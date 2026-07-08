import { Link } from "react-router-dom";
import { GitCompare, X } from "lucide-react";
import { useComparison } from "@/context/ComparisonContext";
import { useStore } from "@/context/StoreContext";
import { ProductImage } from "./ProductImage";

/**
 * Barra flutuante de comparação — aparece no rodapé quando há produtos
 * selecionados para comparar.
 */
export function ComparisonBar() {
  const { ids, count, remove, clear } = useComparison();
  const { products } = useStore();

  if (count === 0) return null;

  const items = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] animate-slide-in-right">
      <div className="container-app pb-3 sm:pb-4">
        <div className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white/95 p-3 shadow-soft-lg backdrop-blur">
          <span className="hidden shrink-0 items-center gap-2 px-2 font-display font-bold text-navy-700 sm:flex">
            <GitCompare size={18} className="text-brand-teal" /> Comparar
          </span>

          <div className="flex flex-1 gap-2 overflow-x-auto no-scrollbar">
            {items.map((p) => (
              <div key={p.id} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-cream-200 bg-cream-100">
                <ProductImage src={p.image} alt={p.name} category={p.category} iconSize={22} />
                <button
                  onClick={() => remove(p.id)}
                  className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-navy-900/70 text-white"
                  aria-label={`Remover ${p.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 2 - count) }).map((_, i) => (
              <div key={`ph-${i}`} className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-cream-200 text-cream-300 sm:flex">
                <GitCompare size={16} />
              </div>
            ))}
          </div>

          <button onClick={clear} className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-navy-400 hover:text-red-500">
            Limpar
          </button>
          <Link
            to="/comparar"
            className={`btn-primary btn-sm shrink-0 ${count < 2 ? "pointer-events-none opacity-50" : ""}`}
          >
            Comparar ({count})
          </Link>
        </div>
      </div>
    </div>
  );
}
