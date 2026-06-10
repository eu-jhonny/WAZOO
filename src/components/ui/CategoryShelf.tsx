import { useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";

interface CategoryShelfProps {
  title: string;
  emoji?: string;
  viewAllLink?: string;
  products: Product[];
  /** Cor do botão "Ver todos" */
  accentColor?: "orange" | "teal" | "green" | "purple" | "pink";
}

const accentMap = {
  orange: "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-500",
  teal:   "bg-teal-50 text-brand-teal border-teal-200 hover:bg-brand-teal hover:text-white hover:border-brand-teal",
  green:  "bg-green-50 text-green-600 border-green-200 hover:bg-green-500 hover:text-white hover:border-green-500",
  purple: "bg-purple-50 text-brand-purple border-purple-200 hover:bg-brand-purple hover:text-white hover:border-brand-purple",
  pink:   "bg-pink-50 text-brand-pink border-pink-200 hover:bg-brand-pink hover:text-white hover:border-brand-pink",
} as const;

/**
 * Prateleira horizontal de produtos por categoria.
 * Scroll com arrows e drag-to-scroll no touch.
 */
export function CategoryShelf({
  title,
  emoji,
  viewAllLink = "/produtos",
  products,
  accentColor = "orange",
}: CategoryShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  if (!products.length) return null;

  return (
    <div className="py-6 sm:py-8">
      {/* Cabeçalho */}
      <div className="container-app mb-4 flex items-center justify-between gap-4">
        <h3 className="font-display text-2xl font-bold text-navy-700 sm:text-3xl">
          {emoji && <span className="mr-2">{emoji}</span>}
          {title}
        </h3>
        <Link
          to={viewAllLink}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-bold transition-all ${accentMap[accentColor]}`}
        >
          Ver todos <ArrowRight size={15} />
        </Link>
      </div>

      {/* Scroll container */}
      <div className="relative">
        {/* Arrow esquerda */}
        <button
          onClick={() => scroll("left")}
          className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 focus:opacity-100 sm:flex"
          aria-label="Rolar para esquerda"
          onFocus={() => {}} // mantém visível no foco
        >
          <ChevronLeft size={20} className="text-navy-700" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-4 pb-4 pt-1 no-scrollbar sm:px-6 lg:px-8"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[220px] shrink-0 sm:w-[240px]"
              style={{ scrollSnapAlign: "start" }}
            >
              <ProductCard product={product} compact />
            </div>
          ))}

          {/* Card "Ver todos" */}
          <Link
            to={viewAllLink}
            className="flex w-[160px] shrink-0 items-center justify-center rounded-3xl border-2 border-dashed border-cream-300 bg-cream-50 transition-colors hover:border-orange-300 hover:bg-orange-50 sm:w-[180px]"
            style={{ scrollSnapAlign: "start" }}
          >
            <div className="text-center">
              <span className="text-3xl">→</span>
              <p className="mt-2 text-sm font-bold text-navy-500">Ver todos</p>
            </div>
          </Link>
        </div>

        {/* Arrow direita */}
        <button
          onClick={() => scroll("right")}
          className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 focus:opacity-100 sm:flex"
          aria-label="Rolar para direita"
        >
          <ChevronRight size={20} className="text-navy-700" />
        </button>
      </div>
    </div>
  );
}
