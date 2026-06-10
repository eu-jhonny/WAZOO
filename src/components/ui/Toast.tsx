import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useToast, type ToastType } from "@/context/ToastContext";

const styles: Record<
  ToastType,
  { icon: typeof CheckCircle2; iconClass: string; bar: string }
> = {
  success: { icon: CheckCircle2, iconClass: "text-green-500", bar: "bg-green-500" },
  error: { icon: XCircle, iconClass: "text-red-500", bar: "bg-red-500" },
  info: { icon: Info, iconClass: "text-navy-600", bar: "bg-navy-600" },
};

/** Área que renderiza os toasts (feedbacks visuais). */
export function Toaster() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:top-24 sm:items-end">
      {toasts.map((toast) => {
        const { icon: Icon, iconClass, bar } = styles[toast.type];
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-sm animate-pop items-center gap-3 overflow-hidden rounded-2xl border border-cream-200 bg-white py-3 pl-4 pr-3 shadow-soft-lg"
            role="status"
          >
            <span className={`h-9 w-1.5 shrink-0 rounded-full ${bar}`} />
            <Icon className={`shrink-0 ${iconClass}`} size={22} />
            <p className="flex-1 text-sm font-semibold text-navy-700">
              {toast.message}
            </p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 rounded-full p-1 text-navy-300 transition-colors hover:bg-cream-100 hover:text-navy-600"
              aria-label="Fechar aviso"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
