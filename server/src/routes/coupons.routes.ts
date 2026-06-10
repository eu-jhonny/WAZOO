import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const couponsRouter = Router();

const couponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number().nonnegative(),
  minOrder: z.number().nonnegative().optional(),
  maxUses: z.number().int().positive().optional(),
  active: z.boolean().default(true),
  expiresAt: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
});

couponsRouter.get("/", authenticate, requireAdmin, async (_req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  res.json(coupons);
});

couponsRouter.post("/", authenticate, requireAdmin, async (req, res) => {
  const data = couponSchema.parse(req.body);
  const exists = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (exists) throw new AppError("Código de cupom já existe", 409);
  const coupon = await prisma.coupon.create({ data });
  res.status(201).json(coupon);
});

couponsRouter.put("/:id", authenticate, requireAdmin, async (req, res) => {
  const exists = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!exists) throw new AppError("Cupom não encontrado", 404);
  const updated = await prisma.coupon.update({ where: { id: req.params.id }, data: couponSchema.partial().parse(req.body) });
  res.json(updated);
});

couponsRouter.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.json({ message: "Cupom excluído" });
});
