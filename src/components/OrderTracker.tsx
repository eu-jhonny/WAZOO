import {
  Send, Search, CreditCard, CheckCircle2, Package,
  Truck, Store, PartyPopper, type LucideIcon,
} from "lucide-react";
import type { Order, OrderStatus } from "@/types";

/** Passos + ícone de cada etapa (adaptado a entrega/retirada). */
function buildSteps(order: Order): { status: OrderStatus; icon: LucideIcon }[] {
  const deliveryStep =
    order.fulfillment === "retirada"
      ? { status: "Pronto para retirada" as OrderStatus, icon: Store }
      : { status: "Saiu para entrega" as OrderStatus, icon: Truck };
  return [
    { status: "Solicitação enviada", icon: Send },
    { status: "Verificando disponibilidade", icon: Search },
    { status: "Aguardando pagamento", icon: CreditCard },
    { status: "Pedido confirmado", icon: CheckCircle2 },
    { status: "Em separação", icon: Package },
    deliveryStep,
    { status: "Finalizado", icon: PartyPopper },
  ];
}

/** Stepper horizontal, visual, para acompanhar o pedido. */
export function OrderTracker({ order }: { order: Order }) {
  const steps = buildSteps(order);
  const reached = Math.max(
    0,
    ...order.history.map((h) => steps.findIndex((s) => s.status === h.status)).filter((i) => i >= 0),
  );
  const cancelled = order.status === "Cancelado";
  const currentIndex = cancelled ? reached : steps.findIndex((s) => s.status === order.status);
  const pct = steps.length > 1 ? (Math.max(0, currentIndex) / (steps.length - 1)) * 100 : 0;

  if (cancelled) {
    return (
      <div className="rounded-2xl bg-red-50 px-5 py-4 text-center font-bold text-red-600">
        ❌ Pedido cancelado
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Trilha */}
      <div className="absolute left-0 right-0 top-5 mx-6 h-1 rounded-full bg-cream-200" aria-hidden />
      <div
        className="absolute left-0 top-5 mx-6 h-1 rounded-full bg-green-400 transition-all duration-700"
        style={{ width: `calc((100% - 3rem) * ${pct / 100})` }}
        aria-hidden
      />

      <ol className="relative flex justify-between">
        {steps.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const Icon = s.icon;
          return (
            <li key={s.status} className="flex w-0 flex-1 flex-col items-center gap-1.5 text-center">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  active
                    ? "border-orange-500 bg-orange-500 text-white shadow-glow"
                    : done
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-cream-300 bg-white text-cream-300"
                }`}
              >
                <Icon size={18} className={active ? "animate-pulse-scale" : ""} />
              </span>
              <span
                className={`hidden max-w-[84px] text-[11px] font-bold leading-tight sm:block ${
                  active ? "text-orange-600" : done ? "text-navy-600" : "text-navy-300"
                }`}
              >
                {s.status}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
