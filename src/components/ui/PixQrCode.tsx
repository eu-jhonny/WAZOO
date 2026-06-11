import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, QrCode as QrIcon } from "lucide-react";
import { buildPixPayload } from "@/lib/pix";
import { formatBRL } from "@/lib/format";

interface PixQrCodeProps {
  /** Chave PIX do recebedor. */
  pixKey: string;
  /** Nome do recebedor (loja). */
  merchantName: string;
  /** Valor a cobrar. */
  amount: number;
  /** Identificador do pedido (vira o txid). */
  txid?: string;
  merchantCity?: string;
}

/**
 * Exibe o QR Code PIX e o "copia e cola", gerados 100% no cliente
 * (sem gateway externo). O QR é desenhado a partir do BR Code.
 */
export function PixQrCode({ pixKey, merchantName, amount, txid, merchantCity }: PixQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const payload = buildPixPayload({
    key: pixKey,
    merchantName,
    merchantCity,
    amount,
    txid,
  });

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(payload, { width: 320, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => { if (active) setDataUrl(url); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [payload]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* clipboard indisponível */ }
  };

  return (
    <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-center sm:p-6">
      <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-700">
        <QrIcon size={14} /> Pague com PIX
      </div>
      <p className="mt-2 text-sm text-green-700">
        Escaneie o código no app do seu banco — valor de <strong>{formatBRL(amount)}</strong>.
      </p>

      <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3 shadow-card">
        {dataUrl ? (
          <img src={dataUrl} alt="QR Code PIX" width={220} height={220} className="h-52 w-52" />
        ) : (
          <div className="flex h-52 w-52 items-center justify-center text-sm text-navy-400">
            {error ? "Não foi possível gerar o QR." : "Gerando QR Code…"}
          </div>
        )}
      </div>

      <div className="mt-4 text-left">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-green-700">PIX copia e cola</p>
        <div className="break-all rounded-xl border border-green-200 bg-white p-3 font-mono text-[11px] leading-relaxed text-navy-600">
          {payload}
        </div>
        <button onClick={copy} className="btn-green mt-3 w-full">
          {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar código PIX</>}
        </button>
      </div>

      <p className="mt-4 text-xs text-green-600">
        Após o pagamento, envie o comprovante pelo WhatsApp para confirmarmos seu pedido. ⏱
      </p>
    </div>
  );
}
