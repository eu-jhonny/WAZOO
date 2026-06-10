import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const bannersRouter = Router();

const bannerSchema = z.object({
  image: z.string().optional(),
  fallback: z.string().default("from-orange-400 to-orange-600"),
  tag: z.string().optional(),
  title: z.string().min(2),
  subtitle: z.string().optional(),
  cta: z.string().default("Ver mais"),
  ctaStyle: z.string().optional(),
  link: z.string().default("/produtos"),
  category: z.string().default("geral"),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
});

bannersRouter.get("/", async (_req, res) => {
  const banners = await prisma.banner.findMany({ where: { active: true }, orderBy: { order: "asc" } });
  res.json(banners);
});

bannersRouter.post("/", authenticate, requireAdmin, async (req, res) => {
  const data = bannerSchema.parse(req.body);
  const banner = await prisma.banner.create({ data });
  res.status(201).json(banner);
});

bannersRouter.put("/:id", authenticate, requireAdmin, async (req, res) => {
  const exists = await prisma.banner.findUnique({ where: { id: req.params.id } });
  if (!exists) throw new AppError("Banner não encontrado", 404);
  const updated = await prisma.banner.update({ where: { id: req.params.id }, data: bannerSchema.partial().parse(req.body) });
  res.json(updated);
});

bannersRouter.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  await prisma.banner.delete({ where: { id: req.params.id } });
  res.json({ message: "Banner excluído" });
});
