import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { STORAGE_KEYS, site } from "@/config/site";
import { seedProducts } from "@/data/products";
import { seedOrders } from "@/data/orders";
import { seedReviews } from "@/data/reviews";
import { uid } from "@/lib/format";
import { emails } from "@/lib/email";
import type {
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Review,
  SiteSettings,
  Fulfillment,
} from "@/types";

const defaultSettings: SiteSettings = {
  storeName: site.storeName,
  whatsapp: site.whatsappNumber,
  instagram: site.instagram,
  hours: site.hours,
  institutionalText: site.institutionalText,
  deliveryFee: site.deliveryFee,
};

export interface NewOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  petName?: string;
  fulfillment: Fulfillment;
  items: OrderItem[];
  subtotal?: number;
  discountAmount?: number;
  shippingAmount?: number;
  total: number;
  note?: string;
  userId?: string;
}

interface StoreContextValue {
  // Produtos
  products: Product[];
  getProduct: (id: string) => Product | undefined;
  addProduct: (data: Omit<Product, "id" | "createdAt">) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductActive: (id: string) => void;
  toggleProductFeatured: (id: string) => void;

  // Pedidos
  orders: Order[];
  addOrder: (input: NewOrderInput) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  setOrderInternalNote: (id: string, note: string) => void;

  // Avaliações
  reviews: Review[];
  addReview: (data: Omit<Review, "id" | "createdAt" | "approved" | "featured">) => void;
  approveReview: (id: string) => void;
  deleteReview: (id: string) => void;
  toggleReviewFeatured: (id: string) => void;

  // Configurações
  settings: SiteSettings;
  updateSettings: (data: Partial<SiteSettings>) => void;

  // Utilitário
  resetStore: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

/** Gera o próximo número de pedido (WZ-XXXX). */
function nextOrderId(orders: Order[]): string {
  const numbers = orders
    .map((o) => parseInt(o.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const max = numbers.length ? Math.max(...numbers) : 1042;
  return `WZ-${max + 1}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = usePersistentState<Product[]>(
    STORAGE_KEYS.products,
    seedProducts
  );
  const [orders, setOrders] = usePersistentState<Order[]>(
    STORAGE_KEYS.orders,
    seedOrders
  );
  const [reviews, setReviews] = usePersistentState<Review[]>(
    STORAGE_KEYS.reviews,
    seedReviews
  );
  const [settings, setSettings] = usePersistentState<SiteSettings>(
    STORAGE_KEYS.settings,
    defaultSettings
  );

  const value = useMemo<StoreContextValue>(() => {
    return {
      // ---------- Produtos ----------
      products,
      getProduct: (id) => products.find((p) => p.id === id),
      addProduct: (data) => {
        const product: Product = {
          ...data,
          id: uid("p-"),
          createdAt: Date.now(),
        };
        setProducts((prev) => [product, ...prev]);
        return product;
      },
      updateProduct: (id, data) =>
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...data } : p))
        ),
      deleteProduct: (id) =>
        setProducts((prev) => prev.filter((p) => p.id !== id)),
      toggleProductActive: (id) =>
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
        ),
      toggleProductFeatured: (id) =>
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, featured: !p.featured } : p))
        ),

      // ---------- Pedidos ----------
      orders,
      addOrder: (input) => {
        const now = Date.now();
        const subtotal =
          input.subtotal ?? input.items.reduce((s, i) => s + i.price * i.quantity, 0);
        const order: Order = {
          id: nextOrderId(orders),
          userId: input.userId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail,
          petName: input.petName,
          fulfillment: input.fulfillment,
          items: input.items,
          subtotal,
          discountAmount: input.discountAmount,
          shippingAmount: input.shippingAmount,
          total: input.total,
          note: input.note,
          status: "Solicitação enviada",
          history: [{ status: "Solicitação enviada", at: now }],
          createdAt: now,
        };
        setOrders((prev) => [order, ...prev]);
        // E-mail de confirmação de pedido (melhor esforço — não bloqueia o fluxo).
        if (order.customerEmail) void emails.orderConfirmation(order);
        return order;
      },
      updateOrderStatus: (id, status) =>
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id !== id || o.status === status) return o;
            const updated: Order = {
              ...o,
              status,
              history: [...o.history, { status, at: Date.now() }],
            };
            // Avisa o cliente sobre a mudança de status por e-mail.
            if (updated.customerEmail) {
              if (status === "Pedido confirmado") void emails.paymentConfirmed(updated);
              else void emails.orderStatus(updated, status);
              // Após finalizar, convida o cliente a avaliar a compra.
              if (status === "Finalizado") {
                void emails.reviewRequest(
                  updated.customerEmail,
                  updated.customerName,
                  updated.id,
                  updated.petName,
                );
              }
            }
            return updated;
          })
        ),
      setOrderInternalNote: (id, note) =>
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, internalNote: note } : o))
        ),

      // ---------- Avaliações ----------
      reviews,
      addReview: (data) => {
        const review: Review = {
          ...data,
          id: uid("r-"),
          approved: false,
          featured: false,
          createdAt: Date.now(),
        };
        setReviews((prev) => [review, ...prev]);
      },
      approveReview: (id) =>
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, approved: true } : r))
        ),
      deleteReview: (id) =>
        setReviews((prev) => prev.filter((r) => r.id !== id)),
      toggleReviewFeatured: (id) =>
        setReviews((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, featured: !r.featured, approved: true }
              : r
          )
        ),

      // ---------- Configurações ----------
      settings,
      updateSettings: (data) => setSettings((prev) => ({ ...prev, ...data })),

      // ---------- Reset ----------
      resetStore: () => {
        setProducts(seedProducts);
        setOrders(seedOrders);
        setReviews(seedReviews);
        setSettings(defaultSettings);
      },
    };
  }, [products, orders, reviews, settings, setProducts, setOrders, setReviews, setSettings]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de <StoreProvider>");
  return ctx;
}
