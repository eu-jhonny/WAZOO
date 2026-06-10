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

interface CartContextValue {
  items: CartItem[];
  note: string;
  count: number;
  subtotal: number;
  total: number;
  addProduct: (product: Product, quantity?: number, note?: string) => void;
  addKit: (kit: Kit, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemNote: (id: string, note: string) => void;
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
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.id === incoming.id && i.kind === incoming.kind
      );
      if (existing) {
        return prev.map((i) =>
          i.id === incoming.id && i.kind === incoming.kind
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

      addProduct: (product, quantity = 1, itemNote) => {
        upsert({
          id: product.id,
          kind: "product",
          name: product.name,
          price: product.price,
          image: product.image,
          leadTime: product.leadTime,
          category: product.category,
          quantity,
          note: itemNote,
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

      removeItem: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),

      updateQuantity: (id, quantity) =>
        setItems((prev) =>
          prev
            .map((i) =>
              i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
            )
            .filter((i) => i.quantity > 0)
        ),

      updateItemNote: (id, itemNote) =>
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, note: itemNote } : i))
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
