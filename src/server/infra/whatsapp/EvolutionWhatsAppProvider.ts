import axios from 'axios';

export interface SendTextParams {
  number: string;
  text: string;
}

export interface SendMediaParams {
  number: string;
  mediaUrl: string;
  caption?: string;
  mediaType?: 'image' | 'video' | 'document' | 'audio';
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

    let formattedNumber = number.replace(/\D/g, '');
    
    const baseUrl = this.apiUrl.endsWith('/') ? this.apiUrl.slice(0, -1) : this.apiUrl;
    const url = `${baseUrl}/message/sendText/${this.instance}`;

    console.log(`📤 Sending WhatsApp Text to ${formattedNumber} via ${url}`);

    try {
      const response = await axios.post(
        url,
        {
          number: formattedNumber,
          text,
          linkPreview: false,
          delay: 0,
        },
        {
          headers: {
            apikey: this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      console.log(`✅ WhatsApp Text sent successfully to ${formattedNumber}:`, response.data);
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error(`❌ Error sending WhatsApp Text to ${formattedNumber}:`, JSON.stringify(errorData || error.message, null, 2));
      throw error;
    }
  }

  async sendMedia({ number, mediaUrl, caption, mediaType = 'image' }: SendMediaParams): Promise<void> {
    if (!this.apiUrl || !this.apiKey || !this.instance) {
      throw new Error('Evolution API configuration is missing (apiUrl, apiKey or instance)');
    }

    let formattedNumber = number.replace(/\D/g, '');
    
    const baseUrl = this.apiUrl.endsWith('/') ? this.apiUrl.slice(0, -1) : this.apiUrl;
    const url = `${baseUrl}/message/sendMedia/${this.instance}`;

    const fileName = mediaUrl.split('/').pop()?.split('?')[0] || 'image.jpg';
    
    const payload: any = {
      number: formattedNumber,
      media: mediaUrl,
      caption: caption || '',
      mediaType: mediaType,
      mediatype: mediaType,
      fileName: fileName,
      delay: 0,
    };

    if (mediaType === 'image') {
      payload.mimetype = 'image/jpeg';
    }

    console.log(`📤 Sending WhatsApp Media (${mediaType}) to ${formattedNumber} via ${url}`);
    console.log('📦 Payload (redacted media):', { ...payload, media: mediaUrl.substring(0, 50) + '...' });

    try {
      const response = await axios.post(
        url,
        payload,
        {
          headers: {
            apikey: this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );
      console.log(`✅ WhatsApp Media sent successfully to ${formattedNumber}:`, response.data);
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error(`❌ Error sending WhatsApp Media to ${formattedNumber}:`, JSON.stringify(errorData || error.message, null, 2));
      throw error;
    }
  }
}
