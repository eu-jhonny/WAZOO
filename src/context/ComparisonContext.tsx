import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useToast } from "./ToastContext";
import type { Product } from "@/types";

const MAX = 4;
const KEY = "wazoo:compare:v1";

interface ComparisonContextValue {
  ids: string[];
  count: number;
  max: number;
  isFull: boolean;
  has: (id: string) => boolean;
  toggle: (product: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

/** Lista de produtos selecionados para comparação (máx. 4). */
export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = usePersistentState<string[]>(KEY, []);
  const { showToast } = useToast();

  const value = useMemo<ComparisonContextValue>(() => {
    return {
      ids,
      count: ids.length,
      max: MAX,
      isFull: ids.length >= MAX,
      has: (id) => ids.includes(id),
      remove: (id) => setIds((prev) => prev.filter((x) => x !== id)),
      clear: () => setIds([]),
      toggle: (product) => {
        setIds((prev) => {
          if (prev.includes(product.id)) return prev.filter((x) => x !== product.id);
          if (prev.length >= MAX) {
            showToast(`Você pode comparar até ${MAX} produtos.`, "info");
            return prev;
          }
          showToast(`${product.name} adicionado à comparação ⚖️`, "success");
          return [...prev, product.id];
        });
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>;
}

export function useComparison() {
  const ctx = useContext(ComparisonContext);
  if (!ctx) throw new Error("useComparison deve ser usado dentro de <ComparisonProvider>");
  return ctx;
}
