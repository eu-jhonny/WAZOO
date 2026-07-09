import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { STORAGE_KEYS } from "@/config/site";
import { useToast } from "./ToastContext";
import type { CartItem, Kit, Product } from "@/types";

/** Variação escolhida ao adicionar um produto ao carrinho. */
export interface SelectedVariant {
  key: string;   // chave estável (identidade da linha)
  label: string; // rótulo legível
  price: number; // preço unitário final (base + ajustes)
}

/** Identidade única de uma linha do carrinho (produto + variação). */
export function cartLineId(item: Pick<CartItem, "kind" | "id" | "variantKey">): string {
  return `${item.kind}:${item.id}:${item.variantKey ?? ""}`;
}

interface CartContextValue {
  items: CartItem[];
  note: string;
  count: number;
  subtotal: number;
  total: number;
  lineId: (item: Pick<CartItem, "kind" | "id" | "variantKey">) => string;
  addProduct: (product: Product, quantity?: number, note?: string, variant?: SelectedVariant) => void;
  addKit: (kit: Kit, quantity?: number) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  updateItemNote: (lineId: string, note: string) => void;
  setNote: (note: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = usePersistentState<CartItem[]>(
    STORAGE_KEYS.cart,
    []
  );
  const [note, setNoteState] = usePersistentState<string>(
    STORAGE_KEYS.cartNote,
    ""
  );
  const { showToast } = useToast();

  const upsert = (incoming: CartItem) => {
    const key = cartLineId(incoming);
    setItems((prev) => {
      const existing = prev.find((i) => cartLineId(i) === key);
      if (existing) {
        return prev.map((i) =>
          cartLineId(i) === key
            ? {
                ...i,
                quantity: i.quantity + incoming.quantity,
                note: incoming.note || i.note,
              }
            : i
        );
      }
      return [...prev, incoming];
    });
  };

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const count = items.reduce((sum, i) => sum + i.quantity, 0);

    return {
      items,
      note,
      count,
      subtotal,
      total: subtotal,
      lineId: cartLineId,

      addProduct: (product, quantity = 1, itemNote, variant) => {
        upsert({
          id: product.id,
          kind: "product",
          name: product.name,
          price: variant ? variant.price : product.price,
          image: product.image,
          leadTime: product.leadTime,
          category: product.category,
          quantity,
          note: itemNote,
          variant: variant?.label,
          variantKey: variant?.key,
        });
        showToast(`${product.name} adicionado ao carrinho! 🛒`, "success");
      },

      addKit: (kit, quantity = 1) => {
        upsert({
          id: kit.id,
          kind: "kit",
          name: kit.name,
          price: kit.price,
          image: kit.image,
          leadTime: kit.leadTime,
          quantity,
        });
        showToast(`${kit.name} adicionado ao carrinho! 🛒`, "success");
      },

      removeItem: (lineId) =>
        setItems((prev) => prev.filter((i) => cartLineId(i) !== lineId)),

      updateQuantity: (lineId, quantity) =>
        setItems((prev) =>
          prev
            .map((i) =>
              cartLineId(i) === lineId ? { ...i, quantity: Math.max(1, quantity) } : i
            )
            .filter((i) => i.quantity > 0)
        ),

      updateItemNote: (lineId, itemNote) =>
        setItems((prev) =>
          prev.map((i) => (cartLineId(i) === lineId ? { ...i, note: itemNote } : i))
        ),

      setNote: (value) => setNoteState(value),

      clear: () => {
        setItems([]);
        setNoteState("");
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, note]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}
