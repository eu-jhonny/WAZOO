import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  Copy,
  CreditCard,
  FileText,
  Loader2,
  MapPin,
  QrCode,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useStore, type NewOrderInput } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { useLoyalty } from "@/context/LoyaltyContext";
import { BRL_PER_POINT } from "@/lib/loyalty";
import { validateCoupon as validateLocalCoupon, readCoupons } from "@/lib/coupons";
import { formatBRL } from "@/lib/format";
import { getAdminPaymentConfig } from "@/lib/adminConfig";
import { PixQrCode } from "@/components/ui/PixQrCode";
import {
  apiEnabled,
  createApiOrder,
  createApiPayment,
  getApiPaymentStatus,
  validateApiCoupon,
  type ApiOrder,
} from "@/lib/api";

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  cpf: string;
}

interface AddressForm {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
}

type PaymentMethod = "pix" | "credit_card" | "boleto";
type Step = "cart" | "customer" | "address" | "payment" | "success";

interface PixChargeState {
  orderId: string;
  orderNumber: string;
  publicToken: string;
  pixCode?: string;
  qrBase64?: string;
  total: number;
  status: string;
}

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

async function fetchCEP(zip: string): Promise<Partial<AddressForm>> {
  const clean = zip.replace(/\D/g, "");
  if (clean.length !== 8) return {};
  try {
    const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const data = await response.json();
    if (data.erro) return {};
    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    };
  } catch {
    return {};
  }
}

export function Checkout() {
  const { items, total: cartTotal, note: cartNote, clear } = useCart();
  const { settings, addOrder, recordExternalOrder } = useStore();
  const { user, updateProfile } = useAuth();
  const loyalty = useLoyalty();
  const navigate = useNavigate();

  const payCfg = useMemo(() => getAdminPaymentConfig(), []);
  const [step, setStep] = useState<Step>("cart");
  const [customer, setCustomer] = useState<CustomerForm>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    cpf: "",
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponFreeShip, setCouponFreeShip] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [serverOrder, setServerOrder] = useState<ApiOrder | null>(null);
  const [pixCharge, setPixCharge] = useState<PixChargeState | null>(null);
  const [copied, setCopied] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [paidTotal, setPaidTotal] = useState(0);
  const completedRef = useRef(false);

  const methods = useMemo(() => {
    const all: Array<{
      key: PaymentMethod;
      label: string;
      icon: typeof QrCode;
      desc: string;
      enabled: boolean;
    }> = [
      {
        key: "pix",
        label: "PIX",
        icon: QrCode,
        desc: apiEnabled ? "Aprovação automática" : (payCfg.pixDiscount > 0 ? `${payCfg.pixDiscount}% de desconto` : "Pagamento instantâneo"),
        enabled: apiEnabled || payCfg.payPix,
      },
      {
        key: "credit_card",
        label: "Cartão de crédito",
        icon: CreditCard,
        desc: "Em breve",
        enabled: false,
      },
      {
        key: "boleto",
        label: "Boleto",
        icon: FileText,
        desc: "Em breve",
        enabled: false,
      },
    ];
    return all.filter((m) => m.enabled);
  }, [payCfg]);

  const activeCouponCodes = useMemo(
    () => apiEnabled ? [] : readCoupons().filter((c) => c.active).map((c) => c.code).slice(0, 3),
    [],
  );

  const subtotal = cartTotal;
  const reachesFreeShipping =
    settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold;
  const baseShipping =
    deliveryMethod === "DELIVERY" && !reachesFreeShipping
      ? settings.deliveryFee
      : 0;
  const shippingAmount = couponFreeShip ? 0 : baseShipping;

  // Desconto PIX e fidelidade continuam apenas no modo local até que as regras
  // estejam persistidas no backend. Em produção, o servidor é a fonte da verdade.
  const pixDiscount =
    !apiEnabled && paymentMethod === "pix" && payCfg.pixDiscount > 0
      ? Math.round((subtotal - couponDiscount) * (payCfg.pixDiscount / 100) * 100) / 100
      : 0;

  const spendableBefore = Math.max(0, subtotal - couponDiscount - pixDiscount);
  const redeemablePoints =
    !apiEnabled && usePoints && loyalty.enabled
      ? Math.min(loyalty.balance, Math.floor(spendableBefore / BRL_PER_POINT))
      : 0;
  const pointsDiscount = Math.round(redeemablePoints * BRL_PER_POINT * 100) / 100;

  const estimatedTotal = Math.max(
    0,
    subtotal - couponDiscount - pixDiscount - pointsDiscount + shippingAmount,
  );
  const displaySubtotal = serverOrder?.subtotal ?? subtotal;
  const displayDiscount = serverOrder?.discountAmount ?? (couponDiscount + pixDiscount + pointsDiscount);
  const displayShipping = serverOrder?.shippingAmount ?? shippingAmount;
  const displayTotal = serverOrder?.total ?? estimatedTotal;

  const canContinueCustomer =
    customer.name.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(customer.email) &&
    customer.phone.replace(/\D/g, "").length >= 10 &&
    customer.cpf.replace(/\D/g, "").length === 11;

  const canContinueAddress =
    deliveryMethod === "PICKUP" ||
    (
      address.zip.replace(/\D/g, "").length === 8 &&
      address.street.trim() &&
      address.number.trim() &&
      address.neighborhood.trim() &&
      address.city.trim() &&
      address.state.trim().length === 2
    );

  const makeLocalOrderInput = (totalValue = estimatedTotal): NewOrderInput => ({
    customerName: customer.name.trim(),
    customerPhone: customer.phone.replace(/\D/g, ""),
    customerEmail: customer.email.trim(),
    fulfillment: deliveryMethod === "DELIVERY" ? "entrega" : "retirada",
    userId: user?.id,
    items: items.map((item) => ({
      name: item.variant ? `${item.name} (${item.variant})` : item.name,
      quantity: item.quantity,
      price: item.price,
      note: item.note,
    })),
    subtotal: serverOrder?.subtotal ?? subtotal,
    discountAmount: serverOrder?.discountAmount ?? (couponDiscount + pixDiscount + pointsDiscount || undefined),
    shippingAmount: serverOrder?.shippingAmount ?? (shippingAmount || undefined),
    total: totalValue,
    note: [
      "Pagamento: PIX",
      couponCode.trim() ? `Cupom: ${couponCode.trim().toUpperCase()}` : "",
      deliveryMethod === "DELIVERY"
        ? `Entrega: ${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}/${address.state}, CEP ${address.zip}`
        : "Retirada na loja",
      cartNote.trim() ? `Observação: ${cartNote.trim()}` : "",
    ].filter(Boolean).join(" · "),
  });

  async function applyCoupon() {
    const code = couponCode.trim().toUpperCase();
    setCouponError("");
    setCouponDiscount(0);
    setCouponFreeShip(false);
    if (!code) {
      setCouponError("Digite um cupom.");
      return;
    }

    setCouponLoading(true);
    try {
      if (apiEnabled) {
        const result = await validateApiCoupon(code, subtotal);
        setCouponDiscount(result.discount);
        setCouponFreeShip(result.type === "FREE_SHIPPING");
      } else {
        const result = validateLocalCoupon(code, subtotal);
        if (!result.ok) {
          setCouponError(result.error ?? "Cupom inválido.");
          return;
        }
        setCouponDiscount(result.discount);
        setCouponFreeShip(result.freeShipping);
      }
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : "Não foi possível validar o cupom.");
    } finally {
      setCouponLoading(false);
    }
  }

  function saveCheckoutAddress() {
    if (!user || deliveryMethod !== "DELIVERY" || !canContinueAddress) return;
    updateProfile({
      address: {
        id: user.address.id,
        label: user.address.label ?? "Casa",
        isDefault: true,
        street: address.street.trim(),
        number: address.number.trim(),
        complement: address.complement.trim() || undefined,
        neighborhood: address.neighborhood.trim(),
        city: address.city.trim(),
        state: address.state.trim().toUpperCase(),
        zip: address.zip.replace(/\D/g, ""),
      },
      preference: "entrega",
    });
  }

  function finishLocalOrder() {
    saveCheckoutAddress();
    const order = addOrder(makeLocalOrderInput());
    if (redeemablePoints > 0) loyalty.redeem(redeemablePoints);
    setOrderNumber(order.id);
    setPaidTotal(order.total);
    clear();
    setStep("success");
  }

  function finishApiOrder(order: ApiOrder) {
    if (completedRef.current) return;
    completedRef.current = true;

    recordExternalOrder(
      order.number,
      {
        ...makeLocalOrderInput(order.total),
        items: order.items.map((item) => ({
          name: item.variantLabel ? `${item.name} (${item.variantLabel})` : item.name,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        subtotal: order.subtotal,
        discountAmount: order.discountAmount || undefined,
        shippingAmount: order.shippingAmount || undefined,
        total: order.total,
      },
      "Pagamento confirmado",
    );

    setOrderNumber(order.number);
    setPaidTotal(order.total);
    clear();
    setStep("success");
  }

  async function startApiPix() {
    if (!apiEnabled || loading || pixCharge) return;

    setLoading(true);
    setPaymentError("");
    try {
      saveCheckoutAddress();

      const order = await createApiOrder({
        customerName: customer.name.trim(),
        customerEmail: customer.email.trim(),
        customerPhone: customer.phone.replace(/\D/g, ""),
        customerDoc: customer.cpf.replace(/\D/g, ""),
        deliveryMethod,
        addressStreet: deliveryMethod === "DELIVERY" ? address.street.trim() : undefined,
        addressNumber: deliveryMethod === "DELIVERY" ? address.number.trim() : undefined,
        addressComplement: deliveryMethod === "DELIVERY" ? address.complement.trim() || undefined : undefined,
        addressNeighborhood: deliveryMethod === "DELIVERY" ? address.neighborhood.trim() : undefined,
        addressCity: deliveryMethod === "DELIVERY" ? address.city.trim() : undefined,
        addressState: deliveryMethod === "DELIVERY" ? address.state.trim().toUpperCase() : undefined,
        addressZip: deliveryMethod === "DELIVERY" ? address.zip.replace(/\D/g, "") : undefined,
        items: items.map((item) =>
          item.kind === "product"
            ? {
                productId: item.id,
                quantity: item.quantity,
                variantKey: item.variantKey,
                variantLabel: item.variant,
              }
            : {
                kitId: item.id,
                quantity: item.quantity,
              },
        ),
        couponCode: couponCode.trim() || undefined,
        paymentMethod: "pix",
        customerNote: cartNote.trim() || undefined,
      });

      setServerOrder(order);
      setOrderNumber(order.number);

      const parts = customer.name.trim().split(/\s+/);
      const firstName = parts.shift() || customer.name.trim();
      const lastName = parts.join(" ") || firstName;

      const payment = await createApiPayment({
        orderId: order.id,
        publicToken: order.publicToken,
        method: "pix",
        email: customer.email.trim(),
        cpf: customer.cpf.replace(/\D/g, ""),
        firstName,
        lastName,
      });

      setPaidTotal(payment.total);
      setPixCharge({
        orderId: order.id,
        orderNumber: payment.orderNumber,
        publicToken: order.publicToken,
        pixCode: payment.pixCode,
        qrBase64: payment.pixQrBase64,
        total: payment.total,
        status: payment.status,
      });

      if (payment.status === "APPROVED") {
        finishApiOrder(order);
      }
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Não foi possível iniciar o pagamento.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!apiEnabled || !pixCharge || !serverOrder || step !== "payment") return;
    if (pixCharge.status === "APPROVED") return;

    let active = true;
    const tick = async () => {
      try {
        const status = await getApiPaymentStatus(pixCharge.orderId, pixCharge.publicToken);
        if (!active) return;
        if (status.paymentStatus === "APPROVED") {
          setPixCharge((prev) => prev ? { ...prev, status: "APPROVED" } : prev);
          finishApiOrder(serverOrder);
        }
      } catch {
        // Polling é melhor esforço; a próxima tentativa continua automaticamente.
      }
    };

    const timer = window.setInterval(tick, 4000);
    void tick();
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [pixCharge?.orderId, pixCharge?.status, serverOrder, step]);

  async function copyPixCode() {
    if (!pixCharge?.pixCode) return;
    try {
      await navigator.clipboard.writeText(pixCharge.pixCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setPaymentError("Não foi possível copiar automaticamente. Selecione o código manualmente.");
    }
  }

  const pixKey = useMemo(() => {
    if (payCfg.pixChave.trim()) return payCfg.pixChave.trim();
    return "";
  }, [payCfg.pixChave]);

  const pendingTxid = useMemo(() => "WZ" + Date.now().toString().slice(-8), []);

  if (!items.length && step !== "success") {
    return (
      <div className="container-app py-20 text-center">
        <span className="text-6xl">🛒</span>
        <h2 className="section-title mt-6">Seu carrinho está vazio</h2>
        <p className="mt-2 text-navy-500">Adicione produtos para finalizar sua compra.</p>
        <Link to="/produtos" className="btn-primary mt-6">Ver produtos</Link>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="container-app max-w-lg py-16 text-center sm:py-20">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 animate-pop">
          <CheckCircle size={44} className="text-green-500" />
        </div>
        <h1 className="section-title mt-6">Compra confirmada! 🎉</h1>
        <p className="mt-3 text-navy-500">
          Pedido <strong className="text-navy-700">{orderNumber}</strong>
        </p>
        <p className="mt-1 text-sm text-navy-400">
          Total confirmado: <strong className="text-navy-600">{formatBRL(paidTotal)}</strong>
        </p>
        <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
          💚 Pagamento confirmado. Agora seu pedido segue para separação.
        </div>

        <div className="mt-6 rounded-3xl border border-cream-200 bg-cream-50 p-5 text-left text-sm text-navy-600">
          <p className="flex items-center gap-2 font-bold text-navy-700">
            <Sparkles size={16} className="text-orange-500" /> Próximos passos
          </p>
          <ol className="mt-3 space-y-2">
            <li>1. A Wazoo separa os produtos.</li>
            <li>2. Você recebe as atualizações do pedido.</li>
            <li>3. {deliveryMethod === "DELIVERY" ? "Acompanhe até a entrega." : "Avisaremos quando estiver pronto para retirada."}</li>
          </ol>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            to={`/rastrear?pedido=${encodeURIComponent(orderNumber)}`}
            className="btn-primary flex-1"
          >
            Rastrear pedido
          </Link>
          {user && (
            <Link to="/pedidos" className="btn-outline-orange flex-1">
              Meus pedidos
            </Link>
          )}
        </div>
        <Link to="/" className="btn-ghost mt-2 w-full border border-cream-200">
          Voltar para a loja
        </Link>
      </div>
    );
  }

  const steps: Array<{ key: Step; label: string }> = [
    { key: "cart", label: "Carrinho" },
    { key: "customer", label: "Dados" },
    { key: "address", label: "Entrega" },
    { key: "payment", label: "Pagamento" },
  ];
  const stepIdx = steps.findIndex((s) => s.key === step);

  const localPix = pixKey ? (
    <>
      <PixQrCode
        pixKey={pixKey}
        merchantName={settings.storeName}
        amount={estimatedTotal}
        txid={pendingTxid}
      />
      <button
        onClick={finishLocalOrder}
        disabled={loading}
        className="btn-green mt-4 w-full disabled:opacity-60"
      >
        <CheckCircle size={18} /> Confirmar pagamento no modo local
      </button>
      <p className="mt-2 text-center text-xs text-navy-400">
        Modo local de desenvolvimento. Em produção, configure VITE_API_URL para confirmação automática.
      </p>
    </>
  ) : (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      O PIX local não está configurado. Para produção, use a API Wazoo com Mercado Pago.
    </div>
  );

  return (
    <div className="bg-cream-50 py-8 sm:py-12">
      <div className="container-app max-w-5xl">
        <button
          onClick={() => (stepIdx > 0 ? setStep(steps[stepIdx - 1].key) : navigate(-1))}
          className="mb-6 flex items-center gap-2 text-navy-500 transition-colors hover:text-navy-700"
          disabled={Boolean(pixCharge)}
        >
          <ArrowLeft size={18} /> Voltar
        </button>

        <h1 className="font-display text-3xl font-bold text-navy-700">Finalizar compra</h1>

        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1">
          {steps.map((item, index) => (
            <div key={item.key} className="flex shrink-0 items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  index <= stepIdx ? "text-white" : "bg-cream-200 text-navy-400"
                }`}
                style={index <= stepIdx ? { backgroundColor: "var(--a500)" } : undefined}
              >
                {index < stepIdx ? "✓" : index + 1}
              </div>
              <span className={`text-sm font-semibold ${index === stepIdx ? "text-orange-600" : "text-navy-400"}`}>
                {item.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`h-px w-6 sm:w-10 ${index < stepIdx ? "bg-orange-400" : "bg-cream-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="card p-6 sm:p-8">
            {step === "cart" && (
              <div className="animate-fade-in">
                <h2 className="font-display text-xl font-bold text-navy-700">Resumo do carrinho</h2>
                <div className="mt-4 space-y-3">
                  {items.map((item) => (
                    <div
                      key={`${item.kind}-${item.id}-${item.variantKey ?? ""}`}
                      className="flex items-center gap-3 rounded-2xl bg-cream-50 p-3"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream-200">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <ShoppingBag size={24} className="text-navy-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-navy-700">{item.name}</p>
                        {item.variant && <p className="text-xs font-semibold text-teal-600">{item.variant}</p>}
                        <p className="text-sm text-navy-400">Qtd: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-orange-600">{formatBRL(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <label className="label">Cupom de desconto</label>
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="EX: WAZOO10"
                      className="input flex-1 uppercase"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={couponLoading}
                      className="btn-teal shrink-0 px-4 disabled:opacity-60"
                    >
                      {couponLoading ? <Loader2 size={16} className="animate-spin" /> : "Aplicar"}
                    </button>
                  </div>
                  {couponError && <p className="mt-1 text-sm text-red-500">{couponError}</p>}
                  {(couponDiscount > 0 || couponFreeShip) && (
                    <p className="mt-1 text-sm font-bold text-green-600">
                      ✅ {couponFreeShip ? "Frete grátis aplicado!" : `Desconto de ${formatBRL(couponDiscount)} aplicado!`}
                    </p>
                  )}
                  {activeCouponCodes.length > 0 && (
                    <p className="mt-1.5 text-xs text-navy-400">
                      Experimente: {activeCouponCodes.join(", ")}
                    </p>
                  )}
                </div>

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
                        {loyalty.balance} patinhas · até {formatBRL(loyalty.balanceBRL)} de desconto
                      </span>
                    </span>
                  </label>
                )}

                <button onClick={() => setStep("customer")} className="btn-primary mt-6 w-full">
                  Continuar → Dados pessoais
                </button>
              </div>
            )}

            {step === "customer" && (
              <div className="animate-fade-in">
                <h2 className="font-display text-xl font-bold text-navy-700">Seus dados</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label">Nome completo</label>
                    <input
                      value={customer.name}
                      className="input"
                      placeholder="João Silva"
                      onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">E-mail</label>
                    <input
                      type="email"
                      value={customer.email}
                      className="input"
                      placeholder="joao@email.com"
                      onChange={(e) => setCustomer((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Telefone</label>
                    <input
                      value={customer.phone}
                      className="input"
                      placeholder="(11) 99999-9999"
                      onChange={(e) => setCustomer((prev) => ({ ...prev, phone: fmtPhone(e.target.value) }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">CPF</label>
                    <input
                      value={customer.cpf}
                      className="input"
                      placeholder="000.000.000-00"
                      onChange={(e) => setCustomer((prev) => ({ ...prev, cpf: fmtCPF(e.target.value) }))}
                    />
                  </div>
                </div>
                <button
                  disabled={!canContinueCustomer}
                  onClick={() => setStep("address")}
                  className="btn-primary mt-6 w-full disabled:opacity-60"
                >
                  Continuar → Entrega
                </button>
              </div>
            )}

            {step === "address" && (
              <div className="animate-fade-in">
                <h2 className="font-display text-xl font-bold text-navy-700">Forma de entrega</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      key: "DELIVERY" as const,
                      label: "Entrega",
                      icon: Truck,
                      desc: reachesFreeShipping
                        ? "Frete grátis"
                        : (settings.deliveryFee > 0 ? `A partir de ${formatBRL(settings.deliveryFee)}` : "Frete grátis"),
                    },
                    {
                      key: "PICKUP" as const,
                      label: "Retirada",
                      icon: MapPin,
                      desc: "Retire no local",
                    },
                  ].map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setDeliveryMethod(option.key)}
                      className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                        deliveryMethod === option.key
                          ? "border-orange-500 bg-orange-50"
                          : "border-cream-200 hover:border-orange-200"
                      }`}
                    >
                      <option.icon
                        size={22}
                        className={deliveryMethod === option.key ? "text-orange-500" : "text-navy-400"}
                      />
                      <div className="text-left">
                        <p className="font-bold text-navy-700">{option.label}</p>
                        <p className="text-xs text-navy-400">{option.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {deliveryMethod === "DELIVERY" && (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">CEP</label>
                      <input
                        value={address.zip}
                        placeholder="00000-000"
                        className="input"
                        onChange={async (e) => {
                          const value = fmtCEP(e.target.value);
                          setAddress((prev) => ({ ...prev, zip: value }));
                          if (value.replace(/\D/g, "").length === 8) {
                            const data = await fetchCEP(value);
                            setAddress((prev) => ({ ...prev, ...data }));
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="label">Número</label>
                      <input
                        value={address.number}
                        className="input"
                        placeholder="123"
                        onChange={(e) => setAddress((prev) => ({ ...prev, number: e.target.value }))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Rua</label>
                      <input
                        value={address.street}
                        className="input"
                        onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="label">Bairro</label>
                      <input
                        value={address.neighborhood}
                        className="input"
                        onChange={(e) => setAddress((prev) => ({ ...prev, neighborhood: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="label">Complemento</label>
                      <input
                        value={address.complement}
                        className="input"
                        placeholder="Apto, bloco..."
                        onChange={(e) => setAddress((prev) => ({ ...prev, complement: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="label">Cidade</label>
                      <input
                        value={address.city}
                        className="input"
                        onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="label">Estado</label>
                      <input
                        value={address.state}
                        maxLength={2}
                        className="input uppercase"
                        placeholder="SP"
                        onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value.toUpperCase() }))}
                      />
                    </div>
                  </div>
                )}

                <button
                  disabled={!canContinueAddress}
                  onClick={() => setStep("payment")}
                  className="btn-primary mt-6 w-full disabled:opacity-60"
                >
                  Continuar → Pagamento
                </button>
              </div>
            )}

            {step === "payment" && (
              <div className="animate-fade-in">
                <h2 className="font-display text-xl font-bold text-navy-700">Pagamento</h2>
                <p className="mt-1 text-sm text-navy-400">
                  O pedido é confirmado após a aprovação do pagamento.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {methods.map((method) => {
                    const Icon = method.icon;
                    const active = paymentMethod === method.key;
                    return (
                      <button
                        key={method.key}
                        onClick={() => setPaymentMethod(method.key)}
                        disabled={Boolean(pixCharge)}
                        className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 transition-all disabled:opacity-60 ${
                          active
                            ? "border-orange-500 bg-orange-50"
                            : "border-cream-200 hover:border-orange-200"
                        }`}
                      >
                        <Icon size={24} className={active ? "text-orange-500" : "text-navy-400"} />
                        <p className="text-sm font-bold text-navy-700">{method.label}</p>
                        <p className="text-[10px] text-navy-400">{method.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {paymentError && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                    {paymentError}
                  </div>
                )}

                {paymentMethod === "pix" && (
                  <div className="mt-5">
                    {apiEnabled ? (
                      pixCharge ? (
                        <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-center sm:p-6">
                          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-700">
                            <QrCode size={14} /> PIX Mercado Pago
                          </div>
                          <p className="mt-2 text-sm text-green-700">
                            Pague <strong>{formatBRL(pixCharge.total)}</strong>. A confirmação é automática.
                          </p>

                          <div className="mx-auto mt-4 flex h-56 w-56 items-center justify-center rounded-2xl bg-white p-3 shadow-card">
                            {pixCharge.qrBase64 ? (
                              <img
                                src={`data:image/png;base64,${pixCharge.qrBase64}`}
                                alt="QR Code PIX"
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <QrCode size={86} className="text-green-300" />
                            )}
                          </div>

                          {pixCharge.pixCode && (
                            <div className="mt-4 text-left">
                              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-green-700">
                                PIX copia e cola
                              </p>
                              <div className="max-h-28 overflow-auto break-all rounded-xl border border-green-200 bg-white p-3 font-mono text-[11px] leading-relaxed text-navy-600">
                                {pixCharge.pixCode}
                              </div>
                              <button onClick={copyPixCode} className="btn-green mt-3 w-full">
                                {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar código PIX</>}
                              </button>
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-green-700">
                            <Loader2 size={15} className="animate-spin" />
                            Aguardando confirmação do pagamento…
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={startApiPix}
                          disabled={loading}
                          className="btn-green w-full btn-lg disabled:opacity-60"
                        >
                          {loading ? (
                            <><Loader2 size={18} className="animate-spin" /> Gerando PIX seguro…</>
                          ) : (
                            <><QrCode size={18} /> Gerar PIX e finalizar compra</>
                          )}
                        </button>
                      )
                    ) : (
                      localPix
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="card h-fit p-5 lg:sticky lg:top-24">
            <h3 className="font-display text-lg font-bold text-navy-700">Resumo</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-navy-500">
                <span>Subtotal</span>
                <span>{formatBRL(displaySubtotal)}</span>
              </div>

              {displayDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span><Tag size={13} className="mr-1 inline" />Descontos</span>
                  <span>- {formatBRL(displayDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-navy-500">
                <span>Entrega</span>
                <span>{displayShipping === 0 ? "Grátis" : formatBRL(displayShipping)}</span>
              </div>

              <div className="mt-3 flex justify-between border-t border-cream-200 pt-3 font-display text-xl font-bold text-navy-700">
                <span>Total</span>
                <span className="text-orange-600">{formatBRL(displayTotal)}</span>
              </div>
            </div>

            {settings.freeShippingThreshold > 0 && !reachesFreeShipping && deliveryMethod === "DELIVERY" && (
              <p className="mt-4 rounded-2xl bg-orange-50 p-3 text-xs font-semibold text-orange-700">
                Faltam {formatBRL(Math.max(0, settings.freeShippingThreshold - subtotal))} para o frete grátis.
              </p>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-navy-500">
              <span>🔒 Compra segura</span>
              <span>💳 Pagamento protegido</span>
              <span>📦 Acompanhamento</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
