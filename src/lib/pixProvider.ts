/**
 * Integração com o provedor de pagamento (Mercado Pago) via funções
 * serverless em /api/pix/*. Usado para CONFIRMAÇÃO AUTOMÁTICA do PIX.
 *
 * Ativa-se quando VITE_PAYMENTS_AUTO === "true" (e o servidor tem o
 * MP_ACCESS_TOKEN). Caso contrário, o checkout usa o PIX estático manual.
 */
export const isPixAuto = import.meta.env.VITE_PAYMENTS_AUTO === "true";

export interface PixCharge {
  id: string;
  copiaECola: string;
  qrBase64: string;
}

export type PixStatus = "pending" | "paid" | "error";

/** Cria a cobrança PIX no provedor. Retorna null se indisponível. */
export async function createPixCharge(input: {
  amount: number;
  payerEmail: string;
  payerName?: string;
  description?: string;
  txid?: string;
}): Promise<PixCharge | null> {
  try {
    const r = await fetch("/api/pix/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!r.ok) return null;
    const d = await r.json();
    if (!d?.copiaECola || !d?.qrBase64) return null;
    return { id: String(d.id), copiaECola: d.copiaECola, qrBase64: d.qrBase64 };
  } catch {
    return null;
  }
}

/** Consulta o status do pagamento. */
export async function getPixStatus(id: string): Promise<PixStatus> {
  try {
    const r = await fetch(`/api/pix/status?id=${encodeURIComponent(id)}`);
    if (!r.ok) return "error";
    const d = await r.json();
    return d?.paid ? "paid" : "pending";
  } catch {
    return "error";
  }
}
