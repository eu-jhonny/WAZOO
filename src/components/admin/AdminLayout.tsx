import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ClipboardList, Star, Settings,
  ExternalLink, LogOut, PawPrint, Mail,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { site } from "@/config/site";
import { ThemeApplier } from "@/components/ui/ThemeApplier";

const NAV = [
  { to: "/admin",               label: "Dashboard",     icon: LayoutDashboard, end: true },
  { to: "/admin/produtos",      label: "Produtos",      icon: Package },
  { to: "/admin/pedidos",       label: "Pedidos",       icon: ClipboardList },
  { to: "/admin/avaliacoes",    label: "Avaliações",    icon: Star },
  { to: "/admin/emails",        label: "E-mails",       icon: Mail },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

/** Layout do painel admin — navegação superior (sem menu lateral). */
export function AdminLayout() {
  const { adminLogout } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    adminLogout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <ThemeApplier />

      {/* ── Top bar (faixa escura) ───────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-900 text-white shadow-lg">
        <div
          className="absolute inset-0 opacity-90"
          style={{ background: "linear-gradient(100deg, #0F172A 0%, #1E293B 60%, #243049 100%)" }}
          aria-hidden
        />
        <div className="pattern-diagonal absolute inset-0 opacity-40" aria-hidden />

        <div className="container-app relative">
          {/* Linha 1: marca + ações */}
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/admin" className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-glow"
                style={{ backgroundColor: "var(--a500)" }}
              >
                <PawPrint size={18} className="text-white" />
              </span>
              <span className="leading-none">
                <span className="block font-display text-base font-bold">Wazoo Admin</span>
                <span className="block text-[11px] text-slate-400">Painel de gestão</span>
              </span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/"
                target="_blank"
                className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white sm:flex"
              >
                <ExternalLink size={15} /> Ver loja
              </Link>
              <span className="hidden text-xs font-semibold text-slate-400 lg:block">
                {site.admin.email}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-bold text-slate-200 transition-colors hover:bg-red-500/90 hover:text-white"
              >
                <LogOut size={15} /> <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>

          {/* Linha 2: navegação em pílulas (rolável no mobile) */}
          <nav className="-mx-1 flex gap-1 overflow-x-auto pb-2.5 no-scrollbar">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                      isActive
                        ? "bg-white text-navy-900 shadow"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <Icon size={16} /> {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── Conteúdo ─────────────────────────────────────────── */}
      <main className="container-app py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
