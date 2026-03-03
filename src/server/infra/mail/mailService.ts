import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST?.trim();
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const port = Number(process.env.SMTP_PORT) || 587;

    if (!host || !user || !pass) {
      console.warn("⚠️ Configuração SMTP incompleta. Verifique SMTP_HOST, SMTP_USER e SMTP_PASS.");
    }

    // Debugging (masked)
    if (user) {
      const maskedUser = user.length > 4 ? user.substring(0, 2) + "***" + user.substring(user.length - 2) : "***";
      console.log(`ℹ️ Usando SMTP_USER: ${maskedUser}`);
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });

    // Verify connection on startup - REMOVED to avoid "Too many failed login attempts" with bad credentials
    // this.verify();
  }

  public async verify() {
    try {
      await this.transporter.verify();
      console.log("✅ Conexão SMTP estabelecida com sucesso.");
      return true;
    } catch (error) {
      console.error("❌ Erro ao conectar ao servidor SMTP:", error);
      throw error;
    }
  }

  async sendMail(to: string, subject: string, html: string) {
    const from = process.env.SMTP_FROM || 'silas.paixao873@gmail.com';
    
    console.log(`📧 Tentando enviar e-mail para ${to}...`);
    
    try {
      const info = await this.transporter.sendMail({
        from: `"Serrinha Conectada" <${from}>`,
        to,
        subject,
        html,
      });
      console.log("✅ E-mail enviado! ID: %s", info.messageId);
      return info;
    } catch (error) {
      console.error("❌ Erro ao enviar e-mail para %s:", to, error);
      // Log more details if available
      if ((error as any).response) {
        console.error("Resposta do servidor SMTP:", (error as any).response);
      }
      throw error;
    }
  }
}
