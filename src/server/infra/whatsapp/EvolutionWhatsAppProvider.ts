import axios from 'axios';

export interface SendTextParams {
  number: string;
  text: string;
}

export class EvolutionWhatsAppProvider {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly instance: string;

  constructor() {
    this.apiUrl = process.env.EVOLUTION_API_URL || '';
    this.apiKey = process.env.EVOLUTION_API_KEY || '';
    this.instance = process.env.EVOLUTION_INSTANCE || '';
  }

  async sendText({ number, text }: SendTextParams): Promise<void> {
    if (!this.apiUrl || !this.apiKey || !this.instance) {
      throw new Error('Evolution API configuration is missing (apiUrl, apiKey or instance)');
    }

    // Ensure number is in correct format for Evolution API
    // Usually it's just digits, but some versions prefer the full JID
    let formattedNumber = number.replace(/\D/g, '');
    
    // If it doesn't have the @s.whatsapp.net suffix, Evolution API usually adds it,
    // but we can be explicit if needed. However, the 'number' field in the API
    // usually expects just the digits or the full JID.
    // Let's stick to digits first as it's more common for the 'number' field.

    const baseUrl = this.apiUrl.endsWith('/') ? this.apiUrl.slice(0, -1) : this.apiUrl;
    const url = `${baseUrl}/message/sendText/${this.instance}`;

    console.log(`📤 Sending WhatsApp to ${formattedNumber} via ${url}`);

    try {
      const response = await axios.post(
        url,
        {
          number: formattedNumber,
          text,
          linkPreview: false,
        },
        {
          headers: {
            apikey: this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15 seconds timeout
        }
      );
      console.log(`✅ WhatsApp sent successfully to ${formattedNumber}:`, response.data);
    } catch (error: any) {
      console.error(`❌ Error sending WhatsApp to ${formattedNumber}:`, error.response?.data || error.message);
      throw error;
    }
  }
}
