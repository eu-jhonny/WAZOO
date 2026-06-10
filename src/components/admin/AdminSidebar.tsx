import { Link, NavLink } from "react-router-dom";
import {
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  Package,
  Settings,
  Star,
  X,
} from "lucide-react";
import { img } from "@/config/site";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-navy-900/50 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col bg-navy-700 text-cream-100 transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-2">
            <img src={img.logo} alt="Wazoo" className="h-8 w-auto" />
            <span className="font-display font-bold text-white">Gestor</span>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-cream-100/70 hover:bg-white/10 lg:hidden" aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
                  isActive ? "bg-orange-500 text-white shadow-soft" : "text-cream-100/80 hover:bg-white/10"
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-cream-100/80 transition-colors hover:bg-white/10"
          >
            <ExternalLink size={20} /> Ver site
          </Link>
        </div>
      </aside>
    </>
  );
}
