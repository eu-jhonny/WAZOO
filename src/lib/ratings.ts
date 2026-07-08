import type { Review } from "@/types";

export interface RatingSummary {
  average: number; // 0 se não houver avaliações
  count: number;
}

/** Média e contagem de avaliações aprovadas de um produto. */
export function ratingForProduct(reviews: Review[], productId: string): RatingSummary {
  const list = reviews.filter((r) => r.approved && r.productId === productId);
  if (list.length === 0) return { average: 0, count: 0 };
  const sum = list.reduce((s, r) => s + r.rating, 0);
  return { average: Math.round((sum / list.length) * 10) / 10, count: list.length };
}
