import { useEffect, useMemo, useState } from "react";
import { MapPin, PawPrint, Phone, Save, Search, Store, User } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { ORDER_STATUSES, type Order } from "@/types";
import { formatBRL, formatDateTime } from "@/lib/format";
import { statusStyle } from "@/lib/orderStatus";
import { whatsappLink, buildOrderContactMessage } from "@/lib/whatsapp";
import { OrderTable } from "@/components/admin/OrderTable";
import { OrderStatusTimeline } from "@/components/OrderStatusTimeline";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { Modal } from "@/components/ui/Modal";

export function AdminOrders() {
  const { orders, updateOrderStatus, setOrderInternalNote } = useStore();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const current = orders.find((o) => o.id === selectedId) ?? null;

  useEffect(() => {
    setNoteDraft(current?.internalNote ?? "");
  }, [selectedId, current?.internalNote]);

  const filtered = useMemo(
    () =>
      orders
        .filter((o) => (statusFilter === "todos" ? true : o.status === statusFilter))
        .filter(
          (o) =>
            o.id.toLowerCase().includes(search.toLowerCase()) ||
            o.customerName.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => b.createdAt - a.createdAt),
    [orders, statusFilter, search]
  );

  const changeStatus = (order: Order, status: string) => {
    updateOrderStatus(order.id, status as Order["status"]);
    showToast("Status atualizado com sucesso! ✅", "success");
  };

  const saveNote = () => {
    if (!current) return;
    setOrderInternalNote(current.id, noteDraft);
    showToast("Observação interna salva.", "success");
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-navy-700">Pedidos</h1>
      <p className="mt-1 text-navy-500">{orders.length} pedidos recebidos.</p>

      {/* Filtros */}
      <div className="card mt-6 space-y-3 p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300" size={18} />
          <input className="input pl-11" placeholder="Buscar por pedido ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button onClick={() => setStatusFilter("todos")} className={`chip shrink-0 ${statusFilter === "todos" ? "chip-active" : ""}`}>
            Todos
          </button>
          {ORDER_STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`chip shrink-0 ${statusFilter === s ? "chip-active" : ""}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <OrderTable orders={filtered} onView={(o) => setSelectedId(o.id)} />
      </div>

      {/* Detalhe do pedido */}
      <Modal open={!!current} onClose={() => setSelectedId(null)} title={`Pedido ${current?.id ?? ""}`} size="lg">
        {current && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`badge ${statusStyle[current.status]}`}>{current.status}</span>
              <span className="text-sm text-navy-400">{formatDateTime(current.createdAt)}</span>
            </div>

            {/* Alterar status */}
            <div>
              <label className="label">Alterar status</label>
              <select className="input" value={current.status} onChange={(e) => changeStatus(current, e.target.value)}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Dados do cliente */}
            <div className="rounded-2xl bg-cream-100 p-4">
              <h4 className="flex items-center gap-2 font-bold text-navy-700"><User size={16} /> Cliente</h4>
              <div className="mt-2 space-y-1 text-sm text-navy-600">
                <p>{current.customerName}</p>
                {current.customerPhone && <p className="flex items-center gap-2"><Phone size={14} /> {current.customerPhone}</p>}
                <p className="flex items-center gap-2">
                  {current.fulfillment === "retirada" ? <Store size={14} /> : <MapPin size={14} />}
                  {current.fulfillment === "retirada" ? "Retirada no local" : "Entrega"}
                </p>
                {current.petName && <p className="flex items-center gap-2"><PawPrint size={14} /> Pet: {current.petName}</p>}
              </div>
              {current.customerPhone && (
                <a
                  href={whatsappLink(buildOrderContactMessage(current), current.customerPhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-green btn-sm mt-3"
                >
                  <WhatsAppIcon size={16} /> Chamar cliente no WhatsApp
                </a>
              )}
            </div>

            {/* Itens */}
            <div>
              <h4 className="font-bold text-navy-700">Itens solicitados</h4>
              <ul className="mt-2 space-y-2">
                {current.items.map((item, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 border-b border-cream-100 pb-2 text-sm">
                    <span className="text-navy-600">
                      <strong>{item.quantity}x</strong> {item.name}
                      {item.note && <span className="block text-xs text-navy-400">Obs: {item.note}</span>}
                    </span>
                    <span className="font-semibold text-navy-600">{formatBRL(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between font-bold text-navy-700">
                <span>Total estimado</span>
                <span className="text-orange-600">{formatBRL(current.total)}</span>
              </div>
              {current.note && (
                <p className="mt-3 rounded-2xl bg-cream-100 p-3 text-sm text-navy-600">
                  <strong>Observação do cliente:</strong> {current.note}
                </p>
              )}
            </div>

            {/* Observação interna */}
            <div>
              <label className="label">Observação interna (não aparece para o cliente)</label>
              <textarea className="input min-h-[70px]" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
              <button onClick={saveNote} className="btn-outline btn-sm mt-2">
                <Save size={15} /> Salvar observação
              </button>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl bg-cream-50 p-4">
              <h4 className="mb-3 font-bold text-navy-700">Histórico</h4>
              <OrderStatusTimeline order={current} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
