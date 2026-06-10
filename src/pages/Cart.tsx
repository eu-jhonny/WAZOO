import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Info,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Trash2,
} from "lucide-react";
import { img } from "@/config/site";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { formatBRL } from "@/lib/format";
import { whatsappLink, buildCartMessage } from "@/lib/whatsapp";
import { ProductImage } from "@/components/ui/ProductImage";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

export function Cart() {
  const {
    items, note, total, count,
    setNote, updateQuantity, removeItem, updateItemNote, clear,
  } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { settings, addOrder } = useStore();
  const { showToast }          = useToast();
  const navigate               = useNavigate();

  const petName = user?.pets[0]?.name;

  const sendOrder = () => {
    if (items.length === 0) return;
    const message = buildCartMessage({ items, total, customerName: user?.name, petName, observation: note || undefined });
    addOrder({
      userId:       user?.id,
      customerName: user?.name ?? "Cliente via site",
      customerPhone: user?.phone ?? "",
      petName,
      fulfillment:  user?.preference ?? "entrega",
      items: items.map((i) => ({
        name:     `${i.name}${i.kind === "kit" ? " (Kit)" : ""}`,
        quantity: i.quantity,
        price:    i.price,
        note:     i.note,
      })),
      total,
      note: note || undefined,
    });
    window.open(whatsappLink(message, settings.whatsapp), "_blank", "noopener");
    clear();
    showToast("Pedido enviado com sucesso! 🎉", "success");
    navigate(isLoggedIn ? "/pedidos" : "/");
  };

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
              Adicione produtos para fazer seu pedido.
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
              {count} {count === 1 ? "item" : "itens"} · sob encomenda
            </p>
          </div>
          <button
            onClick={clear}
            className="flex items-center gap-1.5 text-sm font-semibold text-navy-400 transition-colors hover:text-red-500"
          >
            <Trash2 size={15} /> Esvaziar
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* ── Itens ───────────────────────────────────────────── */}
          <div className="space-y-3 lg:col-span-2">
            {items.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
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
                      <span className="badge-encomenda mt-1">
                        <Tag size={10} /> Sob encomenda
                      </span>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
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
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-navy-600 transition-colors hover:bg-white"
                        aria-label="Diminuir"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-navy-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
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
                    onChange={(e) => updateItemNote(item.id, e.target.value)}
                  />
                </div>
              </div>
            ))}

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
                  placeholder="Ex.: confirmar tamanho antes de fazer o pedido."
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
                  <span className="font-semibold text-green-600">A combinar</span>
                </div>
                <div className="flex items-center justify-between border-t border-cream-200 pt-3">
                  <span className="font-display font-bold text-navy-800">Total estimado</span>
                  <span className="font-display text-2xl font-bold text-orange-600">
                    {formatBRL(total)}
                  </span>
                </div>
              </div>

              {/* Aviso */}
              <div className="mx-5 mb-4 flex gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                <Info size={14} className="mt-0.5 shrink-0 text-amber-500" />
                <span>
                  Valor estimado — confirmação final após verificação com o fornecedor.
                </span>
              </div>

              {/* Botão principal */}
              <div className="px-5 pb-5 space-y-2">
                <button onClick={sendOrder} className="btn-green w-full btn-lg">
                  <WhatsAppIcon size={20} /> Enviar pedido pelo WhatsApp
                </button>
                <Link to="/checkout" className="btn-primary w-full flex items-center justify-center gap-2">
                  Finalizar com pagamento <ArrowRight size={16} />
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
