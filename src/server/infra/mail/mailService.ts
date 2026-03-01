import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    const from = process.env.SMTP_FROM || '"Serrinha Conectada" <no-reply@serrinha.com>';
    
    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      console.log("Message sent: %s", info.messageId);
      return info;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }
}
