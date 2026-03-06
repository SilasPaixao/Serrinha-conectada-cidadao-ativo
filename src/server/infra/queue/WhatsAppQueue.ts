import { Queue } from 'bullmq';
import { redisConfig } from './redisConfig.js';

export interface WhatsAppJobData {
  issueId?: string;
  phoneNumber: string;
  message: string;
}

export const whatsAppQueue = new Queue<WhatsAppJobData>('whatsapp-notifications', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export async function addWhatsAppJob(data: WhatsAppJobData) {
  await whatsAppQueue.add('send-whatsapp', data);
}
