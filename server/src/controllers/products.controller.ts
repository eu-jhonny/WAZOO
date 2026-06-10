import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

function toSlug(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const productSchema = z.object({
  name: z.string().min(2),
  categorySlug: z.string(),
  shortDescription: z.string().max(200),
  description: z.string(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  promoLabel: z.string().optional(),
  image: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  audience: z.enum(["cachorro", "gato", "ambos"]).default("ambos"),
  size: z.enum(["pequeno", "medio", "grande", "todos"]).default("todos"),
  leadTime: z.string().default("5-7 dias úteis"),
  availability: z.string().default("Disponível sob encomenda"),
  tags: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  onDemand: z.boolean().default(true),
  stock: z.number().int().optional(),
});

/* ── Listar ──────────────────────────────────────────── */
export async function listProducts(req: Request, res: Response) {
  const { category, audience, featured, active, search, page = "1", limit = "20" } = req.query;

  const where: Record<string, unknown> = {};
  if (category) where.categorySlug = category;
  if (audience) where.audience = { in: [audience, "ambos"] };
  if (featured !== undefined) where.featured = featured === "true";
  if (active !== undefined) where.active = active === "true";
  else if (!req.user) where.active = true; // público só vê ativos
  if (search) where.OR = [
    { name: { contains: String(search), mode: "insensitive" } },
    { shortDescription: { contains: String(search), mode: "insensitive" } },
  ];

  const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
  const take = parseInt(String(limit));

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.product.count({ where }),
  ]);

  res.json({ data: products, total, page: parseInt(String(page)), pages: Math.ceil(total / take) });
}

/* ── Buscar por ID ───────────────────────────────────── */
export async function getProduct(req: Request, res: Response) {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
  });
  if (!product) throw new AppError("Produto não encontrado", 404);
  res.json(product);
}

/* ── Criar ───────────────────────────────────────────── */
export async function createProduct(req: Request, res: Response) {
  const data = productSchema.parse(req.body);
  const slug = toSlug(data.name);

  const product = await prisma.product.create({
    data: {
      ...data,
      slug,
      image: data.image ?? "",
      gallery: data.gallery ?? [],
      tags: data.tags ?? [],
    },
  });
  res.status(201).json(product);
}

/* ── Atualizar ───────────────────────────────────────── */
export async function updateProduct(req: Request, res: Response) {
  const exists = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!exists) throw new AppError("Produto não encontrado", 404);

  const data = productSchema.partial().parse(req.body);
  const updated = await prisma.product.update({ where: { id: req.params.id }, data });
  res.json(updated);
}

/* ── Excluir ─────────────────────────────────────────── */
export async function deleteProduct(req: Request, res: Response) {
  const exists = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!exists) throw new AppError("Produto não encontrado", 404);

  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ message: "Produto excluído" });
}
