import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import {
  createCardPayment,
  createPixPayment,
  createBoletoPayment,
  getPayment,
} from "../lib/mercadopago";

const baseSchema = z.object({
  orderId: z.string(),
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

/* ── Processar pagamento ──────────────────────────────── */
export async function processPayment(req: Request, res: Response) {
  const input = paymentSchema.parse(req.body);

  const order = await prisma.order.findUnique({ where: { id: input.orderId }, include: { items: true } });
  if (!order) throw new AppError("Pedido não encontrado", 404);
  if (order.paymentStatus === "APPROVED") throw new AppError("Pedido já foi pago", 400);

  const notificationUrl = `${process.env.API_URL}/api/payments/webhook`;
  const description = `Wazoo Pet Express — Pedido ${order.number}`;

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

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentMethod: input.method,
      mpPaymentId: String(result.id),
      paymentStatus: paymentStatus as any,
      pixCode,
      boletoUrl,
      ...(paymentStatus === "APPROVED" && { paidAt: new Date(), status: "CONFIRMED" }),
    },
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
  // Responde 200 imediatamente (MP exige < 5s)
  res.sendStatus(200);

  const { type, data } = req.body;
  if (type !== "payment" || !data?.id) return;

  try {
    const payment = await getPayment(String(data.id));
    if (!payment.external_reference) return;

    const paymentStatus = mpStatusToPaymentStatus(payment.status ?? "pending");
    const pixCode = payment.point_of_interaction?.transaction_data?.qr_code ?? undefined;

    await prisma.order.updateMany({
      where: { id: payment.external_reference },
      data: {
        paymentStatus: paymentStatus as any,
        mpPaymentId: String(payment.id),
        pixCode,
        ...(paymentStatus === "APPROVED" && { paidAt: new Date(), status: "CONFIRMED" }),
        ...(paymentStatus === "REJECTED" && { status: "CANCELLED" }),
      },
    });

    console.log(`[Webhook] Pagamento ${payment.id} → ${paymentStatus}`);
  } catch (err) {
    console.error("[Webhook] Erro ao processar:", err);
  }
}

/* ── Consultar status do pagamento ───────────────────── */
export async function getPaymentStatus(req: Request, res: Response) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    select: { paymentStatus: true, mpPaymentId: true, pixCode: true, boletoUrl: true, paidAt: true, status: true, number: true },
  });
  if (!order) throw new AppError("Pedido não encontrado", 404);
  res.json(order);
}
