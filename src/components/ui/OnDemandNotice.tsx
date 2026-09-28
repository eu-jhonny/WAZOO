import { Info } from "lucide-react";

interface OnDemandNoticeProps {
  text?: string;
  className?: string;
}

const DEFAULT_TEXT =
  "Confira disponibilidade, prazo de entrega e condições de pagamento antes de finalizar sua compra.";

/** Aviso de disponibilidade e condições de compra. */
export function OnDemandNotice({ text = DEFAULT_TEXT, className = "" }: OnDemandNoticeProps) {
  return (
    <div
      className={`flex gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 ${className}`}
    >
      <Info className="mt-0.5 shrink-0 text-orange-500" size={20} />
      <p className="text-sm leading-relaxed text-navy-700">{text}</p>
    </div>
  );
}
