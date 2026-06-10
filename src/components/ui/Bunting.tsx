/**
 * Bunting — bandeirinhas de Festa Junina, versão refinada.
 * Triângulos limpos com leve balanço (sway), corda em catenária suave
 * e brilho sutil. Use no topo de uma seção festiva.
 */
interface BuntingProps {
  colors?: string[];
  count?: number;
  className?: string;
  /** Altura total do componente em px */
  height?: number;
  /** Ativa o balanço animado das bandeirinhas */
  animated?: boolean;
}

const DEFAULT_COLORS = [
  "#EF476F", "#FFD166", "#06D6A0", "#118AB2",
  "#F78C6B", "#9B5DE5", "#FF9F1C", "#2EC4B6",
];

export function Bunting({
  colors = DEFAULT_COLORS,
  count = 16,
  className = "",
  height = 58,
  animated = true,
}: BuntingProps) {
  const w = 100;
  const tw = w * count;
  const flagH = height * 0.62;
  const ropeY = height * 0.16;

  return (
    <div
      className={`w-full overflow-hidden select-none pointer-events-none ${className}`}
      style={{ height }}
      aria-hidden
    >
      <svg
        viewBox={`0 0 ${tw} ${height}`}
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="bt-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2.2" floodOpacity="0.20" />
          </filter>
        </defs>

        {/* Corda em catenária contínua */}
        <path
          d={Array.from({ length: count }).reduce((d, _, i) => {
            const x1 = i * w + w * 0.5;
            const x2 = (i + 1) * w + w * 0.5;
            const cy = ropeY + 7;
            return `${d} M ${x1} ${ropeY} Q ${(x1 + x2) / 2} ${cy} ${x2} ${ropeY}`;
          }, "")}
          stroke="#7c4a1e"
          strokeWidth="2"
          fill="none"
          opacity="0.65"
          strokeLinecap="round"
        />

        {/* Bandeirinhas */}
        {Array.from({ length: count }).map((_, i) => {
          const cx = i * w + w / 2;
          const col = colors[i % colors.length];
          const topY = ropeY;
          const bw = w * 0.66;
          const bl = cx - bw / 2;
          const br = cx + bw / 2;
          const by = topY + flagH;
          const pts = `${cx},${topY} ${bl},${by} ${br},${by}`;

          return (
            <g
              key={i}
              filter="url(#bt-shadow)"
              style={
                animated
                  ? {
                      transformOrigin: `${cx}px ${topY}px`,
                      transformBox: "fill-box",
                      animation: `wz-sway 3.2s ease-in-out ${(i % 5) * 0.18}s infinite`,
                    }
                  : undefined
              }
            >
              <polygon points={pts} fill={col} />
              {/* Brilho diagonal */}
              <polygon points={`${cx},${topY} ${bl},${by} ${cx},${by}`} fill="rgba(255,255,255,0.18)" />
              {/* Ponto de fixação */}
              <circle cx={cx} cy={topY} r="3" fill="#7c4a1e" opacity="0.85" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
