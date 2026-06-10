import { useStore } from "@/context/StoreContext";
import { whatsappLink, defaultContactMessage } from "@/lib/whatsapp";
import { WhatsAppIcon } from "./ui/WhatsAppIcon";

/** Botão flutuante de WhatsApp presente em todas as páginas. */
export function WhatsAppButton() {
  const { settings } = useStore();

  return (
    <a
      href={whatsappLink(defaultContactMessage, settings.whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-green-500 px-4 py-4 text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-green-600 sm:px-5"
      aria-label="Fale conosco no WhatsApp"
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-20" />
      <WhatsAppIcon size={26} className="relative" />
      <span className="relative hidden max-w-0 overflow-hidden whitespace-nowrap font-bold transition-all duration-300 group-hover:max-w-[140px] sm:inline-block">
        Fale conosco
      </span>
    </a>
  );
}
