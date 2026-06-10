type DecorVariant = "warm" | "cool" | "green" | "default";

interface DecorProps {
  className?: string;
  dots?: boolean;
  variant?: DecorVariant;
}

/**
 * Blobs coloridos desfocados para dar energia "pet fofo" sem poluir.
 * Use dentro de um container `relative overflow-hidden`.
 */
export function Decor({ className = "", dots = false, variant = "default" }: DecorProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Blobs por variante */}
      {variant === "warm" && (
        <>
          <span className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-orange-300/35 blur-3xl" />
          <span className="absolute -right-16 -top-8 h-64 w-64 rounded-full bg-brand-pink/20 blur-3xl" />
          <span className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-brand-yellow/25 blur-3xl" />
          <span className="absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-orange-200/30 blur-3xl" />
        </>
      )}
      {variant === "cool" && (
        <>
          <span className="absolute -left-20 -top-16 h-64 w-64 rounded-full bg-brand-teal/25 blur-3xl" />
          <span className="absolute -right-16 top-4 h-56 w-56 rounded-full bg-brand-purple/20 blur-3xl" />
          <span className="absolute -bottom-20 left-1/4 h-64 w-64 rounded-full bg-brand-teal/15 blur-3xl" />
          <span className="absolute bottom-0 right-1/3 h-48 w-48 rounded-full bg-brand-pink/15 blur-3xl" />
        </>
      )}
      {variant === "green" && (
        <>
          <span className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-green-300/25 blur-3xl" />
          <span className="absolute -right-20 top-8 h-56 w-56 rounded-full bg-brand-teal/20 blur-3xl" />
          <span className="absolute -bottom-20 left-1/3 h-60 w-60 rounded-full bg-green-200/20 blur-3xl" />
        </>
      )}
      {variant === "default" && (
        <>
          <span className="absolute -left-20 -top-16 h-56 w-56 rounded-full bg-orange-300/28 blur-3xl" />
          <span className="absolute -right-16 top-0 h-52 w-52 rounded-full bg-brand-teal/22 blur-3xl" />
          <span className="absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-brand-purple/18 blur-3xl" />
          <span className="absolute -bottom-16 right-1/4 h-44 w-44 rounded-full bg-brand-pink/18 blur-3xl" />
        </>
      )}

      {/* Pontinhos decorativos opcionais */}
      {dots && (
        <svg
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="wz-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#wz-dots)"
            className="text-orange-400 opacity-[0.06]"
          />
        </svg>
      )}
    </div>
  );
}
