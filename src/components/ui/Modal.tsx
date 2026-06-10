import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" } as const;

/** Modal acessível com backdrop, fechamento por ESC e clique fora. */
export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 animate-fade-in bg-navy-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-4xl bg-white shadow-soft-lg animate-scale-in sm:rounded-4xl ${sizes[size]}`}
      >
        {title && (
          <div className="sticky top-0 flex items-center justify-between border-b border-cream-200 bg-white px-6 py-4">
            <h3 className="font-display text-xl font-bold text-navy-700">{title}</h3>
            <button
              onClick={onClose}
              className="btn-icon text-navy-400 hover:bg-cream-100"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="border-t border-cream-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
