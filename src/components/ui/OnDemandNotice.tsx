import { Info } from "lucide-react";

interface OnDemandNoticeProps {
  text?: string;
  className?: string;
}

const DEFAULT_TEXT =
  "Este produto é vendido sob encomenda. Após o envio do pedido, nossa equipe confirma disponibilidade, prazo e valor final antes da conclusão da compra.";

/** Aviso elegante padrão de "produto sob encomenda". */
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
