import type { Request, Response } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { releaseCouponUsage, releaseReservedInventory } from "../lib/orderInventory";
import {
  createCardPayment,
  createPixPayment,
  createBoletoPayment,
  getPayment,
} from "../lib/mercadopago";

const baseSchema = z.object({
  orderId: z.string(),
  publicToken: z.string(),
  email: z.string().email(),
  cpf: z.string().min(11).max(14),
  firstName: z.string(),
  lastName: z.string(),
});

const cardSchema = baseSchema.extend({
  method: z.literal("credit_card"),
  token: z.string(),
  installments: z.number().int().min(1).max(12),
  paymentMethodId: z.string(),
  issuerId: z.string().optional(),
});

const pixSchema = baseSchema.extend({ method: z.literal("pix") });
const boletoSchema = baseSchema.extend({ method: z.literal("boleto") });

const paymentSchema = z.discriminatedUnion("method", [cardSchema, pixSchema, boletoSchema]);

function mpStatusToPaymentStatus(mpStatus: string) {
  const map: Record<string, string> = {
    approved: "APPROVED",
    pending: "PENDING",
    in_process: "IN_PROCESS",
    rejected: "REJECTED",
    refunded: "REFUNDED",
    cancelled: "REJECTED",
  };
  return map[mpStatus] ?? "PENDING";
}

function isValidMercadoPagoWebhook(req: Request) {
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.warn("[Webhook] MP_WEBHOOK_SECRET não configurado.");
    return process.env.NODE_ENV !== "production";
  }

  const signature = String(req.headers["x-signature"] ?? "");
  const requestId = String(req.headers["x-request-id"] ?? "");
  const dataId = String(req.query?.["data.id"] ?? req.body?.data?.id ?? "").toLowerCase();

  const parts = Object.fromEntries(
    signature
      .split(",")
      .map((part) => part.trim().split("="))
      .filter(([key, value]) => key && value),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1 || !requestId || !dataId) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(v1, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/* ── Processar pagamento ──────────────────────────────── */
export async function processPayment(req: Request, res: Response) {
  const input = paymentSchema.parse(req.body);

  const order = await prisma.order.findUnique({ where: { id: input.orderId }, include: { items: true } });
  if (!order) throw new AppError("Pedido não encontrado", 404);
  if (order.publicToken !== input.publicToken) throw new AppError("Acesso ao pedido negado", 403, "INVALID_ORDER_TOKEN");
  if (order.paymentStatus === "APPROVED") throw new AppError("Pedido já foi pago", 400);

  const publicApiUrl = (process.env.API_URL || process.env.RENDER_EXTERNAL_URL || "").replace(/\/$/, "");
  if (!publicApiUrl) {
    throw new AppError("URL pública da API não configurada", 500, "API_URL_MISSING");
  }
  const notificationUrl = `${publicApiUrl}/api/payments/webhook`;
  const description = `Wazoo — Pedido ${order.number}`;

  let result: Awaited<ReturnType<typeof createCardPayment>>;

  if (input.method === "credit_card") {
    result = await createCardPayment({
      token: input.token,
      installments: input.installments,
      paymentMethodId: input.paymentMethodId,
      issuerId: input.issuerId,
      amount: order.total,
      description,
      email: input.email,
      cpf: input.cpf.replace(/\D/g, ""),
      firstName: input.firstName,
      lastName: input.lastName,
      orderId: order.id,
      notificationUrl,
    });
  } else if (input.method === "pix") {
    result = await createPixPayment({
      amount: order.total,
      description,
      email: input.email,
      cpf: input.cpf.replace(/\D/g, ""),
      firstName: input.firstName,
      lastName: input.lastName,
      orderId: order.id,
      notificationUrl,
    });
  } else {
    result = await createBoletoPayment({
      amount: order.total,
      description,
      email: input.email,
      cpf: input.cpf.replace(/\D/g, ""),
      firstName: input.firstName,
      lastName: input.lastName,
      orderId: order.id,
      notificationUrl,
    });
  }

  const paymentStatus = mpStatusToPaymentStatus(result.status ?? "pending");
  const pixCode = result.point_of_interaction?.transaction_data?.qr_code ?? undefined;
  const boletoUrl = result.transaction_details?.external_resource_url ?? undefined;

  await prisma.$transaction(async (tx) => {
    const rejected = paymentStatus === "REJECTED";
    if (rejected && order.status !== "CANCELLED") {
      await releaseReservedInventory(tx, order.id);
      await releaseCouponUsage(tx, order.couponCode);
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: input.method,
        mpPaymentId: String(result.id),
        paymentStatus: paymentStatus as any,
        pixCode,
        boletoUrl,
        ...(paymentStatus === "APPROVED" && { paidAt: new Date(), status: "CONFIRMED", reservationExpiresAt: null }),
        ...(rejected && { status: "CANCELLED", reservationExpiresAt: null }),
      },
    });

    const nextStatus =
      paymentStatus === "APPROVED"
        ? "CONFIRMED"
        : rejected
          ? "CANCELLED"
          : undefined;

    if (nextStatus && order.status !== nextStatus) {
      await tx.orderStatusEvent.create({
        data: { orderId: order.id, status: nextStatus },
      });
    }
  });

  res.json({
    paymentId: result.id,
    status: paymentStatus,
    method: input.method,
    pixCode,
    pixQrBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
    boletoUrl,
    total: order.total,
    orderNumber: order.number,
  });
}

/* ── Webhook MercadoPago ──────────────────────────────── */
export async function paymentWebhook(req: Request, res: Response) {
  if (!isValidMercadoPagoWebhook(req)) {
    console.warn("[Webhook] Assinatura Mercado Pago inválida; evento ignorado.");
    res.sendStatus(401);
    return;
  }

  // Responde 200 rapidamente; o processamento abaixo é idempotente.
  res.sendStatus(200);

  const { type, data } = req.body;
  if (type !== "payment" || !data?.id) return;

  try {
    const payment = await getPayment(String(data.id));
    if (!payment.external_reference) return;

    const paymentStatus = mpStatusToPaymentStatus(payment.status ?? "pending");
    const pixCode = payment.point_of_interaction?.transaction_data?.qr_code ?? undefined;

    const order = await prisma.order.findUnique({
      where: { id: payment.external_reference },
      select: { id: true, status: true, couponCode: true },
    });
    if (!order) return;

    const nextStatus =
      paymentStatus === "APPROVED"
        ? "CONFIRMED"
        : paymentStatus === "REJECTED"
          ? "CANCELLED"
          : undefined;

    await prisma.$transaction(async (tx) => {
      if (paymentStatus === "REJECTED" && order.status !== "CANCELLED") {
        await releaseReservedInventory(tx, order.id);
        await releaseCouponUsage(tx, order.couponCode);
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: paymentStatus as any,
          mpPaymentId: String(payment.id),
          pixCode,
          ...(paymentStatus === "APPROVED" && { paidAt: new Date(), status: "CONFIRMED" }),
          ...(paymentStatus === "REJECTED" && { status: "CANCELLED", reservationExpiresAt: null }),
        },
      });
      if (nextStatus && nextStatus !== order.status) {
        await tx.orderStatusEvent.create({
          data: { orderId: order.id, status: nextStatus },
        });
      }
    });

    console.log(`[Webhook] Pagamento ${payment.id} → ${paymentStatus}`);
  } catch (err) {
    console.error("[Webhook] Erro ao processar:", err);
  }
}

/* ── Consultar status do pagamento ───────────────────── */
export async function getPaymentStatus(req: Request, res: Response) {
  const token = z.string().min(1).parse(req.query.token);
  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    select: {
      paymentStatus: true,
      mpPaymentId: true,
      pixCode: true,
      boletoUrl: true,
      paidAt: true,
      status: true,
      number: true,
      publicToken: true,
    },
  });
  if (!order) throw new AppError("Pedido não encontrado", 404);
  if (order.publicToken !== token) {
    throw new AppError("Acesso ao pedido negado", 403, "INVALID_ORDER_TOKEN");
  }
  const { publicToken: _secret, ...safe } = order;
  res.json(safe);
}
