import { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { X, ShoppingCart, User as UserIcon, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import { whatsappLink, defaultContactMessage } from "@/lib/whatsapp";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { img } from "@/config/site";

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  nav: NavItem[];
}

export function MobileMenu({ open, onClose, nav }: MobileMenuProps) {
  const { isLoggedIn, user, logout } = useAuth();
  const { count }   = useCart();
  const { settings } = useStore();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in bg-navy-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Gaveta */}
      <div className="absolute right-0 top-0 flex h-full w-[84%] max-w-sm animate-slide-in-right flex-col bg-white shadow-soft-lg">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <img src={img.logo} alt="Wazoo Pet Express" className="h-9 w-auto" />
          <button
            onClick={onClose}
            className="btn-icon text-navy-500 hover:bg-cream-100"
            aria-label="Fechar menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Links de navegação */}
        <nav className="flex flex-col gap-1 overflow-y-auto px-4 py-5">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `rounded-2xl px-4 py-3 text-base font-bold transition-colors ${
                  isActive
                    ? "bg-orange-500 text-white shadow-glow"
                    : "text-navy-700 hover:bg-orange-50 hover:text-orange-600"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          {/* Carrinho */}
          <Link
            to="/carrinho"
            onClick={onClose}
            className="mt-1 flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold text-navy-700 hover:bg-cream-100"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart size={20} /> Carrinho
            </span>
            {count > 0 && (
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </nav>

        {/* Rodapé da gaveta */}
        <div className="mt-auto space-y-3 border-t border-cream-200 px-5 py-5">
          {isLoggedIn ? (
            <div className="space-y-2">
              <p className="text-center text-sm font-bold text-navy-600">
                Olá, {user?.name.split(" ")[0]}! 🐾
              </p>
              <Link to="/perfil" onClick={onClose} className="btn-secondary w-full">
                <UserIcon size={18} /> Meu Perfil
              </Link>
              <button
                onClick={() => { logout(); onClose(); }}
                className="btn-ghost w-full"
              >
                <LogOut size={18} /> Sair
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link to="/login" onClick={onClose} className="btn-outline">
                <LogIn size={18} /> Entrar
              </Link>
              <Link to="/cadastro" onClick={onClose} className="btn-primary">
                Cadastrar
              </Link>
            </div>
          )}

          <a
            href={whatsappLink(defaultContactMessage, settings.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-green w-full"
          >
            <WhatsAppIcon size={18} /> Falar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
