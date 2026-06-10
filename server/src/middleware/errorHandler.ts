import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  /* Erro de validação Zod */
  if (err instanceof ZodError) {
    res.status(422).json({
      error: "Dados inválidos",
      issues: err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }

  /* Erro de aplicação */
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  /* Erro genérico */
  console.error("[ERROR]", err);
  res.status(500).json({
    error: process.env.NODE_ENV === "production"
      ? "Erro interno do servidor"
      : err.message,
  });
}
