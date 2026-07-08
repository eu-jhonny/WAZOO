import { Heart } from "lucide-react";
import type { Product } from "@/types";
import { useWishlist } from "@/context/WishlistContext";

interface Props {
  product: Product;
  /** "overlay" = botão flutuante sobre a imagem; "inline" = botão com texto. */
  variant?: "overlay" | "inline";
  className?: string;
}

/** Botão de favoritar (coração) reutilizável. */
export function WishlistButton({ product, variant = "overlay", className = "" }: Props) {
  const { has, toggle } = useWishlist();
  const active = has(product.id);

  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
  };

  if (variant === "inline") {
    return (
      <button
        onClick={handle}
        aria-pressed={active}
        className={`btn-sm inline-flex items-center gap-2 border-2 transition-all ${
          active
            ? "border-red-200 bg-red-50 text-red-600"
            : "border-cream-200 bg-white text-navy-600 hover:border-red-200 hover:text-red-500"
        } ${className}`}
      >
        <Heart size={18} className={active ? "fill-red-500 text-red-500" : ""} />
        {active ? "Nos favoritos" : "Favoritar"}
      </button>
    );
  }

  return (
    <button
      onClick={handle}
      aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={active}
      className={`flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur transition-all ${
        active
          ? "bg-red-500 text-white hover:bg-red-600"
          : "bg-white/90 text-navy-500 hover:bg-white hover:text-red-500"
      } ${className}`}
    >
      <Heart size={17} className={active ? "fill-white" : ""} />
    </button>
  );
}
