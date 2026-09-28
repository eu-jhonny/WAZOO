import { Link } from "react-router-dom";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import { img } from "@/config/site";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { formatBRL } from "@/lib/format";
import { ProductImage } from "@/components/ui/ProductImage";

export function Cart() {
  const {
    items, note, total, count, lineId,
    setNote, updateQuantity, removeItem, updateItemNote, clear,
  } = useCart();
  const { isLoggedIn } = useAuth();
  const { settings } = useStore();
  const freeShippingThreshold = Math.max(0, settings.freeShippingThreshold || 0);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - total);
  const freeShippingProgress = freeShippingThreshold > 0
    ? Math.min(100, (total / freeShippingThreshold) * 100)
    : 0;

  /* ─── Carrinho vazio ──────────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <div className="section bg-cream-50">
        <div className="container-app">
          <div className="mx-auto flex max-w-sm flex-col items-center rounded-2xl border border-dashed border-cream-200 bg-white px-8 py-16 text-center shadow-card">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-100">
              <ShoppingCart size={36} className="text-orange-500" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-bold text-navy-800">
              Carrinho vazio
            </h1>
            <p className="mt-2 text-navy-500">
              Adicione produtos para começar sua compra.
            </p>
            <Link to="/produtos" className="btn-primary mt-6">
              <ShoppingBag size={18} /> Ver produtos
            </Link>
            <img src={img.mascot.dormindo} alt="" className="mt-6 h-28 w-auto opacity-60" />
          </div>
        </div>
      </div>
    );
  }

  /* ─── Carrinho com itens ─────────────────────────────────────── */
  return (
    <div className="section bg-cream-50">
      <div className="container-app">

        {/* Título */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-navy-800">Carrinho</h1>
            <p className="mt-1 text-sm text-navy-500">
              {count} {count === 1 ? "item" : "itens"} no carrinho
            </p>
          </div>
          <button
            onClick={clear}
            className="flex items-center gap-1.5 text-sm font-semibold text-navy-400 transition-colors hover:text-red-500"
          >
            <Trash2 size={15} /> Esvaziar
          </button>
        </div>

        {freeShippingThreshold > 0 && (
          <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-bold text-navy-700">
                <Truck size={17} className="text-teal-600" />
                {remainingForFreeShipping > 0
                  ? <>Faltam <strong className="text-teal-700">{formatBRL(remainingForFreeShipping)}</strong> para frete grátis</>
                  : <>Você ganhou <strong className="text-teal-700">frete grátis</strong> 🎉</>}
              </span>
              <span className="text-xs font-semibold text-navy-400">
                acima de {formatBRL(freeShippingThreshold)}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-teal-500 transition-all duration-500"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* ── Itens ───────────────────────────────────────────── */}
          <div className="space-y-3 lg:col-span-2">
            {items.map((item) => {
              const id = lineId(item);
              return (
              <div
                key={id}
                className="card flex gap-4 p-4"
              >
                {/* Imagem */}
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    category={item.category}
                    iconSize={32}
                  />
                </div>

                <div className="flex flex-1 min-w-0 flex-col gap-3">
                  {/* Nome + remover */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display font-bold leading-tight text-navy-800 line-clamp-2">
                        {item.name}
                      </h3>
                      {item.variant && (
                        <p className="mt-0.5 text-xs font-semibold text-teal-600">{item.variant}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(id)}
                      className="shrink-0 rounded-lg p-1.5 text-navy-300 transition-colors hover:bg-red-50 hover:text-red-500"
                      aria-label="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Qty + preço */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Seletor de quantidade */}
                    <div className="flex items-center gap-1 rounded-xl border border-cream-200 bg-cream-50 p-1">
                      <button
                        onClick={() => updateQuantity(id, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-navy-600 transition-colors hover:bg-white"
                        aria-label="Diminuir"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-navy-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(id, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-navy-600 transition-colors hover:bg-white"
                        aria-label="Aumentar"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Preço */}
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-orange-600">
                        {formatBRL(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-navy-400">
                          {formatBRL(item.price)} cada
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Observação do item */}
                  <input
                    className="input py-2 text-xs"
                    placeholder="Observação deste item (opcional)"
                    value={item.note ?? ""}
                    onChange={(e) => updateItemNote(id, e.target.value)}
                  />
                </div>
              </div>
              );
            })}

            <Link
              to="/produtos"
              className="flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700"
            >
              <ShoppingBag size={16} /> Continuar comprando
            </Link>
          </div>

          {/* ── Resumo / sidebar ────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="card sticky top-20 divide-y divide-cream-100 overflow-hidden">

              {/* Header */}
              <div className="bg-navy-800 px-5 py-4">
                <h2 className="font-display font-bold text-white">Resumo do pedido</h2>
              </div>

              {/* Observação geral */}
              <div className="p-5">
                <label className="label">Observação geral</label>
                <textarea
                  className="input min-h-[72px] text-sm"
                  placeholder="Alguma observação para este pedido?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Totais */}
              <div className="px-5 py-4 space-y-2">
                <div className="flex justify-between text-sm text-navy-500">
                  <span>Subtotal ({count} {count === 1 ? "item" : "itens"})</span>
                  <span className="font-semibold text-navy-700">{formatBRL(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-navy-500">
                  <span>Frete</span>
                  <span className="font-semibold text-navy-500">Calculado no checkout</span>
                </div>
                <div className="flex items-center justify-between border-t border-cream-200 pt-3">
                  <span className="font-display font-bold text-navy-800">Subtotal</span>
                  <span className="font-display text-2xl font-bold text-orange-600">
                    {formatBRL(total)}
                  </span>
                </div>
              </div>

              {/* Botão principal */}
              <div className="px-5 pb-5 space-y-2">
                <Link to="/checkout" className="btn-primary w-full flex items-center justify-center gap-2">
                  Ir para o checkout <ArrowRight size={16} />
                </Link>

                {!isLoggedIn && (
                  <p className="pt-1 text-center text-xs text-navy-400">
                    <Link to="/login" className="link-underline">Entre na sua conta</Link> para
                    acompanhar o status do pedido.
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
