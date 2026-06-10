/**
 * CopaDecor — elementos decorativos de Copa do Mundo flutuando ao fundo.
 * Bolas de futebol, troféus e estrelas com animação suave de flutuação.
 * Use dentro de um container `relative overflow-hidden`.
 */
interface CopaDecorProps {
  className?: string;
  /** Mostra o gramado/campo sutil na base. */
  field?: boolean;
}

const ELEMENTS = [
  { emoji: "⚽", top: "12%", left: "6%",  size: "2rem",   dur: "7s",  delay: "0s"   },
  { emoji: "🏆", top: "60%", left: "10%", size: "1.6rem", dur: "9s",  delay: "1.2s" },
  { emoji: "⚽", top: "70%", left: "88%", size: "2.4rem", dur: "8s",  delay: "0.5s" },
  { emoji: "⭐", top: "20%", left: "82%", size: "1.4rem", dur: "6s",  delay: "0.8s" },
  { emoji: "🥇", top: "38%", left: "92%", size: "1.5rem", dur: "10s", delay: "2s"   },
  { emoji: "⭐", top: "82%", left: "48%", size: "1.1rem", dur: "7.5s",delay: "1.5s" },
];

export function CopaDecor({ className = "", field = false }: CopaDecorProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {/* Padrão hexagonal sutil (gomos de bola) */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="copa-hex" width="40" height="46" patternUnits="userSpaceOnUse" patternTransform="scale(1.4)">
            <path
              d="M20 0 L40 11.5 L40 34.5 L20 46 L0 34.5 L0 11.5 Z"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#copa-hex)" />
      </svg>

      {/* Elementos flutuantes */}
      {ELEMENTS.map((el, i) => (
        <span
          key={i}
          className="absolute drop-shadow-lg"
          style={{
            top: el.top,
            left: el.left,
            fontSize: el.size,
            animation: `wz-float-bob ${el.dur} ease-in-out ${el.delay} infinite`,
          }}
        >
          {el.emoji}
        </span>
      ))}

      {/* Gramado sutil na base */}
      {field && (
        <div
          className="absolute inset-x-0 bottom-0 h-16 opacity-20"
          style={{
            background:
              "repeating-linear-gradient(90deg, #0a8f3c 0 40px, #0c9d42 40px 80px)",
            maskImage: "linear-gradient(to top, black, transparent)",
            WebkitMaskImage: "linear-gradient(to top, black, transparent)",
          }}
        />
      )}
    </div>
  );
}
