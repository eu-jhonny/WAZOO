import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Cat,
  Check,
  Clock,
  Dog,
  Minus,
  PackageCheck,
  PawPrint,
  Plus,
  Ruler,
  ShoppingCart,
  Tag,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useCart } from "@/context/CartContext";
import { formatBRL } from "@/lib/format";
import { getCategoryName } from "@/data/categories";
import { whatsappLink, buildProductMessage } from "@/lib/whatsapp";
import { ProductImage } from "@/components/ui/ProductImage";
import { OnDemandNotice } from "@/components/ui/OnDemandNotice";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { NotFound } from "./NotFound";
import type { Product } from "@/types";

const audienceLabel: Record<Product["audience"], string> = {
  cachorro: "Indicado para cães",
  gato: "Indicado para gatos",
  ambos: "Para cães e gatos",
};
const sizeLabel: Record<Product["size"], string> = {
  pequeno: "Porte pequeno",
  medio: "Porte médio",
  grande: "Porte grande",
  todos: "Todos os portes",
};

export function ProductDetail() {
  const { id } = useParams();
  const { products, getProduct, settings } = useStore();
  const { addProduct } = useCart();

  const product = id ? getProduct(id) : undefined;
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const gallery = useMemo(() => {
    if (!product) return [];
    const list = [product.image, ...(product.gallery ?? [])];
    return list.length > 0 ? list : [""];
  }, [product]);
  const [selected, setSelected] = useState(0);

  const related = useMemo(
    () =>
      product
        ? products
            .filter((p) => p.active && p.category === product.category && p.id !== product.id)
            .slice(0, 4)
        : [],
    [products, product]
  );

  if (!product) return <NotFound />;

  const AudienceIcon = product.audience === "gato" ? Cat : Dog;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-cream-200 bg-cream-50">
        <div className="container-app flex items-center gap-2 py-4 text-sm text-navy-400">
          <Link to="/" className="hover:text-orange-600">Início</Link>
          <span>/</span>
          <Link to="/produtos" className="hover:text-orange-600">Produtos</Link>
          <span>/</span>
          <span className="font-semibold text-navy-600">{product.name}</span>
        </div>
      </div>

      <section className="section">
        <div className="container-app">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Galeria */}
            <div>
              <div className="group overflow-hidden rounded-3xl border border-cream-200 bg-cream-100 shadow-card">
                <div className="aspect-square overflow-hidden">
                  <div className="h-full w-full transition-transform duration-500 group-hover:scale-110">
                    <ProductImage
                      src={gallery[selected]}
                      alt={product.name}
                      category={product.category}
                      iconSize={120}
                    />
                  </div>
                </div>
              </div>
              {gallery.length > 1 && (
                <div className="mt-4 flex gap-3">
                  {gallery.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setSelected(i)}
                      className={`h-20 w-20 overflow-hidden rounded-2xl border-2 transition-all hover:-translate-y-0.5 ${
                        selected === i ? "border-[color:var(--a500)] ring-2 ring-[color:var(--a200)]" : "border-cream-200"
                      }`}
                    >
                      <ProductImage src={src} alt="" category={product.category} iconSize={28} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Informações */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-encomenda">
                  <PawPrint size={13} /> Sob encomenda
                </span>
                <span className="badge-soft">{getCategoryName(product.category)}</span>
                {product.featured && (
                  <span className="badge bg-navy-700 text-white">Destaque</span>
                )}
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold text-navy-700 sm:text-4xl">
                {product.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-1">
                <div>
                  <span className="text-sm font-medium text-navy-400">Preço estimado</span>
                  <p className="price-sale text-4xl">
                    {formatBRL(product.price)}
                  </p>
                </div>
                {product.comparePrice && product.comparePrice > product.price && (
                  <div className="flex items-center gap-2 pb-1">
                    <span className="price-original text-base">{formatBRL(product.comparePrice)}</span>
                    <span className="price-discount-badge">
                      <Tag size={12} /> -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-2xl bg-cream-100 px-3 py-2.5 text-sm font-semibold text-navy-600">
                  <Clock size={18} className="text-orange-500" /> {product.leadTime}
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-cream-100 px-3 py-2.5 text-sm font-semibold text-navy-600">
                  <AudienceIcon size={18} className="text-orange-500" /> {audienceLabel[product.audience]}
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-cream-100 px-3 py-2.5 text-sm font-semibold text-navy-600">
                  <Ruler size={18} className="text-orange-500" /> {sizeLabel[product.size]}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm text-navy-500">
                <PackageCheck size={18} className="text-green-500" />
                Disponibilidade: <strong className="text-navy-700">{product.availability}</strong>
              </div>

              <p className="mt-5 leading-relaxed text-navy-600">{product.description}</p>

              <div className="mt-6">
                <OnDemandNotice />
              </div>

              {/* Observação */}
              <div className="mt-6">
                <label className="label" htmlFor="obs">Observação (opcional)</label>
                <textarea
                  id="obs"
                  className="input min-h-[80px]"
                  placeholder="Ex.: tamanho, cor ou sabor de preferência."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Quantidade + ações */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center justify-between rounded-full border-2 border-cream-200 p-1 sm:w-36">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-navy-600 hover:bg-cream-100"
                    aria-label="Diminuir"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-display text-lg font-bold text-navy-700">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-navy-600 hover:bg-cream-100"
                    aria-label="Aumentar"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  onClick={() => addProduct(product, qty, note || undefined)}
                  className="btn-primary flex-1"
                >
                  <ShoppingCart size={18} /> Adicionar ao carrinho
                </button>
              </div>

              <a
                href={whatsappLink(buildProductMessage(product, note || undefined), settings.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-green mt-3 w-full"
              >
                <WhatsAppIcon size={18} /> Pedir pelo WhatsApp
              </a>

              <Link to="/produtos" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-navy-500 hover:text-orange-600">
                <ArrowLeft size={16} /> Voltar para o catálogo
              </Link>
            </div>
          </div>

          {/* Relacionados */}
          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="section-title">Você também pode gostar</h2>
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((p, i) => (
                  <Reveal key={p.id} delay={i * 60}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
