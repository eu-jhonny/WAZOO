import { useState, type FormEvent } from "react";
import { Clock, Instagram, RefreshCw, Save, Store, Wallet } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { whatsappLink, defaultContactMessage } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { Modal } from "@/components/ui/Modal";

export function AdminSettings() {
  const { settings, updateSettings, resetStore } = useStore();
  const { showToast } = useToast();
  const [confirmReset, setConfirmReset] = useState(false);

  const [f, setF] = useState({ ...settings });
  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    updateSettings({ ...f, deliveryFee: Number(f.deliveryFee) || 0 });
    showToast("Configurações salvas com sucesso! ✅", "success");
  };

  const doReset = () => {
    resetStore();
    setF({ ...settings });
    setConfirmReset(false);
    showToast("Dados de demonstração restaurados.", "success");
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-navy-700">Configurações</h1>
      <p className="mt-1 text-navy-500">Ajuste as informações da loja.</p>

      <form onSubmit={submit} className="card mt-6 max-w-2xl space-y-5 p-6">
        <div>
          <label className="label">Nome da loja</label>
          <input className="input" value={f.storeName} onChange={(e) => set("storeName", e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Número do WhatsApp</label>
            <div className="relative">
              <WhatsAppIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
              <input className="input pl-11" placeholder="5511999999999" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
            </div>
            <p className="mt-1 text-xs text-navy-400">Formato: DDI + DDD + número (só dígitos).</p>
          </div>
          <div>
            <label className="label">Instagram</label>
            <div className="relative">
              <Instagram size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
              <input className="input pl-11" value={f.instagram} onChange={(e) => set("instagram", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Horário de atendimento</label>
            <div className="relative">
              <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
              <input className="input pl-11" value={f.hours} onChange={(e) => set("hours", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Taxa de entrega local (R$)</label>
            <div className="relative">
              <Wallet size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
              <input type="number" min={0} step="0.01" className="input pl-11" value={f.deliveryFee} onChange={(e) => set("deliveryFee", Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Texto institucional</label>
          <textarea className="input min-h-[120px]" value={f.institutionalText} onChange={(e) => set("institutionalText", e.target.value)} />
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">
            <Save size={18} /> Salvar configurações
          </button>
          <a href={whatsappLink(defaultContactMessage, f.whatsapp)} target="_blank" rel="noopener noreferrer" className="btn-outline">
            <WhatsAppIcon size={18} /> Testar WhatsApp
          </a>
        </div>
      </form>

      {/* Zona de reset */}
      <div className="card mt-6 max-w-2xl border-amber-200 bg-amber-50 p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy-700">
          <RefreshCw size={20} className="text-amber-600" /> Dados de demonstração
        </h2>
        <p className="mt-1 text-sm text-navy-600">
          Restaura produtos, pedidos, avaliações e configurações para os valores
          iniciais. Útil para testes e apresentações.
        </p>
        <button onClick={() => setConfirmReset(true)} className="btn-outline btn-sm mt-4">
          <RefreshCw size={15} /> Restaurar dados
        </button>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Restaurar dados" size="sm">
        <p className="text-navy-600">
          Isso vai substituir todos os dados atuais pelos dados de demonstração. Deseja continuar?
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setConfirmReset(false)} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={doReset} className="btn-primary flex-1">
            <RefreshCw size={16} /> Restaurar
          </button>
        </div>
      </Modal>
    </div>
  );
}
