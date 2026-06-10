import { Link, NavLink } from "react-router-dom";
import {
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  Package,
  Settings,
  Star,
  X,
  PawPrint,
} from "lucide-react";

const items = [
  { to: "/admin",               label: "Dashboard",     icon: LayoutDashboard, end: true },
  { to: "/admin/produtos",      label: "Produtos",      icon: Package },
  { to: "/admin/pedidos",       label: "Pedidos",       icon: ClipboardList },
  { to: "/admin/avaliacoes",    label: "Avaliações",    icon: Star },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)" }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 shadow-glow">
              <PawPrint size={16} className="text-white" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-white leading-none">Wazoo Admin</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Painel de gestão</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <p className="px-3 pt-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Menu
          </p>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-orange-500 text-white shadow-glow"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/8 p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-400 transition-all hover:bg-white/8 hover:text-white"
          >
            <ExternalLink size={18} /> Ver loja
          </Link>
        </div>
      </aside>
    </>
  );
}
