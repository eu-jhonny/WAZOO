import type { OrderStatus } from "@/types";

/** Cores de badge por status de pedido (reaproveitado em perfil, pedidos e admin). */
export const statusStyle: Record<OrderStatus, string> = {
  "Pedido recebido": "bg-navy-50 text-navy-700",
  "Pagamento pendente": "bg-amber-100 text-amber-700",
  "Pagamento confirmado": "bg-sky-100 text-sky-700",
  "Em separação": "bg-purple-100 text-purple-700",
  "Pronto para retirada": "bg-teal-100 text-teal-700",
  "Saiu para entrega": "bg-cyan-100 text-cyan-700",
  Entregue: "bg-green-600 text-white",
  Cancelado: "bg-red-100 text-red-600",
};
