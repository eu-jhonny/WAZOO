import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const reviewsRouter = Router();

// Listar (público = só aprovadas)
reviewsRouter.get("/", async (req, res) => {
  const { approved, featured } = req.query;
  const where: Record<string, unknown> = {};
  if (!req.user) where.approved = true;
  else if (approved !== undefined) where.approved = approved === "true";
  if (featured !== undefined) where.featured = featured === "true";

  const reviews = await prisma.review.findMany({ where, orderBy: { createdAt: "desc" } });
  res.json(reviews);
});

// Criar (público)
reviewsRouter.post("/", async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email().optional(),
    petName: z.string().optional(),
    rating: z.number().int().min(1).max(5),
    text: z.string().min(10),
    productId: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const review = await prisma.review.create({ data });
  res.status(201).json(review);
});

// Aprovar/destacar (admin)
reviewsRouter.put("/:id", authenticate, requireAdmin, async (req, res) => {
  const schema = z.object({
    approved: z.boolean().optional(),
    featured: z.boolean().optional(),
  });
  const exists = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!exists) throw new AppError("Avaliação não encontrada", 404);
  const updated = await prisma.review.update({ where: { id: req.params.id }, data: schema.parse(req.body) });
  res.json(updated);
});

// Excluir (admin)
reviewsRouter.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  await prisma.review.delete({ where: { id: req.params.id } });
  res.json({ message: "Avaliação excluída" });
});
