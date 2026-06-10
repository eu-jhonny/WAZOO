import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { AppError } from "../middleware/errorHandler";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha muito curta"),
});

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.active) throw new AppError("Credenciais inválidas", 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError("Credenciais inválidas", 401);

  const payload = { userId: user.id, email: user.email, role: user.role };
  const token = signToken(payload);
  const refreshToken = signRefreshToken({ userId: user.id });

  res.json({
    token,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);

  const payload = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.active) throw new AppError("Sessão inválida", 401);

  const newPayload = { userId: user.id, email: user.email, role: user.role };
  const token = signToken(newPayload);
  const newRefresh = signRefreshToken({ userId: user.id });

  res.json({ token, refreshToken: newRefresh });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) throw new AppError("Usuário não encontrado", 404);
  res.json(user);
}

export async function changePassword(req: Request, res: Response) {
  const schema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8, "Nova senha deve ter no mínimo 8 caracteres"),
  });
  const { currentPassword, newPassword } = schema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) throw new AppError("Usuário não encontrado", 404);

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError("Senha atual incorreta", 400);

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  res.json({ message: "Senha alterada com sucesso" });
}
