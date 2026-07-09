import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Search, Heart, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { SearchOverlay } from "../ui/SearchOverlay";

/**
 * Barra de navegação inferior — só no mobile/tablet (escondida em lg+).
 * Dá acesso rápido às ações principais e desafoga o cabeçalho.
 */
export function MobileBottomNav() {
  const { count } = useCart();
  const { count: wish } = useWishlist();
  const { isLoggedIn } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-bold transition-colors ${
      isActive ? "text-orange-600" : "text-navy-400"
    }`;

  const Badge = ({ n, color }: { n: number; color: string }) =>
    n > 0 ? (
      <span className={`absolute right-[22%] top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ${color}`}>
        {n > 9 ? "9+" : n}
      </span>
    ) : null;

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-white/95 shadow-[0_-4px_20px_-8px_rgba(15,23,42,0.15)] backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Navegação principal"
      >
        <div className="grid grid-cols-5">
          <NavLink to="/" end className={linkClass}>
            <Home size={22} /> Início
          </NavLink>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-bold text-navy-400 transition-colors hover:text-orange-600"
          >
            <Search size={22} /> Buscar
          </button>

          <NavLink to="/favoritos" className={linkClass}>
            <Heart size={22} /> <Badge n={wish} color="bg-red-500" /> Favoritos
          </NavLink>

          <NavLink to="/carrinho" className={linkClass}>
            <ShoppingCart size={22} /> <Badge n={count} color="bg-orange-500" /> Carrinho
          </NavLink>

          <NavLink to={isLoggedIn ? "/perfil" : "/login"} className={linkClass}>
            <User size={22} /> {isLoggedIn ? "Perfil" : "Entrar"}
          </NavLink>
        </div>
      </nav>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
