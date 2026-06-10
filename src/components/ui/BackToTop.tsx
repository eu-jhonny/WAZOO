import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Botão flutuante "voltar ao topo" — aparece após rolar a página.
 * Canto inferior esquerdo para não colidir com WhatsApp / WazooAI.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo"
      className={`fixed bottom-5 left-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-navy-800 text-white shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-navy-900 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp size={20} />
    </button>
  );
}
