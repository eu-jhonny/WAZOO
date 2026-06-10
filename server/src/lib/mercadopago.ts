import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

/* ── Instâncias do SDK ──────────────────────────────── */
export function getMPClient() {
  if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("MP_ACCESS_TOKEN não configurado nas variáveis de ambiente");
  }
  return new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
    options: { timeout: 5000 },
  });
}

/* ── Criar pagamento direto (Transparent Checkout) ── */
export interface CreatePaymentInput {
  token: string;         // token do cartão gerado pelo SDK no frontend
  installments: number;  // parcelas
  paymentMethodId: string; // "visa", "master", "pix" etc.
  issuerId?: string;
  amount: number;
  description: string;
  email: string;
  cpf: string;
  firstName: string;
  lastName: string;
  orderId: string;
  notificationUrl: string;
}

export async function createCardPayment(input: CreatePaymentInput) {
  const client = getMPClient();
  const payment = new Payment(client);

  return payment.create({
    body: {
      transaction_amount: input.amount,
      token: input.token,
      description: input.description,
      installments: input.installments,
      payment_method_id: input.paymentMethodId,
      issuer_id: input.issuerId ? parseInt(input.issuerId) : undefined,
      payer: {
        email: input.email,
        identification: { type: "CPF", number: input.cpf },
        first_name: input.firstName,
        last_name: input.lastName,
      },
      notification_url: input.notificationUrl,
      external_reference: input.orderId,
      metadata: { order_id: input.orderId },
    },
  });
}

/* ── Criar pagamento PIX ────────────────────────────── */
export async function createPixPayment(input: {
  amount: number;
  description: string;
  email: string;
  cpf: string;
  firstName: string;
  lastName: string;
  orderId: string;
  notificationUrl: string;
}) {
  const client = getMPClient();
  const payment = new Payment(client);

  return payment.create({
    body: {
      transaction_amount: input.amount,
      description: input.description,
      payment_method_id: "pix",
      payer: {
        email: input.email,
        identification: { type: "CPF", number: input.cpf },
        first_name: input.firstName,
        last_name: input.lastName,
      },
      notification_url: input.notificationUrl,
      external_reference: input.orderId,
    },
  });
}

/* ── Criar boleto ───────────────────────────────────── */
export async function createBoletoPayment(input: {
  amount: number;
  description: string;
  email: string;
  cpf: string;
  firstName: string;
  lastName: string;
  orderId: string;
  notificationUrl: string;
}) {
  const client = getMPClient();
  const payment = new Payment(client);

  return payment.create({
    body: {
      transaction_amount: input.amount,
      description: input.description,
      payment_method_id: "bolbradesco",
      payer: {
        email: input.email,
        identification: { type: "CPF", number: input.cpf },
        first_name: input.firstName,
        last_name: input.lastName,
      },
      notification_url: input.notificationUrl,
      external_reference: input.orderId,
    },
  });
}

/* ── Buscar pagamento por ID ────────────────────────── */
export async function getPayment(paymentId: string) {
  const client = getMPClient();
  const payment = new Payment(client);
  return payment.get({ id: parseInt(paymentId) });
}

/* ── Criar preferência (para Redirect opcional) ────── */
export async function createPreference(input: {
  title: string;
  quantity: number;
  unitPrice: number;
  orderId: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  notificationUrl: string;
}) {
  const client = getMPClient();
  const preference = new Preference(client);

  return preference.create({
    body: {
      items: [{
        id: input.orderId,
        title: input.title,
        quantity: input.quantity,
        unit_price: input.unitPrice,
        currency_id: "BRL",
      }],
      back_urls: {
        success: input.successUrl,
        failure: input.failureUrl,
        pending: input.pendingUrl,
      },
      auto_return: "approved",
      external_reference: input.orderId,
      notification_url: input.notificationUrl,
    },
  });
}
