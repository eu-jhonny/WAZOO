import { GitCompare, Check } from "lucide-react";
import type { Product } from "@/types";
import { useComparison } from "@/context/ComparisonContext";

interface Props {
  product: Product;
  variant?: "overlay" | "inline";
  className?: string;
}

/** Botão de "comparar" reutilizável. */
export function CompareButton({ product, variant = "overlay", className = "" }: Props) {
  const { has, toggle } = useComparison();
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
            ? "border-teal-200 bg-teal-50 text-teal-700"
            : "border-cream-200 bg-white text-navy-600 hover:border-teal-200 hover:text-teal-600"
        } ${className}`}
      >
        {active ? <Check size={18} /> : <GitCompare size={18} />}
        {active ? "Comparando" : "Comparar"}
      </button>
    );
  }

  return (
    <button
      onClick={handle}
      aria-label={active ? "Remover da comparação" : "Comparar produto"}
      aria-pressed={active}
      title="Comparar"
      className={`flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur transition-all ${
        active
          ? "bg-brand-teal text-white hover:brightness-95"
          : "bg-white/90 text-navy-500 hover:bg-white hover:text-brand-teal"
      } ${className}`}
    >
      {active ? <Check size={17} /> : <GitCompare size={16} />}
    </button>
  );
}
