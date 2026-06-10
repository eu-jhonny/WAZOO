import { useMemo } from "react";

/**
 * Confetti — chuva de confetes animada com as cores da Copa (Brasil).
 * 100% CSS, sem dependências. Use dentro de um container `relative overflow-hidden`.
 * Cada peça tem posição, atraso, duração, cor, tamanho e formato aleatórios.
 */
interface ConfettiProps {
  /** Quantidade de peças (padrão 36). */
  count?: number;
  /** Paleta de cores. Padrão: cores da Copa / Brasil. */
  colors?: string[];
  className?: string;
}

const COPA_COLORS = [
  "#009C3B", // verde Brasil
  "#FFDF00", // amarelo
  "#002776", // azul
  "#FFFFFF", // branco
  "#00A859",
  "#FFC400",
];

export function Confetti({
  count = 36,
  colors = COPA_COLORS,
  className = "",
}: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 6;
        const duration = 5 + Math.random() * 5;
        const size = 6 + Math.random() * 7;
        const color = colors[i % colors.length];
        const circle = Math.random() > 0.55;
        const drift = (Math.random() - 0.5) * 60;
        const rotate = Math.random() * 360;
        return { left, delay, duration, size, color, circle, drift, rotate, i };
      }),
    [count, colors],
  );

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {pieces.map((p) => (
        <span
          key={p.i}
          className="wz-confetti"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.circle ? p.size : p.size * 1.6}px`,
            backgroundColor: p.color,
            borderRadius: p.circle ? "9999px" : "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            // @ts-expect-error CSS custom props
            "--wz-drift": `${p.drift}px`,
            "--wz-rot": `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}
