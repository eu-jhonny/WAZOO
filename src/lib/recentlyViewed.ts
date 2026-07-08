/**
 * Histórico de produtos vistos recentemente (localStorage).
 * Guarda apenas os IDs, do mais recente para o mais antigo.
 */
import { STORAGE_KEYS } from "@/config/site";

const LIMIT = 12;

export function getRecentlyViewed(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.recentlyViewed);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    /* vazio */
  }
  return [];
}

/** Registra um produto como visto (move para o topo, sem duplicar). */
export function pushRecentlyViewed(id: string): void {
  try {
    const list = getRecentlyViewed().filter((x) => x !== id);
    list.unshift(id);
    localStorage.setItem(
      STORAGE_KEYS.recentlyViewed,
      JSON.stringify(list.slice(0, LIMIT)),
    );
    window.dispatchEvent(new CustomEvent("wazoo:recently-viewed"));
  } catch {
    /* storage cheio — ignora */
  }
}
