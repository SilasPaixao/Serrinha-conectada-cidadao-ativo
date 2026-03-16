import prisma from '../database/prisma.js';

export interface WhatsAppJobData {
  issueId?: string;
  phoneNumber: string;
  message: string;
  imageUrl?: string;
}

/**
 * Enfileira uma mensagem de WhatsApp no banco de dados para envio posterior pelo worker.
 */
export async function addWhatsAppJob(data: WhatsAppJobData) {
  console.log(`📝 Enfileirando mensagem de WhatsApp para ${data.phoneNumber} no banco de dados...`);
  try {
    const log = await prisma.whatsAppLog.create({
      data: {
        issueId: data.issueId,
        phoneNumber: data.phoneNumber,
        message: data.message,
        imageUrl: data.imageUrl,
        status: 'pending',
        attempts: 0,
      },
    });
    console.log(`✅ Mensagem enfileirada no banco (ID: ${log.id})`);
    return log;
  } catch (error: any) {
    console.error(`❌ Falha ao enfileirar mensagem no banco: ${error.message}`);
    throw error;
  }
}
