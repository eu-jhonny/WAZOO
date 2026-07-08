/**
 * Cupons de desconto — gerenciáveis pelo admin.
 *
 * Ficam no localStorage (`wazoo:coupons:v1`). Na primeira execução,
 * usa os cupons padrão (os mesmos que antes eram fixos no checkout).
 * O checkout valida via `validateCoupon`.
 */
export type CouponType = "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";

export interface AdminCoupon {
  code: string;
  type: CouponType;
  value: number;       // % (PERCENTAGE) ou R$ (FIXED); ignorado em FREE_SHIPPING
  minOrder?: number;   // valor mínimo do pedido
  description?: string;
  active: boolean;
  createdAt: number;
}

export const COUPONS_KEY = "wazoo:coupons:v1";

export const seedCoupons: AdminCoupon[] = [
  { code: "WAZOO10", type: "PERCENTAGE", value: 10, description: "10% de desconto geral", active: true, createdAt: Date.now() },
  { code: "BEMVINDO", type: "PERCENTAGE", value: 15, minOrder: 100, description: "Boas-vindas: 15% acima de R$ 100", active: true, createdAt: Date.now() },
  { code: "VOLTA10", type: "PERCENTAGE", value: 10, description: "Recuperação de carrinho", active: true, createdAt: Date.now() },
  { code: "FRETEGRATIS", type: "FREE_SHIPPING", value: 0, description: "Frete grátis", active: true, createdAt: Date.now() },
];

export function readCoupons(): AdminCoupon[] {
  try {
    const raw = localStorage.getItem(COUPONS_KEY);
    if (raw) return JSON.parse(raw) as AdminCoupon[];
  } catch {
    /* vazio */
  }
  return seedCoupons;
}

export function saveCoupons(list: AdminCoupon[]): void {
  try {
    localStorage.setItem(COUPONS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wazoo:coupons-updated"));
  }
}

export interface CouponResult {
  ok: boolean;
  error?: string;
  coupon?: AdminCoupon;
  discount: number;      // desconto em R$ sobre o subtotal
  freeShipping: boolean;
}

/** Valida um código contra o subtotal informado. */
export function validateCoupon(code: string, subtotal: number): CouponResult {
  const norm = code.trim().toUpperCase();
  const c = readCoupons().find((x) => x.code.toUpperCase() === norm);
  if (!c || !c.active) return { ok: false, error: "Cupom inválido ou expirado.", discount: 0, freeShipping: false };
  if (c.minOrder && subtotal < c.minOrder) {
    return { ok: false, error: `Válido para pedidos acima de R$ ${c.minOrder.toFixed(2).replace(".", ",")}.`, discount: 0, freeShipping: false };
  }
  if (c.type === "PERCENTAGE") {
    return { ok: true, coupon: c, discount: Math.round(subtotal * (c.value / 100) * 100) / 100, freeShipping: false };
  }
  if (c.type === "FIXED") {
    return { ok: true, coupon: c, discount: Math.min(c.value, subtotal), freeShipping: false };
  }
  return { ok: true, coupon: c, discount: 0, freeShipping: true };
}
