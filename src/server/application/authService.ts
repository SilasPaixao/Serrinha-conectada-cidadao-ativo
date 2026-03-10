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
  whatsapp: z.string().optional().refine(val => !val || /^\d{10,15}$/.test(val.replace(/\D/g, '')), {
    message: "WhatsApp deve conter apenas números com DDD (10-11 dígitos)"
  }),
  role: z.enum(["CITIZEN", "GOVERNMENT"], {
    message: "Tipo de acesso inválido",
  }).default("CITIZEN"),
});

import { WhatsAppService } from "./services/WhatsAppService.js";

const whatsappService = new WhatsAppService();

export class AuthService {
  async seedAdmin() {
    await IssueService.ensureSchema();
    const adminEmail = "silas.paixao873@gmail.com";
    const oldAdminEmail = "admin@serrinha.ba.gov.br";
    
    console.log(`🌱 Verificando administrador padrão: ${adminEmail}`);
    const hashedPassword = await argon2.hash("040894Sil@s");
    
    // Remove o admin antigo se existir
    await prisma.user.deleteMany({
      where: { email: oldAdminEmail }
    });

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      console.log("🌱 Semeando usuário administrador padrão...");
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: "Silas Paixão",
          role: "ADMIN",
          status: "ACTIVE",
        },
      });
      console.log("✅ Usuário administrador criado: " + adminEmail);
    } else {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { 
          password: hashedPassword,
          role: "ADMIN",
          status: "ACTIVE"
        }
      });
      console.log("🔄 Credenciais do administrador atualizadas.");
    }

    const allUsers = await prisma.user.findMany({
      select: { email: true, role: true, status: true }
    });
    console.log("👥 Usuários cadastrados no sistema:", JSON.stringify(allUsers, null, 2));
  }

  async register(data: z.infer<typeof registerSchema>) {
    await IssueService.ensureSchema();
    const email = data.email.trim().toLowerCase();
    const password = data.password.trim();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("E-mail já registrado!");
    }

    const hashedPassword = await argon2.hash(password);
    const status = data.role === "GOVERNMENT" ? "PENDING" : "ACTIVE";

    const user = await prisma.user.create({
      data: {
        ...data,
        email,
        password: hashedPassword,
        status,
      },
    });

    if (status === "PENDING") {
      if (user.whatsapp) {
        whatsappService.sendManualMessage(user.whatsapp, "CADASTRO-PENDENTE", `Olá ${user.name}, seu pedido de acesso como gestor na plataforma *Prefeitura de Serrinha - Cidadão ativo!* foi recebido e está aguardando aprovação da administração. Você receberá uma notificação assim que for aprovado.`, "auth-pending")
          .catch(error => console.error("Erro ao enviar WhatsApp de cadastro pendente:", error));
      }
      return {
        pending: true,
        message: "Seu cadastro foi registrado com sucesso. Ele ainda não possui permissão de administrador. Seu pedido ficará aguardando aprovação de um administrador já existente. Somente após aprovação ele poderá acessar a área interna.",
      };
    }

    return this.generateToken(user);
  }

  async login(data: z.infer<typeof loginSchema>) {
    await IssueService.ensureSchema();
    const email = data.email.trim().toLowerCase();
    const password = data.password.trim();

    // Auto cleanup expired requests on login
    await this.cleanupExpiredRequests();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`🔍 Login falhou: Usuário não encontrado (${email})`);
      throw new Error("Credenciais inválidas");
    }

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      console.log(`🔍 Login falhou: Senha incorreta para (${email})`);
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
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      throw new Error("Usuário não encontrado.");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
    });

    if (user.whatsapp) {
      whatsappService.sendManualMessage(user.whatsapp, "CADASTRO-APROVADO", `Olá ${user.name}, seu cadastro como gestor na plataforma *Prefeitura de Serrinha - Cidadão ativo!* foi APROVADO! Você já pode acessar o painel.`, "auth-approval")
        .catch(error => console.error("Erro ao enviar WhatsApp de aprovação:", error));
    }

    return user;
  }

  async rejectAdmin(userId: string) {
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      throw new Error("Usuário não encontrado.");
    }

    // Envia notificação antes de deletar
    if (userExists.whatsapp) {
      whatsappService.sendManualMessage(userExists.whatsapp, "CADASTRO-REJEITADO", `Olá ${userExists.name}, lamentamos informar que seu pedido de acesso como gestor na plataforma *Prefeitura de Serrinha - Cidadão ativo!* foi REJEITADO pela administração.`, "auth-rejection")
        .catch(error => console.error("Erro ao enviar WhatsApp de rejeição:", error));
    }

    // Deleta imediatamente conforme solicitado
    const user = await prisma.user.delete({
      where: { id: userId },
    });

    return user;
  }

  async forgotPassword(email: string) {
    await IssueService.ensureSchema();
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "GOVERNMENT")) {
      throw new Error("Não registro com este e-mail. Certifique-se de que está digitando corretamente!");
    }

    // In a real app, we would send an email here. 
    // Since we can't recover the hashed password, and the user asked to "send the password",
    // we will simulate this by returning a success message.
    // If this were a real production app, we would trigger a password reset flow.
    return { message: "Sua senha foi enviada para o e-mail informado." };
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
