import { useEffect, useMemo, useState } from "react";
import { History } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { getRecentlyViewed } from "@/lib/recentlyViewed";
import { ProductCard } from "./ProductCard";

interface Props {
  /** Não mostra este produto na lista (ex.: o que está aberto agora). */
  excludeId?: string;
  title?: string;
}

/** Prateleira "Vistos recentemente" — rola horizontalmente. */
export function RecentlyViewed({ excludeId, title = "Vistos recentemente" }: Props) {
  const { products } = useStore();
  const [ids, setIds] = useState<string[]>(() => getRecentlyViewed());

  useEffect(() => {
    const refresh = () => setIds(getRecentlyViewed());
    window.addEventListener("wazoo:recently-viewed", refresh);
    return () => window.removeEventListener("wazoo:recently-viewed", refresh);
  }, []);

  const list = useMemo(
    () =>
      ids
        .filter((id) => id !== excludeId)
        .map((id) => products.find((p) => p.id === id && p.active))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .slice(0, 8),
    [ids, products, excludeId],
  );

  if (list.length === 0) return null;

  return (
    <div className="mt-16">
      <h2 className="section-title flex items-center gap-2">
        <History size={22} className="text-orange-500" /> {title}
      </h2>
      <div className="-mx-4 mt-8 flex gap-5 overflow-x-auto px-4 pb-4 no-scrollbar sm:mx-0 sm:px-0">
        {list.map((p) => (
          <div key={p.id} className="w-44 shrink-0 sm:w-52">
            <ProductCard product={p} compact />
          </div>
        ))}
      </div>
    </div>
  );
}
