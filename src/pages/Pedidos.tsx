import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  PawPrint,
  ShoppingBag,
  Store,
} from "lucide-react";
import { img } from "@/config/site";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { formatBRL, formatDate } from "@/lib/format";
import { statusStyle } from "@/lib/orderStatus";
import { OrderStatusTimeline } from "@/components/OrderStatusTimeline";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { whatsappLink } from "@/lib/whatsapp";
import { apiEnabled, listCustomerOrders, type ApiOrder } from "@/lib/api";
import type { Order, OrderStatus, StatusEvent } from "@/types";

const statusIcon: Record<string, string> = {
  "Pedido recebido": "🧾",
  "Pagamento pendente": "💳",
  "Pagamento confirmado": "✅",
  "Em separação": "📦",
  "Pronto para retirada": "🏪",
  "Saiu para entrega": "🚚",
  "Entregue": "🎉",
  "Cancelado": "❌",
};

function mapStatus(status: string, paymentStatus?: string): OrderStatus {
  if (status === "CANCELLED") return "Cancelado";
  if (status === "DELIVERED") return "Entregue";
  if (status === "SHIPPED") return "Saiu para entrega";
  if (status === "READY") return "Pronto para retirada";
  if (status === "PROCESSING") return "Em separação";
  if (status === "CONFIRMED" || paymentStatus === "APPROVED") return "Pagamento confirmado";
  if (paymentStatus === "PENDING" || paymentStatus === "IN_PROCESS") return "Pagamento pendente";
  return "Pedido recebido";
}

function apiOrderToOrder(order: ApiOrder, userId?: string): Order {
  const createdAt = new Date(order.createdAt).getTime();
  const current = mapStatus(order.status, order.paymentStatus);

  const history: StatusEvent[] = [{ status: "Pedido recebido", at: createdAt }];
  if (order.paymentStatus === "PENDING" || order.paymentStatus === "IN_PROCESS") {
    history.push({ status: "Pagamento pendente", at: createdAt + 1 });
  }

  for (const event of order.statusEvents ?? []) {
    const mapped = mapStatus(event.status, event.status === "CONFIRMED" ? "APPROVED" : order.paymentStatus);
    if (!history.some((item) => item.status === mapped)) {
      history.push({ status: mapped, at: new Date(event.createdAt).getTime() });
    }
  }
  if (!history.some((item) => item.status === current)) {
    history.push({ status: current, at: Date.now() });
  }

  return {
    id: order.number,
    userId,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    fulfillment: order.deliveryMethod === "PICKUP" ? "retirada" : "entrega",
    items: order.items.map((item) => ({
      name: item.variantLabel ? `${item.name} (${item.variantLabel})` : item.name,
      quantity: item.quantity,
      price: item.unitPrice,
    })),
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    shippingAmount: order.shippingAmount,
    total: order.total,
    status: current,
    history,
    createdAt,
  };
}

function OrderCard({ order, wa }: { order: Order; wa: string }) {
  const [expanded, setExpanded] = useState(false);
  const icon = statusIcon[order.status] ?? "📋";

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-cream-50"
        onClick={() => setExpanded((value) => !value)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream-100 text-xl">
            {icon}
          </div>
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wide text-navy-500">
              {order.id}
            </p>
            <p className="font-display font-bold leading-snug text-navy-800">
              {order.items.length} {order.items.length === 1 ? "item" : "itens"} · {formatBRL(order.total)}
            </p>
            <p className="text-xs text-navy-400">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`badge ${statusStyle[order.status]}`}>{order.status}</span>
          {expanded ? <ChevronUp size={18} className="text-navy-400" /> : <ChevronDown size={18} className="text-navy-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-cream-100">
          <div className="grid gap-6 p-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-display font-bold text-navy-700">
                <Package size={16} className="text-orange-500" /> Itens do pedido
              </h3>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-3 rounded-xl bg-cream-50 px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug text-navy-700">
                        <span className="font-bold text-orange-600">{item.quantity}×</span>{" "}
                        {item.name}
                      </p>
                    </div>
                    <span className="shrink-0 font-bold text-navy-700">
                      {formatBRL(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                <span className="font-bold text-navy-700">Total</span>
                <span className="font-display text-xl font-bold text-orange-600">{formatBRL(order.total)}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="badge-soft">
                  {order.fulfillment === "retirada"
                    ? <><Store size={12} /> Retirada</>
                    : <><MapPin size={12} /> Entrega</>}
                </span>
                {order.petName && <span className="badge-soft"><PawPrint size={12} /> {order.petName}</span>}
              </div>

              <a
                href={whatsappLink(`Olá! Gostaria de falar sobre meu pedido ${order.id}.`, wa)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-green btn-sm mt-4"
              >
                <WhatsAppIcon size={15} /> Suporte sobre este pedido
              </a>
            </div>

            <div className="rounded-xl bg-cream-50 p-4">
              <h3 className="mb-4 flex items-center gap-2 font-display font-bold text-navy-700">
                <MessageSquare size={16} className="text-brand-teal" /> Acompanhamento
              </h3>
              <OrderStatusTimeline order={order} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Pedidos() {
  const { user } = useAuth();
  const { orders, settings } = useStore();
  const [remoteOrders, setRemoteOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(apiEnabled);

  useEffect(() => {
    if (!apiEnabled || !user) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    listCustomerOrders()
      .then((result) => {
        if (active) setRemoteOrders(result.map((order) => apiOrderToOrder(order, user.id)));
      })
      .catch(() => {
        if (active) setRemoteOrders(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [user?.id]);

  const localOrders = useMemo(
    () =>
      user
        ? orders
            .filter((order) => order.userId === user.id)
            .sort((a, b) => b.createdAt - a.createdAt)
        : [],
    [orders, user],
  );

  const myOrders = remoteOrders ?? localOrders;
  if (!user) return null;

  return (
    <div className="section bg-cream-50">
      <div className="container-app">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-navy-800 sm:text-4xl">Meus pedidos</h1>
            <p className="mt-1 text-navy-500">
              {loading
                ? "Sincronizando seus pedidos..."
                : myOrders.length === 0
                  ? "Você ainda não realizou pedidos."
                  : `${myOrders.length} pedido${myOrders.length !== 1 ? "s" : ""} encontrado${myOrders.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link to="/produtos" className="btn-primary btn-sm">
            <ShoppingBag size={16} /> Nova compra
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-white py-16 text-navy-500 shadow-card">
            <Loader2 size={20} className="animate-spin text-orange-500" /> Carregando pedidos...
          </div>
        ) : myOrders.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-cream-200 bg-white px-8 py-16 text-center shadow-card">
            <img src={img.mascot.dormindo} alt="" className="h-36 w-auto opacity-70" />
            <p className="mt-4 font-display text-xl font-bold text-navy-800">Nenhum pedido ainda</p>
            <p className="mt-1 text-sm text-navy-500">Adicione produtos ao carrinho e finalize sua primeira compra.</p>
            <Link to="/produtos" className="btn-primary mt-6">
              <ShoppingBag size={18} /> Ver produtos
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {myOrders.map((order) => (
              <OrderCard key={order.id} order={order} wa={settings.whatsapp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
