import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn("SMTP configuration is missing. Emails will not be sent. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS.");
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    const from = process.env.SMTP_FROM || '"Serrinha Conectada" <no-reply@serrinha.com>';
    
    console.log(`Attempting to send email to ${to} with subject: ${subject}`);
    
    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      console.log("Email sent successfully. Message ID: %s", info.messageId);
      return info;
    } catch (error) {
      console.error("Error sending email to %s:", to, error);
      throw error;
    }
  }
}
