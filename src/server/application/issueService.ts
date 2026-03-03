import prisma from "../infra/database/prisma.js";
import { z } from "zod";
import { S3Service } from "../infra/storage/s3.js";
import { format } from "date-fns";

export const createIssueSchema = z.object({
  category: z.string({ message: "Categoria é obrigatória" }).min(1, "Categoria é obrigatória"),
  description: z.string({ message: "Descrição é obrigatória" }).min(1, "Descrição é obrigatória"),
  latitude: z.number({ message: "Latitude é obrigatória" }),
  longitude: z.number({ message: "Longitude é obrigatória" }),
  address: z.string().optional(),
  reporterEmail: z.string().email("E-mail inválido").optional().or(z.literal("")),
});

import { MailService } from "../infra/mail/mailService.js";

const s3Service = new S3Service();
const mailService = new MailService();

export class IssueService {
  private static columnChecked = false;

  public static async ensureSchema() {
    if (IssueService.columnChecked) return;
    try {
      console.log("Checking and ensuring database schema...");
      
      // Ensure columns in Issue table
      await prisma.$executeRawUnsafe(`ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "reporterEmail" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "address" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "userId" TEXT;`);
      
      // Ensure status column in User table
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE';`);
      
      // Ensure IssueStatusHistory table exists
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "IssueStatusHistory" (
          "id" TEXT NOT NULL,
          "issueId" TEXT NOT NULL,
          "status" TEXT NOT NULL,
          "comment" TEXT,
          "changedById" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "IssueStatusHistory_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "IssueStatusHistory_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "IssueStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      
      console.log("Database schema ensured.");
      IssueService.columnChecked = true;
    } catch (e) {
      console.warn("Could not ensure database schema:", e);
    }
  }

  private generateProtocol(): string {
    const date = format(new Date(), "yyyyMMdd");
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `SC-${date}-${random}`;
  }

  private async resolveImageUrl(imageUrl: string | null | undefined): Promise<string | null> {
    return s3Service.getFileUrl(imageUrl);
  }

  async createIssue(data: z.infer<typeof createIssueSchema>, userId: string | null, file?: Express.Multer.File) {
    await IssueService.ensureSchema();
    const protocol = this.generateProtocol();
    let imageUrl: string | undefined;

    if (file) {
      imageUrl = await s3Service.uploadFile(file);
    }

    const { reporterEmail, ...issueData } = data;

    const issue = await prisma.issue.create({
      data: {
        ...issueData,
        reporterEmail,
        protocol,
        userId,
        imageUrl,
        status: "PENDING",
      },
    });

    if (reporterEmail) {
      try {
        await mailService.sendMail(
          reporterEmail,
          `Protocolo de Relato: ${protocol}`,
          `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">Serrinha Conectada</h2>
            <p>Olá,</p>
            <p>Seu relato foi registrado com sucesso em nossa plataforma.</p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Número do Protocolo:</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #111827;">${protocol}</p>
            </div>
            <p><strong>Categoria:</strong> ${issueData.category}</p>
            <p><strong>Descrição:</strong> ${issueData.description}</p>
            <p>Você pode acompanhar o status do seu relato em nosso site utilizando o número do protocolo acima.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #9ca3af;">Este é um e-mail automático, por favor não responda.</p>
          </div>
          `
        );
      } catch (error) {
        console.error("Failed to send protocol email:", error);
      }
    }

    return {
      ...issue,
      imageUrl: await this.resolveImageUrl(issue.imageUrl)
    };
  }

  async getIssues(filters: any) {
    await IssueService.ensureSchema();
    const issues = await prisma.issue.findMany({
      where: filters,
      include: {
        user: {
          select: { name: true, email: true }
        },
        history: {
          include: {
            changedBy: { select: { name: true } }
          },
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return Promise.all(issues.map(async issue => ({
      ...issue,
      imageUrl: await this.resolveImageUrl(issue.imageUrl)
    })));
  }

  async updateStatus(issueId: string, status: any, comment: string, changedById: string) {
    const statusMap: Record<string, string> = {
      PENDING: "Pendente",
      IN_PROGRESS: "Em Andamento",
      RESOLVED: "Resolvido",
      REJECTED: "Rejeitado",
    };

    return prisma.$transaction(async (tx) => {
      const issue = await tx.issue.update({
        where: { id: issueId },
        data: { status },
      });

      await tx.issueStatusHistory.create({
        data: {
          issueId,
          status,
          comment,
          changedById,
        },
      });

      if (issue.reporterEmail) {
        try {
          await mailService.sendMail(
            issue.reporterEmail,
            `Atualização de Status: ${issue.protocol}`,
            `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #10b981;">Serrinha Conectada</h2>
              <p>Olá,</p>
              <p>O status do seu relato <strong>${issue.protocol}</strong> foi atualizado.</p>
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Novo Status:</p>
                <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #111827;">${statusMap[status] || status}</p>
                ${comment ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #4b5563;"><strong>Comentário:</strong> ${comment}</p>` : ""}
              </div>
              <p>Você pode continuar acompanhando o progresso em nosso site.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #9ca3af;">Este é um e-mail automático, por favor não responda.</p>
            </div>
            `
          );
        } catch (error) {
          console.error("Failed to send status update email:", error);
        }
      }

      return issue;
    });
  }

  async getIssueByProtocol(protocol: string) {
    const issue = await prisma.issue.findUnique({
      where: { protocol },
      include: {
        history: {
          include: {
            changedBy: { select: { name: true } }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!issue) return null;

    return {
      ...issue,
      imageUrl: await this.resolveImageUrl(issue.imageUrl)
    };
  }

  async deleteIssue(id: string) {
    return prisma.issue.delete({
      where: { id },
    });
  }

  async sendManualEmail(issueId: string, message: string) {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue || !issue.reporterEmail) {
      throw new Error("Relato não encontrado ou cidadão não forneceu e-mail.");
    }

    await mailService.sendMail(
      issue.reporterEmail,
      `Mensagem da Prefeitura - Protocolo ${issue.protocol}`,
      `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #10b981;">Serrinha Conectada</h2>
        <p>Olá,</p>
        <p>A equipe de gestão da Prefeitura enviou uma mensagem sobre o seu relato <strong>${issue.protocol}</strong>:</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0; font-size: 16px; color: #111827; line-height: 1.6;">${message}</p>
        </div>
        <p>Você pode acompanhar o status do seu relato em nosso site.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">Este é um e-mail enviado manualmente por um gestor através da plataforma Serrinha Conectada.</p>
      </div>
      `
    );

    return { success: true };
  }
}
