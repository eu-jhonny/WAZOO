import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { site } from "@/config/site";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout() {
  const [open, setOpen]     = useState(false);
  const { adminLogout }     = useAuth();
  const navigate            = useNavigate();

  const logout = () => {
    adminLogout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <AdminSidebar open={open} onClose={() => setOpen(false)} />

      {/* Conteúdo principal */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-cream-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cream-100 text-navy-700 hover:bg-cream-200 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={18} />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs font-semibold text-navy-500 sm:block">
              {site.admin.email}
            </span>
            <div className="h-4 w-px bg-cream-200 hidden sm:block" />
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold text-navy-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={15} /> Sair
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
