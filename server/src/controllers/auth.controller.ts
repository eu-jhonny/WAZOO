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

const registerSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  preference: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
  address: z.object({
    label: z.string().optional(),
    street: z.string().min(2),
    number: z.string().min(1),
    complement: z.string().optional(),
    neighborhood: z.string().min(2),
    city: z.string().min(2),
    state: z.string().length(2),
    zip: z.string().min(8),
  }).optional(),
});

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  preference: string;
  role: string;
  createdAt: Date;
  addresses?: unknown;
  pets?: unknown;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    preference: user.preference,
    role: user.role,
    createdAt: user.createdAt,
    addresses: user.addresses ?? [],
    pets: user.pets ?? [],
  };
}

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);
  const email = data.email.trim().toLowerCase();

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new AppError("Este e-mail já está cadastrado", 409, "EMAIL_IN_USE");

  const password = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      password,
      name: data.name.trim(),
      phone: data.phone.replace(/\D/g, ""),
      preference: data.preference,
      role: "CUSTOMER",
      ...(data.address && {
        addresses: {
          create: {
            label: data.address.label ?? "Casa",
            recipientName: data.name.trim(),
            street: data.address.street.trim(),
            number: data.address.number.trim(),
            complement: data.address.complement?.trim() || undefined,
            neighborhood: data.address.neighborhood.trim(),
            city: data.address.city.trim(),
            state: data.address.state.trim().toUpperCase(),
            zip: data.address.zip.replace(/\D/g, ""),
            isDefault: true,
          },
        },
      }),
    },
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      pets: true,
    },
  });

  const payload = { userId: user.id, email: user.email, role: user.role };
  const token = signToken(payload);
  const refreshToken = signRefreshToken({ userId: user.id });

  res.status(201).json({
    token,
    refreshToken,
    user: publicUser(user),
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      pets: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!user || !user.active) throw new AppError("Credenciais inválidas", 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError("Credenciais inválidas", 401);

  const payload = { userId: user.id, email: user.email, role: user.role };
  const token = signToken(payload);
  const refreshToken = signRefreshToken({ userId: user.id });

  res.json({
    token,
    refreshToken,
    user: publicUser(user),
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
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      pets: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!user) throw new AppError("Usuário não encontrado", 404);
  res.json(publicUser(user));
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
