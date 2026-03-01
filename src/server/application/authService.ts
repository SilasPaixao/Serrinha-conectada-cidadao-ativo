import argon2 from "argon2";
import jwt from "jsonwebtoken";
import prisma from "../infra/database/prisma.js";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(["GOVERNMENT", "ADMIN"]),
});

export class AuthService {
  async register(data: z.infer<typeof registerSchema>) {
    const hashedPassword = await argon2.hash(data.password);
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
    return this.generateToken(user);
  }

  async login(data: z.infer<typeof loginSchema>) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !(await argon2.verify(user.password, data.password))) {
      throw new Error("Invalid credentials");
    }

    return this.generateToken(user);
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
