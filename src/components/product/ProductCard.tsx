import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Clock, PawPrint, ShoppingCart, Tag } from "lucide-react";
import type { Product } from "@/types";
import { formatBRL } from "@/lib/format";
import { getCategoryName } from "@/data/categories";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import { whatsappLink, buildProductMessage } from "@/lib/whatsapp";
import { ProductImage } from "../ui/ProductImage";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { WishlistButton } from "../ui/WishlistButton";
import { CompareButton } from "../ui/CompareButton";

const audienceLabel: Record<Product["audience"], string> = {
  cachorro: "Para cães",
  gato: "Para gatos",
  ambos: "Cães e gatos",
};

function calcDiscount(price: number, compare?: number): number | null {
  if (!compare || compare <= price) return null;
  return Math.round(((compare - price) / compare) * 100);
}

interface Props {
  product: Product;
  /** Modo compacto para prateleiras horizontais */
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: Props) {
  const { addProduct } = useCart();
  const { settings } = useStore();
  const discount = calcDiscount(product.price, product.comparePrice);
  const promoTag = product.promoLabel ?? (discount ? `-${discount}%` : null);

  const [added, setAdded] = useState(false);
  const handleAdd = (qty = 1) => {
    addProduct(product, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  if (compact) {
    return (
      <div className="card card-hover group flex flex-col overflow-hidden h-full">
        <Link
          to={`/produtos/${product.id}`}
          className="relative block aspect-square overflow-hidden bg-cream-100"
        >
          <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
            <ProductImage src={product.image} alt={product.name} category={product.category} iconSize={48} />
          </div>
          {promoTag && (
            <span className="badge absolute left-2 top-2 bg-red-500 text-white shadow-sm animate-pulse-scale text-[10px]">
              <Tag size={10} /> {promoTag}
            </span>
          )}
          <WishlistButton product={product} className="absolute right-2 top-2 h-8 w-8" />
        </Link>
        <div className="flex flex-1 flex-col p-3">
          <h3 className="line-clamp-2 text-sm font-bold text-navy-700 leading-snug">
            <Link to={`/produtos/${product.id}`} className="hover:text-orange-600 transition-colors">
              {product.name}
            </Link>
          </h3>
          <div className="mt-auto pt-2">
            {product.comparePrice && (
              <span className="text-xs text-navy-400 line-through">{formatBRL(product.comparePrice)}</span>
            )}
            <p className="font-display text-base font-bold text-orange-600">{formatBRL(product.price)}</p>
          </div>
          <button
            onClick={() => handleAdd()}
            className={`btn-sm mt-2 w-full text-xs transition-all ${added ? "btn-green" : "btn-primary"}`}
          >
            {added ? <><Check size={14} /> Adicionado!</> : <><ShoppingCart size={14} /> Adicionar</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-hover group flex flex-col overflow-hidden">
      <Link
        to={`/produtos/${product.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-cream-100"
      >
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
          <ProductImage src={product.image} alt={product.name} category={product.category} />
        </div>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          <span className="badge-encomenda shadow-sm backdrop-blur">
            <PawPrint size={13} /> Sob encomenda
          </span>
          {promoTag && (
            <span className="badge bg-red-500 text-white shadow-sm animate-pulse-scale">
              <Tag size={12} /> {promoTag}
            </span>
          )}
          {product.featured && (
            <span className="badge bg-navy-700 text-white shadow-sm">Destaque ⭐</span>
          )}
        </div>

        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          <WishlistButton product={product} />
          <CompareButton product={product} />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-navy-400">
          <span>{getCategoryName(product.category)}</span>
          <span className="text-cream-300">•</span>
          <span>{audienceLabel[product.audience]}</span>
        </div>

        <h3 className="mt-1.5 font-display text-lg font-bold leading-snug text-navy-700">
          <Link to={`/produtos/${product.id}`} className="transition-colors hover:text-orange-600">
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 line-clamp-2 text-sm text-navy-500">{product.shortDescription}</p>

        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-navy-500">
          <Clock size={14} className="text-orange-500" />
          {product.leadTime}
        </div>

        <div className="mt-3">
          <span className="text-xs font-medium text-navy-400">Preço estimado</span>
          <div className="flex items-baseline gap-2">
            <p className="font-display text-2xl font-bold text-orange-600">
              {formatBRL(product.price)}
            </p>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-sm text-navy-400 line-through">{formatBRL(product.comparePrice)}</span>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => handleAdd()}
            className={`btn-sm flex-1 transition-all ${added ? "btn-green" : "btn-primary"}`}
          >
            {added ? <><Check size={16} /> Adicionado!</> : <><ShoppingCart size={16} /> Adicionar</>}
          </button>
          <a
            href={whatsappLink(buildProductMessage(product), settings.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-green btn-sm inline-flex h-auto w-11 shrink-0 items-center justify-center px-0"
            aria-label={`Pedir ${product.name} no WhatsApp`}
          >
            <WhatsAppIcon size={18} />
          </a>
        </div>

        <Link to={`/produtos/${product.id}`} className="mt-2.5 text-center text-sm link-underline">
          Ver detalhes
        </Link>
      </div>
    </div>
  );
}
