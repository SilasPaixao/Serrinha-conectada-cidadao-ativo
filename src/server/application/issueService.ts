import prisma from "../infra/database/prisma.js";
import { z } from "zod";
import { S3Service } from "../infra/storage/s3.js";
import { format } from "date-fns";

export const createIssueSchema = z.object({
  category: z.string(),
  description: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
});

const s3Service = new S3Service();

export class IssueService {
  private generateProtocol(): string {
    const date = format(new Date(), "yyyyMMdd");
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `SC-${date}-${random}`;
  }

  private async resolveImageUrl(imageUrl: string | null | undefined): Promise<string | null> {
    return s3Service.getFileUrl(imageUrl);
  }

  async createIssue(data: z.infer<typeof createIssueSchema>, userId: string | null, file?: Express.Multer.File) {
    const protocol = this.generateProtocol();
    let imageUrl: string | undefined;

    if (file) {
      imageUrl = await s3Service.uploadFile(file);
    }

    const issue = await prisma.issue.create({
      data: {
        ...data,
        protocol,
        userId,
        imageUrl,
        status: "PENDING",
      },
    });

    return {
      ...issue,
      imageUrl: await this.resolveImageUrl(issue.imageUrl)
    };
  }

  async getIssues(filters: any) {
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
}
