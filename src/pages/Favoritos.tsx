import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useStore } from "@/context/StoreContext";
import { useCart } from "@/context/CartContext";
import { PageHero } from "@/components/ui/PageHero";
import { ProductGrid } from "@/components/product/ProductGrid";
import { img } from "@/config/site";

export function Favoritos() {
  const { ids, count, clear } = useWishlist();
  const { products } = useStore();
  const { addProduct } = useCart();

  // Mantém a ordem em que foram favoritados e ignora produtos removidos/inativos.
  const list = useMemo(
    () =>
      ids
        .map((id) => products.find((p) => p.id === id && p.active))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    [ids, products],
  );

  const addAll = () => list.forEach((p) => addProduct(p, 1));

  return (
    <>
      <PageHero
        eyebrow="Sua lista"
        title="Meus favoritos ❤️"
        subtitle="Os produtos que você mais amou, guardados em um só lugar. Adicione ao carrinho quando quiser."
        icon={Heart}
        mascot={img.mascot.brincando}
      />

      <div className="container-app py-10 sm:py-14">
        {count === 0 ? (
          <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-dashed border-cream-300 bg-cream-50 px-6 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <Heart size={30} className="text-red-400" />
            </span>
            <p className="mt-4 font-display text-xl font-bold text-navy-700">
              Sua lista está vazia
            </p>
            <p className="mt-1 text-navy-500">
              Toque no coração de qualquer produto para salvá-lo aqui e não perder de vista.
            </p>
            <Link to="/produtos" className="btn-primary mt-6">
              <ShoppingCart size={18} /> Explorar produtos
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-navy-600">
                {count} {count === 1 ? "produto favoritado" : "produtos favoritados"}
              </p>
              <div className="flex gap-2">
                <button onClick={addAll} className="btn-primary btn-sm">
                  <ShoppingCart size={16} /> Adicionar todos ao carrinho
                </button>
                <button
                  onClick={() => {
                    if (confirm("Limpar toda a lista de favoritos?")) clear();
                  }}
                  className="btn-ghost btn-sm border border-cream-200 text-red-500"
                >
                  <Trash2 size={16} /> Limpar
                </button>
              </div>
            </div>
            <ProductGrid products={list} />
          </>
        )}
      </div>
    </>
  );
}
