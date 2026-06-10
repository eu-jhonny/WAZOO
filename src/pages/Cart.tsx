import { Link, useNavigate } from "react-router-dom";
import { Info, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
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
  const { items, note, total, count, setNote, updateQuantity, removeItem, updateItemNote, clear } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { settings, addOrder } = useStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const petName = user?.pets[0]?.name;

  const sendOrder = () => {
    if (items.length === 0) return;

    const message = buildCartMessage({
      items,
      total,
      customerName: user?.name,
      petName,
      observation: note || undefined,
    });

    // Cria o pedido (visível no admin e no histórico do cliente)
    addOrder({
      userId: user?.id,
      customerName: user?.name ?? "Cliente via site",
      customerPhone: user?.phone ?? "",
      petName,
      fulfillment: user?.preference ?? "entrega",
      items: items.map((i) => ({
        name: `${i.name}${i.kind === "kit" ? " (Kit)" : ""}`,
        quantity: i.quantity,
        price: i.price,
        note: i.note,
      })),
      total,
      note: note || undefined,
    });

    // Abre o WhatsApp com a mensagem automática
    window.open(whatsappLink(message, settings.whatsapp), "_blank", "noopener");

    clear();
    showToast("Pedido enviado com sucesso! 🎉", "success");
    navigate(isLoggedIn ? "/pedidos" : "/");
  };

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container-app">
          <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-dashed border-cream-300 bg-cream-50 px-6 py-16 text-center">
            <img src={img.mascot.dormindo} alt="Mascote dormindo" className="h-44 w-auto" />
            <h1 className="mt-4 font-display text-2xl font-bold text-navy-700">
              Seu carrinho está vazio
            </h1>
            <p className="mt-2 text-navy-500">
              Que tal escolher alguns mimos para o seu pet?
            </p>
            <Link to="/produtos" className="btn-primary mt-6">
              <ShoppingBag size={18} /> Ver produtos
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container-app">
        <h1 className="font-display text-3xl font-bold text-navy-700 sm:text-4xl">
          Seu carrinho
        </h1>
        <p className="mt-1 text-navy-500">
          {count} {count === 1 ? "item" : "itens"} sob encomenda
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Itens */}
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <div key={`${item.kind}-${item.id}`} className="card flex flex-col gap-4 p-4 sm:flex-row">
                <div className="h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-cream-100 sm:h-24 sm:w-24">
                  <ProductImage src={item.image} alt={item.name} category={item.category} iconSize={36} />
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-bold leading-tight text-navy-700">
                        {item.name}
                      </h3>
                      <span className="badge-encomenda mt-1">Sob encomenda</span>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="shrink-0 rounded-full p-2 text-navy-300 transition-colors hover:bg-red-50 hover:text-red-500"
                      aria-label={`Remover ${item.name}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center rounded-full border-2 border-cream-200 p-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-navy-600 hover:bg-cream-100"
                        aria-label="Diminuir"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="w-9 text-center font-bold text-navy-700">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-navy-600 hover:bg-cream-100"
                        aria-label="Aumentar"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-orange-600">
                        {formatBRL(item.price * item.quantity)}
                      </p>
                      <p className="text-xs text-navy-400">{formatBRL(item.price)} cada</p>
                    </div>
                  </div>

                  <input
                    className="input mt-3 py-2 text-sm"
                    placeholder="Observação deste item (opcional)"
                    value={item.note ?? ""}
                    onChange={(e) => updateItemNote(item.id, e.target.value)}
                  />
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between">
              <Link to="/produtos" className="btn-ghost btn-sm">
                <ShoppingBag size={16} /> Continuar comprando
              </Link>
              <button onClick={clear} className="btn-ghost btn-sm text-navy-400 hover:text-red-500">
                <Trash2 size={16} /> Esvaziar carrinho
              </button>
            </div>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24 p-6">
              <h2 className="font-display text-xl font-bold text-navy-700">Resumo do pedido</h2>

              <div className="mt-4">
                <label className="label" htmlFor="cart-note">Observação geral</label>
                <textarea
                  id="cart-note"
                  className="input min-h-[80px] text-sm"
                  placeholder="Ex.: preciso confirmar o tamanho da coleira."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="mt-4 space-y-2 border-t border-cream-200 pt-4 text-sm">
                <div className="flex justify-between text-navy-500">
                  <span>Itens ({count})</span>
                  <span>{formatBRL(total)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-cream-200 pt-3">
                  <span className="font-display text-lg font-bold text-navy-700">Total estimado</span>
                  <span className="font-display text-2xl font-bold text-orange-600">
                    {formatBRL(total)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2 rounded-2xl bg-orange-50 p-3 text-xs leading-relaxed text-navy-600">
                <Info size={16} className="mt-0.5 shrink-0 text-orange-500" />
                <span>
                  O valor exibido é uma estimativa. A confirmação final depende da
                  disponibilidade com o fornecedor.
                </span>
              </div>

              <button onClick={sendOrder} className="btn-green mt-5 w-full btn-lg">
                <WhatsAppIcon size={20} /> Enviar pedido pelo WhatsApp
              </button>

              {!isLoggedIn && (
                <p className="mt-3 text-center text-xs text-navy-400">
                  <Link to="/login" className="link-underline">Entre na sua conta</Link> para
                  acompanhar o status do pedido.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
