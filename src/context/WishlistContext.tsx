import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { STORAGE_KEYS } from "@/config/site";
import { useToast } from "./ToastContext";
import type { Product } from "@/types";

interface WishlistContextValue {
  ids: string[];
  count: number;
  has: (id: string) => boolean;
  toggle: (product: Product) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * Lista de desejos (favoritos). Guarda apenas os IDs dos produtos no
 * localStorage; a página de favoritos resolve os produtos via useStore.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = usePersistentState<string[]>(STORAGE_KEYS.wishlist, []);
  const { showToast } = useToast();

  const value = useMemo<WishlistContextValue>(() => {
    const has = (id: string) => ids.includes(id);
    return {
      ids,
      count: ids.length,
      has,
      add: (id) => setIds((prev) => (prev.includes(id) ? prev : [id, ...prev])),
      remove: (id) => setIds((prev) => prev.filter((x) => x !== id)),
      clear: () => setIds([]),
      toggle: (product) => {
        setIds((prev) => {
          if (prev.includes(product.id)) {
            showToast(`${product.name} removido dos favoritos`, "info");
            return prev.filter((x) => x !== product.id);
          }
          showToast(`${product.name} salvo nos favoritos! ❤️`, "success");
          return [product.id, ...prev];
        });
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist deve ser usado dentro de <WishlistProvider>");
  return ctx;
}
