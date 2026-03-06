import { Worker, Job } from 'bullmq';
import { EvolutionWhatsAppProvider } from '../whatsapp/EvolutionWhatsAppProvider.js';
import prisma from '../database/prisma.js';
import { redisConfig } from './redisConfig.js';

const evolutionProvider = new EvolutionWhatsAppProvider();

export const whatsAppWorker = new Worker(
  'whatsapp-notifications',
  async (job: Job) => {
    const { issueId, phoneNumber, message } = job.data;
    console.log(`👷 Processing WhatsApp job for ${phoneNumber} (Issue: ${issueId || 'N/A'})`);

    let log;
    try {
      // Create log entry as pending
      log = await prisma.whatsAppLog.create({
        data: {
          issueId,
          phoneNumber,
          message,
          status: 'pending',
          attempts: job.attemptsMade + 1,
        },
      });
    } catch (dbError: any) {
      console.error(`❌ Failed to create WhatsApp log in DB: ${dbError.message}`);
      // Continue anyway, we still want to try sending the message
    }

    try {
      await evolutionProvider.sendText({
        number: phoneNumber,
        text: message,
      });

      // Update log as sent
      if (log) {
        await prisma.whatsAppLog.update({
          where: { id: log.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
          },
        });
      }
      console.log(`✅ WhatsApp sent successfully to ${phoneNumber}`);
    } catch (error: any) {
      console.error(`❌ WhatsApp send error for ${phoneNumber}:`, error.message);
      
      // Update log as failed
      if (log) {
        await prisma.whatsAppLog.update({
          where: { id: log.id },
          data: {
            status: 'failed',
            lastError: error.message || 'Unknown error',
            attempts: job.attemptsMade + 1,
          },
        });
      }

      throw error; // Rethrow to let BullMQ handle retries
    }
  },
  {
    connection: redisConfig,
    limiter: {
      max: 1,
      duration: 4000,
    },
  }
);

whatsAppWorker.on('active', (job) => {
  console.log(`👷 WhatsApp job ${job.id} is now active`);
});

whatsAppWorker.on('completed', (job) => {
  console.log(`✅ WhatsApp job ${job.id} completed successfully`);
});

whatsAppWorker.on('failed', (job, err) => {
  console.error(`❌ WhatsApp job ${job?.id} failed: ${err.message}`);
  if (err.stack) console.error(err.stack);
});

whatsAppWorker.on('error', (err) => {
  console.error('🔥 WhatsApp Worker Error:', err);
});
