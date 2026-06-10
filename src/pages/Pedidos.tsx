import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
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

/* ── Cores/ícones por status ─────────────────────────────────── */
const statusIcon: Record<string, string> = {
  "Solicitação enviada":          "🕐",
  "Verificando disponibilidade":  "🔍",
  "Confirmado pelo fornecedor":   "✅",
  "Em preparação":                "📦",
  "Pronto para retirada":         "🏪",
  "Em rota de entrega":           "🚚",
  "Finalizado":                   "🎉",
  "Cancelado":                    "❌",
};

function OrderCard({ order, wa }: { order: any; wa: string }) {
  const [expanded, setExpanded] = useState(false);
  const icon = statusIcon[order.status] ?? "📋";

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-cream-50"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream-100 text-xl">
            {icon}
          </div>
          <div>
            <p className="font-mono text-xs font-bold text-navy-500 uppercase tracking-wide">
              #{order.id.slice(0, 8)}
            </p>
            <p className="font-display font-bold text-navy-800 leading-snug">
              {order.items.length} {order.items.length === 1 ? "item" : "itens"} ·{" "}
              {formatBRL(order.total)}
            </p>
            <p className="text-xs text-navy-400">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`badge ${statusStyle[order.status]}`}>{order.status}</span>
          {expanded ? (
            <ChevronUp size={18} className="text-navy-400" />
          ) : (
            <ChevronDown size={18} className="text-navy-400" />
          )}
        </div>
      </div>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="border-t border-cream-100">
          <div className="grid gap-6 p-5 lg:grid-cols-2">

            {/* Itens + resumo */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-display font-bold text-navy-700">
                <Package size={16} className="text-orange-500" /> Itens do pedido
              </h3>
              <div className="space-y-2">
                {order.items.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 rounded-xl bg-cream-50 px-3 py-2.5 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-navy-700 leading-snug">
                        <span className="text-orange-600 font-bold">{item.quantity}×</span>{" "}
                        {item.name}
                      </p>
                      {item.note && (
                        <p className="mt-0.5 text-xs text-navy-400 italic">
                          Obs: {item.note}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-bold text-navy-700">
                      {formatBRL(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
                <span className="font-bold text-navy-700">Total estimado</span>
                <span className="font-display text-xl font-bold text-orange-600">
                  {formatBRL(order.total)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="badge-soft">
                  {order.fulfillment === "retirada" ? (
                    <><Store size={12} /> Retirada</>
                  ) : (
                    <><MapPin size={12} /> Entrega</>
                  )}
                </span>
                {order.petName && (
                  <span className="badge-soft">
                    <PawPrint size={12} /> {order.petName}
                  </span>
                )}
              </div>

              {order.note && (
                <div className="mt-3 rounded-xl bg-cream-100 px-4 py-3 text-sm text-navy-600">
                  <span className="font-bold text-navy-700">Obs:</span> {order.note}
                </div>
              )}

              <a
                href={whatsappLink(
                  `Olá! Gostaria de falar sobre meu pedido #${order.id.slice(0, 8)}.`,
                  wa
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-green btn-sm mt-4"
              >
                <WhatsAppIcon size={15} /> Falar sobre este pedido
              </a>
            </div>

            {/* Timeline */}
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

/* ═══════════════════════════════════════════════════════════════ */
export function Pedidos() {
  const { user }        = useAuth();
  const { orders, settings } = useStore();

  const myOrders = useMemo(
    () =>
      user
        ? orders
            .filter((o) => o.userId === user.id)
            .sort((a, b) => b.createdAt - a.createdAt)
        : [],
    [orders, user]
  );

  if (!user) return null;

  const wa = settings.whatsapp;

  return (
    <div className="section bg-cream-50">
      <div className="container-app">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-navy-800 sm:text-4xl">
              Meus pedidos
            </h1>
            <p className="mt-1 text-navy-500">
              {myOrders.length === 0
                ? "Você ainda não realizou pedidos."
                : `${myOrders.length} pedido${myOrders.length !== 1 ? "s" : ""} encontrado${myOrders.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link to="/produtos" className="btn-primary btn-sm">
            <ShoppingBag size={16} /> Nova compra
          </Link>
        </div>

        {/* Aviso sob encomenda */}
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
          <PawPrint size={16} className="mt-0.5 shrink-0 text-amber-500" />
          Como trabalhamos <strong>sob encomenda</strong>, alguns pedidos passam pela etapa de
          verificação antes da confirmação final.
        </div>

        {/* Lista */}
        {myOrders.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-cream-200 bg-white px-8 py-16 text-center shadow-card">
            <img src={img.mascot.dormindo} alt="" className="h-36 w-auto opacity-70" />
            <p className="mt-4 font-display text-xl font-bold text-navy-800">
              Nenhum pedido ainda
            </p>
            <p className="mt-1 text-sm text-navy-500">
              Adicione produtos ao carrinho e envie seu primeiro pedido.
            </p>
            <Link to="/produtos" className="btn-primary mt-6">
              <ShoppingBag size={18} /> Ver produtos
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {myOrders.map((order) => (
              <OrderCard key={order.id} order={order} wa={wa} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
