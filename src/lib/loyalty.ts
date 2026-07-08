/**
 * Programa de fidelidade "Patinhas Wazoo".
 *
 * Regras (simples e transparentes):
 *   • Ganhe 1 patinha (ponto) a cada R$ 1 gasto em pedidos.
 *   • 100 patinhas = R$ 5 de desconto (R$ 0,05 por ponto).
 *   • Níveis por total acumulado ao longo do tempo (não caem ao resgatar).
 *
 * Só os IDs/valores são guardados; o saldo resgatado fica no localStorage
 * por usuário. O total acumulado é recalculado a partir dos pedidos.
 */

export const POINTS_PER_BRL = 1;
export const BRL_PER_POINT = 0.05; // 100 pontos = R$ 5

const REDEEMED_KEY = "wazoo:loyalty:redeemed:v1";

export interface Tier {
  key: string;
  name: string;
  emoji: string;
  min: number; // pontos acumulados para entrar no nível
  perk: string;
  color: string; // classe de cor (badge)
}

export const TIERS: Tier[] = [
  { key: "filhote", name: "Filhote", emoji: "🐾", min: 0, perk: "Acumule patinhas em cada compra", color: "bg-cream-200 text-navy-700" },
  { key: "bronze", name: "Bronze", emoji: "🥉", min: 200, perk: "Ofertas antecipadas por e-mail", color: "bg-amber-100 text-amber-700" },
  { key: "prata", name: "Prata", emoji: "🥈", min: 600, perk: "Frete grátis em datas especiais", color: "bg-slate-200 text-slate-700" },
  { key: "ouro", name: "Ouro", emoji: "🥇", min: 1500, perk: "Brindes e prioridade no atendimento", color: "bg-yellow-100 text-yellow-700" },
];

/** Pontos gerados por um valor em reais. */
export function pointsForBRL(total: number): number {
  return Math.max(0, Math.floor(total * POINTS_PER_BRL));
}

/** Valor em reais equivalente a um número de pontos. */
export function brlForPoints(points: number): number {
  return Math.round(points * BRL_PER_POINT * 100) / 100;
}

/** Nível atual a partir do total acumulado. */
export function tierFor(lifetime: number): Tier {
  let current = TIERS[0];
  for (const t of TIERS) if (lifetime >= t.min) current = t;
  return current;
}

/** Próximo nível (ou null se já é o máximo). */
export function nextTier(lifetime: number): Tier | null {
  return TIERS.find((t) => t.min > lifetime) ?? null;
}

/* ── Pontos resgatados (persistência por usuário) ───────────── */
type RedeemedMap = Record<string, number>;

function readMap(): RedeemedMap {
  try {
    const raw = localStorage.getItem(REDEEMED_KEY);
    if (raw) return JSON.parse(raw) as RedeemedMap;
  } catch {
    /* vazio */
  }
  return {};
}

export function getRedeemed(userId: string): number {
  return readMap()[userId] ?? 0;
}

export function addRedeemed(userId: string, points: number): void {
  const map = readMap();
  map[userId] = (map[userId] ?? 0) + Math.max(0, Math.round(points));
  try {
    localStorage.setItem(REDEEMED_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wazoo:loyalty-updated"));
  }
}
