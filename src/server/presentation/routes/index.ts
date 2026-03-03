import { Express, Request, Response } from "express";
import multer from "multer";
import { AuthService, loginSchema, registerSchema } from "../../application/authService.js";
import { IssueService, createIssueSchema } from "../../application/issueService.js";
import { authenticate, authorize, AuthRequest } from "../middlewares/auth.js";
import rateLimit from "express-rate-limit";
import { z } from "zod";

const upload = multer({ storage: multer.memoryStorage() });
const authService = new AuthService();
const issueService = new IssueService();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: "Muitas tentativas de login, tente novamente mais tarde",
});

function handleError(res: Response, error: any, status: number = 400) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: error.issues[0].message });
  }
  res.status(status).json({ error: error.message || "Ocorreu um erro interno" });
}

export function setupRoutes(app: Express) {
  // Auth
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      res.json(result);
    } catch (error: any) {
      handleError(res, error);
    }
  });

  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      res.json(result);
    } catch (error: any) {
      handleError(res, error, 401);
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
      handleError(res, error);
    }
  });

  app.get("/api/issues/protocol/:protocol", async (req, res) => {
    try {
      const issue = await issueService.getIssueByProtocol(req.params.protocol);
      if (!issue) return res.status(404).json({ error: "Relato não encontrado" });
      res.json(issue);
    } catch (error: any) {
      handleError(res, error, 500);
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
      handleError(res, error, 500);
    }
  });

  app.patch("/api/admin/issues/:id/status", authenticate, authorize(["GOVERNMENT", "ADMIN"]), async (req: AuthRequest, res) => {
    try {
      const { status, comment } = req.body;
      const issue = await issueService.updateStatus(req.params.id, status, comment, req.user!.id);
      res.json(issue);
    } catch (error: any) {
      handleError(res, error);
    }
  });

  app.post("/api/admin/issues/:id/send-email", authenticate, authorize(["GOVERNMENT", "ADMIN"]), async (req: AuthRequest, res) => {
    try {
      const { message } = req.body;
      const result = await issueService.sendManualEmail(req.params.id, message);
      res.json(result);
    } catch (error: any) {
      handleError(res, error);
    }
  });

  // Admin Management Routes
  app.get("/api/admin/pending-requests", authenticate, authorize(["GOVERNMENT", "ADMIN"]), async (req, res) => {
    try {
      const requests = await authService.getPendingAdmins();
      res.json(requests);
    } catch (error: any) {
      handleError(res, error, 500);
    }
  });

  app.post("/api/admin/approve-request/:id", authenticate, authorize(["GOVERNMENT", "ADMIN"]), async (req, res) => {
    try {
      const result = await authService.approveAdmin(req.params.id);
      res.json(result);
    } catch (error: any) {
      handleError(res, error);
    }
  });

  app.post("/api/admin/reject-request/:id", authenticate, authorize(["GOVERNMENT", "ADMIN"]), async (req, res) => {
    try {
      const result = await authService.rejectAdmin(req.params.id);
      res.json(result);
    } catch (error: any) {
      handleError(res, error);
    }
  });

  app.delete("/api/admin/issues/:id", authenticate, authorize(["ADMIN"]), async (req, res) => {
    try {
      await issueService.deleteIssue(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      handleError(res, error);
    }
  });

  // Geocoding Proxy
  app.get("/api/geocode/reverse", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      if (!lat || !lon) return res.status(400).json({ error: "Latitude e longitude são obrigatórios" });
      
      const response = await (await import("axios")).default.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
        headers: {
          'User-Agent': 'SerrinhaConectada/1.0 (silaspaixao873@gmail.com)'
        }
      });
      
      res.json(response.data);
    } catch (error: any) {
      console.error("❌ Geocoding proxy error:", error.message);
      if (error.response) {
        console.error("Nominatim Response:", error.response.status, error.response.data);
      }
      res.status(500).json({ error: "Erro ao buscar endereço. Tente novamente mais tarde." });
    }
  });

  // SMTP Diagnostic Route
  app.post("/api/admin/test-email", authenticate, authorize(["ADMIN"]), async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "E-mail de teste é obrigatório" });
      
      const { MailService } = await import("../../infra/mail/mailService.js");
      const mailService = new MailService();
      
      await mailService.sendMail(
        email,
        "Teste de Configuração SMTP - Serrinha Conectada",
        `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #10b981;">Conexão SMTP OK!</h2>
          <p>Se você recebeu este e-mail, suas credenciais SMTP estão configuradas corretamente.</p>
          <p><strong>Data do teste:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        `
      );
      
      res.json({ success: true, message: "E-mail de teste enviado com sucesso!" });
    } catch (error: any) {
      console.error("SMTP Test Error:", error);
      
      let hint = "Verifique se SMTP_USER e SMTP_PASS estão corretos no ambiente.";
      if (error.message.includes("535 5.7.0 Invalid credentials")) {
        hint = "Credenciais inválidas. Se estiver usando Brevo, use a 'Master Password' ou uma 'SMTP Key' válida. Se for Gmail, use uma 'App Password'.";
      } else if (error.message.includes("Too many failed login attempts")) {
        hint = "Muitas tentativas falhas. O servidor SMTP bloqueou seu acesso temporariamente. Aguarde alguns minutos antes de tentar novamente com as credenciais corretas.";
      } else if (error.code === 'ECONNREFUSED') {
        hint = "Não foi possível conectar ao servidor SMTP. Verifique o SMTP_HOST e SMTP_PORT.";
      }

      res.status(500).json({ 
        error: "Falha no teste de e-mail", 
        details: error.message,
        hint
      });
    }
  });
}
