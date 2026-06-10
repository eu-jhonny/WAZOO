/**
 * Checkout com MercadoPago Bricks — pagamento 100% embutido na página.
 *
 * SETUP necessário:
 *   1. npm install @mercadopago/sdk-react (na raiz do projeto frontend)
 *   2. Criar .env com: VITE_MP_PUBLIC_KEY=APP_USR-xxxx
 *   3. O backend deve estar rodando em VITE_API_URL=http://localhost:3001
 */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, ShoppingBag, Tag, Truck, MapPin, CreditCard, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import { formatBRL } from "@/lib/format";

/* ── Tipos ──────────────────────────────────────────────────── */
interface CustomerForm {
  name: string; email: string; phone: string; cpf: string;
}
interface AddressForm {
  street: string; number: string; complement: string;
  neighborhood: string; city: string; state: string; zip: string;
}

type PaymentMethod = "credit_card" | "debit_card" | "pix" | "boleto";
type Step = "cart" | "customer" | "address" | "payment" | "success";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

/* ── Formatadores ─────────────────────────────────────────── */
function fmtCPF(v: string) {
  return v.replace(/\D/g, "").slice(0,11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function fmtPhone(v: string) {
  return v.replace(/\D/g, "").slice(0,11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{4})$/, "$1-$2");
}
function fmtCEP(v: string) {
  return v.replace(/\D/g, "").slice(0,8).replace(/(\d{5})(\d)/, "$1-$2");
}

/* ── Busca CEP ──────────────────────────────────────────────── */
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

/* ── PIX QR Code Display ───────────────────────────────────── */
function PixDisplay({ pixCode, pixBase64 }: { pixCode?: string; pixBase64?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!pixCode) return;
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-3xl bg-green-50 p-6 text-center">
      <h3 className="font-display text-xl font-bold text-green-700">Pague com PIX 📱</h3>
      <p className="mt-1 text-sm text-green-600">Escaneie o QR Code ou copie o código</p>
      {pixBase64 && (
        <img src={`data:image/png;base64,${pixBase64}`} alt="QR Code PIX" className="mx-auto mt-4 h-48 w-48 rounded-2xl" />
      )}
      {pixCode && (
        <div className="mt-4">
          <div className="rounded-xl bg-white p-3 font-mono text-xs text-navy-600 break-all border border-green-200">
            {pixCode.slice(0, 60)}...
          </div>
          <button onClick={copy} className="btn-green mt-3 w-full">
            {copied ? "✅ Copiado!" : "📋 Copiar código PIX"}
          </button>
        </div>
      )}
      <p className="mt-4 text-xs text-green-600">⏱ O código expira em 30 minutos. Após o pagamento, seu pedido será confirmado automaticamente.</p>
    </div>
  );
}

/* ── Componente principal ─────────────────────────────────── */
export function Checkout() {
  const { items, total: cartTotal, clearCart } = useCart();
  const { settings } = useStore();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("cart");
  const [customer, setCustomer] = useState<CustomerForm>({ name: "", email: "", phone: "", cpf: "" });
  const [address, setAddress] = useState<AddressForm>({ street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zip: "" });
  const [deliveryMethod, setDeliveryMethod] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ pixCode?: string; pixBase64?: string; boletoUrl?: string; status?: string }>({});
  const [mpLoaded, setMpLoaded] = useState(false);
  const [cardData, setCardData] = useState({ token: "", installments: 1, paymentMethodId: "" });

  const shippingAmount = deliveryMethod === "DELIVERY" ? 15 : 0;
  const subtotal = cartTotal;
  const total = Math.max(0, subtotal - couponDiscount + shippingAmount);

  /* Carrega SDK MP no head */
  useEffect(() => {
    const mpKey = import.meta.env.VITE_MP_PUBLIC_KEY;
    if (!mpKey || mpLoaded) return;
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.onload = () => setMpLoaded(true);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [mpLoaded]);

  /* Monta o CardForm do MercadoPago (Bricks lite) */
  useEffect(() => {
    if (step !== "payment" || paymentMethod !== "credit_card" || !mpLoaded) return;
    const mpKey = import.meta.env.VITE_MP_PUBLIC_KEY;
    if (!mpKey || !(window as any).MercadoPago) return;

    const mp = new (window as any).MercadoPago(mpKey, { locale: "pt-BR" });
    const cardForm = mp.cardForm({
      amount: String(total),
      autoMount: true,
      form: {
        id: "mp-card-form",
        cardholderName: { id: "mp-cardholder", placeholder: "Nome no cartão" },
        cardholderEmail: { id: "mp-email", placeholder: "E-mail" },
        cardNumber: { id: "mp-card-number", placeholder: "Número do cartão" },
        cardExpirationMonth: { id: "mp-exp-month", placeholder: "MM" },
        cardExpirationYear: { id: "mp-exp-year", placeholder: "AA" },
        securityCode: { id: "mp-cvv", placeholder: "CVV" },
        installments: { id: "mp-installments" },
        identificationType: { id: "mp-doctype" },
        identificationNumber: { id: "mp-docnumber", placeholder: "CPF" },
        issuer: { id: "mp-issuer" },
      },
      callbacks: {
        onFormMounted: (err: any) => { if (err) console.error(err); },
        onSubmit: async (e: any) => {
          e.preventDefault();
          const { getCardFormData } = cardForm;
          const formData = getCardFormData();
          setCardData({
            token: formData.token,
            installments: parseInt(formData.installments),
            paymentMethodId: formData.paymentMethodId,
          });
        },
      },
    });
    return () => cardForm.unmount?.();
  }, [step, paymentMethod, mpLoaded, total]);

  /* ── Funções ─────────────────────────────────────────────── */
  async function applyCoupon() {
    setCouponError("");
    try {
      const r = await fetch(`${API}/api/orders/validate-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal }),
      });
      const d = await r.json();
      if (!r.ok) { setCouponError(d.error); return; }
      setCouponDiscount(d.discount);
    } catch { setCouponError("Erro ao validar cupom"); }
  }

  async function createOrder(): Promise<string> {
    const body = {
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone.replace(/\D/g, ""),
      customerDoc: customer.cpf.replace(/\D/g, ""),
      deliveryMethod,
      ...(deliveryMethod === "DELIVERY" && {
        addressStreet: address.street,
        addressNumber: address.number,
        addressComplement: address.complement,
        addressNeighborhood: address.neighborhood,
        addressCity: address.city,
        addressState: address.state,
        addressZip: address.zip.replace(/\D/g, ""),
      }),
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.price,
        image: i.image,
        ...(i.kind === "product" ? { productId: i.id } : { kitId: i.id }),
      })),
      couponCode: couponCode || undefined,
      customerNote: "",
    };
    const r = await fetch(`${API}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error((await r.json()).error ?? "Erro ao criar pedido");
    const order = await r.json();
    return order.id;
  }

  async function processPayment(oId: string) {
    const [firstName, ...rest] = customer.name.trim().split(" ");
    const lastName = rest.join(" ") || firstName;
    const cpf = customer.cpf.replace(/\D/g, "");

    const body: Record<string, unknown> = {
      orderId: oId,
      email: customer.email,
      cpf,
      firstName,
      lastName,
      method: paymentMethod,
    };

    if (paymentMethod === "credit_card") {
      if (!cardData.token) throw new Error("Dados do cartão inválidos");
      body.token = cardData.token;
      body.installments = cardData.installments;
      body.paymentMethodId = cardData.paymentMethodId;
    }

    const r = await fetch(`${API}/api/payments/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error((await r.json()).error ?? "Erro no pagamento");
    return r.json();
  }

  async function handleFinalize() {
    setLoading(true);
    try {
      const oId = await createOrder();
      setOrderId(oId);

      const result = await processPayment(oId);
      setOrderNumber(result.orderNumber ?? oId);
      setPaymentResult({
        pixCode: result.pixCode,
        pixBase64: result.pixQrBase64,
        boletoUrl: result.boletoUrl,
        status: result.status,
      });

      clearCart();
      setStep("success");
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (!items.length && step !== "success") {
    return (
      <div className="container-app py-20 text-center">
        <span className="text-6xl">🛒</span>
        <h2 className="section-title mt-6">Seu carrinho está vazio</h2>
        <Link to="/produtos" className="btn-primary mt-6">Ver produtos</Link>
      </div>
    );
  }

  /* ═══ SUCCESS ═════════════════════════════════════════════ */
  if (step === "success") {
    return (
      <div className="container-app max-w-lg py-20 text-center">
        <CheckCircle size={72} className="mx-auto text-green-500" />
        <h1 className="section-title mt-6">Pedido criado! 🎉</h1>
        <p className="mt-3 text-navy-500">Número do pedido: <strong className="text-navy-700">{orderNumber}</strong></p>

        {paymentResult.status === "APPROVED" && (
          <div className="mt-6 rounded-3xl bg-green-50 p-5 text-green-700">✅ Pagamento aprovado! Em breve você receberá a confirmação.</div>
        )}

        {(paymentResult.status === "PENDING" || paymentResult.status === "IN_PROCESS") && paymentMethod === "pix" && (
          <div className="mt-6">
            <PixDisplay pixCode={paymentResult.pixCode} pixBase64={paymentResult.pixBase64} />
          </div>
        )}

        {paymentMethod === "boleto" && paymentResult.boletoUrl && (
          <a href={paymentResult.boletoUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-6 block">
            📄 Abrir boleto
          </a>
        )}

        {paymentMethod === "credit_card" && paymentResult.status === "REJECTED" && (
          <div className="mt-6 rounded-3xl bg-red-50 p-5 text-red-700">
            ❌ Pagamento recusado. Tente novamente ou escolha outro método.
          </div>
        )}

        <p className="mt-6 text-sm text-navy-400">Dúvidas? Fale conosco pelo WhatsApp: {settings.whatsapp}</p>
        <Link to="/" className="btn-outline-orange mt-6">Voltar para a loja</Link>
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

  return (
    <div className="bg-cream-50 py-8 sm:py-12">
      <div className="container-app max-w-4xl">

        {/* Back button */}
        <button onClick={() => stepIdx > 0 ? setStep(steps[stepIdx - 1].key) : navigate(-1)} className="mb-6 flex items-center gap-2 text-navy-500 hover:text-navy-700">
          <ArrowLeft size={18} /> Voltar
        </button>

        <h1 className="font-display text-3xl font-bold text-navy-700">Finalizar Pedido</h1>

        {/* Progress steps */}
        <div className="mt-6 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${i <= stepIdx ? "bg-orange-500 text-white" : "bg-cream-200 text-navy-400"}`}>{i + 1}</div>
              <span className={`hidden text-sm font-semibold sm:block ${i === stepIdx ? "text-orange-600" : "text-navy-400"}`}>{s.label}</span>
              {i < steps.length - 1 && <div className={`h-px w-8 sm:w-12 ${i < stepIdx ? "bg-orange-400" : "bg-cream-200"}`} />}
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* ── Conteúdo do step ─────────────────── */}
          <div className="card p-6 sm:p-8">

            {/* STEP: CART */}
            {step === "cart" && (
              <div>
                <h2 className="font-display text-xl font-bold text-navy-700">Resumo do carrinho</h2>
                <div className="mt-4 space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-cream-50 p-3">
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
                  {couponDiscount > 0 && <p className="mt-1 text-sm font-bold text-green-600">✅ Desconto de {formatBRL(couponDiscount)} aplicado!</p>}
                </div>

                <button onClick={() => setStep("customer")} className="btn-primary mt-6 w-full">Continuar → Dados pessoais</button>
              </div>
            )}

            {/* STEP: CUSTOMER */}
            {step === "customer" && (
              <div>
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
                  disabled={!customer.name || !customer.email || !customer.phone || !customer.cpf}
                  onClick={() => setStep("address")}
                  className="btn-primary mt-6 w-full disabled:opacity-60"
                >
                  Continuar → Entrega
                </button>
              </div>
            )}

            {/* STEP: ADDRESS */}
            {step === "address" && (
              <div>
                <h2 className="font-display text-xl font-bold text-navy-700">Forma de entrega</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { key: "DELIVERY" as const, label: "Entrega", icon: Truck, desc: "Receba em casa" },
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
              <div>
                <h2 className="font-display text-xl font-bold text-navy-700">Forma de pagamento</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { key: "pix" as const,         label: "PIX",           icon: "💚", desc: "Aprovação imediata" },
                    { key: "credit_card" as const,  label: "Cartão Crédito", icon: "💳", desc: "Até 12x sem juros" },
                    { key: "boleto" as const,       label: "Boleto",        icon: "📄", desc: "Vencimento em 3 dias" },
                  ].map((m) => (
                    <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                      className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-4 transition-all ${paymentMethod === m.key ? "border-orange-500 bg-orange-50" : "border-cream-200 hover:border-orange-200"}`}>
                      <span className="text-2xl">{m.icon}</span>
                      <p className="text-sm font-bold text-navy-700">{m.label}</p>
                      <p className="text-[10px] text-navy-400">{m.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Formulário Cartão MercadoPago */}
                {paymentMethod === "credit_card" && (
                  <div className="mt-6 rounded-2xl border border-cream-200 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-navy-600">
                      <CreditCard size={16} /> Dados do cartão (criptografado pelo MercadoPago)
                    </div>
                    {mpLoaded ? (
                      <form id="mp-card-form" className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2"><input id="mp-cardholder" className="input" /></div>
                        <div className="sm:col-span-2"><input id="mp-email" className="input" /></div>
                        <div className="sm:col-span-2"><input id="mp-card-number" className="input" /></div>
                        <div><input id="mp-exp-month" className="input" /></div>
                        <div><input id="mp-exp-year" className="input" /></div>
                        <div><input id="mp-cvv" className="input" /></div>
                        <div><select id="mp-doctype" className="input" /></div>
                        <div><input id="mp-docnumber" className="input" /></div>
                        <div><select id="mp-issuer" className="input" /></div>
                        <div className="sm:col-span-2"><select id="mp-installments" className="input" /></div>
                      </form>
                    ) : (
                      <div className="flex items-center gap-2 text-navy-400"><Loader2 size={16} className="animate-spin" /> Carregando formulário seguro...</div>
                    )}
                  </div>
                )}

                {paymentMethod === "pix" && (
                  <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
                    💚 O QR Code PIX será gerado após confirmar o pedido. Válido por 30 minutos.
                  </div>
                )}
                {paymentMethod === "boleto" && (
                  <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">
                    📄 O boleto será gerado após confirmar o pedido. Prazo de compensação: 1-3 dias úteis.
                  </div>
                )}

                <button onClick={handleFinalize} disabled={loading} className="btn-primary mt-6 w-full disabled:opacity-60">
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Processando...</> : "🔒 Confirmar e pagar"}
                </button>
                <p className="mt-2 text-center text-xs text-navy-400">🔒 Pagamento seguro processado pelo MercadoPago</p>
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
                  <span><Tag size={13} className="inline mr-1" />Desconto ({couponCode})</span>
                  <span>- {formatBRL(couponDiscount)}</span>
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
              <p>🐾 <strong>Sob encomenda</strong> — prazo médio de 5–7 dias úteis após confirmação do pagamento.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
