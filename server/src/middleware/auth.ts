import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError("Token não fornecido", 401, "UNAUTHORIZED");
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = payload;
    next();
  } catch {
    throw new AppError("Token inválido ou expirado", 401, "INVALID_TOKEN");
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new AppError("Não autenticado", 401);
  if (!["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
    throw new AppError("Acesso negado — somente admins", 403, "FORBIDDEN");
  }
  next();
}
