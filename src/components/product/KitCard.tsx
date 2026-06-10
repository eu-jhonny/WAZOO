import { Clock, PawPrint } from "lucide-react";
import type { Kit } from "@/types";
import { formatBRL } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import { whatsappLink, buildKitMessage } from "@/lib/whatsapp";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";

const accent: Record<
  Kit["accent"],
  { grad: string; text: string; chip: string }
> = {
  orange: { grad: "from-orange-400 to-orange-600", text: "text-orange-600", chip: "bg-orange-100 text-orange-700" },
  teal: { grad: "from-brand-teal to-navy-600", text: "text-brand-teal", chip: "bg-cream-100 text-navy-600" },
  green: { grad: "from-green-400 to-green-600", text: "text-green-600", chip: "bg-green-100 text-green-700" },
  pink: { grad: "from-brand-pink to-orange-500", text: "text-brand-pink", chip: "bg-orange-100 text-orange-700" },
  purple: { grad: "from-brand-purple to-navy-600", text: "text-brand-purple", chip: "bg-cream-100 text-navy-600" },
};

export function KitCard({ kit }: { kit: Kit }) {
  const { addKit } = useCart();
  const { settings } = useStore();
  const a = accent[kit.accent];

  return (
    <div className="card card-hover group flex flex-col overflow-hidden">
      <div
        className={`relative flex h-48 items-end justify-center overflow-hidden bg-gradient-to-br ${a.grad}`}
      >
        <div className="absolute inset-0 bg-dots-light" />
        <span className="badge absolute left-4 top-4 bg-white/90 text-navy-700 shadow-sm">
          <PawPrint size={13} /> Kit sob encomenda
        </span>
        <img
          src={kit.image}
          alt={kit.name}
          loading="lazy"
          className="relative h-44 w-auto object-contain drop-shadow-2xl transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-bold text-navy-700">{kit.name}</h3>
        <p className="mt-1 text-sm text-navy-500">{kit.description}</p>

        <ul className="mt-3 flex flex-wrap gap-1.5">
          {kit.items.map((item) => (
            <li key={item} className={`badge ${a.chip}`}>
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="text-xs font-medium text-navy-400">A partir de</span>
            <p className={`font-display text-2xl font-bold ${a.text}`}>
              {formatBRL(kit.price)}
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-navy-500">
            <Clock size={14} className="text-orange-500" />
            {kit.leadTime}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => addKit(kit)} className="btn-primary btn-sm">
            Adicionar
          </button>
          <a
            href={whatsappLink(buildKitMessage(kit), settings.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-green btn-sm"
          >
            <WhatsAppIcon size={16} /> Solicitar
          </a>
        </div>
      </div>
    </div>
  );
}
