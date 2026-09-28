import {
  createContext,
  useContext,
  useEffect,
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
import {
  apiEnabled,
  createApiProduct,
  deleteApiProduct,
  getApiSettings,
  listApiProducts,
  listApiReviews,
  updateApiProduct,
  updateApiSettings,
  type ApiProduct,
  type ApiProductInput,
} from "@/lib/api";
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
  freeShippingThreshold: site.freeShippingThreshold,
  pixDiscount: site.pixDiscount,
  maxInstall: site.maxInstall,
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
  recordExternalOrder: (id: string, input: NewOrderInput, status?: OrderStatus) => Order;
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


function productFromApi(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    category: p.categorySlug,
    price: p.price,
    comparePrice: p.comparePrice ?? undefined,
    promoLabel: p.promoLabel ?? undefined,
    leadTime: p.leadTime,
    shortDescription: p.shortDescription,
    description: p.description,
    image: p.image,
    gallery: p.gallery ?? [],
    active: p.active,
    featured: p.featured,
    onDemand: false,
    audience: p.audience,
    size: p.size,
    availability: p.availability,
    tags: p.tags ?? [],
    stock: p.stock ?? undefined,
    variants: Array.isArray(p.variants) ? (p.variants as Product["variants"]) : undefined,
    createdAt: new Date(p.createdAt).getTime(),
  };
}

function productToApi(p: Omit<Product, "id" | "createdAt"> | Product): ApiProductInput {
  return {
    name: p.name,
    categorySlug: p.category,
    shortDescription: p.shortDescription,
    description: p.description,
    price: p.price,
    comparePrice: p.comparePrice,
    promoLabel: p.promoLabel,
    image: p.image,
    gallery: p.gallery ?? [],
    audience: p.audience,
    size: p.size,
    leadTime: p.leadTime,
    availability: p.availability,
    tags: p.tags ?? [],
    active: p.active,
    featured: p.featured,
    onDemand: false,
    stock: p.stock,
    variants: p.variants,
  };
}

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


  useEffect(() => {
    if (!apiEnabled) return;
    let active = true;

    void listApiProducts({ limit: 200 })
      .then(({ data }) => {
        if (active && data.length > 0) setProducts(data.map(productFromApi));
      })
      .catch((error) => console.warn("[Wazoo API] catálogo indisponível; usando cache local.", error));

    void getApiSettings()
      .then((remote) => {
        if (!active) return;
        setSettings((prev) => ({
          ...prev,
          storeName: remote.storeName ?? prev.storeName,
          whatsapp: remote.whatsapp ?? prev.whatsapp,
          instagram: remote.instagram ?? prev.instagram,
          hours: remote.hours ?? prev.hours,
          institutionalText: remote.institutionalText ?? prev.institutionalText,
          deliveryFee: remote.deliveryFee !== undefined ? Number(remote.deliveryFee) : prev.deliveryFee,
          freeShippingThreshold: remote.freeShippingThreshold !== undefined
            ? Number(remote.freeShippingThreshold)
            : prev.freeShippingThreshold,
          pixDiscount: remote.pixDiscount !== undefined ? Number(remote.pixDiscount) : prev.pixDiscount,
          maxInstall: remote.maxInstall !== undefined ? Number(remote.maxInstall) : prev.maxInstall,
        }));
      })
      .catch((error) => console.warn("[Wazoo API] configurações indisponíveis; usando cache local.", error));

    void listApiReviews()
      .then((remote) => {
        if (!active) return;
        setReviews(remote.map((r) => ({
          id: r.id,
          name: r.name,
          petName: r.petName ?? undefined,
          rating: r.rating,
          text: r.text,
          productId: r.productId ?? undefined,
          approved: r.approved,
          featured: r.featured,
          createdAt: new Date(r.createdAt).getTime(),
        })));
      })
      .catch((error) => console.warn("[Wazoo API] avaliações indisponíveis; usando cache local.", error));

    return () => { active = false; };
  }, [setProducts, setReviews, setSettings]);

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

        if (apiEnabled) {
          void createApiProduct(productToApi(data))
            .then((remote) => {
              setProducts((prev) =>
                prev.map((p) => (p.id === product.id ? productFromApi(remote) : p)),
              );
            })
            .catch((error) => console.error("[Wazoo API] falha ao criar produto:", error));
        }

        return product;
      },
      updateProduct: (id, data) => {
        const current = products.find((p) => p.id === id);
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...data } : p))
        );
        if (apiEnabled && current) {
          void updateApiProduct(id, productToApi({ ...current, ...data }))
            .then((remote) => {
              setProducts((prev) =>
                prev.map((p) => (p.id === id ? productFromApi(remote) : p)),
              );
            })
            .catch((error) => console.error("[Wazoo API] falha ao atualizar produto:", error));
        }
      },
      deleteProduct: (id) => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        if (apiEnabled) {
          void deleteApiProduct(id)
            .catch((error) => console.error("[Wazoo API] falha ao excluir produto:", error));
        }
      },
      toggleProductActive: (id) => {
        const current = products.find((p) => p.id === id);
        if (!current) return;
        const active = !current.active;
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active } : p)));
        if (apiEnabled) void updateApiProduct(id, { active }).catch(console.error);
      },
      toggleProductFeatured: (id) => {
        const current = products.find((p) => p.id === id);
        if (!current) return;
        const featured = !current.featured;
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, featured } : p)));
        if (apiEnabled) void updateApiProduct(id, { featured }).catch(console.error);
      },

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
          status: "Pedido recebido",
          history: [{ status: "Pedido recebido", at: now }],
          createdAt: now,
        };
        setOrders((prev) => [order, ...prev]);
        // E-mail de confirmação de pedido (melhor esforço — não bloqueia o fluxo).
        if (order.customerEmail) void emails.orderConfirmation(order);
        return order;
      },
      recordExternalOrder: (id, input, status = "Pedido recebido") => {
        const now = Date.now();
        const subtotal =
          input.subtotal ?? input.items.reduce((s, i) => s + i.price * i.quantity, 0);
        const order: Order = {
          id,
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
          status,
          history: [{ status: "Pedido recebido", at: now }, ...(status !== "Pedido recebido" ? [{ status, at: now }] : [])],
          createdAt: now,
        };
        setOrders((prev) => [order, ...prev.filter((o) => o.id !== id)]);
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
              if (status === "Pagamento confirmado") void emails.paymentConfirmed(updated);
              else void emails.orderStatus(updated, status);
              // Após finalizar, convida o cliente a avaliar a compra.
              if (status === "Entregue") {
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
      updateSettings: (data) => {
        setSettings((prev) => ({ ...prev, ...data }));
        if (apiEnabled) {
          const payload = Object.fromEntries(
            Object.entries(data)
              .filter(([, value]) => value !== undefined)
              .map(([key, value]) => [key, String(value)]),
          );
          if (Object.keys(payload).length) {
            void updateApiSettings(payload)
              .catch((error) => console.error("[Wazoo API] falha ao salvar configurações:", error));
          }
        }
      },

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
