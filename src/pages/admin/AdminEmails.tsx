/**
 * Central de E-mails (admin).
 *
 * • Mostra o provedor de envio ativo (EmailJS / API / demo).
 * • Pré-visualiza todos os modelos de e-mail com dados de exemplo,
 *   renderizados num <iframe> (fiel ao que o cliente recebe).
 * • Permite enviar um e-mail de teste de qualquer modelo.
 * • Envia um comunicado/promoção para uma lista de e-mails.
 * • Lista o histórico de e-mails (enviados / enfileirados / falhos).
 */
import { useEffect, useMemo, useState } from "react";
import {
  Mail, Send, Eye, Trash2, CheckCircle2, Clock, AlertTriangle,
  Megaphone, Inbox, Sparkles,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { formatDateTime } from "@/lib/format";
import {
  emails,
  getEmailBrand,
  emailProviderStatus,
  readEmailLog,
  clearEmailLog,
  sendEmail,
  welcomeEmail,
  orderConfirmationEmail,
  orderStatusEmail,
  paymentConfirmedEmail,
  reviewRequestEmail,
  abandonedCartEmail,
  newsletterWelcomeEmail,
  passwordChangedEmail,
  promoEmail,
  type EmailContent,
  type EmailRecord,
} from "@/lib/email";

/* ── Dados de exemplo para a pré-visualização ───────────────── */
const SAMPLE_ORDER = {
  id: "WZ-1042",
  customerName: "Ana Souza",
  fulfillment: "entrega" as const,
  items: [
    { name: "Ração Premium Golden 15kg", quantity: 1, price: 289.9 },
    { name: "Petisco Bifinho Carne 500g", quantity: 2, price: 24.5 },
    { name: "Brinquedo Mordedor Resistente", quantity: 1, price: 39.9 },
  ],
  subtotal: 378.8,
  discountAmount: 18.94,
  shippingAmount: 0,
  total: 359.86,
};

interface TemplateDef {
  key: string;
  label: string;
  emoji: string;
  build: (brand: ReturnType<typeof getEmailBrand>) => EmailContent;
  sample: { subject: string; kind: Parameters<typeof sendEmail>[0]["kind"] };
}

const TEMPLATES: TemplateDef[] = [
  {
    key: "welcome", label: "Boas-vindas", emoji: "🐾",
    build: (b) => welcomeEmail(b, { name: "Ana Souza", coupon: "BEMVINDO" }),
    sample: { subject: "welcome", kind: "welcome" },
  },
  {
    key: "order_confirmation", label: "Pedido recebido", emoji: "🎉",
    build: (b) => orderConfirmationEmail(b, SAMPLE_ORDER),
    sample: { subject: "order", kind: "order_confirmation" },
  },
  {
    key: "order_status", label: "Status: saiu para entrega", emoji: "🚚",
    build: (b) => orderStatusEmail(b, { ...SAMPLE_ORDER, status: "Saiu para entrega" }),
    sample: { subject: "status", kind: "order_status" },
  },
  {
    key: "payment_confirmed", label: "Pagamento confirmado", emoji: "💚",
    build: (b) => paymentConfirmedEmail(b, SAMPLE_ORDER),
    sample: { subject: "pay", kind: "payment_confirmed" },
  },
  {
    key: "review_request", label: "Pedido de avaliação", emoji: "🌟",
    build: (b) => reviewRequestEmail(b, { name: "Ana Souza", orderId: "WZ-1042", petName: "Thor" }),
    sample: { subject: "review", kind: "review_request" },
  },
  {
    key: "abandoned_cart", label: "Carrinho abandonado", emoji: "🛒",
    build: (b) => abandonedCartEmail(b, { name: "Ana", items: SAMPLE_ORDER.items, total: SAMPLE_ORDER.subtotal, coupon: "VOLTA10" }),
    sample: { subject: "cart", kind: "abandoned_cart" },
  },
  {
    key: "newsletter_welcome", label: "Newsletter", emoji: "💌",
    build: (b) => newsletterWelcomeEmail(b, { coupon: "WAZOO10" }),
    sample: { subject: "news", kind: "newsletter_welcome" },
  },
  {
    key: "password_changed", label: "Senha alterada", emoji: "🔒",
    build: (b) => passwordChangedEmail(b, { name: "Ana Souza" }),
    sample: { subject: "pass", kind: "password_changed" },
  },
];

/* ── Badge de status do log ─────────────────────────────────── */
function StatusBadge({ s }: { s: EmailRecord["status"] }) {
  if (s === "sent") return <span className="badge bg-green-100 text-green-700"><CheckCircle2 size={12} className="inline mr-1" />Enviado</span>;
  if (s === "failed") return <span className="badge bg-red-100 text-red-700"><AlertTriangle size={12} className="inline mr-1" />Falhou</span>;
  return <span className="badge bg-amber-100 text-amber-700"><Clock size={12} className="inline mr-1" />Na fila</span>;
}

export function AdminEmails() {
  const { showToast } = useToast();
  const brand = useMemo(() => getEmailBrand(), []);
  const provider = useMemo(() => emailProviderStatus(), []);

  const [selected, setSelected] = useState<string>(TEMPLATES[0].key);
  const [testTo, setTestTo] = useState("");
  const [log, setLog] = useState<EmailRecord[]>([]);
  const [viewing, setViewing] = useState<string | null>(null);

  // Promoção / comunicado
  const [promoTo, setPromoTo] = useState("");
  const [promoTitle, setPromoTitle] = useState("Semana do Pet: até 30% OFF 🐾");
  const [promoMsg, setPromoMsg] = useState("Preparamos ofertas especiais em rações, petiscos e brinquedos. Corre que é por tempo limitado!");
  const [promoCoupon, setPromoCoupon] = useState("PETWEEK");

  const refresh = () => setLog(readEmailLog());
  useEffect(() => {
    refresh();
    const onSent = () => refresh();
    window.addEventListener("wazoo:email-sent", onSent);
    return () => window.removeEventListener("wazoo:email-sent", onSent);
  }, []);

  const current = useMemo(() => {
    const def = TEMPLATES.find((t) => t.key === selected) ?? TEMPLATES[0];
    return { def, content: def.build(brand) };
  }, [selected, brand]);

  async function sendTest() {
    const to = testTo.trim();
    if (!/.+@.+\..+/.test(to)) { showToast("Informe um e-mail válido para o teste.", "error"); return; }
    const rec = await sendEmail({ kind: "test", to, toName: "Teste", content: current.content });
    showToast(
      rec.status === "sent" ? `E-mail de teste enviado para ${to}! ✅`
      : rec.status === "failed" ? `Falha no envio: ${rec.error}`
      : `E-mail registrado na fila (modo demo). 📥`,
      rec.status === "failed" ? "error" : "success",
    );
    refresh();
  }

  async function sendPromo() {
    const recipients = promoTo.split(/[\s,;]+/).map((s) => s.trim()).filter((s) => /.+@.+\..+/.test(s));
    if (!recipients.length) { showToast("Informe ao menos um e-mail válido.", "error"); return; }
    if (!promoTitle.trim() || !promoMsg.trim()) { showToast("Preencha título e mensagem.", "error"); return; }
    for (const to of recipients) {
      await emails.promo(to, { title: promoTitle, message: promoMsg, coupon: promoCoupon.trim() || undefined, emoji: "🎉" });
    }
    showToast(`Comunicado disparado para ${recipients.length} destinatário(s)! 🚀`, "success");
    setPromoTo("");
    refresh();
  }

  const viewingRec = viewing ? log.find((l) => l.id === viewing) : null;

  const sentCount = log.filter((l) => l.status === "sent").length;
  const queuedCount = log.filter((l) => l.status === "queued").length;
  const failedCount = log.filter((l) => l.status === "failed").length;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-navy-700">Central de e-mails</h1>
      <p className="mt-1 text-navy-500">
        Modelos, pré-visualização, testes e histórico dos e-mails enviados aos clientes.
      </p>

      {/* ── Status do provedor ─────────────────────────────── */}
      <div className={`card mt-6 flex flex-wrap items-center gap-3 p-5 ${provider.active ? "border-green-200" : "border-amber-200"}`}>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${provider.active ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
          <Mail size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-navy-700">{provider.label}</p>
          <p className="text-sm text-navy-500">
            {provider.active
              ? "Os e-mails são entregues de verdade aos clientes."
              : "Sem provedor configurado: os e-mails ficam registrados na fila local. Configure VITE_EMAILJS_* (ou VITE_EMAIL_API_URL) para envio real."}
          </p>
        </div>
        <div className="flex gap-2 text-center text-xs font-bold">
          <span className="rounded-xl bg-green-50 px-3 py-2 text-green-700">{sentCount}<br/>enviados</span>
          <span className="rounded-xl bg-amber-50 px-3 py-2 text-amber-700">{queuedCount}<br/>na fila</span>
          <span className="rounded-xl bg-red-50 px-3 py-2 text-red-700">{failedCount}<br/>falhas</span>
        </div>
      </div>

      {/* ── Modelos + pré-visualização ─────────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Lista de modelos */}
        <div className="card h-fit p-3">
          <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-navy-400">Modelos</p>
          <div className="mt-1 space-y-1">
            {TEMPLATES.map((t) => (
              <button
                key={t.key}
                onClick={() => setSelected(t.key)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  selected === t.key ? "bg-orange-50 text-orange-700" : "text-navy-600 hover:bg-cream-100"
                }`}
              >
                <span className="text-lg">{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview + teste */}
        <div className="card overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 bg-cream-50 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-navy-700">{current.content.subject}</p>
              <p className="truncate text-xs text-navy-400">{current.content.preheader}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="testar em: seu@email.com"
                className="input h-10 w-52 text-sm"
              />
              <button onClick={sendTest} className="btn-primary h-10 shrink-0 px-4 text-sm">
                <Send size={15} /> Testar
              </button>
            </div>
          </div>
          <iframe
            title="Pré-visualização do e-mail"
            srcDoc={current.content.html}
            className="h-[560px] w-full bg-white"
            sandbox=""
          />
        </div>
      </div>

      {/* ── Comunicado / promoção ──────────────────────────── */}
      <div className="card mt-6 p-6">
        <div className="flex items-center gap-2">
          <Megaphone className="text-orange-500" size={20} />
          <h2 className="font-display text-xl font-bold text-navy-700">Enviar comunicado / promoção</h2>
        </div>
        <p className="mt-1 text-sm text-navy-500">
          Dispare uma novidade para vários clientes de uma vez. Separe os e-mails por vírgula, espaço ou linha.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="label">Destinatários</label>
              <textarea value={promoTo} onChange={(e) => setPromoTo(e.target.value)} rows={3}
                placeholder="cliente1@email.com, cliente2@email.com" className="input" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">Título</label>
                <input value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} className="input" /></div>
              <div><label className="label">Cupom (opcional)</label>
                <input value={promoCoupon} onChange={(e) => setPromoCoupon(e.target.value.toUpperCase())} className="input uppercase" /></div>
            </div>
            <div><label className="label">Mensagem</label>
              <textarea value={promoMsg} onChange={(e) => setPromoMsg(e.target.value)} rows={3} className="input" /></div>
            <button onClick={sendPromo} className="btn-primary w-full"><Sparkles size={16} /> Disparar comunicado</button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-cream-200">
            <iframe
              title="Prévia do comunicado"
              srcDoc={promoEmail(brand, { title: promoTitle || "Título", message: promoMsg || "Mensagem", coupon: promoCoupon.trim() || undefined, emoji: "🎉" }).html}
              className="h-[320px] w-full bg-white"
              sandbox=""
            />
          </div>
        </div>
      </div>

      {/* ── Histórico ──────────────────────────────────────── */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-navy-700">
          <Inbox size={20} className="mr-1 inline text-navy-400" /> Histórico ({log.length})
        </h2>
        {log.length > 0 && (
          <button
            onClick={() => { if (confirm("Limpar todo o histórico de e-mails?")) { clearEmailLog(); refresh(); } }}
            className="btn-ghost border border-cream-200 text-sm text-red-500"
          >
            <Trash2 size={15} /> Limpar
          </button>
        )}
      </div>

      {log.length === 0 ? (
        <div className="card mt-3 flex flex-col items-center p-12 text-center">
          <Mail className="text-orange-400" size={40} />
          <p className="mt-3 font-semibold text-navy-600">Nenhum e-mail registrado ainda.</p>
          <p className="text-sm text-navy-400">Cadastre-se ou finalize um pedido para ver os e-mails aqui.</p>
        </div>
      ) : (
        <div className="card mt-3 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-50 text-left text-xs uppercase text-navy-400">
                  <th className="p-3">Quando</th>
                  <th className="p-3">Para</th>
                  <th className="p-3">Assunto</th>
                  <th className="p-3">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {log.map((r) => (
                  <tr key={r.id} className="border-b border-cream-100 last:border-0 hover:bg-cream-50">
                    <td className="whitespace-nowrap p-3 text-navy-500">{formatDateTime(r.createdAt)}</td>
                    <td className="p-3">
                      <p className="font-semibold text-navy-700">{r.toName || "—"}</p>
                      <p className="text-xs text-navy-400">{r.to || "sem destinatário"}</p>
                    </td>
                    <td className="max-w-xs p-3">
                      <p className="truncate text-navy-600">{r.subject}</p>
                      {r.error && <p className="truncate text-xs text-red-500">{r.error}</p>}
                    </td>
                    <td className="p-3"><StatusBadge s={r.status} /></td>
                    <td className="p-3 text-right">
                      <button onClick={() => setViewing(r.id)} className="rounded-lg p-2 text-navy-400 hover:bg-cream-100 hover:text-orange-600" title="Visualizar">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal de visualização ──────────────────────────── */}
      {viewingRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewing(null)}>
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-cream-200 p-4">
              <div className="min-w-0">
                <p className="truncate font-bold text-navy-700">{viewingRec.subject}</p>
                <p className="truncate text-xs text-navy-400">Para: {viewingRec.to || "—"}</p>
              </div>
              <button onClick={() => setViewing(null)} className="btn-ghost border border-cream-200 text-sm">Fechar</button>
            </div>
            <iframe title="E-mail" srcDoc={viewingRec.html} className="h-[70vh] w-full bg-white" sandbox="" />
          </div>
        </div>
      )}
    </div>
  );
}
