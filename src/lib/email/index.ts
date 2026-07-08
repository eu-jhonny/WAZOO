/**
 * ============================================================
 *  Wazoo Pet Express — API de e-mails (ponto de entrada)
 * ============================================================
 *
 * Funções de alto nível usadas pelo app. Cada uma monta a marca atual,
 * gera o template e dispara o envio (melhor esforço, nunca lança).
 *
 * Exemplo:
 *   import { emails } from "@/lib/email";
 *   emails.orderConfirmation(order);
 */
import type { Order, OrderStatus } from "@/types";
import * as T from "./templates";
import {
  sendEmail,
  getEmailBrand,
  type EmailKind,
  type EmailRecord,
} from "./service";

export * from "./service";
export * from "./templates";

function order2like(o: Order) {
  return {
    id: o.id,
    customerName: o.customerName,
    items: o.items,
    subtotal: o.subtotal,
    discountAmount: o.discountAmount,
    shippingAmount: o.shippingAmount,
    total: o.total,
    fulfillment: o.fulfillment,
    createdAt: o.createdAt,
  };
}

/** Coleção de disparadores prontos, um por evento de negócio. */
export const emails = {
  welcome(to: string, name: string, coupon?: string): Promise<EmailRecord> {
    const brand = getEmailBrand();
    return sendEmail({ kind: "welcome", to, toName: name, content: T.welcomeEmail(brand, { name, coupon }) });
  },

  orderConfirmation(order: Order): Promise<EmailRecord> {
    const brand = getEmailBrand();
    return sendEmail({
      kind: "order_confirmation",
      to: order.customerEmail || "",
      toName: order.customerName,
      content: T.orderConfirmationEmail(brand, order2like(order)),
    });
  },

  orderStatus(order: Order, status?: OrderStatus): Promise<EmailRecord> {
    const brand = getEmailBrand();
    return sendEmail({
      kind: "order_status",
      to: order.customerEmail || "",
      toName: order.customerName,
      content: T.orderStatusEmail(brand, { ...order2like(order), status: status || order.status }),
    });
  },

  paymentConfirmed(order: Order): Promise<EmailRecord> {
    const brand = getEmailBrand();
    return sendEmail({
      kind: "payment_confirmed",
      to: order.customerEmail || "",
      toName: order.customerName,
      content: T.paymentConfirmedEmail(brand, order2like(order)),
    });
  },

  reviewRequest(to: string, name: string, orderId?: string, petName?: string): Promise<EmailRecord> {
    const brand = getEmailBrand();
    return sendEmail({
      kind: "review_request",
      to,
      toName: name,
      content: T.reviewRequestEmail(brand, { name, orderId, petName }),
    });
  },

  abandonedCart(to: string, name: string | undefined, items: { name: string; quantity: number; price: number }[], total: number, coupon?: string): Promise<EmailRecord> {
    const brand = getEmailBrand();
    return sendEmail({
      kind: "abandoned_cart",
      to,
      toName: name,
      content: T.abandonedCartEmail(brand, { name, items, total, coupon }),
    });
  },

  newsletterWelcome(to: string, coupon?: string): Promise<EmailRecord> {
    const brand = getEmailBrand();
    return sendEmail({
      kind: "newsletter_welcome",
      to,
      content: T.newsletterWelcomeEmail(brand, { coupon }),
    });
  },

  passwordChanged(to: string, name?: string): Promise<EmailRecord> {
    const brand = getEmailBrand();
    return sendEmail({
      kind: "password_changed",
      to,
      toName: name,
      content: T.passwordChangedEmail(brand, { name }),
    });
  },

  promo(to: string, opts: { title: string; message: string; ctaLabel?: string; ctaUrl?: string; coupon?: string; emoji?: string }): Promise<EmailRecord> {
    const brand = getEmailBrand();
    return sendEmail({ kind: "promo", to, content: T.promoEmail(brand, opts) });
  },
};

export type { EmailKind };
