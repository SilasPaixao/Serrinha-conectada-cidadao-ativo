import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development with Vite
  }));
  app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  }));
  app.use(express.json());

  console.log("Verificando variáveis de ambiente...");
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL está ausente!");
  } else {
    console.log("✅ DATABASE_URL está presente.");
  }

  if (!process.env.BREVO_API_KEY) {
    console.warn("⚠️ BREVO_API_KEY está ausente! Recursos de e-mail não funcionarão.");
  } else {
    console.log("✅ BREVO_API_KEY está presente.");
    const apiKey = process.env.BREVO_API_KEY;
    if (apiKey.includes(" ")) {
      console.warn("⚠️ BREVO_API_KEY contém espaços! Isso pode causar erro de autenticação.");
    }
    if (apiKey.length < 20) {
      console.warn("⚠️ BREVO_API_KEY parece muito curta para uma chave de API Brevo v3.");
    }
  }

  // Evolution API & Redis Checks
  if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_API_KEY) {
    console.warn("⚠️ Evolution API (WhatsApp) não configurada.");
  } else {
    console.log("✅ Evolution API configurada.");
  }

  if (!process.env.REDIS_HOST) {
    console.warn("⚠️ REDIS_HOST não configurado. Usando 127.0.0.1 por padrão.");
  } else if (process.env.REDIS_HOST === 'redis') {
    console.log("ℹ️ REDIS_HOST definido como 'redis'. O sistema tentará usar 127.0.0.1 se houver falha de resolução.");
  }
  
  const { redisConfig } = await import("./src/server/infra/queue/redisConfig.js");
  const isMock = redisConfig.constructor.name === 'Redis' || redisConfig.constructor.name === 'MockRedis' || (redisConfig as any)._isMock;
  
  if (isMock) {
    console.log("ℹ️ Redis está usando uma conexão MOCK (em memória).");
  } else {
    const hasPassword = !!process.env.REDIS_PASSWORD;
    const redisHost = (redisConfig as any).host;
    const redisPort = (redisConfig as any).port;
    console.log(`✅ Redis configurado em ${redisHost}:${redisPort} (${hasPassword ? 'Com senha' : 'Sem senha'}).`);
  }

  // Start WhatsApp Worker
  try {
    await import("./src/server/infra/queue/WhatsAppWorker.js");
    console.log("🚀 WhatsApp Worker inicializado.");
  } catch (e) {
    console.error("❌ Falha ao inicializar WhatsApp Worker:", e);
  }

  // API Routes
  const { setupRoutes } = await import("./src/server/presentation/routes/index.js");
  
  // Ensure database schema is ready
  try {
    const { IssueService } = await import("./src/server/application/issueService.js");
    await IssueService.ensureSchema();
    console.log("✅ Banco de dados verificado e pronto.");
  } catch (e) {
    console.error("❌ Erro ao verificar banco de dados:", e);
  }

  setupRoutes(app);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
