import { Express, Request, Response } from "express";
import multer from "multer";
import { AuthService, loginSchema, registerSchema } from "../../application/authService.js";
import { IssueService, createIssueSchema } from "../../application/issueService.js";
import { authenticate, authorize, AuthRequest } from "../middlewares/auth.js";
import rateLimit from "express-rate-limit";

const upload = multer({ storage: multer.memoryStorage() });
const authService = new AuthService();
const issueService = new IssueService();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: "Too many login attempts, please try again later",
});

export function setupRoutes(app: Express) {
  // Auth
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", authenticate, (req: AuthRequest, res) => {
    res.json(req.user);
  });

  // Issues
  app.post("/api/issues", upload.single("image"), async (req: AuthRequest, res) => {
    try {
      // Handle potential stringified JSON from FormData
      const body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
      const data = createIssueSchema.parse(body);
      const userId = req.headers.authorization ? (await authService.login({email: '', password: ''}).catch(() => null))?.user.id : null; 
      // Simplified userId handling for demo. In real app, authenticate middleware would handle this.
      
      // Let's use a more robust way to get userId if token is present
      let finalUserId: string | null = null;
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        try {
          const decoded = (await import("jsonwebtoken")).default.verify(token, process.env.JWT_SECRET || "super-secret") as any;
          finalUserId = decoded.id;
        } catch {}
      }

      const issue = await issueService.createIssue(data, finalUserId, req.file);
      res.json(issue);
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/issues/protocol/:protocol", async (req, res) => {
    try {
      const issue = await issueService.getIssueByProtocol(req.params.protocol);
      if (!issue) return res.status(404).json({ error: "Issue not found" });
      res.json(issue);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin/Government Routes
  app.get("/api/admin/issues", authenticate, authorize(["GOVERNMENT", "ADMIN"]), async (req, res) => {
    try {
      const { status, category, neighborhood } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (category) filters.category = category;
      // Neighborhood filtering would require address parsing or a dedicated field
      // For now, we'll filter by address containing the neighborhood string if provided
      if (neighborhood) {
        filters.address = { contains: neighborhood as string, mode: 'insensitive' };
      }

      const issues = await issueService.getIssues(filters);
      res.json(issues);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/issues/:id/status", authenticate, authorize(["GOVERNMENT", "ADMIN"]), async (req: AuthRequest, res) => {
    try {
      const { status, comment } = req.body;
      const issue = await issueService.updateStatus(req.params.id, status, comment, req.user!.id);
      res.json(issue);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/issues/:id", authenticate, authorize(["ADMIN"]), async (req, res) => {
    try {
      await issueService.deleteIssue(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
}
