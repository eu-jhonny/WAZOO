import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, ShoppingCart, User as UserIcon } from "lucide-react";
import { img } from "@/config/site";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { MobileMenu } from "./MobileMenu";

const navItems = [
  { to: "/",             label: "Início",         end: true },
  { to: "/cachorros",    label: "🐕 Cães"                   },
  { to: "/gatos",        label: "🐈 Gatos"                  },
  { to: "/produtos",     label: "Produtos"                  },
  { to: "/kits",         label: "Kits"                      },
  { to: "/como-funciona",label: "Como funciona"             },
  { to: "/avaliacoes",   label: "Avaliações"                },
];

export function Header() {
  const [scrolled, setScrolled]  = useState(false);
  const [menuOpen, setMenuOpen]  = useState(false);
  const { count }                = useCart();
  const { isLoggedIn, user }     = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 shadow-soft backdrop-blur"
          : "bg-white border-b border-cream-200/60"
      }`}
    >
      <div className="container-app flex h-16 items-center justify-between gap-4 sm:h-20">

        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center" aria-label="Página inicial">
          <img
            src={img.logo}
            alt="Wazoo Pet Express"
            className="h-10 w-auto sm:h-12"
          />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-orange-500 text-white shadow-glow"
                    : "text-navy-600 hover:bg-orange-50 hover:text-orange-600"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Ações da direita */}
        <div className="flex items-center gap-2">

          {/* Perfil / Entrar */}
          <Link
            to={isLoggedIn ? "/perfil" : "/login"}
            className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-navy-600 transition-colors hover:bg-cream-100 hover:text-orange-600 sm:flex"
          >
            <UserIcon size={20} />
            <span className="hidden xl:inline">
              {isLoggedIn ? user?.name.split(" ")[0] : "Entrar"}
            </span>
          </Link>

          {/* Carrinho */}
          <Link
            to="/carrinho"
            className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full transition-all ${
              count > 0
                ? "bg-orange-500 text-white shadow-glow hover:bg-orange-600"
                : "bg-cream-100 text-navy-700 hover:bg-cream-200"
            }`}
            aria-label="Carrinho"
          >
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-navy-700 px-1 text-xs font-bold text-white shadow">
                {count}
              </span>
            )}
          </Link>

          {/* Botão mobile menu */}
          <button
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cream-100 text-navy-700 transition-colors hover:bg-cream-200 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} nav={navItems} />
    </header>
  );
}
