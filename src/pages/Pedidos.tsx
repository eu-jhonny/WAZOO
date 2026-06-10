import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Info, MapPin, PawPrint, ShoppingBag, Store } from "lucide-react";
import { img } from "@/config/site";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { formatBRL, formatDate } from "@/lib/format";
import { statusStyle } from "@/lib/orderStatus";
import { OrderStatusTimeline } from "@/components/OrderStatusTimeline";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { whatsappLink } from "@/lib/whatsapp";

export function Pedidos() {
  const { user } = useAuth();
  const { orders, settings } = useStore();

  const myOrders = useMemo(
    () => (user ? orders.filter((o) => o.userId === user.id).sort((a, b) => b.createdAt - a.createdAt) : []),
    [orders, user]
  );

  if (!user) return null;

  return (
    <section className="section bg-cream-50">
      <div className="container-app">
        <h1 className="font-display text-3xl font-bold text-navy-700 sm:text-4xl">Meus pedidos</h1>
        <p className="mt-2 flex items-start gap-2 rounded-2xl bg-orange-50 p-4 text-sm text-navy-600">
          <Info size={18} className="mt-0.5 shrink-0 text-orange-500" />
          Como trabalhamos sob encomenda, alguns pedidos passam pela etapa de
          verificação com fornecedor antes da confirmação final.
        </p>

        {myOrders.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-cream-300 bg-white px-6 py-16 text-center">
            <img src={img.mascot.dormindo} alt="Mascote dormindo" className="h-40 w-auto" />
            <p className="mt-4 font-display text-xl font-bold text-navy-700">
              Você ainda não tem pedidos
            </p>
            <p className="mt-1 text-navy-500">Monte seu pedido e envie pelo WhatsApp.</p>
            <Link to="/produtos" className="btn-primary mt-6">
              <ShoppingBag size={18} /> Ver produtos
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {myOrders.map((order) => (
              <div key={order.id} className="card overflow-hidden">
                {/* Cabeçalho do pedido */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 bg-cream-50 px-6 py-4">
                  <div>
                    <p className="font-display text-lg font-bold text-navy-700">{order.id}</p>
                    <p className="text-xs text-navy-400">Pedido em {formatDate(order.createdAt)}</p>
                  </div>
                  <span className={`badge ${statusStyle[order.status]}`}>{order.status}</span>
                </div>

                <div className="grid gap-8 p-6 lg:grid-cols-2">
                  {/* Itens + infos */}
                  <div>
                    <h3 className="font-display font-bold text-navy-700">Itens solicitados</h3>
                    <ul className="mt-3 space-y-2">
                      {order.items.map((item, i) => (
                        <li key={i} className="flex items-start justify-between gap-3 border-b border-cream-100 pb-2 text-sm">
                          <span className="text-navy-600">
                            <strong className="text-navy-700">{item.quantity}x</strong> {item.name}
                            {item.note && <span className="block text-xs text-navy-400">Obs: {item.note}</span>}
                          </span>
                          <span className="shrink-0 font-semibold text-navy-600">
                            {formatBRL(item.price * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-display font-bold text-navy-700">Total estimado</span>
                      <span className="font-display text-xl font-bold text-orange-600">{formatBRL(order.total)}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="badge-soft">
                        {order.fulfillment === "retirada" ? <Store size={13} /> : <MapPin size={13} />}
                        {order.fulfillment === "retirada" ? "Retirada" : "Entrega"}
                      </span>
                      {order.petName && (
                        <span className="badge-soft"><PawPrint size={13} /> {order.petName}</span>
                      )}
                    </div>

                    {order.note && (
                      <p className="mt-3 rounded-2xl bg-cream-100 p-3 text-sm text-navy-600">
                        <strong>Observação:</strong> {order.note}
                      </p>
                    )}

                    <a
                      href={whatsappLink(`Olá! Gostaria de falar sobre o meu pedido ${order.id}.`, settings.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-green btn-sm mt-4"
                    >
                      <WhatsAppIcon size={16} /> Falar sobre este pedido
                    </a>
                  </div>

                  {/* Timeline */}
                  <div className="rounded-2xl bg-cream-50 p-5">
                    <h3 className="mb-4 font-display font-bold text-navy-700">Acompanhe seu pedido</h3>
                    <OrderStatusTimeline order={order} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
