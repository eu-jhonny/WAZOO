import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PackageSearch, MapPin, Store, PawPrint, Search, ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatBRL, formatDate } from "@/lib/format";
import { statusStyle } from "@/lib/orderStatus";
import { PageHero } from "@/components/ui/PageHero";
import { OrderTracker } from "@/components/OrderTracker";
import { OrderStatusTimeline } from "@/components/OrderStatusTimeline";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { whatsappLink } from "@/lib/whatsapp";
import { img } from "@/config/site";

export function Rastrear() {
  const { orders, settings } = useStore();
  const [params, setParams] = useSearchParams();
  const [code, setCode] = useState(params.get("pedido") ?? "");
  const [submitted, setSubmitted] = useState(!!params.get("pedido"));

  const query = (params.get("pedido") ?? "").trim().toLowerCase();
  const order = useMemo(() => {
    if (!query) return undefined;
    const norm = query.replace(/[^a-z0-9]/g, "");
    return orders.find((o) => o.id.toLowerCase().replace(/[^a-z0-9]/g, "") === norm);
  }, [orders, query]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const next = new URLSearchParams(params);
    if (code.trim()) next.set("pedido", code.trim());
    else next.delete("pedido");
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageHero
        eyebrow="Acompanhe"
        title="Rastrear pedido 📦"
        subtitle="Digite o número do seu pedido (ex.: WZ-1042) e veja em que etapa ele está, em tempo real."
        icon={PackageSearch}
        mascot={img.mascot.trabalhando}
      />

      <div className="container-app max-w-3xl py-10 sm:py-14">
        <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Número do pedido (ex.: WZ-1042)"
              className="input pl-11 uppercase"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0">
            <PackageSearch size={18} /> Rastrear
          </button>
        </form>

        {submitted && !order && (
          <div className="mt-8 rounded-3xl border border-dashed border-cream-300 bg-cream-50 px-6 py-12 text-center">
            <img src={img.mascot.dormindo} alt="" className="mx-auto h-32 w-auto opacity-80" />
            <p className="mt-4 font-display text-lg font-bold text-navy-700">
              Não encontramos esse pedido
            </p>
            <p className="mt-1 text-navy-500">
              Confira o número (ele tem o formato <strong>WZ-0000</strong>) ou fale com a gente.
            </p>
            <a
              href={whatsappLink("Olá! Não consegui rastrear meu pedido no site.", settings.whatsapp)}
              target="_blank" rel="noopener noreferrer"
              className="btn-green mt-5"
            >
              <WhatsAppIcon size={18} /> Falar no WhatsApp
            </a>
          </div>
        )}

        {order && (
          <div className="mt-8 space-y-6">
            {/* Cabeçalho do pedido */}
            <div className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-wide text-navy-400">
                    Pedido {order.id}
                  </p>
                  <p className="font-display text-xl font-bold text-navy-800">
                    {order.items.length} {order.items.length === 1 ? "item" : "itens"} · {formatBRL(order.total)}
                  </p>
                  <p className="text-xs text-navy-400">Feito em {formatDate(order.createdAt)}</p>
                </div>
                <span className={`badge ${statusStyle[order.status]}`}>{order.status}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="badge-soft">
                  {order.fulfillment === "retirada" ? <><Store size={12} /> Retirada</> : <><MapPin size={12} /> Entrega</>}
                </span>
                {order.petName && <span className="badge-soft"><PawPrint size={12} /> {order.petName}</span>}
              </div>

              {/* Tracker horizontal */}
              <div className="mt-8 px-1">
                <OrderTracker order={order} />
              </div>
            </div>

            {/* Detalhe + timeline */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card p-5">
                <h3 className="mb-3 font-display font-bold text-navy-700">Itens</h3>
                <div className="space-y-2">
                  {order.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-cream-50 px-3 py-2.5 text-sm">
                      <span className="text-navy-700">
                        <span className="font-bold text-orange-600">{it.quantity}×</span> {it.name}
                      </span>
                      <span className="font-bold text-navy-700">{formatBRL(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card bg-cream-50 p-5">
                <h3 className="mb-4 font-display font-bold text-navy-700">Histórico</h3>
                <OrderStatusTimeline order={order} />
              </div>
            </div>

            <div className="text-center">
              <Link to="/pedidos" className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:text-orange-700">
                Ver todos os meus pedidos <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
