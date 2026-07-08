import { useMemo } from "react";
import { Link } from "react-router-dom";
import { GitCompare, ShoppingCart, Trash2, X, Check } from "lucide-react";
import { useComparison } from "@/context/ComparisonContext";
import { useStore } from "@/context/StoreContext";
import { useCart } from "@/context/CartContext";
import { formatBRL } from "@/lib/format";
import { getCategoryName } from "@/data/categories";
import { PageHero } from "@/components/ui/PageHero";
import { ProductImage } from "@/components/ui/ProductImage";
import { img } from "@/config/site";
import type { Product } from "@/types";

const audienceLabel: Record<Product["audience"], string> = {
  cachorro: "Cães", gato: "Gatos", ambos: "Cães e gatos",
};
const sizeLabel: Record<Product["size"], string> = {
  pequeno: "Pequeno", medio: "Médio", grande: "Grande", todos: "Todos",
};

export function Comparar() {
  const { ids, remove, clear } = useComparison();
  const { products } = useStore();
  const { addProduct } = useCart();

  const list = useMemo(
    () =>
      ids
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    [ids, products],
  );

  // Menor preço entre os comparados (para destacar).
  const minPrice = list.length ? Math.min(...list.map((p) => p.price)) : 0;

  const rows: { label: string; render: (p: Product) => React.ReactNode }[] = [
    { label: "Preço estimado", render: (p) => (
      <span className={`font-display text-lg font-bold ${p.price === minPrice ? "text-green-600" : "text-orange-600"}`}>
        {formatBRL(p.price)}
        {p.price === minPrice && list.length > 1 && (
          <span className="ml-1 align-middle text-[10px] font-bold text-green-600">menor 🏆</span>
        )}
      </span>
    ) },
    { label: "Preço \"de\"", render: (p) => p.comparePrice ? <span className="text-navy-400 line-through">{formatBRL(p.comparePrice)}</span> : <span className="text-cream-300">—</span> },
    { label: "Categoria", render: (p) => getCategoryName(p.category) },
    { label: "Indicado para", render: (p) => audienceLabel[p.audience] },
    { label: "Porte", render: (p) => sizeLabel[p.size] },
    { label: "Prazo médio", render: (p) => p.leadTime },
    { label: "Disponibilidade", render: (p) => p.availability },
    { label: "Destaque", render: (p) => p.featured ? <Check size={18} className="mx-auto text-green-500" /> : <X size={16} className="mx-auto text-cream-300" /> },
  ];

  return (
    <>
      <PageHero
        eyebrow="Decisão fácil"
        title="Comparar produtos ⚖️"
        subtitle="Veja lado a lado preço, prazo e características para escolher o melhor para o seu pet."
        icon={GitCompare}
        mascot={img.mascot.trabalhando}
      />

      <div className="container-app py-10 sm:py-14">
        {list.length === 0 ? (
          <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-dashed border-cream-300 bg-cream-50 px-6 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
              <GitCompare size={30} className="text-brand-teal" />
            </span>
            <p className="mt-4 font-display text-xl font-bold text-navy-700">Nada para comparar ainda</p>
            <p className="mt-1 text-navy-500">
              Nos produtos, toque no ícone <GitCompare size={14} className="inline text-brand-teal" /> para adicionar até 4 itens à comparação.
            </p>
            <Link to="/produtos" className="btn-primary mt-6"><ShoppingCart size={18} /> Ver produtos</Link>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <button onClick={clear} className="btn-ghost btn-sm border border-cream-200 text-red-500">
                <Trash2 size={16} /> Limpar comparação
              </button>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-cream-200 bg-white shadow-card">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 w-32 bg-cream-50 p-4 text-left align-bottom" />
                    {list.map((p) => (
                      <th key={p.id} className="min-w-[180px] border-l border-cream-100 p-4 align-top">
                        <div className="relative">
                          <button
                            onClick={() => remove(p.id)}
                            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-cream-100 text-navy-400 hover:bg-red-50 hover:text-red-500"
                            aria-label="Remover"
                          >
                            <X size={14} />
                          </button>
                          <Link to={`/produtos/${p.id}`} className="block">
                            <div className="mx-auto h-24 w-24 overflow-hidden rounded-2xl bg-cream-100">
                              <ProductImage src={p.image} alt={p.name} category={p.category} iconSize={36} />
                            </div>
                            <p className="mt-2 line-clamp-2 text-center font-display font-bold text-navy-700 hover:text-orange-600">
                              {p.name}
                            </p>
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={row.label} className={ri % 2 ? "bg-cream-50/60" : ""}>
                      <td className="sticky left-0 z-10 bg-inherit p-4 text-left font-bold text-navy-500">{row.label}</td>
                      {list.map((p) => (
                        <td key={p.id} className="border-l border-cream-100 p-4 text-center text-navy-700">
                          {row.render(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="sticky left-0 z-10 bg-white p-4" />
                    {list.map((p) => (
                      <td key={p.id} className="border-l border-cream-100 p-4 text-center">
                        <button onClick={() => addProduct(p, 1)} className="btn-primary btn-sm w-full">
                          <ShoppingCart size={15} /> Adicionar
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
