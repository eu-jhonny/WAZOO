import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Cat, Dog, PawPrint, Search, SlidersHorizontal, X } from "lucide-react";
import { img } from "@/config/site";
import { useStore } from "@/context/StoreContext";
import { productCategories } from "@/data/categories";
import { formatBRL } from "@/lib/format";
import { PageHero } from "@/components/ui/PageHero";
import { ProductGrid } from "@/components/product/ProductGrid";

type SortKey = "recentes" | "menor" | "maior" | "az";

export function Products() {
  const { products } = useStore();
  const [params, setParams] = useSearchParams();

  const active = useMemo(() => products.filter((p) => p.active), [products]);
  const maxPriceAvailable = useMemo(
    () => Math.ceil(Math.max(100, ...active.map((p) => p.price)) / 10) * 10,
    [active]
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(params.get("cat") ?? "todos");
  const [pet, setPet] = useState(params.get("pet") ?? "todos");
  const [sort, setSort] = useState<SortKey>("recentes");
  const [maxPrice, setMaxPrice] = useState(maxPriceAvailable);

  // Mantém os filtros sincronizados com a URL (links de categoria/pet)
  useEffect(() => {
    setCategory(params.get("cat") ?? "todos");
    setPet(params.get("pet") ?? "todos");
  }, [params]);

  useEffect(() => setMaxPrice(maxPriceAvailable), [maxPriceAvailable]);

  const updateParam = (key: "cat" | "pet", value: string) => {
    const next = new URLSearchParams(params);
    if (value === "todos") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    let list = active.filter((p) => {
      if (category !== "todos" && p.category !== category) return false;
      if (pet !== "todos" && p.audience !== pet && p.audience !== "ambos") return false;
      if (p.price > maxPrice) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.shortDescription.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "menor": return a.price - b.price;
        case "maior": return b.price - a.price;
        case "az": return a.name.localeCompare(b.name);
        default: return b.createdAt - a.createdAt;
      }
    });
    return list;
  }, [active, category, pet, maxPrice, search, sort]);

  const hasFilters =
    category !== "todos" || pet !== "todos" || search !== "" || maxPrice !== maxPriceAvailable;

  const clearFilters = () => {
    setSearch("");
    setSort("recentes");
    setMaxPrice(maxPriceAvailable);
    setParams({}, { replace: true });
  };

  return (
    <div>
      <PageHero
        variant="cream"
        eyebrow="Catálogo"
        icon={PawPrint}
        title="Nossos produtos"
        subtitle="Tudo para cães e gatos, sob encomenda. Use os filtros e encontre o ideal para o seu pet."
        mascot={img.mascot.comendo}
      />

      <section className="section">
        <div className="container-app">
          {/* Barra de filtros */}
          <div className="card mb-8 p-4 sm:p-5">
            <div className="flex flex-col gap-4">
              {/* Busca + ordenação */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300" size={18} />
                  <input
                    type="search"
                    className="input pl-11"
                    placeholder="Buscar produto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={18} className="shrink-0 text-navy-400" />
                  <select
                    className="input sm:w-52"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    aria-label="Ordenar"
                  >
                    <option value="recentes">Mais recentes</option>
                    <option value="menor">Menor preço</option>
                    <option value="maior">Maior preço</option>
                    <option value="az">Nome (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Chips de categoria */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => updateParam("cat", "todos")}
                  className={`chip shrink-0 ${category === "todos" ? "chip-active" : ""}`}
                >
                  Todos
                </button>
                {productCategories.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => updateParam("cat", c.slug)}
                    className={`chip shrink-0 ${category === c.slug ? "chip-active" : ""}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Pet + faixa de preço */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  {[
                    { value: "todos", label: "Todos", icon: PawPrint },
                    { value: "cachorro", label: "Cães", icon: Dog },
                    { value: "gato", label: "Gatos", icon: Cat },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => updateParam("pet", opt.value)}
                        className={`chip ${pet === opt.value ? "chip-active" : ""}`}
                      >
                        <Icon size={15} /> {opt.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3">
                  <span className="whitespace-nowrap text-sm font-bold text-navy-600">
                    Até {formatBRL(maxPrice)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={maxPriceAvailable}
                    step={10}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="h-2 w-40 cursor-pointer appearance-none rounded-full bg-cream-200 accent-orange-500"
                    aria-label="Preço máximo"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Resultado */}
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm font-semibold text-navy-500">
              {filtered.length} {filtered.length === 1 ? "produto" : "produtos"}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-ghost btn-sm">
                <X size={16} /> Limpar filtros
              </button>
            )}
          </div>

          <ProductGrid products={filtered} />
        </div>
      </section>
    </div>
  );
}
