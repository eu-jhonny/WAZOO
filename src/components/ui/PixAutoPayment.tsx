import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Loader2, QrCode as QrIcon, CheckCircle2 } from "lucide-react";
import { createPixCharge, getPixStatus, type PixCharge } from "@/lib/pixProvider";
import { formatBRL } from "@/lib/format";

interface PixAutoPaymentProps {
  amount: number;
  payerEmail: string;
  payerName?: string;
  description?: string;
  txid?: string;
  /** Chamado automaticamente quando o pagamento é confirmado. */
  onPaid: () => void;
  /** Conteúdo exibido se o PIX automático não puder ser gerado (PIX estático). */
  fallback: ReactNode;
}

type Phase = "creating" | "waiting" | "paid" | "failed";

/**
 * PIX com confirmação automática: cria a cobrança no provedor, mostra o QR
 * e faz polling do status até "pago" — então dispara onPaid (registra o
 * pedido). Se o provedor não estiver disponível, renderiza o fallback.
 */
export function PixAutoPayment({
  amount, payerEmail, payerName, description, txid, onPaid, fallback,
}: PixAutoPaymentProps) {
  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [phase, setPhase] = useState<Phase>("creating");
  const [copied, setCopied] = useState(false);
  const paidOnce = useRef(false);

  /* Cria a cobrança uma vez ao montar */
  useEffect(() => {
    let active = true;
    createPixCharge({ amount, payerEmail, payerName, description, txid }).then((c) => {
      if (!active) return;
      if (c) { setCharge(c); setPhase("waiting"); }
      else setPhase("failed");
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Polling do status enquanto aguarda pagamento */
  useEffect(() => {
    if (phase !== "waiting" || !charge) return;
    let active = true;
    const tick = async () => {
      const s = await getPixStatus(charge.id);
      if (active && s === "paid") setPhase("paid");
    };
    const iv = setInterval(tick, 4000);
    tick();
    return () => { active = false; clearInterval(iv); };
  }, [phase, charge]);

  /* Dispara onPaid uma única vez quando confirmado */
  useEffect(() => {
    if (phase === "paid" && !paidOnce.current) {
      paidOnce.current = true;
      const t = setTimeout(onPaid, 900); // mostra "confirmado" por um instante
      return () => clearTimeout(t);
    }
  }, [phase, onPaid]);

  const copy = async () => {
    if (!charge) return;
    try {
      await navigator.clipboard.writeText(charge.copiaECola);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* clipboard indisponível */ }
  };

  if (phase === "failed") return <>{fallback}</>;

  if (phase === "paid") {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2 size={48} className="mx-auto text-green-500 animate-pop" />
        <p className="mt-3 font-display text-lg font-bold text-green-700">Pagamento confirmado! 🎉</p>
        <p className="text-sm text-green-600">Registrando seu pedido…</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-center sm:p-6">
      <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-700">
        <QrIcon size={14} /> Pague com PIX
      </div>
      <p className="mt-2 text-sm text-green-700">
        Escaneie e pague <strong>{formatBRL(amount)}</strong> — a confirmação é automática.
      </p>

      <div className="mx-auto mt-4 flex h-56 w-56 items-center justify-center rounded-2xl bg-white p-3 shadow-card">
        {phase === "creating" || !charge ? (
          <span className="flex flex-col items-center gap-2 text-sm text-navy-400">
            <Loader2 size={22} className="animate-spin" /> Gerando cobrança…
          </span>
        ) : (
          <img
            src={`data:image/png;base64,${charge.qrBase64}`}
            alt="QR Code PIX"
            className="h-full w-full object-contain"
          />
        )}
      </div>

      {charge && (
        <div className="mt-4 text-left">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-green-700">PIX copia e cola</p>
          <div className="break-all rounded-xl border border-green-200 bg-white p-3 font-mono text-[11px] leading-relaxed text-navy-600">
            {charge.copiaECola}
          </div>
          <button onClick={copy} className="btn-green mt-3 w-full">
            {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar código PIX</>}
          </button>
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-green-700">
        <Loader2 size={15} className="animate-spin" /> Aguardando o pagamento…
      </div>
      <p className="mt-1 text-xs text-green-600">
        Assim que o PIX cair, seu pedido é registrado automaticamente. Pode deixar esta tela aberta.
      </p>
    </div>
  );
}
