import argon2 from "argon2";
import jwt from "jsonwebtoken";
import prisma from "../infra/database/prisma.js";
import { z } from "zod";
import { IssueService } from "./issueService.js";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export const registerSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  role: z.enum(["CITIZEN", "GOVERNMENT"], {
    message: "Tipo de acesso inválido",
  }).default("CITIZEN"),
});

import { MailService } from "../infra/mail/mailService.js";

const mailService = new MailService();

export class AuthService {
  async register(data: z.infer<typeof registerSchema>) {
    await IssueService.ensureSchema();
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("E-mail já registrado!");
    }

    const hashedPassword = await argon2.hash(data.password);
    const status = data.role === "GOVERNMENT" ? "PENDING" : "ACTIVE";

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        status,
      },
    });

    if (status === "PENDING") {
      return {
        pending: true,
        message: "Seu cadastro foi registrado com sucesso. Ele ainda não possui permissão de administrador. Seu pedido ficará aguardando aprovação de um administrador já existente. Somente após aprovação ele poderá acessar a área interna.",
      };
    }

    return this.generateToken(user);
  }

  async login(data: z.infer<typeof loginSchema>) {
    await IssueService.ensureSchema();
    // Auto cleanup expired requests on login
    await this.cleanupExpiredRequests();

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !(await argon2.verify(user.password, data.password))) {
      throw new Error("Credenciais inválidas");
    }

    if (user.status === "PENDING" && user.role !== "ADMIN") {
      throw new Error("Seu cadastro ainda está pendente de aprovação.");
    }

    if (user.status === "REJECTED" && user.role !== "ADMIN") {
      throw new Error("Seu pedido de cadastro foi rejeitado.");
    }

    return this.generateToken(user);
  }

  async getPendingAdmins() {
    await IssueService.ensureSchema();
    await this.cleanupExpiredRequests();
    return prisma.user.findMany({
      where: {
        role: "GOVERNMENT",
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async approveAdmin(userId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
    });

    try {
      await mailService.sendMail(
        user.email,
        "Cadastro Aprovado - Serrinha Conectada",
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #10b981;">Serrinha Conectada</h2>
          <p>Olá <strong>${user.name}</strong>,</p>
          <p>Seu cadastro como gestor foi <strong>aprovado</strong> com sucesso!</p>
          <p>Agora você já pode acessar a área administrativa da plataforma utilizando seu e-mail e senha cadastrados.</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.APP_URL || '#'}/login" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar Painel</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Este é um e-mail automático, por favor não responda.</p>
        </div>
        `
      );
    } catch (error) {
      console.error("Erro ao enviar e-mail de aprovação:", error);
    }

    return user;
  }

  async rejectAdmin(userId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: "REJECTED" },
    });

    try {
      await mailService.sendMail(
        user.email,
        "Cadastro Rejeitado - Serrinha Conectada",
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #ef4444;">Serrinha Conectada</h2>
          <p>Olá <strong>${user.name}</strong>,</p>
          <p>Lamentamos informar que seu pedido de acesso como gestor foi <strong>rejeitado</strong> pela administração.</p>
          <p>Caso acredite que isso seja um erro, entre em contato com o suporte técnico da prefeitura.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Este é um e-mail automático, por favor não responda.</p>
        </div>
        `
      );
    } catch (error) {
      console.error("Erro ao enviar e-mail de rejeição:", error);
    }

    return user;
  }

  private async cleanupExpiredRequests() {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    await prisma.user.deleteMany({
      where: {
        status: "PENDING",
        createdAt: {
          lt: fifteenDaysAgo,
        },
      },
    });
  }

  private generateToken(user: any) {
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
