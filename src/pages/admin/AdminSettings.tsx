import { useRef, useState, useEffect, type FormEvent } from "react";
import {
  Bell, Clock, CreditCard, Instagram, Lock, Mail, MapPin,
  Package, PawPrint, RefreshCw, Save, Shield, Store,
  Truck, Wallet, MessageSquare, Palette, User, Eye, EyeOff,
  CheckCircle2, Phone, Upload, Loader2, Trash2, Plus, X,
  Download,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { whatsappLink, defaultContactMessage } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { Modal } from "@/components/ui/Modal";
import { compressLogo } from "@/lib/imageUtils";

/* ────────────────────────────────────────────
   Persistência genérica no localStorage
   ────────────────────────────────────────────*/
function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...fallback, ...JSON.parse(raw) };
  } catch { /* ignorar */ }
  return fallback;
}
function saveLS(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignorar */ }
}

const ADMIN_CFG_KEY = "wazoo:admin_config:v1";

interface AdminConfig {
  // Perfil
  adminName:   string;
  adminEmail:  string;
  adminPhone:  string;
  adminAvatar: string;
  // Pagamento
  payPix:       boolean;
  payCard:      boolean;
  payBoleto:    boolean;
  pixDiscount:  number;
  maxInstall:   number;
  minInstall:   number;
  pixChave:     string;
  // Notificações
  notifWA:       boolean;
  notifEmail:    boolean;
  notifNewOrder: boolean;
  notifPending:  boolean;
  notifAbandoned:boolean;
  notifReview:   boolean;
  alertEmail:    string;
  // Aparência
  accentColor: string;
  darkMode:    boolean;
  showBanner:  boolean;
  showCopa:    boolean;
  showFesta:   boolean;
}

const DEFAULT_CFG: AdminConfig = {
  adminName:   "Administrador Wazoo",
  adminEmail:  "admin@wazoo.com.br",
  adminPhone:  "",
  adminAvatar: "🐾",
  payPix: true, payCard: true, payBoleto: true,
  pixDiscount: 5, maxInstall: 10, minInstall: 30, pixChave: "",
  notifWA: true, notifEmail: true, notifNewOrder: true, notifPending: true,
  notifAbandoned: false, notifReview: true, alertEmail: "",
  accentColor: "orange", darkMode: false,
  showBanner: true, showCopa: true, showFesta: true,
};

/* ── Tipos ────────────────────────────────── */
type Tab = "perfil" | "loja" | "pagamento" | "entrega" | "notificacoes" | "aparencia" | "dados";

const TABS: Array<{ id: Tab; label: string; icon: React.ElementType; badge?: string }> = [
  { id: "perfil",       label: "Meu perfil",      icon: User      },
  { id: "loja",         label: "Loja",             icon: Store     },
  { id: "pagamento",    label: "Pagamento",        icon: CreditCard },
  { id: "entrega",      label: "Entrega",          icon: Truck     },
  { id: "notificacoes", label: "Notificações",     icon: Bell      },
  { id: "aparencia",    label: "Aparência",        icon: Palette   },
  { id: "dados",        label: "Dados demo",       icon: RefreshCw, badge: "!" },
];

/* ── Zona de entrega ─────────────────────── */
interface DeliveryZone { id: string; zone: string; fee: number; min: number; days: string; }
const ZONES_KEY = "wazoo_delivery_zones";
function loadZones(): DeliveryZone[] {
  try { const r = localStorage.getItem(ZONES_KEY); if (r) return JSON.parse(r); } catch { /* */ }
  return [
    { id: "1", zone: "Centro (SP)",  fee: 0,  min: 0,   days: "3–5 dias úteis" },
    { id: "2", zone: "Zona Sul",     fee: 8,  min: 0,   days: "4–6 dias úteis" },
    { id: "3", zone: "Zona Norte",   fee: 8,  min: 0,   days: "4–6 dias úteis" },
    { id: "4", zone: "Zona Leste",   fee: 12, min: 0,   days: "5–7 dias úteis" },
    { id: "5", zone: "Zona Oeste",   fee: 12, min: 0,   days: "5–7 dias úteis" },
    { id: "6", zone: "ABC Paulista", fee: 18, min: 100, days: "5–8 dias úteis" },
    { id: "7", zone: "Interior SP",  fee: 25, min: 150, days: "7–10 dias úteis" },
  ];
}

/* ── Helpers de UI ────────────────────────── */
function Field({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {sublabel && <p className="mb-1.5 text-xs text-navy-400">{sublabel}</p>}
      {children}
    </div>
  );
}
function Section({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-5 space-y-4">
      <h3 className="flex items-center gap-2 font-display font-bold text-navy-800 text-sm border-b border-cream-100 pb-3">
        {Icon && <Icon size={16} className="text-orange-500" />}{title}
      </h3>
      {children}
    </div>
  );
}
function ComingSoon() {
  return <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600 uppercase">em breve</span>;
}
function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between cursor-pointer gap-3">
      <span className="text-sm font-semibold text-navy-700">{label}</span>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full transition-colors ${value ? "bg-orange-500" : "bg-cream-300"}`}>
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

/* ── Modal: adicionar zona ─────────────────── */
function AddZoneModal({ open, onClose, onAdd }: {
  open: boolean; onClose: () => void; onAdd: (z: Omit<DeliveryZone, "id">) => void;
}) {
  const [zone, setZone] = useState(""); const [fee, setFee] = useState("");
  const [min, setMin] = useState("0"); const [days, setDays] = useState("");
  const [err, setErr] = useState("");
  const reset = () => { setZone(""); setFee(""); setMin("0"); setDays(""); setErr(""); };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!zone.trim()) { setErr("Nome da zona é obrigatório."); return; }
    if (fee === "" || isNaN(Number(fee))) { setErr("Taxa de entrega inválida."); return; }
    if (!days.trim()) { setErr("Prazo de entrega é obrigatório."); return; }
    onAdd({ zone: zone.trim(), fee: Number(fee), min: Number(min) || 0, days: days.trim() });
    reset(); onClose();
  };
  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Adicionar zona de entrega" size="sm">
      <form onSubmit={submit} className="space-y-4">
        {err && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">{err}</p>}
        <Field label="Nome da zona / região">
          <input className="input" placeholder="Ex: Zona Norte" value={zone}
            onChange={(e) => { setZone(e.target.value); setErr(""); }} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Taxa de entrega (R$)">
            <input type="number" min={0} step="0.01" className="input" placeholder="0.00"
              value={fee} onChange={(e) => { setFee(e.target.value); setErr(""); }} />
          </Field>
          <Field label="Pedido mínimo (R$)">
            <input type="number" min={0} step={10} className="input" placeholder="0"
              value={min} onChange={(e) => setMin(e.target.value)} />
          </Field>
        </div>
        <Field label="Prazo de entrega">
          <input className="input" placeholder="Ex: 3–5 dias úteis" value={days}
            onChange={(e) => { setDays(e.target.value); setErr(""); }} />
        </Field>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => { reset(); onClose(); }} className="btn-ghost flex-1 border border-cream-200">Cancelar</button>
          <button type="submit" className="btn-primary flex-1"><Plus size={15} /> Adicionar</button>
        </div>
      </form>
    </Modal>
  );
}

/* ══════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ══════════════════════════════════════════════ */
export function AdminSettings() {
  const { settings, updateSettings, resetStore, products, orders, reviews } = useStore();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("perfil");
  const [confirmReset, setConfirmReset] = useState(false);

  /* ── Config persistida (tudo exceto aba Loja) ── */
  const [cfg, setCfgRaw] = useState<AdminConfig>(() => loadLS(ADMIN_CFG_KEY, DEFAULT_CFG));

  const setCfg = (patch: Partial<AdminConfig>) => {
    setCfgRaw((prev) => { const next = { ...prev, ...patch }; saveLS(ADMIN_CFG_KEY, next); return next; });
  };

  /* ── Loja (usa StoreContext) ── */
  const [f, setF] = useState({ ...settings });
  // Sincroniza quando settings muda externamente (ex: reset)
  useEffect(() => { setF({ ...settings }); }, [settings]);
  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  /* ── Logo upload ── */
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [customLogo,  setCustomLogo]  = useState<string | null>(() => localStorage.getItem("wazoo_custom_logo"));
  const [logoLoading, setLogoLoading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast("Arquivo muito grande (máx. 10 MB).", "error"); return; }
    setLogoLoading(true);
    try {
      const compressed = await compressLogo(file);
      localStorage.setItem("wazoo_custom_logo", compressed);
      setCustomLogo(compressed);
      showToast("Logo atualizado! ✅", "success");
    } catch { showToast("Erro ao processar imagem.", "error"); }
    finally { setLogoLoading(false); if (logoInputRef.current) logoInputRef.current.value = ""; }
  };
  const removeLogo = () => { localStorage.removeItem("wazoo_custom_logo"); setCustomLogo(null); showToast("Logo removido.", "success"); };

  /* ── Entrega ── */
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(loadZones);
  const [addZoneOpen, setAddZoneOpen]     = useState(false);
  const [zoneToDelete, setZoneToDelete]   = useState<string | null>(null);
  const persistZones = (zones: DeliveryZone[]) => { localStorage.setItem(ZONES_KEY, JSON.stringify(zones)); setDeliveryZones(zones); };
  const addZone  = (data: Omit<DeliveryZone, "id">) => { persistZones([...deliveryZones, { id: Date.now().toString(), ...data }]); showToast(`Zona "${data.zone}" adicionada! ✅`, "success"); };
  const deleteZone = (id: string) => { persistZones(deliveryZones.filter((z) => z.id !== id)); setZoneToDelete(null); showToast("Zona removida.", "success"); };

  /* ── Senha admin ── */
  const [adminPwd,        setAdminPwd]        = useState("");
  const [adminPwdConfirm, setAdminPwdConfirm] = useState("");
  const [showPwd,         setShowPwd]         = useState(false);

  /* ── Exports ── */
  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };
  const exportProductsJson = () => {
    const data = products.map(({ image: _i, gallery: _g, ...p }) => p);
    downloadFile(JSON.stringify(data, null, 2), "wazoo-produtos.json", "application/json");
    showToast(`${data.length} produtos exportados! 📦`, "success");
  };
  const exportOrdersCsv = () => {
    const header = ["ID","Cliente","Telefone","Data","Status","Total (R$)","Itens","Entrega"];
    const rows   = orders.map((o) => [
      o.id, o.customerName, o.customerPhone,
      new Date(o.createdAt).toLocaleDateString("pt-BR"),
      o.status, o.total.toFixed(2),
      o.items.map((i) => `${i.name} x${i.quantity}`).join(" | "),
      o.fulfillment === "entrega" ? "Entrega" : "Retirada",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    downloadFile("﻿" + csv, "wazoo-pedidos.csv", "text/csv;charset=utf-8");
    showToast(`${orders.length} pedidos exportados! 📊`, "success");
  };
  const exportReviewsCsv = () => {
    const header = ["ID","Nome","Pet","Nota","Texto","Aprovado","Data"];
    const rows   = reviews.map((r) => [r.id, r.name, r.petName ?? "", r.rating, r.text, r.approved ? "Sim" : "Não", new Date(r.createdAt).toLocaleDateString("pt-BR")]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    downloadFile("﻿" + csv, "wazoo-avaliacoes.csv", "text/csv;charset=utf-8");
    showToast(`${reviews.length} avaliações exportadas! 📊`, "success");
  };

  /* ── Submits ── */
  const savePerfil = (e: FormEvent) => {
    e.preventDefault();
    if (adminPwd && adminPwd !== adminPwdConfirm) { showToast("As senhas não conferem.", "error"); return; }
    setCfg({ adminName: cfg.adminName, adminEmail: cfg.adminEmail, adminPhone: cfg.adminPhone, adminAvatar: cfg.adminAvatar });
    showToast("Perfil atualizado! ✅", "success");
    setAdminPwd(""); setAdminPwdConfirm("");
  };
  const saveLoja = (e: FormEvent) => {
    e.preventDefault();
    updateSettings({ ...f, deliveryFee: Number(f.deliveryFee) || 0 });
    showToast("Configurações da loja salvas! ✅", "success");
  };
  const savePayment = (e: FormEvent) => {
    e.preventDefault();
    setCfg({ payPix: cfg.payPix, payCard: cfg.payCard, payBoleto: cfg.payBoleto, pixDiscount: cfg.pixDiscount, maxInstall: cfg.maxInstall, minInstall: cfg.minInstall, pixChave: cfg.pixChave });
    showToast("Configurações de pagamento salvas! ✅", "success");
  };
  const saveNotif = (e: FormEvent) => {
    e.preventDefault();
    setCfg({ notifWA: cfg.notifWA, notifEmail: cfg.notifEmail, notifNewOrder: cfg.notifNewOrder, notifPending: cfg.notifPending, notifAbandoned: cfg.notifAbandoned, notifReview: cfg.notifReview, alertEmail: cfg.alertEmail });
    showToast("Preferências de notificação salvas! ✅", "success");
  };
  const saveAparencia = (e: FormEvent) => {
    e.preventDefault();
    setCfg({ accentColor: cfg.accentColor, darkMode: cfg.darkMode, showBanner: cfg.showBanner, showCopa: cfg.showCopa, showFesta: cfg.showFesta });
    showToast("Configurações de aparência salvas! ✅", "success");
  };
  const doReset = () => { resetStore(); setConfirmReset(false); showToast("Dados de demonstração restaurados.", "success"); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-800">Configurações</h1>
        <p className="mt-1 text-sm text-navy-500">Gerencie todas as configurações da sua loja.</p>
      </div>

      {/* ── Tabs ── */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-1 rounded-2xl border border-cream-200 bg-cream-50 p-1 min-w-max">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${active ? "bg-white text-orange-600 shadow-sm" : "text-navy-500 hover:text-navy-800"}`}>
                <Icon size={14} />{t.label}
                {t.badge && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">{t.badge}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════ TAB: PERFIL ══════════ */}
      {tab === "perfil" && (
        <form onSubmit={savePerfil} className="space-y-5 max-w-2xl">
          <Section title="Informações do administrador" icon={User}>
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-navy-800 text-4xl shadow-soft">
                {cfg.adminAvatar}
              </div>
              <div>
                <p className="font-bold text-navy-800">{cfg.adminName || "Administrador"}</p>
                <p className="text-sm text-navy-400">{cfg.adminEmail}</p>
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  {["🐾","🐕","🐈","🌟","⚡","🏆","🎯"].map((em) => (
                    <button key={em} type="button" onClick={() => setCfg({ adminAvatar: em })}
                      className={`rounded-lg border px-2 py-1 text-lg transition-all ${cfg.adminAvatar === em ? "border-orange-400 bg-orange-50" : "border-cream-200 hover:border-cream-300"}`}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome">
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                  <input className="input pl-9" value={cfg.adminName} onChange={(e) => setCfg({ adminName: e.target.value })} />
                </div>
              </Field>
              <Field label="E-mail de acesso">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                  <input type="email" className="input pl-9" value={cfg.adminEmail} onChange={(e) => setCfg({ adminEmail: e.target.value })} />
                </div>
              </Field>
              <Field label="Telefone / WhatsApp">
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                  <input className="input pl-9" placeholder="11945198349" value={cfg.adminPhone} onChange={(e) => setCfg({ adminPhone: e.target.value })} />
                </div>
              </Field>
            </div>
          </Section>

          <Section title="Segurança" icon={Lock}>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <strong>Atenção:</strong> Preencha abaixo apenas para alterar a senha. Deixe em branco para manter a atual.
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nova senha">
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                  <input type={showPwd ? "text" : "password"} className="input pl-9 pr-10"
                    placeholder="Nova senha (mín. 6 caracteres)" value={adminPwd}
                    onChange={(e) => setAdminPwd(e.target.value)} minLength={6} />
                  <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>
              <Field label="Confirmar nova senha">
                <div className="relative">
                  <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                  <input type={showPwd ? "text" : "password"}
                    className={`input pl-9 ${adminPwd && adminPwdConfirm && adminPwd !== adminPwdConfirm ? "border-red-400" : ""}`}
                    placeholder="Repetir nova senha" value={adminPwdConfirm} onChange={(e) => setAdminPwdConfirm(e.target.value)} />
                  {adminPwd && adminPwdConfirm && adminPwd === adminPwdConfirm && (
                    <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                  )}
                </div>
              </Field>
            </div>
            <div>
              <p className="label">Autenticação em 2 fatores <ComingSoon /></p>
              <p className="text-xs text-navy-400">Adicione segurança extra com 2FA via app autenticador.</p>
            </div>
          </Section>

          <Section title="Sessões ativas" icon={Shield}>
            <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-navy-800">Sessão atual</p>
                <p className="text-xs text-navy-400">Chrome · São Paulo, SP · Agora</p>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Ativa
              </span>
            </div>
          </Section>

          <button type="submit" className="btn-primary"><Save size={16} /> Salvar perfil</button>
        </form>
      )}

      {/* ══════════ TAB: LOJA ══════════ */}
      {tab === "loja" && (
        <form onSubmit={saveLoja} className="space-y-5 max-w-2xl">
          <Section title="Informações da loja" icon={Store}>
            <Field label="Nome da loja">
              <input className="input" value={f.storeName} onChange={(e) => set("storeName", e.target.value)} />
            </Field>
            <Field label="Texto institucional" sublabel="Aparece na página Sobre.">
              <textarea className="input min-h-[100px]" value={f.institutionalText} onChange={(e) => set("institutionalText", e.target.value)} />
            </Field>
          </Section>

          <Section title="Contato e redes sociais" icon={MessageSquare}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="WhatsApp" sublabel="DDI + DDD + número (só dígitos). Ex: 5511945198349">
                <div className="relative">
                  <WhatsAppIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
                  <input className="input pl-9" placeholder="5511945198349" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
                </div>
              </Field>
              <Field label="Instagram">
                <div className="relative">
                  <Instagram size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" />
                  <input className="input pl-9" placeholder="@wazoo.petexpress" value={f.instagram} onChange={(e) => set("instagram", e.target.value)} />
                </div>
              </Field>
              <Field label="E-mail de contato">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                  <input type="email" className="input pl-9" placeholder="contato@wazoo.com.br" />
                </div>
              </Field>
              <Field label="Horário de atendimento">
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                  <input className="input pl-9" value={f.hours} onChange={(e) => set("hours", e.target.value)} />
                </div>
              </Field>
            </div>
          </Section>

          <Section title="Endereço da loja" icon={MapPin}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Rua / Avenida"><input className="input" placeholder="Av. Paulista, 1000" /></Field>
              <Field label="Complemento"><input className="input" placeholder="Sala 12, Loja B..." /></Field>
              <Field label="Bairro"><input className="input" placeholder="Bela Vista" /></Field>
              <Field label="Cidade"><input className="input" placeholder="São Paulo" /></Field>
              <Field label="CEP"><input className="input" placeholder="01310-100" /></Field>
              <Field label="Estado"><select className="input"><option>SP</option><option>RJ</option><option>MG</option></select></Field>
            </div>
          </Section>

          <div className="flex gap-3 flex-wrap">
            <button type="submit" className="btn-primary"><Save size={16} /> Salvar configurações</button>
            <a href={whatsappLink(defaultContactMessage, f.whatsapp)} target="_blank" rel="noopener noreferrer" className="btn-outline">
              <WhatsAppIcon size={16} /> Testar WhatsApp
            </a>
          </div>
        </form>
      )}

      {/* ══════════ TAB: PAGAMENTO ══════════ */}
      {tab === "pagamento" && (
        <form onSubmit={savePayment} className="space-y-5 max-w-2xl">
          <Section title="Métodos aceitos" icon={CreditCard}>
            <Toggle value={cfg.payPix}    onChange={(v) => setCfg({ payPix: v })}    label="PIX" />
            <Toggle value={cfg.payCard}   onChange={(v) => setCfg({ payCard: v })}   label="Cartão de crédito" />
            <Toggle value={cfg.payBoleto} onChange={(v) => setCfg({ payBoleto: v })} label="Boleto bancário" />
          </Section>

          <Section title="PIX" icon={Wallet}>
            <Toggle value={cfg.payPix} onChange={(v) => setCfg({ payPix: v })} label="Aceitar pagamentos via PIX" />
            {cfg.payPix && (
              <>
                <Field label="Desconto para pagamento via PIX (%)" sublabel="0 = sem desconto.">
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={20} step={1} value={cfg.pixDiscount}
                      onChange={(e) => setCfg({ pixDiscount: Number(e.target.value) })}
                      className="flex-1 h-2 accent-orange-500" />
                    <span className="w-12 text-center font-bold text-orange-600">{cfg.pixDiscount}%</span>
                  </div>
                </Field>
                <Field label="Chave PIX" sublabel="CNPJ, CPF, e-mail ou telefone.">
                  <input className="input" placeholder="Chave PIX da loja" value={cfg.pixChave} onChange={(e) => setCfg({ pixChave: e.target.value })} />
                </Field>
              </>
            )}
          </Section>

          <Section title="Cartão de crédito" icon={CreditCard}>
            <Toggle value={cfg.payCard} onChange={(v) => setCfg({ payCard: v })} label="Aceitar cartão de crédito" />
            {cfg.payCard && (
              <>
                <Field label="Máximo de parcelas" sublabel="Sem juros ao cliente.">
                  <div className="flex items-center gap-3">
                    <input type="range" min={1} max={12} step={1} value={cfg.maxInstall}
                      onChange={(e) => setCfg({ maxInstall: Number(e.target.value) })}
                      className="flex-1 h-2 accent-orange-500" />
                    <span className="w-16 text-center font-bold text-orange-600">até {cfg.maxInstall}x</span>
                  </div>
                </Field>
                <Field label="Valor mínimo por parcela (R$)">
                  <div className="flex items-center gap-3">
                    <input type="range" min={10} max={200} step={5} value={cfg.minInstall}
                      onChange={(e) => setCfg({ minInstall: Number(e.target.value) })}
                      className="flex-1 h-2 accent-orange-500" />
                    <span className="w-16 text-center font-bold text-orange-600">R$ {cfg.minInstall}</span>
                  </div>
                </Field>
                <Field label="Bandeiras aceitas">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {["Visa","Mastercard","Elo","Amex","Hipercard"].map((b) => (
                      <span key={b} className="rounded-full border border-cream-200 bg-cream-50 px-3 py-1 text-xs font-bold text-navy-600">{b}</span>
                    ))}
                  </div>
                </Field>
              </>
            )}
          </Section>

          <Section title="MercadoPago" icon={Shield}>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 font-semibold">
              💡 As chaves de integração são configuradas via variáveis de ambiente no servidor.
            </div>
            <Field label="Chave pública (VITE_MP_PUBLIC_KEY)">
              <input className="input font-mono text-xs" value="APP_USR-xxxxxxxx..." disabled />
            </Field>
            <Field label="Access Token (MP_ACCESS_TOKEN — servidor)">
              <input className="input font-mono text-xs" value="APP_USR-••••••••••••" disabled />
            </Field>
          </Section>

          <button type="submit" className="btn-primary"><Save size={16} /> Salvar pagamento</button>
        </form>
      )}

      {/* ══════════ TAB: ENTREGA ══════════ */}
      {tab === "entrega" && (
        <div className="space-y-5 max-w-2xl">
          <Section title="Taxa de entrega padrão" icon={Truck}>
            <Field label="Taxa padrão de entrega (R$)" sublabel="Aplicada a regiões não listadas abaixo.">
              <div className="relative">
                <Wallet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                <input type="number" min={0} step="0.01" className="input pl-9"
                  value={f.deliveryFee} onChange={(e) => set("deliveryFee", Number(e.target.value))} />
              </div>
            </Field>
          </Section>

          <Section title="Zonas de entrega" icon={MapPin}>
            <p className="text-xs text-navy-400">{deliveryZones.length} zonas cadastradas.</p>
            <div className="divide-y divide-cream-100 rounded-xl border border-cream-200 overflow-hidden">
              {deliveryZones.map((z) => (
                <div key={z.id} className="flex items-center justify-between px-4 py-3 hover:bg-cream-50 transition-colors group">
                  <div>
                    <p className="font-bold text-navy-700 text-sm">{z.zone}</p>
                    <p className="text-xs text-navy-400">{z.days}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-orange-600 text-sm">{z.fee === 0 ? "Grátis" : `R$ ${z.fee.toFixed(2)}`}</p>
                      {z.min > 0 && <p className="text-[10px] text-navy-400">Mín. R$ {z.min}</p>}
                    </div>
                    <button type="button" onClick={() => setZoneToDelete(z.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="btn-outline btn-sm" onClick={() => setAddZoneOpen(true)}>
              <Plus size={14} /> Adicionar zona
            </button>
          </Section>

          <Section title="Frete grátis" icon={Package}>
            <Field label="Frete grátis acima de (R$)" sublabel="0 = desativado.">
              <input type="number" min={0} step={10} className="input" placeholder="Ex: 200" />
            </Field>
          </Section>

          <button type="button" className="btn-primary"
            onClick={() => { updateSettings({ ...f, deliveryFee: Number(f.deliveryFee) || 0 }); showToast("Configurações de entrega salvas! ✅", "success"); }}>
            <Save size={16} /> Salvar entrega
          </button>
        </div>
      )}

      {/* ══════════ TAB: NOTIFICAÇÕES ══════════ */}
      {tab === "notificacoes" && (
        <form onSubmit={saveNotif} className="space-y-5 max-w-2xl">
          <Section title="Canais de notificação" icon={Bell}>
            <Toggle value={cfg.notifWA}    onChange={(v) => setCfg({ notifWA: v })}    label="Notificações via WhatsApp" />
            <Toggle value={cfg.notifEmail} onChange={(v) => setCfg({ notifEmail: v })} label="Notificações via e-mail" />
          </Section>
          <Section title="Eventos" icon={Bell}>
            <Toggle value={cfg.notifNewOrder}   onChange={(v) => setCfg({ notifNewOrder: v })}   label="Novo pedido recebido" />
            <Toggle value={cfg.notifPending}    onChange={(v) => setCfg({ notifPending: v })}    label="Pedidos aguardando confirmação" />
            <Toggle value={cfg.notifAbandoned}  onChange={(v) => setCfg({ notifAbandoned: v })}  label="Carrinho abandonado (clientes)" />
            <Toggle value={cfg.notifReview}     onChange={(v) => setCfg({ notifReview: v })}     label="Nova avaliação enviada" />
          </Section>
          <Section title="E-mail de destino" icon={Mail}>
            <Field label="E-mail para receber alertas" sublabel="Pode ser diferente do seu e-mail de acesso.">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                <input type="email" className="input pl-9" placeholder="alertas@wazoo.com.br"
                  value={cfg.alertEmail} onChange={(e) => setCfg({ alertEmail: e.target.value })} />
              </div>
            </Field>
          </Section>
          <button type="submit" className="btn-primary"><Save size={16} /> Salvar notificações</button>
        </form>
      )}

      {/* ══════════ TAB: APARÊNCIA ══════════ */}
      {tab === "aparencia" && (
        <form onSubmit={saveAparencia} className="space-y-5 max-w-2xl">
          <Section title="Cor de destaque" icon={Palette}>
            <p className="text-xs text-navy-400">Cor principal dos botões, links e destaques.</p>
            <div className="flex flex-wrap gap-3">
              {[
                { id: "orange", label: "Laranja", cls: "bg-orange-500" },
                { id: "teal",   label: "Teal",    cls: "bg-teal-500"   },
                { id: "purple", label: "Roxo",    cls: "bg-purple-500" },
                { id: "green",  label: "Verde",   cls: "bg-green-600"  },
                { id: "pink",   label: "Rosa",    cls: "bg-pink-500"   },
              ].map((c) => (
                <button key={c.id} type="button" onClick={() => setCfg({ accentColor: c.id })}
                  className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all ${cfg.accentColor === c.id ? "border-navy-700 bg-white shadow" : "border-cream-200"}`}>
                  <span className={`h-4 w-4 rounded-full ${c.cls}`} />{c.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Elementos visuais" icon={PawPrint}>
            <Toggle value={cfg.showBanner} onChange={(v) => setCfg({ showBanner: v })} label="Mostrar banner carrossel na home" />
            <Toggle value={cfg.showCopa}   onChange={(v) => setCfg({ showCopa: v })}   label="Mostrar seção Copa 2026" />
            <Toggle value={cfg.showFesta}  onChange={(v) => setCfg({ showFesta: v })}  label="Mostrar seção Festa Junina" />
            <Toggle value={cfg.darkMode}   onChange={(v) => setCfg({ darkMode: v })}   label={<>Modo escuro (admin) <ComingSoon /></>} />
          </Section>

          <Section title="Logo e identidade" icon={Store}>
            <Field label="Logo da loja" sublabel="Recomendado: PNG transparente, 200×80px. Máx. 10 MB.">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-36 items-center justify-center rounded-xl border-2 border-cream-300 bg-cream-50 overflow-hidden">
                  {customLogo
                    ? <img src={customLogo} alt="Logo" className="h-full w-full object-contain p-1" />
                    : <span className="text-xs text-navy-400">Logo atual</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <button type="button" disabled={logoLoading} onClick={() => logoInputRef.current?.click()}
                    className="btn-outline btn-sm disabled:opacity-60">
                    {logoLoading ? <><Loader2 size={13} className="animate-spin" /> Processando…</> : <><Upload size={13} /> {customLogo ? "Alterar logo" : "Enviar logo"}</>}
                  </button>
                  {customLogo && (
                    <button type="button" onClick={removeLogo} className="btn-sm btn-ghost text-red-500 hover:bg-red-50">
                      <X size={13} /> Remover
                    </button>
                  )}
                </div>
              </div>
            </Field>
            <Field label="Mascote" sublabel="Personagem animado que aparece na loja.">
              <button type="button" className="btn-outline btn-sm" onClick={() => showToast("Customização do mascote em breve!", "info")}>
                Personalizar mascote <ComingSoon />
              </button>
            </Field>
          </Section>

          <button type="submit" className="btn-primary"><Save size={16} /> Salvar aparência</button>
        </form>
      )}

      {/* ══════════ TAB: DADOS ══════════ */}
      {tab === "dados" && (
        <div className="max-w-2xl space-y-5">
          <Section title="Dados de demonstração" icon={RefreshCw}>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-bold text-amber-800 text-sm">⚠️ Atenção</p>
              <p className="mt-1 text-sm text-amber-700">Restaura produtos, pedidos, avaliações e configurações para os valores iniciais.</p>
            </div>
            <div className="space-y-2 text-sm text-navy-600">
              <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500" /> Dados de produtos restaurados</p>
              <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500" /> Pedidos de exemplo gerados</p>
              <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500" /> Avaliações de exemplo adicionadas</p>
              <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500" /> Configurações de loja resetadas</p>
            </div>
            <button type="button" onClick={() => setConfirmReset(true)}
              className="btn flex gap-2 items-center bg-amber-500 text-white hover:bg-amber-600 btn-sm">
              <RefreshCw size={15} /> Restaurar dados de demonstração
            </button>
          </Section>

          <Section title="Exportar dados" icon={Download}>
            <p className="text-sm text-navy-500">Exporte os dados da loja. Gerados no browser, sem servidor.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Produtos", sub: `JSON · ${products.length} itens`, format: "JSON", icon: Package, fn: exportProductsJson },
                { label: "Pedidos",  sub: `CSV · ${orders.length} pedidos`,  format: "CSV",  icon: Truck,   fn: exportOrdersCsv   },
                { label: "Avaliações",sub: `CSV · ${reviews.length} aval.`,  format: "CSV",  icon: PawPrint,fn: exportReviewsCsv  },
              ].map((item) => (
                <button key={item.label} type="button" onClick={item.fn}
                  className="flex flex-col items-center gap-2 rounded-2xl border-2 border-cream-200 bg-cream-50 p-4 text-center transition-all hover:border-orange-300 hover:bg-orange-50">
                  <item.icon size={22} className="text-orange-500" />
                  <div>
                    <p className="font-bold text-navy-700 text-sm">{item.label}</p>
                    <p className="text-[11px] text-navy-400">{item.sub}</p>
                  </div>
                  <span className="rounded-full bg-navy-100 px-3 py-1 text-[11px] font-bold text-navy-600">
                    <Download size={10} className="inline mr-1" />{item.format}
                  </span>
                </button>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Modais */}
      <AddZoneModal open={addZoneOpen} onClose={() => setAddZoneOpen(false)} onAdd={addZone} />

      <Modal open={!!zoneToDelete} onClose={() => setZoneToDelete(null)} title="Remover zona" size="sm">
        <p className="text-navy-600">
          Remover a zona <strong>{deliveryZones.find((z) => z.id === zoneToDelete)?.zone}</strong>?
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setZoneToDelete(null)} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={() => zoneToDelete && deleteZone(zoneToDelete)} className="btn flex-1 bg-red-500 text-white hover:bg-red-600">
            <Trash2 size={15} /> Remover
          </button>
        </div>
      </Modal>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Restaurar dados" size="sm">
        <p className="text-navy-600">Isso vai substituir <strong>todos</strong> os dados atuais pelos dados de demonstração. Continuar?</p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setConfirmReset(false)} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={doReset} className="btn flex-1 bg-amber-500 text-white hover:bg-amber-600">
            <RefreshCw size={16} /> Restaurar
          </button>
        </div>
      </Modal>
    </div>
  );
}
