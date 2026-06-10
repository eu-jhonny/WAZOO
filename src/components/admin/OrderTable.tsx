import { ChevronRight } from "lucide-react";
import type { Order } from "@/types";
import { formatBRL, formatDate } from "@/lib/format";
import { statusStyle } from "@/lib/orderStatus";

interface OrderTableProps {
  orders: Order[];
  onView: (order: Order) => void;
}

export function OrderTable({ orders, onView }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <p className="card p-8 text-center text-navy-500">Nenhum pedido encontrado.</p>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <button
          key={order.id}
          onClick={() => onView(order)}
          className="card card-hover flex w-full items-center gap-4 p-4 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display font-bold text-navy-700">{order.id}</span>
              <span className={`badge ${statusStyle[order.status]}`}>{order.status}</span>
            </div>
            <p className="mt-0.5 truncate text-sm text-navy-500">
              {order.customerName} · {order.items.length} {order.items.length === 1 ? "item" : "itens"} · {formatDate(order.createdAt)}
            </p>
          </div>
          <p className="shrink-0 font-display font-bold text-orange-600">{formatBRL(order.total)}</p>
          <ChevronRight className="shrink-0 text-navy-300" size={20} />
        </button>
      ))}
    </div>
  );
}
