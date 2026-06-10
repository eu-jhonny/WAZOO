/**
 * Sistema de Notificações Inteligentes
 * - Abandono de carrinho
 * - Boas-vindas com horário
 * - Promoções
 * - Dicas
 */
import { useState, useEffect, useCallback } from "react";
import { Bell, X, ShoppingCart, Tag, Zap, PawPrint, Gift, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";

/* ── Tipos ──────────────────────────────────────────── */
interface Notification {
  id: string;
  type: "cart" | "promo" | "tip" | "greeting" | "offer";
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: { label: string; to: string };
  color: string;
  bg: string;
  createdAt: number;
  read: boolean;
}

/* ── Helpers ────────────────────────────────────────── */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function getStoredNotifications(): Notification[] {
  try { return JSON.parse(localStorage.getItem("wazoo_notifs") ?? "[]"); }
  catch { return []; }
}
function saveNotifications(n: Notification[]) {
  localStorage.setItem("wazoo_notifs", JSON.stringify(n.slice(0, 20)));
}
function wasShownRecently(key: string, hours = 4): boolean {
  const ts = localStorage.getItem(`wazoo_notif_ts_${key}`);
  if (!ts) return false;
  return Date.now() - Number(ts) < hours * 60 * 60 * 1000;
}
function markShown(key: string) {
  localStorage.setItem(`wazoo_notif_ts_${key}`, String(Date.now()));
}

/* ── Notificações pré-definidas ─────────────────────── */
const PROMOS: Array<Omit<Notification, "id" | "createdAt" | "read">> = [
  {
    type: "promo",
    icon: <Tag size={18} />,
    title: "10% OFF no primeiro pedido!",
    message: "Use o cupom WAZOO10 e economize na sua primeira compra.",
    action: { label: "Ver produtos", to: "/produtos" },
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    type: "offer",
    icon: <Gift size={18} />,
    title: "Frete grátis acima de R$200",
    message: "Monte seu pedido e ganhe entrega grátis em toda São Paulo.",
    action: { label: "Aproveitar", to: "/produtos" },
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    type: "tip",
    icon: <PawPrint size={18} />,
    title: "Tudo sob encomenda 🐾",
    message: "Buscamos exatamente o que você precisa. Prazo médio de 5-7 dias úteis.",
    action: { label: "Entender como funciona", to: "/como-funciona" },
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    type: "tip",
    icon: <Zap size={18} />,
    title: "Acompanhe seu pedido",
    message: "Crie uma conta para rastrear seus pedidos em tempo real.",
    action: { label: "Criar conta", to: "/registro" },
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

/* ═══════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════ */
export function NotificationSystem() {
  const { items, count } = useCart();
  const [notifications, setNotifications] = useState<Notification[]>(getStoredNotifications);
  const [open, setOpen] = useState(false);

  const addNotif = useCallback((n: Omit<Notification, "id" | "createdAt" | "read">) => {
    const notif: Notification = {
      ...n,
      id: `${Date.now()}-${Math.random()}`,
      createdAt: Date.now(),
      read: false,
    };
    setNotifications((prev) => {
      const updated = [notif, ...prev].slice(0, 20);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  /* ── Boas-vindas ─── */
  useEffect(() => {
    if (wasShownRecently("greeting", 8)) return;
    const t = setTimeout(() => {
      addNotif({
        type: "greeting",
        icon: <PawPrint size={18} />,
        title: `${greeting()}, bem-vindo à Wazoo! 🐾`,
        message: "Encontre tudo para o seu pet sob encomenda, com amor.",
        action: { label: "Ver produtos", to: "/produtos" },
        color: "text-orange-600",
        bg: "bg-orange-50",
      });
      markShown("greeting");
    }, 3000);
    return () => clearTimeout(t);
  }, [addNotif]);

  /* ── Abandono de carrinho ─── */
  useEffect(() => {
    if (count === 0) return;
    if (wasShownRecently("cart_abandon", 1)) return;
    const t = setTimeout(() => {
      if (count === 0) return;
      addNotif({
        type: "cart",
        icon: <ShoppingCart size={18} />,
        title: `Você deixou ${count} ${count === 1 ? "item" : "itens"} no carrinho!`,
        message: "Não esqueça do seu pedido. Finalize antes que acabe!",
        action: { label: "Ver carrinho", to: "/carrinho" },
        color: "text-orange-600",
        bg: "bg-orange-50",
      });
      markShown("cart_abandon");
    }, 4 * 60 * 1000); // 4 minutos
    return () => clearTimeout(t);
  }, [count, addNotif]);

  /* ── Promoção aleatória a cada 15 min ─── */
  useEffect(() => {
    if (wasShownRecently("promo", 4)) return;
    const t = setTimeout(() => {
      const promo = PROMOS[Math.floor(Math.random() * PROMOS.length)];
      addNotif(promo);
      markShown("promo");
    }, 15 * 1000); // 15 segundos após entrar no site
    return () => clearTimeout(t);
  }, [addNotif]);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  };

  const remove = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveNotifications(updated);
      return updated;
    });
  };

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) markAllRead();
  };

  /* ── Toast flutuante para novas notificações ─── */
  const [toast, setToast] = useState<Notification | null>(null);

  useEffect(() => {
    const latest = notifications[0];
    if (!latest || latest.read) return;
    if (open) return;
    setToast(latest);
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [notifications, open]);

  return (
    <>
      {/* ── Toast flutuante ─────────────────────────── */}
      {toast && !open && (
        <div
          className="fixed bottom-24 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] animate-slide-up"
          style={{ animation: "slide-in-left 0.4s ease-out both" }}
        >
          <div className={`card flex gap-3 p-4 shadow-lg border-l-4 ${toast.color.replace("text-", "border-")} ${toast.bg}`}>
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
            <button
              onClick={() => setToast(null)}
              className="shrink-0 text-navy-300 hover:text-navy-600"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Sino ────────────────────────────────────── */}
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-16 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-navy-800 text-white shadow-lg hover:bg-navy-700 transition-colors sm:right-20"
        aria-label="Notificações"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* ── Painel de notificações ───────────────────── */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed bottom-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-cream-200 bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cream-100 bg-navy-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-orange-400" />
                <span className="font-display font-bold text-white text-sm">Notificações</span>
                {unread > 0 && (
                  <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">{unread}</span>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="text-cream-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {/* Lista */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Bell size={28} className="text-cream-300" />
                  <p className="mt-2 text-sm text-navy-400">Nenhuma notificação ainda</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 border-b border-cream-50 p-3 transition-colors ${n.read ? "bg-white" : "bg-orange-50/50"}`}
                  >
                    <div className={`mt-0.5 shrink-0 ${n.color}`}>{n.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-navy-800 text-xs leading-snug">{n.title}</p>
                      <p className="mt-0.5 text-xs text-navy-500 leading-relaxed">{n.message}</p>
                      {n.action && (
                        <Link
                          to={n.action.to}
                          className={`mt-1.5 inline-block text-xs font-bold ${n.color} hover:underline`}
                          onClick={() => setOpen(false)}
                        >
                          {n.action.label} →
                        </Link>
                      )}
                      <p className="mt-1 text-[10px] text-navy-300">
                        <Clock size={9} className="inline mr-0.5" />
                        {new Date(n.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <button onClick={() => remove(n.id)} className="shrink-0 text-navy-200 hover:text-red-400 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-cream-100 p-2 text-center">
                <button
                  onClick={() => { setNotifications([]); saveNotifications([]); }}
                  className="text-xs text-navy-400 hover:text-red-500 font-semibold"
                >
                  Limpar todas
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
