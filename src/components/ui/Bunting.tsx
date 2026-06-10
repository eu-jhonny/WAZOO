/**
 * Bunting — bandeirinhas estilo Festa Junina
 * Renderiza um barbante com triângulos pendurados, estilo arraial.
 */
interface BuntingProps {
  colors?: string[];
  count?: number;
  className?: string;
  /** Altura total do componente em px */
  height?: number;
}

const DEFAULT_COLORS = [
  "#E63946", "#F4A261", "#2A9D8F", "#E9C46A",
  "#8338EC", "#3A86FF", "#FB5607", "#FFBE0B",
  "#06D6A0", "#EF476F",
];

export function Bunting({
  colors = DEFAULT_COLORS,
  count = 16,
  className = "",
  height = 56,
}: BuntingProps) {
  const w  = 100; // viewBox width units por bandeirinha
  const tw = w * count;
  const flagH = height * 0.65; // altura do triângulo
  const ropeY = height * 0.18; // Y da corda

  return (
    <div className={`w-full overflow-hidden select-none pointer-events-none ${className}`} style={{ height }} aria-hidden>
      <svg
        viewBox={`0 0 ${tw} ${height}`}
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sombra suave */}
        <defs>
          <filter id="bunting-shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.18" />
          </filter>
          <filter id="flag-shadow">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.22" />
          </filter>
        </defs>

        {/* Corda principal — leve curva para cada vão */}
        {Array.from({ length: count + 1 }).map((_, i) => i).reduce<JSX.Element[]>((acc, i) => {
          if (i === count) return acc;
          const x1 = i * w + w * 0.5;
          const x2 = (i + 1) * w + w * 0.5;
          const cy = ropeY + 6; // leve catenária
          acc.push(
            <path
              key={`rope-${i}`}
              d={`M ${x1} ${ropeY} Q ${(x1 + x2) / 2} ${cy} ${x2} ${ropeY}`}
              stroke="#8B6914"
              strokeWidth="2.5"
              fill="none"
              opacity="0.75"
            />
          );
          return acc;
        }, [])}

        {/* Bandeirinhas */}
        {Array.from({ length: count }).map((_, i) => {
          const cx   = i * w + w / 2;
          const col  = colors[i % colors.length];
          // ponto de penduramento
          const topX = cx;
          const topY = ropeY;
          // extremidades base do triângulo
          const bw   = w * 0.62;
          const bl   = cx - bw / 2;
          const br   = cx + bw / 2;
          const by   = topY + flagH;
          // rotação leve alternada para variar
          const rot  = (i % 2 === 0 ? -3 : 3) + (i % 3 === 0 ? 2 : 0);

          return (
            <g key={i} transform={`rotate(${rot}, ${cx}, ${topY})`} filter="url(#flag-shadow)">
              {/* Triângulo preenchido */}
              <polygon
                points={`${topX},${topY} ${bl},${by} ${br},${by}`}
                fill={col}
                opacity="0.93"
              />
              {/* Borda */}
              <polygon
                points={`${topX},${topY} ${bl},${by} ${br},${by}`}
                fill="none"
                stroke="rgba(0,0,0,0.15)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {/* Padrão interno: listras horizontais em algumas bandeiras */}
              {i % 3 === 0 && (
                <>
                  <clipPath id={`clip-${i}`}>
                    <polygon points={`${topX},${topY} ${bl},${by} ${br},${by}`} />
                  </clipPath>
                  <rect
                    x={bl} y={topY + flagH * 0.45}
                    width={bw} height={flagH * 0.15}
                    fill="rgba(255,255,255,0.25)"
                    clipPath={`url(#clip-${i})`}
                  />
                </>
              )}
              {/* Ponto de fixação na corda */}
              <circle cx={topX} cy={topY} r="3.5" fill="#8B6914" opacity="0.9" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
