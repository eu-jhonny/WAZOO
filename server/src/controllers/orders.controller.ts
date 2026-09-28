import type { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

const orderItemSchema = z.object({
  productId: z.string().optional(),
  kitId: z.string().optional(),
  quantity: z.number().int().positive().max(99),
  variantKey: z.string().optional(),
  variantLabel: z.string().optional(),
}).refine((item) => Boolean(item.productId) !== Boolean(item.kitId), {
  message: "Informe exatamente um productId ou kitId",
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

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const salt = randomBytes(2).toString("hex").toUpperCase();
  return `WZ-${year}-${stamp}${salt}`;
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

  const resolveVariantPrice = (
    basePrice: number,
    variants: unknown,
    variantKey?: string,
  ) => {
    if (!Array.isArray(variants) || variants.length === 0) {
      return { unitPrice: basePrice, variantLabel: undefined as string | undefined };
    }

    if (!variantKey) {
      throw new AppError("Selecione as opções do produto", 400, "VARIANT_REQUIRED");
    }

    const selected = Object.fromEntries(
      variantKey.split("|").map((part) => {
        const [name, ...rest] = part.split("=");
        return [name, rest.join("=")];
      }),
    );

    let delta = 0;
    const labels: string[] = [];

    for (const group of variants as Array<{ name?: string; options?: Array<{ label?: string; priceDelta?: number }> }>) {
      const groupName = String(group.name ?? "");
      const desired = selected[groupName];
      const option = (group.options ?? []).find((o) => o.label === desired);
      if (!option) {
        throw new AppError(`Opção inválida para ${groupName || "variação"}`, 400, "INVALID_VARIANT");
      }
      delta += Number(option.priceDelta ?? 0);
      labels.push(`${groupName}: ${option.label}`);
    }

    return { unitPrice: basePrice + delta, variantLabel: labels.join(" · ") };
  };

  // Nunca confie em nome ou preço enviados pelo navegador.
  // O servidor resolve os itens diretamente no banco.
  const normalizedItems = await Promise.all(
    data.items.map(async (item) => {
      if (item.productId) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product || !product.active) {
          throw new AppError("Produto indisponível", 400, "PRODUCT_UNAVAILABLE");
        }
        if (typeof product.stock === "number" && product.stock < item.quantity) {
          throw new AppError(`Estoque insuficiente para ${product.name}`, 409, "INSUFFICIENT_STOCK");
        }
        const variant = resolveVariantPrice(product.price, product.variants, item.variantKey);
        return {
          productId: product.id,
          kitId: undefined,
          name: product.name,
          quantity: item.quantity,
          unitPrice: variant.unitPrice,
          image: product.image,
          controlledStock: product.stock !== null,
          variantKey: item.variantKey,
          variantLabel: variant.variantLabel ?? item.variantLabel,
        };
      }

      const kit = await prisma.kit.findUnique({ where: { id: item.kitId! } });
      if (!kit || !kit.active) {
        throw new AppError("Kit indisponível", 400, "KIT_UNAVAILABLE");
      }
      return {
        productId: undefined,
        kitId: kit.id,
        name: kit.name,
        quantity: item.quantity,
        unitPrice: kit.price,
        image: kit.image,
        controlledStock: false,
        variantKey: undefined,
        variantLabel: undefined,
      };
    }),
  );

  const subtotal = normalizedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  let discountAmount = 0;

  const storeSettings = await prisma.setting.findMany({
    where: { key: { in: ["deliveryFee", "freeShippingThreshold"] } },
  });
  const settingMap = new Map(storeSettings.map((s) => [s.key, s.value]));
  const deliveryFee = Math.max(0, Number(settingMap.get("deliveryFee") ?? 15) || 0);
  const freeShippingThreshold = Math.max(
    0,
    Number(settingMap.get("freeShippingThreshold") ?? 199) || 0,
  );

  let couponRef: Awaited<ReturnType<typeof applyCoupon>>["coupon"] | null = null;
  if (data.couponCode) {
    const { discount, coupon } = await applyCoupon(data.couponCode, subtotal);
    discountAmount = Math.min(subtotal, discount);
    couponRef = coupon;
  }

  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const qualifiesForFreeShipping =
    data.deliveryMethod === "DELIVERY" &&
    freeShippingThreshold > 0 &&
    afterDiscount >= freeShippingThreshold;
  let shippingAmount =
    data.deliveryMethod === "DELIVERY" && !qualifiesForFreeShipping
      ? deliveryFee
      : 0;
  if (couponRef?.type === "FREE_SHIPPING") shippingAmount = 0;

  const total = Math.max(0, afterDiscount + shippingAmount);
  const number = generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    // Reserva/debita estoque dentro da mesma transação do pedido.
    for (const item of normalizedItems) {
      if (!item.productId || !item.controlledStock) continue;
      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          active: true,
          stock: { gte: item.quantity },
        },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count !== 1) {
        throw new AppError(`Estoque insuficiente para ${item.name}`, 409, "INSUFFICIENT_STOCK");
      }
    }

    const created = await tx.order.create({
      data: {
        number,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerDoc: data.customerDoc,
        deliveryMethod: data.deliveryMethod,
        addressStreet: data.addressStreet,
        addressNumber: data.addressNumber,
        addressComplement: data.addressComplement,
        addressNeighborhood: data.addressNeighborhood,
        addressCity: data.addressCity,
        addressState: data.addressState,
        addressZip: data.addressZip,
        couponCode: data.couponCode?.toUpperCase(),
        customerNote: data.customerNote,
        subtotal,
        discountAmount,
        shippingAmount,
        total,
        items: {
          create: normalizedItems.map((item) => ({
            productId: item.productId,
            kitId: item.kitId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            image: item.image ?? "",
            variantKey: item.variantKey,
            variantLabel: item.variantLabel,
          })),
        },
      },
      include: { items: true },
    });

    if (couponRef) {
      await tx.coupon.update({
        where: { id: couponRef.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    return created;
  });

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
