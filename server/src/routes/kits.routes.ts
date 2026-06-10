import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const kitsRouter = Router();

const kitSchema = z.object({
  name: z.string().min(2),
  description: z.string(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  image: z.string().optional(),
  accent: z.enum(["orange","teal","green","pink","purple"]).default("orange"),
  items: z.array(z.string()).min(1),
  audience: z.enum(["cachorro","gato","ambos"]).default("ambos"),
  leadTime: z.string().default("7-10 dias úteis"),
  active: z.boolean().optional(),
});

function toSlug(s: string) { return s.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,""); }

kitsRouter.get("/", async (_req, res) => {
  const kits = await prisma.kit.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } });
  res.json(kits);
});

kitsRouter.get("/:id", async (req, res) => {
  const kit = await prisma.kit.findFirst({ where: { OR: [{ id: req.params.id }, { slug: req.params.id }] } });
  if (!kit) throw new AppError("Kit não encontrado", 404);
  res.json(kit);
});

kitsRouter.post("/", authenticate, requireAdmin, async (req, res) => {
  const data = kitSchema.parse(req.body);
  const kit = await prisma.kit.create({ data: { ...data, slug: toSlug(data.name), image: data.image ?? "" } });
  res.status(201).json(kit);
});

kitsRouter.put("/:id", authenticate, requireAdmin, async (req, res) => {
  const exists = await prisma.kit.findUnique({ where: { id: req.params.id } });
  if (!exists) throw new AppError("Kit não encontrado", 404);
  const updated = await prisma.kit.update({ where: { id: req.params.id }, data: kitSchema.partial().parse(req.body) });
  res.json(updated);
});

kitsRouter.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  await prisma.kit.delete({ where: { id: req.params.id } });
  res.json({ message: "Kit excluído" });
});
