import { describe, it, expect } from 'vitest';
import { normalizeWhatsAppNumber } from '../src/utils/phone.js';
import { MessageFormatter } from '../src/server/application/services/MessageFormatter.js';

describe('WhatsApp Integration Tests', () => {
  describe('Phone Normalization', () => {
    it('should normalize a standard Brazilian number', () => {
      expect(normalizeWhatsAppNumber('75988887777')).toBe('5575988887777');
    });

    it('should normalize a number with spaces and hyphens', () => {
      expect(normalizeWhatsAppNumber('(75) 9 8888-7777')).toBe('5575988887777');
    });

    it('should handle numbers already starting with 55', () => {
      expect(normalizeWhatsAppNumber('5575988887777')).toBe('5575988887777');
    });

    it('should handle numbers starting with 0', () => {
      expect(normalizeWhatsAppNumber('075988887777')).toBe('5575988887777');
    });

    it('should return null for invalid numbers', () => {
      expect(normalizeWhatsAppNumber('123')).toBeNull();
      expect(normalizeWhatsAppNumber('abcdefghijk')).toBeNull();
    });
  });

  describe('Message Formatting', () => {
    it('should format new issue message correctly', () => {
      const msg = MessageFormatter.formatNewIssue('SC-123', 'Lixo', 'Lixo na rua');
      expect(msg).toContain('*Prefeitura de Serrinha - Cidadão ativo!*');
      expect(msg).toContain('*Protocolo:* SC-123');
      expect(msg).toContain('*Categoria:* Lixo');
    });

    it('should format status update message correctly', () => {
      const msg = MessageFormatter.formatStatusUpdate('SC-123', 'RESOLVED', 'Tudo limpo');
      expect(msg).toContain('O status do seu relato *SC-123* foi atualizado.');
      expect(msg).toContain('*Novo Status:* Resolvido');
      expect(msg).toContain('*Comentário:* Tudo limpo');
    });

    it('should format manual message correctly', () => {
      const msg = MessageFormatter.formatManualMessage('SC-123', 'Olá, estamos chegando');
      expect(msg).toContain('A equipe de gestão da Prefeitura enviou uma mensagem');
      expect(msg).toContain('"Olá, estamos chegando"');
    });
  });
});
