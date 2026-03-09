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
  whatsapp: z.string().optional().or(z.literal("")),
});

import { WhatsAppService } from "./services/WhatsAppService.js";

const s3Service = new S3Service();
const whatsappService = new WhatsAppService();

export class IssueService {
  private static columnChecked = false;

  public static async ensureSchema() {
    if (IssueService.columnChecked) return;
    try {
      console.log("Checking and ensuring database schema...");
      
      // Ensure Issue table exists
      console.log("Ensuring Issue table...");
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Issue" (
          "id" TEXT NOT NULL,
          "protocol" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "latitude" DOUBLE PRECISION NOT NULL,
          "longitude" DOUBLE PRECISION NOT NULL,
          "address" TEXT,
          "reporterEmail" TEXT,
          "whatsapp" TEXT,
          "imageUrl" TEXT,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "userId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Issue_protocol_key" ON "Issue"("protocol");`);

      // Ensure User table exists
      console.log("Ensuring User table...");
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "role" TEXT NOT NULL DEFAULT 'CITIZEN',
          "status" TEXT NOT NULL DEFAULT 'ACTIVE',
          "whatsapp" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "User_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`);

      // Ensure columns in Issue table
      console.log("Ensuring Issue columns...");
      await prisma.$executeRawUnsafe(`ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "reporterEmail" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "address" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "userId" TEXT;`);
      
      // Ensure status column in User table
      console.log("Ensuring User columns...");
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE';`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;`);
      
      // Ensure IssueStatusHistory table exists
      console.log("Ensuring IssueStatusHistory table...");
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
      
      // Ensure WhatsAppLog table exists
      console.log("Ensuring WhatsAppLog table...");
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "WhatsAppLog" (
          "id" TEXT NOT NULL,
          "issueId" TEXT,
          "phoneNumber" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "status" TEXT NOT NULL,
          "lastError" TEXT,
          "attempts" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "sentAt" TIMESTAMP(3),
          CONSTRAINT "WhatsAppLog_pkey" PRIMARY KEY ("id")
        );
      `);

      IssueService.columnChecked = true;
    } catch (e: any) {
      console.error("❌ Could not ensure database schema:", e);
      if (e.code) console.error("Prisma Error Code:", e.code);
      if (e.meta) console.error("Prisma Error Meta:", JSON.stringify(e.meta));
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

    const { whatsapp, ...issueData } = data;

    const issue = await prisma.issue.create({
      data: {
        ...issueData,
        whatsapp,
        protocol,
        userId,
        imageUrl,
        status: "PENDING",
      },
    });

    if (whatsapp) {
      whatsappService.notifyNewIssue(whatsapp, protocol, issueData.category, issueData.description, issue.id)
        .catch(error => console.error("Failed to enqueue WhatsApp notification:", error));
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

    const existingIssue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!existingIssue) {
      throw new Error("Relato não encontrado.");
    }

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

      if (issue.whatsapp) {
        whatsappService.notifyStatusUpdate(issue.whatsapp, issue.protocol, status, comment, issue.id)
          .catch(error => console.error("Failed to enqueue WhatsApp status update:", error));
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
    const existingIssue = await prisma.issue.findUnique({ where: { id } });
    if (!existingIssue) return { success: true };
    
    // Delete related history first
    await prisma.issueStatusHistory.deleteMany({
      where: { issueId: id }
    });

    // Delete related WhatsApp logs if any (optional but good for cleanup)
    await prisma.whatsAppLog.deleteMany({
      where: { issueId: id }
    });
    
    return prisma.issue.delete({
      where: { id },
    });
  }

  async sendManualNotification(issueId: string, message: string) {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      throw new Error("Relato não encontrado.");
    }

    if (issue.whatsapp) {
      whatsappService.sendManualMessage(issue.whatsapp, issue.protocol, message, issue.id)
        .catch(error => console.error("Failed to enqueue manual WhatsApp message:", error));
    }

    return { success: true };
  }
}
