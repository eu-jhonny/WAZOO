import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, Menu, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { site } from "@/config/site";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { adminLogout } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    adminLogout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <AdminSidebar open={open} onClose={() => setOpen(false)} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-cream-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cream-100 text-navy-700 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 font-display font-bold text-navy-700">
              <ShieldCheck size={20} className="text-orange-500" />
              Painel do Gestor
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="badge-navy hidden sm:inline-flex">{site.admin.email}</span>
            <button onClick={logout} className="btn-ghost btn-sm text-navy-500 hover:text-red-500">
              <LogOut size={16} /> Sair
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
