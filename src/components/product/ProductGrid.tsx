import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { Reveal } from "../ui/Reveal";
import { img } from "@/config/site";

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

export function ProductGrid({ products, emptyMessage }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-cream-300 bg-cream-50 px-6 py-16 text-center">
        <img src={img.mascot.dormindo} alt="Mascote dormindo" className="h-40 w-auto opacity-90" />
        <p className="mt-4 font-display text-xl font-bold text-navy-700">
          Nenhum produto encontrado
        </p>
        <p className="mt-1 max-w-sm text-navy-500">
          {emptyMessage ?? "Tente ajustar os filtros ou a busca para encontrar o que seu pet precisa."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, i) => (
        <Reveal key={product.id} delay={(i % 4) * 60}>
          <ProductCard product={product} />
        </Reveal>
      ))}
    </div>
  );
}
