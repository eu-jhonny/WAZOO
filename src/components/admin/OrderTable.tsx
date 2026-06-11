import { ChevronRight, MapPin, Store, Package } from "lucide-react";
import type { Order, OrderStatus } from "@/types";
import { formatBRL, formatDateTime } from "@/lib/format";
import { statusStyle } from "@/lib/orderStatus";

interface OrderTableProps {
  orders: Order[];
  onView: (order: Order) => void;
}

const statusEmoji: Record<OrderStatus, string> = {
  "Solicitação enviada":         "🕐",
  "Verificando disponibilidade": "🔍",
  "Aguardando pagamento":        "💳",
  "Pedido confirmado":           "✅",
  "Em separação":                "📦",
  "Pronto para retirada":        "🏪",
  "Saiu para entrega":           "🚚",
  Finalizado:                    "🎉",
  Cancelado:                     "❌",
};

const statusBar: Record<OrderStatus, string> = {
  "Solicitação enviada":         "bg-navy-300",
  "Verificando disponibilidade": "bg-orange-400",
  "Aguardando pagamento":        "bg-amber-400",
  "Pedido confirmado":           "bg-sky-400",
  "Em separação":                "bg-purple-400",
  "Pronto para retirada":        "bg-green-400",
  "Saiu para entrega":           "bg-green-400",
  Finalizado:                    "bg-green-600",
  Cancelado:                     "bg-red-400",
};

/** Extrai a forma de pagamento da observação do pedido, se houver. */
function paymentTag(note?: string): string | null {
  if (!note) return null;
  const m = note.match(/Pagamento:\s*([^·]+)/i);
  return m ? m[1].trim() : null;
}

export function OrderTable({ orders, onView }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-10 text-center">
        <Package size={30} className="text-navy-300" />
        <p className="font-semibold text-navy-500">Nenhum pedido encontrado.</p>
        <p className="text-sm text-navy-400">Ajuste os filtros ou aguarde novos pedidos.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {orders.map((order) => {
        const pay = paymentTag(order.note);
        return (
          <button
            key={order.id}
            onClick={() => onView(order)}
            className="card card-hover group relative flex flex-col gap-3 overflow-hidden p-4 pl-5 text-left"
          >
            {/* Barra de status à esquerda */}
            <span className={`absolute inset-y-0 left-0 w-1.5 ${statusBar[order.status]}`} aria-hidden />

            {/* Topo: id + status */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream-100 text-lg">
                  {statusEmoji[order.status]}
                </span>
                <div className="leading-tight">
                  <p className="font-display font-bold text-navy-800">{order.id}</p>
                  <p className="text-[11px] text-navy-400">{formatDateTime(order.createdAt)}</p>
                </div>
              </div>
              <span className={`badge text-[10px] ${statusStyle[order.status]}`}>{order.status}</span>
            </div>

            {/* Cliente */}
            <p className="truncate text-sm font-semibold text-navy-700">{order.customerName}</p>

            {/* Metadados */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-navy-500">
              <span className="inline-flex items-center gap-1 rounded-md bg-cream-100 px-2 py-0.5">
                {order.fulfillment === "retirada" ? <Store size={11} /> : <MapPin size={11} />}
                {order.fulfillment === "retirada" ? "Retirada" : "Entrega"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-cream-100 px-2 py-0.5">
                <Package size={11} /> {order.items.length} {order.items.length === 1 ? "item" : "itens"}
              </span>
              {pay && (
                <span className="inline-flex items-center gap-1 rounded-md bg-cream-100 px-2 py-0.5">{pay}</span>
              )}
            </div>

            {/* Rodapé: total + ação */}
            <div className="mt-auto flex items-center justify-between border-t border-cream-100 pt-2.5">
              <span className="font-display text-lg font-bold text-orange-600">{formatBRL(order.total)}</span>
              <span className="flex items-center gap-1 text-xs font-bold text-navy-400 transition-colors group-hover:text-orange-600">
                Detalhes <ChevronRight size={14} />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
