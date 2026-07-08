/**
 * Checkout "sob encomenda" — 100% local (localStorage), sem backend.
 *
 * O pedido é registrado na loja (aparece no admin e em "Meus pedidos") com
 * status inicial "Solicitação enviada". A confirmação de disponibilidade e o
 * pagamento são combinados pelo WhatsApp — coerente com o modelo da Wazoo.
 *
 * Configurações do admin que afetam esta página:
 *   • Loja → taxa de entrega (frete)
 *   • Pagamento → métodos habilitados, desconto no PIX, parcelas máx.
 */
import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, ShoppingBag, Tag, Truck, MapPin,
  CreditCard, Loader2, QrCode, FileText, Sparkles,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { formatBRL } from "@/lib/format";
import { getAdminPaymentConfig } from "@/lib/adminConfig";
import { whatsappLink } from "@/lib/whatsapp";
import { isPixAuto } from "@/lib/pixProvider";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { PixQrCode } from "@/components/ui/PixQrCode";
import { PixAutoPayment } from "@/components/ui/PixAutoPayment";

/* ── Tipos ──────────────────────────────────────────────────── */
interface CustomerForm { name: string; email: string; phone: string; cpf: string; }
interface AddressForm {
  street: string; number: string; complement: string;
  neighborhood: string; city: string; state: string; zip: string;
}
type PaymentMethod = "pix" | "credit_card" | "boleto";
type Step = "cart" | "customer" | "address" | "payment" | "success";

/* ── Cupons locais (demo) ───────────────────────────────────── */
const COUPONS: Record<string, { type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING"; value: number; min?: number }> = {
  WAZOO10:     { type: "PERCENTAGE", value: 10 },
  BEMVINDO:    { type: "PERCENTAGE", value: 15, min: 100 },
  FRETEGRATIS: { type: "FREE_SHIPPING", value: 0 },
};

/* ── Formatadores ─────────────────────────────────────────── */
function fmtCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function fmtPhone(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{4})$/, "$1-$2");
}
function fmtCEP(v: string) {
  return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

/* ── Busca CEP (ViaCEP, client-side) ───────────────────────── */
async function fetchCEP(zip: string): Promise<Partial<AddressForm>> {
  const clean = zip.replace(/\D/g, "");
  if (clean.length !== 8) return {};
  try {
    const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const d = await r.json();
    if (d.erro) return {};
    return { street: d.logradouro, neighborhood: d.bairro, city: d.localidade, state: d.uf };
  } catch { return {}; }
}

/* ── Componente principal ─────────────────────────────────── */
export function Checkout() {
  const { items, total: cartTotal, clear } = useCart();
  const { settings, addOrder } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  const payCfg = useMemo(() => getAdminPaymentConfig(), []);
  const methods = useMemo(() => {
    const all: { key: PaymentMethod; label: string; icon: typeof QrCode; desc: string; enabled: boolean }[] = [
      { key: "pix",         label: "PIX",            icon: QrCode,     desc: payCfg.pixDiscount > 0 ? `${payCfg.pixDiscount}% de desconto` : "Aprovação imediata", enabled: payCfg.payPix },
      { key: "credit_card", label: "Cartão de crédito", icon: CreditCard, desc: `Até ${payCfg.maxInstall}x`, enabled: payCfg.payCard },
      { key: "boleto",      label: "Boleto",         icon: FileText,   desc: "Vence em 3 dias", enabled: payCfg.payBoleto },
    ];
    return all.filter((m) => m.enabled);
  }, [payCfg]);

  const [step, setStep] = useState<Step>("cart");
  const [customer, setCustomer] = useState<CustomerForm>({
    name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "", cpf: "",
  });
  const [address, setAddress] = useState<AddressForm>({
    street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zip: "",
  });
  const [deliveryMethod, setDeliveryMethod] = useState<"DELIVERY" | "PICKUP">(
    user?.preference === "retirada" ? "PICKUP" : "DELIVERY",
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(methods[0]?.key ?? "pix");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponFreeShip, setCouponFreeShip] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [paidTotal, setPaidTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  /* Referência do PIX (mostrada antes do pedido existir). */
  const pendingTxid = useMemo(() => "WZ" + Date.now().toString().slice(-8), []);

  /* ── Cálculo de totais ─────────────────────────────────── */
  const subtotal = cartTotal;
  const baseShipping = deliveryMethod === "DELIVERY" ? (settings.deliveryFee || 0) : 0;
  const shippingAmount = couponFreeShip ? 0 : baseShipping;
  const pixDiscount = paymentMethod === "pix" && payCfg.pixDiscount > 0
    ? Math.round((subtotal - couponDiscount) * (payCfg.pixDiscount / 100) * 100) / 100
    : 0;
  const total = Math.max(0, subtotal - couponDiscount - pixDiscount + shippingAmount);

  /* ── Cupom (validação local) ───────────────────────────── */
  function applyCoupon() {
    setCouponError(""); setCouponDiscount(0); setCouponFreeShip(false);
    const c = COUPONS[couponCode.trim().toUpperCase()];
    if (!c) { setCouponError("Cupom inválido ou expirado."); return; }
    if (c.min && subtotal < c.min) { setCouponError(`Válido para pedidos acima de ${formatBRL(c.min)}.`); return; }
    if (c.type === "PERCENTAGE") setCouponDiscount(Math.round(subtotal * (c.value / 100) * 100) / 100);
    else if (c.type === "FIXED") setCouponDiscount(c.value);
    else if (c.type === "FREE_SHIPPING") setCouponFreeShip(true);
  }

  /* ── Finalizar: cria o pedido localmente ───────────────── */
  function handleFinalize() {
    setLoading(true);
    try {
      const order = addOrder({
        customerName: customer.name,
        customerPhone: customer.phone.replace(/\D/g, ""),
        customerEmail: customer.email.trim(),
        fulfillment: deliveryMethod === "DELIVERY" ? "entrega" : "retirada",
        userId: user?.id,
        items: items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          note: i.note,
        })),
        subtotal,
        discountAmount: couponDiscount + pixDiscount || undefined,
        shippingAmount: shippingAmount || undefined,
        total,
        note: [
          paymentMethod === "pix" ? "Pagamento: PIX (informado pelo cliente)" : paymentMethod === "credit_card" ? "Pagamento: Cartão (a combinar)" : "Pagamento: Boleto (a combinar)",
          couponCode ? `Cupom: ${couponCode.toUpperCase()}` : "",
          deliveryMethod === "DELIVERY" && address.street
            ? `Entrega: ${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}/${address.state}, CEP ${address.zip}`
            : deliveryMethod === "PICKUP" ? "Retirada na loja" : "",
        ].filter(Boolean).join(" · "),
      });
      setOrderNumber(order.id);
      setPaidTotal(total);
      clear();
      setStep("success");
    } finally {
      setLoading(false);
    }
  }

  /* ── Mensagem de WhatsApp para a tela de sucesso ────────── */
  const waMessage = useMemo(() => {
    if (paymentMethod === "pix") {
      return [
        `Olá! Acabei de pagar o pedido *${orderNumber}* via PIX. 🐾`,
        `Valor: ${formatBRL(paidTotal)}. Segue o comprovante 👇`,
      ].join("\n");
    }
    return [
      `Olá! Acabei de enviar o pedido *${orderNumber}* pelo site. 🐾`,
      `Total estimado: ${formatBRL(paidTotal)} (${paymentMethod === "credit_card" ? "Cartão" : "Boleto"})`,
      `Gostaria de confirmar a disponibilidade e o pagamento.`,
    ].join("\n");
  }, [orderNumber, paidTotal, paymentMethod]);

  /* Chave PIX: usa a configurada no admin; senão, o WhatsApp como chave telefone. */
  const pixKey = useMemo(() => {
    if (payCfg.pixChave.trim()) return payCfg.pixChave.trim();
    const digits = (settings.whatsapp || "").replace(/\D/g, "");
    return digits ? `+${digits.startsWith("55") ? digits : "55" + digits}` : "";
  }, [payCfg.pixChave, settings.whatsapp]);

  if (!items.length && step !== "success") {
    return (
      <div className="container-app py-20 text-center">
        <span className="text-6xl">🛒</span>
        <h2 className="section-title mt-6">Seu carrinho está vazio</h2>
        <p className="mt-2 text-navy-500">Adicione produtos para finalizar seu pedido.</p>
        <Link to="/produtos" className="btn-primary mt-6">Ver produtos</Link>
      </div>
    );
  }

  /* ═══ SUCCESS ═════════════════════════════════════════════ */
  if (step === "success") {
    return (
      <div className="container-app max-w-lg py-16 text-center sm:py-20">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 animate-pop">
          <CheckCircle size={44} className="text-green-500" />
        </div>
        <h1 className="section-title mt-6">
          {paymentMethod === "pix" ? "Pagamento informado! 🎉" : "Pedido enviado! 🎉"}
        </h1>
        <p className="mt-3 text-navy-500">
          Número do pedido: <strong className="text-navy-700">{orderNumber}</strong>
        </p>
        {customer.email.trim() && (
          <p className="mt-1 text-sm text-navy-400">
            📧 Enviamos a confirmação para <strong className="text-navy-600">{customer.email.trim()}</strong>
          </p>
        )}

        {paymentMethod === "pix" && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
            💚 Recebemos a confirmação do seu PIX de {formatBRL(paidTotal)}. Para agilizar, envie o comprovante pelo WhatsApp.
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-cream-200 bg-cream-50 p-5 text-left text-sm text-navy-600">
          <p className="flex items-center gap-2 font-bold text-navy-700">
            <Sparkles size={16} className="text-orange-500" /> Próximos passos
          </p>
          <ol className="mt-3 space-y-2">
            <li>1. {paymentMethod === "pix" ? "Conferimos o recebimento do PIX." : "Vamos verificar a disponibilidade dos itens."}</li>
            <li>2. Confirmamos o valor final e o prazo com você.</li>
            <li>3. {paymentMethod === "pix"
              ? "Enviamos o seu pedido."
              : `Combinamos o pagamento (${paymentMethod === "credit_card" ? "cartão" : "boleto"}).`} {deliveryMethod === "DELIVERY" ? "Combinamos a entrega." : "Combinamos a retirada."}</li>
          </ol>
        </div>

        <a
          href={whatsappLink(waMessage, settings.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-green mt-6 w-full"
        >
          <WhatsAppIcon size={18} /> {paymentMethod === "pix" ? "Enviar comprovante pelo WhatsApp" : "Agilizar pelo WhatsApp"}
        </a>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Link to="/pedidos" className="btn-outline-orange flex-1">Meus pedidos</Link>
          <Link to="/" className="btn-ghost flex-1 border border-cream-200">Voltar para a loja</Link>
        </div>
      </div>
    );
  }

  /* ═══ STEPS ═══════════════════════════════════════════════ */
  const steps: { key: Step; label: string }[] = [
    { key: "cart",     label: "Carrinho" },
    { key: "customer", label: "Dados" },
    { key: "address",  label: "Entrega" },
    { key: "payment",  label: "Pagamento" },
  ];
  const stepIdx = steps.findIndex((s) => s.key === step);
  const canAddress = customer.name && customer.email && customer.phone && customer.cpf;

  /* PIX estático (manual) — usado quando o pagamento automático não está
     ativo, ou como fallback se a cobrança automática falhar. */
  const staticPix = pixKey ? (
    <>
      <PixQrCode
        pixKey={pixKey}
        merchantName={settings.storeName}
        amount={total}
        txid={pendingTxid}
      />
      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <span className="text-base leading-none">⚠️</span>
        <span>Faça o PIX no app do seu banco. <strong>Só depois</strong> clique no botão abaixo — o pedido será registrado apenas após o pagamento.</span>
      </div>
      <button onClick={handleFinalize} disabled={loading} className="btn-green mt-4 w-full disabled:opacity-60">
        {loading ? <><Loader2 size={18} className="animate-spin" /> Registrando...</> : <><CheckCircle size={18} /> Já fiz o pagamento — registrar pedido</>}
      </button>
    </>
  ) : (
    <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
      Chave PIX não configurada pela loja. Escolha outra forma de pagamento ou combine pelo WhatsApp.
    </div>
  );

  return (
    <div className="bg-cream-50 py-8 sm:py-12">
      <div className="container-app max-w-4xl">

        {/* Back button */}
        <button
          onClick={() => (stepIdx > 0 ? setStep(steps[stepIdx - 1].key) : navigate(-1))}
          className="mb-6 flex items-center gap-2 text-navy-500 transition-colors hover:text-navy-700"
        >
          <ArrowLeft size={18} /> Voltar
        </button>

        <h1 className="font-display text-3xl font-bold text-navy-700">Finalizar pedido</h1>

        {/* Progress steps */}
        <div className="mt-6 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  i <= stepIdx ? "text-white" : "bg-cream-200 text-navy-400"
                }`}
                style={i <= stepIdx ? { backgroundColor: "var(--a500)" } : undefined}
              >
                {i < stepIdx ? "✓" : i + 1}
              </div>
              <span className={`hidden text-sm font-semibold sm:block ${i === stepIdx ? "text-orange-600" : "text-navy-400"}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`h-px w-8 sm:w-12 ${i < stepIdx ? "bg-orange-400" : "bg-cream-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* ── Conteúdo do step ─────────────────── */}
          <div className="card p-6 sm:p-8">

            {/* STEP: CART */}
            {step === "cart" && (
              <div className="animate-fade-in">
                <h2 className="font-display text-xl font-bold text-navy-700">Resumo do carrinho</h2>
                <div className="mt-4 space-y-3">
                  {items.map((item) => (
                    <div key={`${item.kind}-${item.id}`} className="flex items-center gap-3 rounded-2xl bg-cream-50 p-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream-200">
                        {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <ShoppingBag size={24} className="text-navy-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-navy-700">{item.name}</p>
                        <p className="text-sm text-navy-400">Qtd: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-orange-600">{formatBRL(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                {/* Cupom */}
                <div className="mt-5">
                  <label className="label">Cupom de desconto</label>
                  <div className="flex gap-2">
                    <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="EX: WAZOO10" className="input flex-1 uppercase" />
                    <button onClick={applyCoupon} className="btn-teal shrink-0 px-4">Aplicar</button>
                  </div>
                  {couponError && <p className="mt-1 text-sm text-red-500">{couponError}</p>}
                  {(couponDiscount > 0 || couponFreeShip) && (
                    <p className="mt-1 text-sm font-bold text-green-600">
                      ✅ {couponFreeShip ? "Frete grátis aplicado!" : `Desconto de ${formatBRL(couponDiscount)} aplicado!`}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-navy-400">Experimente: WAZOO10, BEMVINDO ou FRETEGRATIS</p>
                </div>

                <button onClick={() => setStep("customer")} className="btn-primary mt-6 w-full">Continuar → Dados pessoais</button>
              </div>
            )}

            {/* STEP: CUSTOMER */}
            {step === "customer" && (
              <div className="animate-fade-in">
                <h2 className="font-display text-xl font-bold text-navy-700">Seus dados</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Nome completo", field: "name" as const, placeholder: "João Silva" },
                    { label: "E-mail",         field: "email" as const, placeholder: "joao@email.com", type: "email" },
                    { label: "Telefone/WhatsApp", field: "phone" as const, placeholder: "(11) 99999-9999" },
                    { label: "CPF",            field: "cpf" as const, placeholder: "000.000.000-00" },
                  ].map((f) => (
                    <div key={f.field} className={f.field === "name" ? "sm:col-span-2" : ""}>
                      <label className="label">{f.label}</label>
                      <input
                        type={f.type ?? "text"}
                        value={customer[f.field]}
                        placeholder={f.placeholder}
                        className="input"
                        onChange={(e) => {
                          let v = e.target.value;
                          if (f.field === "cpf") v = fmtCPF(v);
                          if (f.field === "phone") v = fmtPhone(v);
                          setCustomer((c) => ({ ...c, [f.field]: v }));
                        }}
                      />
                    </div>
                  ))}
                </div>
                <button
                  disabled={!canAddress}
                  onClick={() => setStep("address")}
                  className="btn-primary mt-6 w-full disabled:opacity-60"
                >
                  Continuar → Entrega
                </button>
              </div>
            )}

            {/* STEP: ADDRESS */}
            {step === "address" && (
              <div className="animate-fade-in">
                <h2 className="font-display text-xl font-bold text-navy-700">Forma de entrega</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { key: "DELIVERY" as const, label: "Entrega", icon: Truck, desc: settings.deliveryFee > 0 ? `Frete ${formatBRL(settings.deliveryFee)}` : "Frete grátis" },
                    { key: "PICKUP"   as const, label: "Retirada", icon: MapPin, desc: "Retire na loja (SP)" },
                  ].map((o) => (
                    <button key={o.key} onClick={() => setDeliveryMethod(o.key)}
                      className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition-all ${deliveryMethod === o.key ? "border-orange-500 bg-orange-50" : "border-cream-200 hover:border-orange-200"}`}>
                      <o.icon size={22} className={deliveryMethod === o.key ? "text-orange-500" : "text-navy-400"} />
                      <div className="text-left">
                        <p className="font-bold text-navy-700">{o.label}</p>
                        <p className="text-xs text-navy-400">{o.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {deliveryMethod === "DELIVERY" && (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">CEP</label>
                      <input value={address.zip} placeholder="00000-000" className="input" onChange={async (e) => {
                        const v = fmtCEP(e.target.value);
                        setAddress((a) => ({ ...a, zip: v }));
                        if (v.replace(/\D/g, "").length === 8) {
                          const data = await fetchCEP(v);
                          setAddress((a) => ({ ...a, ...data }));
                        }
                      }} />
                    </div>
                    <div>
                      <label className="label">Número</label>
                      <input value={address.number} placeholder="123" className="input" onChange={(e) => setAddress((a) => ({ ...a, number: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Rua</label>
                      <input value={address.street} placeholder="Rua..." className="input" onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Bairro</label>
                      <input value={address.neighborhood} className="input" onChange={(e) => setAddress((a) => ({ ...a, neighborhood: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Complemento</label>
                      <input value={address.complement} placeholder="Apto, bloco..." className="input" onChange={(e) => setAddress((a) => ({ ...a, complement: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Cidade</label>
                      <input value={address.city} className="input" onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Estado</label>
                      <input value={address.state} maxLength={2} placeholder="SP" className="input uppercase" onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value.toUpperCase() }))} />
                    </div>
                  </div>
                )}
                <button onClick={() => setStep("payment")} className="btn-primary mt-6 w-full">Continuar → Pagamento</button>
              </div>
            )}

            {/* STEP: PAYMENT */}
            {step === "payment" && (
              <div className="animate-fade-in">
                <h2 className="font-display text-xl font-bold text-navy-700">Forma de pagamento</h2>
                <p className="mt-1 text-sm text-navy-400">Escolha como pagar. O pedido só é registrado depois do pagamento.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {methods.map((m) => {
                    const Icon = m.icon;
                    const active = paymentMethod === m.key;
                    return (
                      <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                        className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 transition-all ${active ? "border-orange-500 bg-orange-50" : "border-cream-200 hover:border-orange-200"}`}>
                        <Icon size={24} className={active ? "text-orange-500" : "text-navy-400"} />
                        <p className="text-sm font-bold text-navy-700">{m.label}</p>
                        <p className="text-[10px] text-navy-400">{m.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* ── PIX: paga AGORA, e só então registra o pedido ── */}
                {paymentMethod === "pix" && (
                  <div className="mt-5">
                    {payCfg.pixDiscount > 0 && (
                      <div className="mb-4 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">
                        💚 Pagando com PIX você ganha <strong>{payCfg.pixDiscount}% de desconto</strong> ({formatBRL(pixDiscount)}).
                      </div>
                    )}
                    {isPixAuto ? (
                      <PixAutoPayment
                        amount={total}
                        payerEmail={customer.email}
                        payerName={customer.name}
                        description={`Pedido Wazoo ${pendingTxid}`}
                        txid={pendingTxid}
                        onPaid={handleFinalize}
                        fallback={staticPix}
                      />
                    ) : (
                      staticPix
                    )}
                  </div>
                )}

                {/* ── Cartão / Boleto: combinados na confirmação ── */}
                {paymentMethod !== "pix" && (
                  <div className="mt-5">
                    {paymentMethod === "credit_card" && (
                      <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">
                        💳 Parcele em até {payCfg.maxInstall}x. Os dados do cartão são combinados de forma segura ao confirmar o pedido — sem cobrança automática agora.
                      </div>
                    )}
                    {paymentMethod === "boleto" && (
                      <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
                        📄 O boleto é enviado após a confirmação da disponibilidade. Vencimento em 3 dias úteis.
                      </div>
                    )}
                    <button onClick={handleFinalize} disabled={loading} className="btn-primary mt-4 w-full disabled:opacity-60">
                      {loading ? <><Loader2 size={18} className="animate-spin" /> Enviando...</> : <>🐾 Enviar solicitação de pedido</>}
                    </button>
                    <p className="mt-2 text-center text-xs text-navy-400">Sem cobrança agora — combinamos o pagamento pelo WhatsApp.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Resumo lateral ───────────────────── */}
          <div className="card h-fit p-5 lg:sticky lg:top-24">
            <h3 className="font-display text-lg font-bold text-navy-700">Resumo</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-navy-500">
                <span>Subtotal ({items.length} iten{items.length > 1 ? "s" : ""})</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span><Tag size={13} className="inline mr-1" />Cupom ({couponCode})</span>
                  <span>- {formatBRL(couponDiscount)}</span>
                </div>
              )}
              {pixDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span><QrCode size={13} className="inline mr-1" />Desconto PIX</span>
                  <span>- {formatBRL(pixDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-navy-500">
                <span>Entrega</span>
                <span>{shippingAmount === 0 ? "Grátis" : formatBRL(shippingAmount)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-cream-200 pt-3 font-display text-xl font-bold text-navy-700">
                <span>Total</span>
                <span className="text-orange-600">{formatBRL(total)}</span>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-cream-50 p-3 text-xs text-navy-500">
              <p>🐾 <strong>Sob encomenda</strong> — prazo médio de 5–7 dias úteis após a confirmação.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
