export class MessageFormatter {
  static formatNewIssue(protocol: string, category: string, description: string): string {
    return `*Serrinha Conectada*\n\n` +
      `Olá! Seu relato foi registrado com sucesso.\n\n` +
      `*Protocolo:* ${protocol}\n` +
      `*Categoria:* ${category}\n` +
      `*Descrição:* ${description}\n\n` +
      `Você pode acompanhar o status em nosso site utilizando o número do protocolo acima.`;
  }

  static formatStatusUpdate(protocol: string, status: string, comment?: string): string {
    const statusMap: Record<string, string> = {
      PENDING: "Pendente",
      IN_PROGRESS: "Em Andamento",
      RESOLVED: "Resolvido",
      REJECTED: "Rejeitado",
    };

    const statusLabel = statusMap[status] || status;

    let message = `*Serrinha Conectada*\n\n` +
      `O status do seu relato *${protocol}* foi atualizado.\n\n` +
      `*Novo Status:* ${statusLabel}\n`;

    if (comment) {
      message += `*Comentário:* ${comment}\n`;
    }

    message += `\nVocê pode continuar acompanhando o progresso em nosso site.`;
    
    return message;
  }

  static formatManualMessage(protocol: string, message: string): string {
    return `*Serrinha Conectada*\n\n` +
      `A equipe de gestão da Prefeitura enviou uma mensagem sobre o seu relato *${protocol}*:\n\n` +
      `"${message}"\n\n` +
      `Você pode acompanhar o status do seu relato em nosso site.`;
  }
}
