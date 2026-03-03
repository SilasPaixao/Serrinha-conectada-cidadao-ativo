import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export class MailService {
  private apiKey: string | undefined;
  private senderName: string;
  private senderEmail: string;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY?.trim();
    this.senderName = process.env.BREVO_SENDER_NAME || 'Serrinha Conectada';
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'silas.paixao873@gmail.com';

    console.log(`ℹ️ Inicializando MailService (Brevo API): API_KEY=${this.apiKey ? 'Configurada' : 'AUSENTE'}`);

    if (!this.apiKey) {
      console.warn("⚠️ Configuração Brevo API incompleta. Verifique BREVO_API_KEY.");
    }
  }

  public async verify() {
    if (!this.apiKey) return false;
    try {
      // Brevo doesn't have a simple "verify" endpoint for the key itself that is lightweight, 
      // but we can try to get account info to verify the key.
      await axios.get('https://api.brevo.com/v3/account', {
        headers: { 'api-key': this.apiKey }
      });
      console.log("✅ Conexão com API do Brevo verificada com sucesso.");
      return true;
    } catch (error) {
      console.error("❌ Erro ao verificar API do Brevo:", error);
      return false;
    }
  }

  async sendMail(to: string, subject: string, html: string) {
    if (!this.apiKey) {
      throw new Error("Configuração BREVO_API_KEY ausente no servidor.");
    }

    console.log(`📧 Tentando enviar e-mail via API Brevo para ${to}...`);
    
    try {
      const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { name: this.senderName, email: this.senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }, {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log("✅ E-mail enviado via API! ID: %s", response.data.messageId);
      return response.data;
    } catch (error: any) {
      console.error("❌ Erro ao enviar e-mail via API para %s:", to);
      if (error.response) {
        console.error("Resposta da API Brevo:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error(error.message);
      }
      throw error;
    }
  }
}
