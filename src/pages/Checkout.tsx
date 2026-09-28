/**
 * Checkout da loja — fluxo de compra, entrega e pagamento.
 *
 * O pedido é registrado na loja e aparece em "Meus pedidos". O fluxo definitivo
 * será persistido pela API; este componente mantém compatibilidade com o modo local.
 *
 * Configurações do admin que afetam esta página:
 *   • Loja → taxa de entrega (frete)
 *   • Pagamento → métodos habilitados, desconto no PIX, parcelas máx.
 */
import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, ShoppingBag, Tag, Truck, MapPin,
  CreditCard, Loader2, QrCode, FileText, Sparkles, Copy, ShieldCheck,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { useLoyalty } from "@/context/LoyaltyContext";
import { BRL_PER_POINT } from "@/lib/loyalty";
import { validateCoupon, readCoupons } from "@/lib/coupons";
import { formatBRL } from "@/lib/format";
import { getAdminPaymentConfig } from "@/lib/adminConfig";
import { isPixAuto } from "@/lib/pixProvider";
import { PixQrCode } from "@/components/ui/PixQrCode";
import { PixAutoPayment } from "@/components/ui/PixAutoPayment";
import {
  apiEnabled,
  createApiOrder,
  createApiPayment,
  validateApiCoupon,
} from "@/lib/api";

/* ── Tipos ──────────────────────────────────────────────────── */
interface CustomerForm { name: string; email: string; phone: string; cpf: string; }
interface AddressForm {
  street: string; number: string; complement: string;
  neighborhood: string; city: string; state: string; zip: string;
}
type PaymentMethod = "pix" | "credit_card" | "boleto";
type Step = "cart" | "customer" | "address" | "payment" | "success";

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
  const { items, note: cartNote, total: cartTotal, clear } = useCart();
  const { settings, addOrder } = useStore();
  const { user, updateProfile } = useAuth();
  const loyalty = useLoyalty();
  const navigate = useNavigate();

  const [usePoints, setUsePoints] = useState(false);

  /* Códigos de cupom ativos (dica exibida ao cliente). */
  const activeCouponCodes = useMemo(
    () => readCoupons().filter((c) => c.active).map((c) => c.code).slice(0, 3),
    [],
  );

  const payCfg = useMemo(() => getAdminPaymentConfig(), []);
  const methods = useMemo(() => {
    const all: { key: PaymentMethod; label: string; icon: typeof QrCode; desc: string; enabled: boolean }[] = [
      { key: "pix",         label: "PIX",            icon: QrCode,     desc: payCfg.pixDiscount > 0 ? `${payCfg.pixDiscount}% de desconto` : "Aprovação rápida", enabled: payCfg.payPix },
      { key: "credit_card", label: "Cartão de crédito", icon: CreditCard, desc: `Até ${payCfg.maxInstall}x`, enabled: false },
      { key: "boleto",      label: "Boleto",         icon: FileText,   desc: apiEnabled ? "Gerado pelo gateway" : "Em breve", enabled: apiEnabled && payCfg.payBoleto },
    ];
    return all.filter((m) => m.enabled);
  }, [payCfg]);

  const [step, setStep] = useState<Step>("cart");
  const [customer, setCustomer] = useState<CustomerForm>({
    name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "", cpf: "",
  });
  const [address, setAddress] = useState<AddressForm>({
    street: user?.address.street ?? "",
    number: user?.address.number ?? "",
    complement: user?.address.complement ?? "",
    neighborhood: user?.address.neighborhood ?? "",
    city: user?.address.city ?? "",
    state: user?.address.state ?? "",
    zip: user?.address.zip ?? "",
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
  const [checkoutError, setCheckoutError] = useState("");
  const [apiPayment, setApiPayment] = useState<{
    status: string;
    pixCode?: string;
    pixQrBase64?: string;
    boletoUrl?: string;
  } | null>(null);

  /* Referência do PIX (mostrada antes do pedido existir). */
  const pendingTxid = useMemo(() => "WZ" + Date.now().toString().slice(-8), []);

  /* ── Cálculo de totais ─────────────────────────────────── */
  const subtotal = cartTotal;
  const freeShippingThreshold = Math.max(0, settings.freeShippingThreshold || 0);
  const qualifiesForFreeShipping =
    deliveryMethod === "DELIVERY" &&
    freeShippingThreshold > 0 &&
    Math.max(0, subtotal - couponDiscount) >= freeShippingThreshold;
  const baseShipping =
    deliveryMethod === "DELIVERY" && !qualifiesForFreeShipping
      ? (settings.deliveryFee || 0)
      : 0;
  const shippingAmount = couponFreeShip ? 0 : baseShipping;
  const pixDiscount = paymentMethod === "pix" && payCfg.pixDiscount > 0
    ? Math.round((subtotal - couponDiscount) * (payCfg.pixDiscount / 100) * 100) / 100
    : 0;

  /* Resgate de patinhas (fidelidade): usa o saldo até o valor restante. */
  const spendableBefore = Math.max(0, subtotal - couponDiscount - pixDiscount);
  const redeemablePoints = usePoints && !apiEnabled && loyalty.enabled
    ? Math.min(loyalty.balance, Math.floor(spendableBefore / BRL_PER_POINT))
    : 0;
  const pointsDiscount = Math.round(redeemablePoints * BRL_PER_POINT * 100) / 100;

  const total = Math.max(0, subtotal - couponDiscount - pixDiscount - pointsDiscount + shippingAmount);

  /* ── Cupom (validação via cupons do admin) ─────────────── */
  async function applyCoupon() {
    setCouponError("");
    setCouponDiscount(0);
    setCouponFreeShip(false);

    if (apiEnabled) {
      try {
        const r = await validateApiCoupon(couponCode, subtotal);
        setCouponDiscount(r.discount);
        setCouponFreeShip(r.type === "FREE_SHIPPING");
        return;
      } catch (error) {
        setCouponError(error instanceof Error ? error.message : "Cupom inválido.");
        return;
      }
    }

    const r = validateCoupon(couponCode, subtotal);
    if (!r.ok) { setCouponError(r.error ?? "Cupom inválido."); return; }
    setCouponDiscount(r.discount);
    setCouponFreeShip(r.freeShipping);
  }

  /* ── Finalizar compra ─────────────────────────────────── */
  async function handleFinalize() {
    setLoading(true);
    setCheckoutError("");

    try {
      if (deliveryMethod === "DELIVERY" && (!address.zip || !address.street || !address.number || !address.city || !address.state)) {
        setCheckoutError("Complete o endereço de entrega antes de finalizar.");
        setStep("address");
        return;
      }

      if (apiEnabled) {
        const order = await createApiOrder({
          customerName: customer.name.trim(),
          customerEmail: customer.email.trim(),
          customerPhone: customer.phone.replace(/\D/g, ""),
          customerDoc: customer.cpf.replace(/\D/g, ""),
          deliveryMethod,
          addressStreet: deliveryMethod === "DELIVERY" ? address.street : undefined,
          addressNumber: deliveryMethod === "DELIVERY" ? address.number : undefined,
          addressComplement: deliveryMethod === "DELIVERY" ? address.complement || undefined : undefined,
          addressNeighborhood: deliveryMethod === "DELIVERY" ? address.neighborhood : undefined,
          addressCity: deliveryMethod === "DELIVERY" ? address.city : undefined,
          addressState: deliveryMethod === "DELIVERY" ? address.state : undefined,
          addressZip: deliveryMethod === "DELIVERY" ? address.zip : undefined,
          items: items.map((i) => ({
            ...(i.kind === "product" ? { productId: i.id } : { kitId: i.id }),
            quantity: i.quantity,
            variantKey: i.variantKey,
            variantLabel: i.variant,
          })),
          couponCode: couponCode.trim() || undefined,
          paymentMethod,
          customerNote: cartNote || undefined,
        });

        const nameParts = customer.name.trim().split(/\s+/);
        const firstName = nameParts.shift() || customer.name.trim();
        const lastName = nameParts.join(" ") || firstName;

        if (paymentMethod === "credit_card") {
          throw new Error("Cartão ainda não está habilitado no checkout da Wazoo.");
        }

        const payment = await createApiPayment({
          orderId: order.id,
          method: paymentMethod,
          email: customer.email.trim(),
          cpf: customer.cpf.replace(/\D/g, ""),
          firstName,
          lastName,
        });

        setApiPayment({
          status: payment.status,
          pixCode: payment.pixCode,
          pixQrBase64: payment.pixQrBase64,
          boletoUrl: payment.boletoUrl,
        });
        setOrderNumber(order.number);
        setPaidTotal(payment.total ?? order.total);

        if (user && deliveryMethod === "DELIVERY") {
          updateProfile({
            address: {
              street: address.street,
              number: address.number,
              complement: address.complement,
              neighborhood: address.neighborhood,
              city: address.city,
              state: address.state,
              zip: address.zip,
            },
          });
        }

        if (redeemablePoints > 0) loyalty.redeem(redeemablePoints);
        clear();
        setStep("success");
        return;
      }

      // Fallback local: mantém a loja utilizável enquanto a API não estiver configurada.
      const order = addOrder({
        customerName: customer.name,
        customerPhone: customer.phone.replace(/\D/g, ""),
        customerEmail: customer.email.trim(),
        fulfillment: deliveryMethod === "DELIVERY" ? "entrega" : "retirada",
        userId: user?.id,
        items: items.map((i) => ({
          name: i.variant ? `${i.name} (${i.variant})` : i.name,
          quantity: i.quantity,
          price: i.price,
          note: i.note,
        })),
        subtotal,
        discountAmount: couponDiscount + pixDiscount + pointsDiscount || undefined,
        shippingAmount: shippingAmount || undefined,
        total,
        note: [
          paymentMethod === "pix" ? "Pagamento: PIX" : paymentMethod === "credit_card" ? "Pagamento: Cartão" : "Pagamento: Boleto",
          couponCode ? `Cupom: ${couponCode.toUpperCase()}` : "",
          redeemablePoints > 0 ? `Resgate: ${redeemablePoints} patinhas (-${formatBRL(pointsDiscount)})` : "",
          cartNote || "",
        ].filter(Boolean).join(" · "),
      });

      if (user && deliveryMethod === "DELIVERY") {
        updateProfile({
          address: {
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            zip: address.zip,
          },
        });
      }

      if (redeemablePoints > 0) loyalty.redeem(redeemablePoints);
      setOrderNumber(order.id);
      setPaidTotal(total);
      clear();
      setStep("success");
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Não foi possível finalizar a compra.");
    } finally {
      setLoading(false);
    }
  }

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
          Pedido recebido! 🎉
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
            💚 PIX gerado para {formatBRL(paidTotal)}. O pedido será liberado assim que o pagamento for confirmado.
          </div>
        )}

        {apiPayment?.pixCode && (
          <div className="mt-5 rounded-3xl border border-cream-200 bg-white p-5 text-left shadow-card">
            <div className="flex items-center gap-2 font-bold text-navy-700">
              <QrCode size={18} className="text-teal-600" /> Pague com PIX
            </div>
            {apiPayment.pixQrBase64 && (
              <img
                src={`data:image/png;base64,${apiPayment.pixQrBase64}`}
                alt="QR Code PIX"
                className="mx-auto mt-4 h-48 w-48 rounded-2xl border border-cream-200 bg-white p-2"
              />
            )}
            <div className="mt-4 rounded-2xl bg-cream-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-navy-400">PIX copia e cola</p>
              <p className="mt-1 break-all text-xs text-navy-600">{apiPayment.pixCode}</p>
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(apiPayment.pixCode || "")}
              className="btn-outline mt-3 w-full"
            >
              <Copy size={16} /> Copiar código PIX
            </button>
          </div>
        )}

        {apiPayment?.boletoUrl && (
          <a
            href={apiPayment.boletoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-orange mt-5 w-full"
          >
            <FileText size={17} /> Abrir boleto
          </a>
        )}

        <div className="mt-6 rounded-3xl border border-cream-200 bg-cream-50 p-5 text-left text-sm text-navy-600">
          <p className="flex items-center gap-2 font-bold text-navy-700">
            <Sparkles size={16} className="text-orange-500" /> Próximos passos
          </p>
          <ol className="mt-3 space-y-2">
            <li>1. O pagamento é confirmado pelo gateway.</li>
            <li>2. Seu pedido segue automaticamente para separação.</li>
            <li>3. {deliveryMethod === "DELIVERY" ? "Você acompanha a entrega pela sua conta." : "Avisaremos quando estiver pronto para retirada."}</li>
          </ol>
        </div>

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
                  {activeCouponCodes.length > 0 && (
                    <p className="mt-1.5 text-xs text-navy-400">Experimente: {activeCouponCodes.join(", ")}</p>
                  )}
                </div>

                {/* Patinhas Wazoo (fidelidade) */}
                {!apiEnabled && loyalty.enabled && loyalty.balance > 0 && (
                  <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-cream-200 p-4 transition-all hover:border-orange-200">
                    <input
                      type="checkbox"
                      checked={usePoints}
                      onChange={(e) => setUsePoints(e.target.checked)}
                      className="h-5 w-5 shrink-0 accent-orange-500"
                    />
                    <span className="flex-1 text-sm">
                      <span className="font-bold text-navy-700">🐾 Usar minhas patinhas</span>
                      <span className="block text-navy-400">
                        Você tem <strong className="text-navy-600">{loyalty.balance}</strong> patinhas
                        (até {formatBRL(loyalty.balanceBRL)} de desconto)
                      </span>
                    </span>
                  </label>
                )}

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
                {user?.address.street && deliveryMethod === "DELIVERY" && (
                  <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 p-3 text-sm text-teal-800">
                    <strong>Endereço salvo:</strong> os dados da sua conta foram preenchidos automaticamente. Você pode editar antes de continuar.
                  </div>
                )}
                <button onClick={() => setStep("payment")} className="btn-primary mt-6 w-full">Continuar → Pagamento</button>
              </div>
            )}

            {/* STEP: PAYMENT */}
            {step === "payment" && (
              <div className="animate-fade-in">
                <h2 className="font-display text-xl font-bold text-navy-700">Forma de pagamento</h2>
                <p className="mt-1 text-sm text-navy-400">Escolha como pagar. Com a API ativa, preço, estoque, cupom e frete são validados no servidor.</p>
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
                    {apiEnabled ? (
                      <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
                        <p className="flex items-center gap-2 text-sm font-bold text-teal-800">
                          <ShieldCheck size={17} /> Pagamento processado pelo gateway seguro da Wazoo
                        </p>
                        <p className="mt-1 text-xs text-teal-700">
                          Ao continuar, criaremos o pedido e mostraremos o QR Code PIX oficial.
                        </p>
                        <button onClick={handleFinalize} disabled={loading} className="btn-primary mt-4 w-full disabled:opacity-60">
                          {loading ? <><Loader2 size={18} className="animate-spin" /> Gerando PIX...</> : <><QrCode size={18} /> Gerar PIX e finalizar compra</>}
                        </button>
                      </div>
                    ) : isPixAuto ? (
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

                {/* ── Métodos adicionais serão reativados quando o gateway estiver conectado ao frontend ── */}
                {paymentMethod !== "pix" && (
                  <div className="mt-5">
                    {paymentMethod === "credit_card" && (
                      <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">
                        💳 O pagamento por cartão será processado pelo gateway seguro da Wazoo.
                      </div>
                    )}
                    {paymentMethod === "boleto" && (
                      <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
                        📄 O boleto será gerado pelo gateway de pagamento após confirmar a compra.
                      </div>
                    )}
                    <button onClick={handleFinalize} disabled={loading} className="btn-primary mt-4 w-full disabled:opacity-60">
                      {loading ? <><Loader2 size={18} className="animate-spin" /> Enviando...</> : <>Finalizar compra</>}
                    </button>
                    
                  </div>
                )}
              </div>
            )}
          </div>

{checkoutError && (
            <div className="lg:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {checkoutError}
            </div>
          )}

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
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>🐾 Patinhas ({redeemablePoints})</span>
                  <span>- {formatBRL(pointsDiscount)}</span>
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
              <p>🚚 <strong>Entrega</strong> — {freeShippingThreshold > 0 ? `frete grátis acima de ${formatBRL(freeShippingThreshold)}.` : "valor calculado no checkout."}</p>
              <p className="mt-1">🔒 Pagamentos processados com segurança. Preços e estoque são validados no servidor quando a API está ativa.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
