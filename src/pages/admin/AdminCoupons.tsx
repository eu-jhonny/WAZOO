import { useEffect, useState } from "react";
import { Ticket, Plus, Trash2, Power, Pencil, Percent, DollarSign, Truck } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/ui/Modal";
import {
  readCoupons, saveCoupons, type AdminCoupon, type CouponType,
} from "@/lib/coupons";
import { formatBRL } from "@/lib/format";

const TYPE_META: Record<CouponType, { label: string; icon: typeof Percent; hint: string }> = {
  PERCENTAGE: { label: "Percentual (%)", icon: Percent, hint: "Desconto em % sobre o subtotal" },
  FIXED: { label: "Valor fixo (R$)", icon: DollarSign, hint: "Abate um valor em reais" },
  FREE_SHIPPING: { label: "Frete grátis", icon: Truck, hint: "Zera o frete do pedido" },
};

const EMPTY: AdminCoupon = {
  code: "", type: "PERCENTAGE", value: 10, minOrder: undefined, description: "", active: true, createdAt: 0,
};

function CouponForm({ initial, existingCodes, onSave, onCancel }: {
  initial: AdminCoupon;
  existingCodes: string[];
  onSave: (c: AdminCoupon) => void;
  onCancel: () => void;
}) {
  const [c, setC] = useState<AdminCoupon>(initial);
  const set = <K extends keyof AdminCoupon>(k: K, v: AdminCoupon[K]) => setC((p) => ({ ...p, [k]: v }));
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = c.code.trim().toUpperCase();
    if (!code) return setErr("Informe um código.");
    if (existingCodes.includes(code)) return setErr("Já existe um cupom com esse código.");
    if (c.type !== "FREE_SHIPPING" && (!c.value || c.value <= 0)) return setErr("Informe um valor maior que zero.");
    onSave({ ...c, code, createdAt: c.createdAt || Date.now() });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Código</label>
        <input value={c.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="EX: WAZOO10" className="input uppercase" />
      </div>
      <div>
        <span className="label">Tipo</span>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {(Object.keys(TYPE_META) as CouponType[]).map((t) => {
            const M = TYPE_META[t]; const Icon = M.icon; const sel = c.type === t;
            return (
              <button type="button" key={t} onClick={() => set("type", t)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-xs font-bold transition-all ${sel ? "border-orange-500 bg-orange-50 text-orange-600" : "border-cream-200 text-navy-600 hover:border-orange-200"}`}>
                <Icon size={18} /> {M.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-navy-400">{TYPE_META[c.type].hint}</p>
      </div>
      {c.type !== "FREE_SHIPPING" && (
        <div>
          <label className="label">{c.type === "PERCENTAGE" ? "Desconto (%)" : "Desconto (R$)"}</label>
          <input type="number" min={0} step={c.type === "PERCENTAGE" ? 1 : 0.01} value={c.value}
            onChange={(e) => set("value", Number(e.target.value))} className="input" />
        </div>
      )}
      <div>
        <label className="label">Pedido mínimo (R$) — opcional</label>
        <input type="number" min={0} step={0.01} value={c.minOrder ?? ""} placeholder="Sem mínimo"
          onChange={(e) => set("minOrder", e.target.value ? Number(e.target.value) : undefined)} className="input" />
      </div>
      <div>
        <label className="label">Descrição — opcional</label>
        <input value={c.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Ex.: Promo de inverno" className="input" />
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-navy-700">
        <input type="checkbox" checked={c.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-orange-500" />
        Cupom ativo
      </label>
      {err && <p className="text-sm text-red-500">{err}</p>}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 border border-cream-200">Cancelar</button>
        <button type="submit" className="btn-primary flex-1">Salvar cupom</button>
      </div>
    </form>
  );
}

export function AdminCoupons() {
  const { showToast } = useToast();
  const [list, setList] = useState<AdminCoupon[]>([]);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; coupon: AdminCoupon } | null>(null);

  useEffect(() => { setList(readCoupons()); }, []);

  const persist = (next: AdminCoupon[]) => { setList(next); saveCoupons(next); };

  const save = (c: AdminCoupon) => {
    const others = list.filter((x) => x.code !== (modal?.coupon.code ?? ""));
    persist([...others.filter((x) => x.code !== c.code), c].sort((a, b) => a.code.localeCompare(b.code)));
    showToast(modal?.mode === "edit" ? "Cupom atualizado! 🎟️" : "Cupom criado! 🎟️", "success");
    setModal(null);
  };
  const toggle = (code: string) =>
    persist(list.map((c) => (c.code === code ? { ...c, active: !c.active } : c)));
  const remove = (code: string) => {
    if (confirm(`Excluir o cupom ${code}?`)) {
      persist(list.filter((c) => c.code !== code));
      showToast("Cupom excluído.", "info");
    }
  };

  const editCodes = (skip?: string) => list.map((c) => c.code).filter((c) => c !== skip);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-700">Cupons</h1>
          <p className="mt-1 text-navy-500">{list.length} cupons · {list.filter((c) => c.active).length} ativos</p>
        </div>
        <button onClick={() => setModal({ mode: "add", coupon: { ...EMPTY } })} className="btn-primary btn-sm">
          <Plus size={16} /> Novo cupom
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center p-12 text-center">
          <Ticket className="text-orange-400" size={40} />
          <p className="mt-3 font-semibold text-navy-600">Nenhum cupom cadastrado.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {list.map((c) => {
            const M = TYPE_META[c.type]; const Icon = M.icon;
            const valueLabel = c.type === "PERCENTAGE" ? `${c.value}% OFF` : c.type === "FIXED" ? `${formatBRL(c.value)} OFF` : "Frete grátis";
            return (
              <div key={c.code} className={`card p-5 ${c.active ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${c.active ? "bg-orange-100 text-orange-600" : "bg-cream-200 text-navy-400"}`}>
                      <Icon size={20} />
                    </span>
                    <div>
                      <p className="font-mono text-lg font-bold text-navy-800">{c.code}</p>
                      <p className="text-sm font-bold text-orange-600">{valueLabel}</p>
                    </div>
                  </div>
                  <span className={`badge ${c.active ? "bg-green-100 text-green-700" : "bg-cream-200 text-navy-500"}`}>
                    {c.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                {(c.description || c.minOrder) && (
                  <p className="mt-3 text-sm text-navy-500">
                    {c.description}
                    {c.minOrder ? `${c.description ? " · " : ""}mín. ${formatBRL(c.minOrder)}` : ""}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => toggle(c.code)} className="btn-ghost btn-sm flex-1 border border-cream-200">
                    <Power size={14} /> {c.active ? "Desativar" : "Ativar"}
                  </button>
                  <button onClick={() => setModal({ mode: "edit", coupon: c })} className="btn-ghost btn-sm border border-cream-200">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(c.code)} className="btn-ghost btn-sm border border-cream-200 text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "edit" ? "Editar cupom" : "Novo cupom"}>
        {modal && (
          <CouponForm
            initial={modal.coupon}
            existingCodes={editCodes(modal.mode === "edit" ? modal.coupon.code : undefined)}
            onSave={save}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}
