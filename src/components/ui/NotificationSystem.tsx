/**
 * Sistema de Notificações — v2
 * Correção: icon NÃO é salvo no localStorage (React node não é serializável).
 * Salva-se apenas `iconKey` string; o nó JSX é derivado na hora de renderizar.
 */
import { useState, useEffect, useRef } from "react";
import { Bell, X, ShoppingCart, Tag, Zap, PawPrint, Gift, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";

/* ── Mapa de ícones (string → JSX) ─────────────── */
export type IconKey = "ShoppingCart" | "Tag" | "Zap" | "PawPrint" | "Gift";

const ICON_MAP: Record<IconKey, React.ReactNode> = {
  ShoppingCart: <ShoppingCart size={16} />,
  Tag:          <Tag size={16} />,
  Zap:          <Zap size={16} />,
  PawPrint:     <PawPrint size={16} />,
  Gift:         <Gift size={16} />,
};

/* ── Tipo que vai pro localStorage (sem React node) */
export interface StoredNotification {
  id:        string;
  type:      "cart" | "promo" | "tip" | "greeting" | "offer";
  iconKey:   IconKey;
  title:     string;
  message:   string;
  action?:   { label: string; to: string };
  color:     string;
  bg:        string;
  createdAt: number;
  read:      boolean;
}

/* ── Tipo de runtime (com ícone derivado) ────────── */
export interface Notification extends StoredNotification {
  icon: React.ReactNode;
}

/* ── Helpers de storage ─────────────────────────── */
const STORAGE_KEY    = "wazoo_notifs_v2"; // v2 → limpa dados corrompidos da v1
const TIMESTAMP_PFX  = "wazoo_notif_ts_";

function getStored(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? "[]";
    const stored: StoredNotification[] = JSON.parse(raw);
    // Hidrata o campo `icon` que não veio do JSON
    return stored.map((n) => ({
      ...n,
      icon: ICON_MAP[n.iconKey] ?? <PawPrint size={16} />,
    }));
  } catch {
    return [];
  }
}

function save(notifs: Notification[]) {
  // Remove o campo `icon` (React node) antes de serializar
  const storable: StoredNotification[] = notifs.map(({ icon: _icon, ...rest }) => rest);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storable.slice(0, 20)));
  } catch {}
}

function wasShownRecently(key: string, hours = 4): boolean {
  const ts = localStorage.getItem(`${TIMESTAMP_PFX}${key}`);
  if (!ts) return false;
  return Date.now() - Number(ts) < hours * 3_600_000;
}
function markShown(key: string) {
  localStorage.setItem(`${TIMESTAMP_PFX}${key}`, String(Date.now()));
}
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/* ── Templates de promoção ───────────────────────── */
type NotifTemplate = Omit<StoredNotification, "id" | "createdAt" | "read">;

const PROMOS: NotifTemplate[] = [
  {
    type: "promo", iconKey: "Tag",
    title: "10% OFF no primeiro pedido!",
    message: "Use o cupom WAZOO10 e economize na sua primeira compra.",
    action: { label: "Ver produtos", to: "/produtos" },
    color: "text-orange-600", bg: "bg-orange-50",
  },
  {
    type: "offer", iconKey: "Gift",
    title: "Frete grátis acima de R$200",
    message: "Monte seu pedido e ganhe entrega grátis em toda São Paulo.",
    action: { label: "Aproveitar", to: "/produtos" },
    color: "text-green-600", bg: "bg-green-50",
  },
  {
    type: "tip", iconKey: "PawPrint",
    title: "Tudo sob encomenda 🐾",
    message: "Buscamos exatamente o que você precisa. Prazo médio: 5–7 dias úteis.",
    action: { label: "Como funciona?", to: "/como-funciona" },
    color: "text-teal-600", bg: "bg-teal-50",
  },
  {
    type: "tip", iconKey: "Zap",
    title: "Acompanhe seus pedidos",
    message: "Crie uma conta e rastreie cada pedido em tempo real.",
    action: { label: "Criar conta", to: "/cadastro" },
    color: "text-purple-600", bg: "bg-purple-50",
  },
];

/* ══════════════════════════════════════════════════════
   ESTADO GLOBAL (módulo-level, compartilhado)
   ══════════════════════════════════════════════════════ */
let _listeners: Array<(n: Notification[]) => void> = [];
let _state: Notification[] = getStored();

function subscribeNotifs(cb: (n: Notification[]) => void) {
  _listeners.push(cb);
  return () => { _listeners = _listeners.filter((l) => l !== cb); };
}
function notifyListeners() {
  _listeners.forEach((l) => l([..._state]));
}

export function addNotification(tmpl: NotifTemplate) {
  const notif: Notification = {
    ...tmpl,
    icon:      ICON_MAP[tmpl.iconKey] ?? <PawPrint size={16} />,
    id:        `${Date.now()}-${Math.random()}`,
    createdAt: Date.now(),
    read:      false,
  };
  _state = [notif, ..._state].slice(0, 20);
  save(_state);
  notifyListeners();
  return notif;
}
export function markAllRead() {
  _state = _state.map((n) => ({ ...n, read: true }));
  save(_state);
  notifyListeners();
}
export function removeNotif(id: string) {
  _state = _state.filter((n) => n.id !== id);
  save(_state);
  notifyListeners();
}
export function clearAll() {
  _state = [];
  save(_state);
  notifyListeners();
}

function useNotifState() {
  const [notifs, setNotifs] = useState<Notification[]>(_state);
  useEffect(() => subscribeNotifs(setNotifs), []);
  return notifs;
}

/* ══════════════════════════════════════════════════════
   NOTIFICATION BELL — montado no Header
   ══════════════════════════════════════════════════════ */
export function NotificationBell() {
  const notifs    = useNotifState();
  const [open, setOpen] = useState(false);
  const panelRef  = useRef<HTMLDivElement>(null);
  const unread    = notifs.filter((n) => !n.read).length;

  /* Fechar ao clicar fora */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) markAllRead();
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Botão sino */}
      <button
        onClick={handleOpen}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-all ${
          open
            ? "bg-navy-800 text-white"
            : "bg-cream-100 text-navy-700 hover:bg-cream-200"
        }`}
        aria-label="Notificações"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white shadow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Painel dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1rem)] rounded-2xl border border-cream-200 bg-white shadow-2xl overflow-hidden z-[60]">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between border-b border-cream-100 bg-navy-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-orange-400" />
              <span className="font-display font-bold text-white text-sm">Notificações</span>
              {unread > 0 && (
                <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="text-cream-400 hover:text-white">
              <X size={15} />
            </button>
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Bell size={28} className="text-cream-300" />
                <p className="mt-2 text-sm text-navy-400">Nenhuma notificação</p>
                <p className="mt-1 text-xs text-navy-300">Fique de olho nas promoções! 🐾</p>
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 border-b border-cream-50 p-3 transition-colors ${n.read ? "bg-white" : "bg-orange-50/40"}`}
                >
                  <div className={`mt-0.5 shrink-0 ${n.color}`}>{n.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-navy-800 text-xs leading-snug">{n.title}</p>
                    <p className="mt-0.5 text-xs text-navy-500 leading-relaxed">{n.message}</p>
                    {n.action && (
                      <Link
                        to={n.action.to}
                        className={`mt-1.5 inline-block text-xs font-bold hover:underline ${n.color}`}
                        onClick={() => setOpen(false)}
                      >
                        {n.action.label} →
                      </Link>
                    )}
                    <p className="mt-1 text-[10px] text-navy-300 flex items-center gap-1">
                      <Clock size={9} />
                      {new Date(n.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <button
                    onClick={() => removeNotif(n.id)}
                    className="shrink-0 text-navy-200 hover:text-red-400 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Rodapé */}
          {notifs.length > 0 && (
            <div className="border-t border-cream-100 p-2 text-center">
              <button
                onClick={clearAll}
                className="text-xs text-navy-400 hover:text-red-500 font-semibold"
              >
                Limpar todas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   NOTIFICATION SYSTEM — lógica de fundo + toast
   Montado no Layout (sem bell visível)
   ══════════════════════════════════════════════════════ */
export function NotificationSystem() {
  const { count } = useCart();
  const notifs    = useNotifState();
  const [toast, setToast] = useState<Notification | null>(null);
  const shownIds  = useRef<Set<string>>(new Set());

  /* ── Boas-vindas ──────────────────────────── */
  useEffect(() => {
    if (wasShownRecently("greeting", 8)) return;
    const t = setTimeout(() => {
      addNotification({
        type: "greeting", iconKey: "PawPrint",
        title: `${greeting()}, bem-vindo à Wazoo! 🐾`,
        message: "Encontre tudo para o seu pet sob encomenda, com amor.",
        action: { label: "Ver produtos", to: "/produtos" },
        color: "text-orange-600", bg: "bg-orange-50",
      });
      markShown("greeting");
    }, 3_000);
    return () => clearTimeout(t);
  }, []);

  /* ── Abandono de carrinho ──────────────────── */
  useEffect(() => {
    if (count === 0) return;
    if (wasShownRecently("cart_abandon", 1)) return;
    const t = setTimeout(() => {
      if (count === 0) return;
      addNotification({
        type: "cart", iconKey: "ShoppingCart",
        title: `Você tem ${count} ${count === 1 ? "item" : "itens"} no carrinho!`,
        message: "Não esqueça do seu pedido — finalize antes que acabe o estoque.",
        action: { label: "Ver carrinho", to: "/carrinho" },
        color: "text-orange-600", bg: "bg-orange-50",
      });
      markShown("cart_abandon");
    }, 4 * 60_000);
    return () => clearTimeout(t);
  }, [count]);

  /* ── Promoção automática ───────────────────── */
  useEffect(() => {
    if (wasShownRecently("promo", 4)) return;
    const t = setTimeout(() => {
      const promo = PROMOS[Math.floor(Math.random() * PROMOS.length)];
      addNotification(promo);
      markShown("promo");
    }, 15_000);
    return () => clearTimeout(t);
  }, []);

  /* ── Toast (mais recente não lido) ─────────── */
  useEffect(() => {
    const latest = notifs[0];
    if (!latest || latest.read) return;
    if (shownIds.current.has(latest.id)) return;
    shownIds.current.add(latest.id);
    setToast(latest);
    const t = setTimeout(() => setToast(null), 6_000);
    return () => clearTimeout(t);
  }, [notifs]);

  return (
    <>
      {toast && (
        <div
          className="fixed bottom-6 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]"
          style={{ animation: "slide-in-left 0.4s ease-out both" }}
        >
          <div className={`card flex gap-3 p-4 shadow-xl border-l-4 ${toast.color.replace("text-", "border-")} ${toast.bg}`}>
            <div className={`mt-0.5 shrink-0 ${toast.color}`}>{toast.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-navy-800 text-sm leading-snug">{toast.title}</p>
              <p className="mt-0.5 text-xs text-navy-500">{toast.message}</p>
              {toast.action && (
                <Link
                  to={toast.action.to}
                  className={`mt-2 inline-block text-xs font-bold underline ${toast.color}`}
                  onClick={() => setToast(null)}
                >
                  {toast.action.label} →
                </Link>
              )}
            </div>
            <button onClick={() => setToast(null)} className="shrink-0 text-navy-300 hover:text-navy-600">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
