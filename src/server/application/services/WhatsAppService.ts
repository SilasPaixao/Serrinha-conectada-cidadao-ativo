import { addWhatsAppJob } from '../../infra/queue/WhatsAppQueue.js';
import { normalizeWhatsAppNumber } from '../../../utils/phone.js';
import { MessageFormatter } from './MessageFormatter.js';

export class WhatsAppService {
  async notifyNewIssue(whatsapp: string, protocol: string, category: string, description: string, issueId: string) {
    const normalized = normalizeWhatsAppNumber(whatsapp);
    if (!normalized) {
      console.warn(`⚠️ WhatsApp normalization failed for: ${whatsapp}`);
      return;
    }

    console.log(`📝 Enqueuing WhatsApp notification for ${normalized} (Issue: ${protocol})`);
    await addWhatsAppJob({
      issueId,
      phoneNumber: normalized,
      message: MessageFormatter.formatNewIssue(protocol, category, description),
    });
  }

  async notifyStatusUpdate(whatsapp: string, protocol: string, status: string, comment: string | undefined, issueId: string) {
    const normalized = normalizeWhatsAppNumber(whatsapp);
    if (!normalized) {
      console.warn(`⚠️ WhatsApp normalization failed for: ${whatsapp}`);
      return;
    }

    console.log(`📝 Enqueuing WhatsApp status update for ${normalized} (Issue: ${protocol})`);
    await addWhatsAppJob({
      issueId,
      phoneNumber: normalized,
      message: MessageFormatter.formatStatusUpdate(protocol, status, comment),
    });
  }

  async sendManualMessage(whatsapp: string, protocol: string, messageText: string, issueId: string) {
    const normalized = normalizeWhatsAppNumber(whatsapp);
    if (!normalized) {
      console.warn(`⚠️ WhatsApp normalization failed for: ${whatsapp}`);
      return;
    }

    console.log(`📝 Enqueuing manual WhatsApp message for ${normalized} (Issue: ${protocol})`);
    await addWhatsAppJob({
      issueId,
      phoneNumber: normalized,
      message: MessageFormatter.formatManualMessage(protocol, messageText),
    });
  }
}
