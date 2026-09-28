import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Devolve ao catálogo somente o estoque que foi efetivamente reservado
 * quando o pedido foi criado. A flag stockReserved torna a operação idempotente.
 */
export async function releaseReservedInventory(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  const items = await tx.orderItem.findMany({
    where: {
      orderId,
      stockReserved: true,
      productId: { not: null },
    },
    select: {
      id: true,
      productId: true,
      quantity: true,
    },
  });

  for (const item of items) {
    if (!item.productId) continue;

    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });

    await tx.orderItem.update({
      where: { id: item.id },
      data: { stockReserved: false },
    });
  }
}

/**
 * O uso do cupom é reservado no momento da criação do pedido.
 * Se a compra for cancelada antes de ser concluída, liberamos esse uso.
 */
export async function releaseCouponUsage(
  tx: Prisma.TransactionClient,
  couponCode?: string | null,
) {
  if (!couponCode) return;

  const coupon = await tx.coupon.findUnique({
    where: { code: couponCode.toUpperCase() },
    select: { id: true, usedCount: true },
  });

  if (!coupon || coupon.usedCount <= 0) return;

  await tx.coupon.update({
    where: { id: coupon.id },
    data: { usedCount: { decrement: 1 } },
  });
}


/**
 * Cancela pedidos cujo tempo de reserva expirou e devolve estoque/cupom.
 * O update condicional evita que dois workers liberem a mesma reserva.
 */
export async function expireStaleOrderReservations() {
  const now = new Date();
  const stale = await prisma.order.findMany({
    where: {
      status: "PENDING",
      paymentStatus: { in: ["PENDING", "IN_PROCESS"] },
      reservationExpiresAt: { lte: now },
    },
    select: {
      id: true,
      couponCode: true,
    },
    take: 100,
  });

  let expired = 0;

  for (const order of stale) {
    await prisma.$transaction(async (tx) => {
      const locked = await tx.order.updateMany({
        where: {
          id: order.id,
          status: "PENDING",
          reservationExpiresAt: { lte: now },
        },
        data: {
          status: "CANCELLED",
          reservationExpiresAt: null,
        },
      });

      if (locked.count !== 1) return;

      await releaseReservedInventory(tx, order.id);
      await releaseCouponUsage(tx, order.couponCode);
      await tx.orderStatusEvent.create({
        data: { orderId: order.id, status: "CANCELLED" },
      });
      expired += 1;
    });
  }

  return expired;
}
