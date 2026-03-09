import { EvolutionWhatsAppProvider } from '../whatsapp/EvolutionWhatsAppProvider.js';
import prisma from '../database/prisma.js';

const evolutionProvider = new EvolutionWhatsAppProvider();
const WORKER_INTERVAL_MS = 5000; // Verifica a cada 5 segundos
const SEND_DELAY_MS = 4000; // Espera 4 segundos entre envios para evitar bloqueios

let isRunning = false;

/**
 * Worker que processa mensagens de WhatsApp pendentes no banco de dados.
 */
async function processNextMessage() {
  try {
    // Busca a próxima mensagem pendente
    // Usamos uma transação ou um update atômico para evitar que múltiplos workers peguem a mesma mensagem
    // (Embora aqui provavelmente só tenhamos uma instância rodando)
    const nextMessage = await prisma.whatsAppLog.findFirst({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });

    if (!nextMessage) {
      return;
    }

    console.log(`👷 Processando mensagem para ${nextMessage.phoneNumber} (ID: ${nextMessage.id})`);

    // Marca como processando
    await prisma.whatsAppLog.update({
      where: { id: nextMessage.id },
      data: { status: 'processing' },
    });

    try {
      // Envia via Evolution API
      await evolutionProvider.sendText({
        number: nextMessage.phoneNumber,
        text: nextMessage.message,
      });

      // Sucesso
      await prisma.whatsAppLog.update({
        where: { id: nextMessage.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          attempts: nextMessage.attempts + 1,
        },
      });
      console.log(`✅ WhatsApp enviado com sucesso para ${nextMessage.phoneNumber}`);
    } catch (error: any) {
      console.error(`❌ Erro ao enviar WhatsApp para ${nextMessage.phoneNumber}:`, error.message);
      
      // Falha
      await prisma.whatsAppLog.update({
        where: { id: nextMessage.id },
        data: {
          status: 'failed',
          lastError: error.message || 'Unknown error',
          attempts: nextMessage.attempts + 1,
        },
      });
    }

    // Espera o delay configurado antes de permitir a próxima execução
    await new Promise(resolve => setTimeout(resolve, SEND_DELAY_MS));

  } catch (error: any) {
    console.error('🔥 Erro no loop do WhatsApp Worker:', error.message);
  }
}

/**
 * Inicia o loop infinito do worker.
 */
export async function startWhatsAppWorker() {
  if (isRunning) return;
  isRunning = true;
  
  console.log("🚀 Iniciando WhatsApp DB Worker (Intervalo: 5s, Delay entre envios: 4s)");

  // Loop infinito
  while (isRunning) {
    await processNextMessage();
    // Pequena pausa se não houver mensagens para não fritar o CPU/DB
    await new Promise(resolve => setTimeout(resolve, WORKER_INTERVAL_MS));
  }
}

/**
 * Para o worker.
 */
export function stopWhatsAppWorker() {
  isRunning = false;
  console.log("🛑 Parando WhatsApp DB Worker...");
}
