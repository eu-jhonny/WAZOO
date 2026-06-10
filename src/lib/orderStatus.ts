import type { OrderStatus } from "@/types";

/** Cores de badge por status de pedido (reaproveitado em perfil, pedidos e admin). */
export const statusStyle: Record<OrderStatus, string> = {
  "Solicitação enviada": "bg-navy-50 text-navy-700",
  "Verificando disponibilidade": "bg-orange-100 text-orange-700",
  "Aguardando pagamento": "bg-amber-100 text-amber-700",
  "Pedido confirmado": "bg-sky-100 text-sky-700",
  "Em separação": "bg-purple-100 text-purple-700",
  "Pronto para retirada": "bg-green-100 text-green-700",
  "Saiu para entrega": "bg-green-100 text-green-700",
  Finalizado: "bg-green-600 text-white",
  Cancelado: "bg-red-100 text-red-600",
};
