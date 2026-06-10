import { Check, X } from "lucide-react";
import type { Order, OrderStatus } from "@/types";
import { formatDateTime } from "@/lib/format";

/** Monta a sequência lógica de status de acordo com entrega/retirada. */
function buildSteps(order: Order): OrderStatus[] {
  const deliveryStep: OrderStatus =
    order.status === "Pronto para retirada" || order.status === "Saiu para entrega"
      ? order.status
      : order.fulfillment === "retirada"
      ? "Pronto para retirada"
      : "Saiu para entrega";

  return [
    "Solicitação enviada",
    "Verificando disponibilidade",
    "Aguardando pagamento",
    "Pedido confirmado",
    "Em separação",
    deliveryStep,
    "Finalizado",
  ];
}

export function OrderStatusTimeline({ order }: { order: Order }) {
  const cancelled = order.status === "Cancelado";
  const steps = buildSteps(order);

  const reachedIndex = Math.max(
    0,
    ...order.history.map((h) => steps.indexOf(h.status)).filter((i) => i >= 0)
  );
  const currentIndex = cancelled ? reachedIndex : steps.indexOf(order.status);

  const timeFor = (status: OrderStatus): string | undefined => {
    const event = [...order.history].reverse().find((h) => h.status === status);
    return event ? formatDateTime(event.at) : undefined;
  };

  return (
    <div>
      {cancelled && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          <X size={18} /> Pedido cancelado
        </div>
      )}

      <ol className="relative space-y-1">
        {steps.map((step, i) => {
          const done = i <= currentIndex;
          const active = !cancelled && i === currentIndex;
          const time = timeFor(step);

          return (
            <li key={step} className="flex gap-3.5">
              {/* Coluna do marcador + linha */}
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    active
                      ? "border-orange-500 bg-orange-500 text-white"
                      : done
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-cream-300 bg-white text-cream-300"
                  }`}
                >
                  {done && !active ? (
                    <Check size={16} />
                  ) : (
                    <span className={`h-2 w-2 rounded-full ${active ? "animate-pulse bg-white" : "bg-current"}`} />
                  )}
                </span>
                {i < steps.length - 1 && (
                  <span
                    className={`my-0.5 w-0.5 flex-1 ${
                      i < currentIndex ? "bg-green-400" : "bg-cream-200"
                    }`}
                  />
                )}
              </div>

              {/* Texto */}
              <div className={`pb-5 ${i === steps.length - 1 ? "pb-0" : ""}`}>
                <p
                  className={`font-bold leading-tight ${
                    active ? "text-orange-600" : done ? "text-navy-700" : "text-navy-300"
                  }`}
                >
                  {step}
                </p>
                {time && <p className="mt-0.5 text-xs text-navy-400">{time}</p>}
                {active && (
                  <p className="mt-0.5 text-xs font-medium text-orange-500">Etapa atual</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
