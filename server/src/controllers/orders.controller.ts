import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

const orderItemSchema = z.object({
  productId: z.string().optional(),
  kitId: z.string().optional(),
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  image: z.string().optional(),
});

const createOrderSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  customerDoc: z.string().optional(),
  deliveryMethod: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
  couponCode: z.string().optional(),
  customerNote: z.string().optional(),
});

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count();
  return `WZ-${year}-${String(count + 1).padStart(4, "0")}`;
}

async function applyCoupon(code: string, subtotal: number) {
  const coupon = await prisma.coupon.findFirst({
    where: { code: code.toUpperCase(), active: true },
  });
  if (!coupon) throw new AppError("Cupom inválido ou expirado", 400, "INVALID_COUPON");
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new AppError("Cupom expirado", 400, "COUPON_EXPIRED");
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new AppError("Cupom esgotado", 400, "COUPON_EXHAUSTED");
  }
  if (coupon.minOrder && subtotal < coupon.minOrder) {
    throw new AppError(`Pedido mínimo para este cupom: R$ ${coupon.minOrder.toFixed(2)}`, 400);
  }

  let discount = 0;
  if (coupon.type === "PERCENTAGE") discount = (subtotal * coupon.value) / 100;
  else if (coupon.type === "FIXED") discount = coupon.value;
  // FREE_SHIPPING tratado no cálculo de frete

  return { discount, coupon };
}

/* ── Criar pedido ────────────────────────────────────── */
export async function createOrder(req: Request, res: Response) {
  const data = createOrderSchema.parse(req.body);

  const subtotal = data.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  let discountAmount = 0;
  let shippingAmount = data.deliveryMethod === "DELIVERY" ? 15 : 0; // taxa base — pode ser calculada por CEP

  let couponRef: Awaited<ReturnType<typeof applyCoupon>>["coupon"] | null = null;
  if (data.couponCode) {
    const { discount, coupon } = await applyCoupon(data.couponCode, subtotal);
    discountAmount = discount;
    if (coupon.type === "FREE_SHIPPING") shippingAmount = 0;
    couponRef = coupon;
  }

  const total = Math.max(0, subtotal - discountAmount + shippingAmount);
  const number = await generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      number,
      ...data,
      subtotal,
      discountAmount,
      shippingAmount,
      total,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          kitId: item.kitId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          image: item.image ?? "",
        })),
      },
    },
    include: { items: true },
  });

  // Incrementa uso do cupom
  if (couponRef) {
    await prisma.coupon.update({
      where: { id: couponRef.id },
      data: { usedCount: { increment: 1 } },
    });
  }

  res.status(201).json(order);
}

/* ── Listar pedidos (admin) ──────────────────────────── */
export async function listOrders(req: Request, res: Response) {
  const { status, page = "1", limit = "20", search } = req.query;
  const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
  const take = parseInt(String(limit));

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) where.OR = [
    { number: { contains: String(search), mode: "insensitive" } },
    { customerName: { contains: String(search), mode: "insensitive" } },
    { customerEmail: { contains: String(search), mode: "insensitive" } },
  ];

  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, include: { items: true } }),
    prisma.order.count({ where }),
  ]);

  res.json({ data: orders, total, page: parseInt(String(page)), pages: Math.ceil(total / take) });
}

/* ── Buscar pedido ───────────────────────────────────── */
export async function getOrder(req: Request, res: Response) {
  const order = await prisma.order.findFirst({
    where: { OR: [{ id: req.params.id }, { number: req.params.id }] },
    include: { items: true },
  });
  if (!order) throw new AppError("Pedido não encontrado", 404);
  res.json(order);
}

/* ── Atualizar status (admin) ────────────────────────── */
export async function updateOrderStatus(req: Request, res: Response) {
  const schema = z.object({
    status: z.enum(["PENDING","CONFIRMED","PROCESSING","READY","SHIPPED","DELIVERED","CANCELLED"]).optional(),
    adminNote: z.string().optional(),
  });
  const data = schema.parse(req.body);

  const exists = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!exists) throw new AppError("Pedido não encontrado", 404);

  const updated = await prisma.order.update({ where: { id: req.params.id }, data });
  res.json(updated);
}

/* ── Validar cupom ───────────────────────────────────── */
export async function validateCoupon(req: Request, res: Response) {
  const { code, subtotal } = z.object({ code: z.string(), subtotal: z.number() }).parse(req.body);
  const { discount, coupon } = await applyCoupon(code, subtotal);
  res.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
  });
}

/* ── Cancelar pedido pendente ────────────────────────── */
export async function cancelOrder(req: Request, res: Response) {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError("Pedido não encontrado", 404);
  if (order.status === "DELIVERED" || order.status === "CANCELLED") {
    throw new AppError("Este pedido não pode ser cancelado", 400);
  }
  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: "CANCELLED" },
  });
  res.json(updated);
}
