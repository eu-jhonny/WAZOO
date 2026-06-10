import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const INTERVAL_MS = 6000;

/* ── Slides: imagem como protagonista, overlay mínimo ─────────── */
const SLIDES = [
  {
    id: "copa",
    image: "/images/banners/copa.jpg",
    fallbackColor: "#071444",
    badge: "⚽ Edição Especial · Copa 2026",
    badgeColor: "bg-[#FFDF00]/20 text-[#FFDF00] border-[#FFDF00]/30",
    title: "Copa dos Pets! 🏆",
    subtitle: "Vista seu pet com as cores do Brasil.\nBandanas, roupinhas e kits temáticos.",
    ctas: [
      { to: "/produtos", label: "Ver coleção Copa →", style: "bg-[#FFDF00] text-[#002776] hover:bg-yellow-300" },
      { to: "/kits",     label: "Ver kits",           style: "bg-[#009C3B] text-white hover:bg-green-700" },
    ],
    extra: (
      <div className="absolute right-8 bottom-6 hidden sm:flex lg:right-16">
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 border-[#FFDF00] text-center shadow-soft-lg sm:h-28 sm:w-28 bg-[#002776]">
          <span className="text-2xl sm:text-3xl">🏆</span>
          <span className="font-display text-[10px] font-extrabold uppercase text-[#FFDF00] sm:text-xs">Copa<br/>2026</span>
        </div>
      </div>
    ),
  },
  {
    id: "caes",
    image: "/images/banners/cachorros.jpg",
    fallbackColor: "#7C3A00",
    badge: "🐕 Linha Cachorros",
    badgeColor: "bg-amber-400/20 text-amber-200 border-amber-400/30",
    title: "Para o seu\nmelhor amigo",
    subtitle: "Coleiras, roupinhas, brinquedos e mimos.\nTudo sob encomenda, com muito amor.",
    ctas: [
      { to: "/cachorros", label: "Ver tudo para cães →", style: "bg-white text-orange-700 hover:bg-cream-50" },
    ],
    extra: null,
  },
  {
    id: "gatos",
    image: "/images/banners/gatos.jpg",
    fallbackColor: "#2D1B69",
    badge: "🐈 Linha Gatos",
    badgeColor: "bg-purple-400/20 text-purple-200 border-purple-400/30",
    title: "Mimos para\nos felinos",
    subtitle: "Arranhadores, casinhas, petiscos e acessórios.\nConforto e estilo para o seu gato.",
    ctas: [
      { to: "/gatos", label: "Ver tudo para gatos →", style: "bg-white text-purple-700 hover:bg-cream-50" },
    ],
    extra: null,
  },
  {
    id: "festa",
    image: "/images/banners/festajunina.jpg",
    fallbackColor: "#9A3412",
    badge: "🎉 Arraiá Pet 2025",
    badgeColor: "bg-yellow-400/20 text-yellow-200 border-yellow-400/30",
    title: "Festa Junina\ndos Pets! 🌽",
    subtitle: "Chapéus de palha, bandanas xadrez e kits temáticos.\nFaça seu pet brilhar no arraial!",
    ctas: [
      { to: "/kits", label: "Ver kits Festa Junina →", style: "bg-white text-orange-700 hover:bg-cream-50" },
    ],
    extra: null,
  },
  {
    id: "promo",
    image: "/images/banners/promo.jpg",
    fallbackColor: "#1E3A5F",
    badge: "🔥 Semana de Ofertas",
    badgeColor: "bg-white/15 text-white border-white/20",
    title: "Promoções\nImperdíveis!",
    subtitle: "Descontos de até 30% em produtos selecionados.\nUse o cupom WAZOO10 e economize mais!",
    ctas: [
      { to: "/produtos", label: "Aproveitar agora →", style: "bg-orange-500 text-white hover:bg-orange-600 shadow-glow" },
    ],
    extra: (
      <div className="absolute top-8 right-12 hidden sm:flex flex-col items-center justify-center h-24 w-24 rounded-full bg-orange-500 shadow-glow text-white font-display text-center font-bold leading-tight">
        <span className="text-2xl">30%</span>
        <span className="text-xs uppercase">OFF</span>
      </div>
    ),
  },
] as const;

/* ── Animação de entrada ─────────────────────────────────────── */
function Anim({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div style={{ animation: `slide-in-left 0.55s ${delay}s ease-out both` }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════════════ */
export function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const progressRef           = useRef<HTMLDivElement>(null);
  const total                 = SLIDES.length;

  const go = useCallback((idx: number) => {
    setCurrent(idx);
    setAnimKey((k) => k + 1);
    if (progressRef.current) {
      progressRef.current.style.animation = "none";
      void progressRef.current.offsetHeight;
      progressRef.current.style.animation = "";
    }
  }, []);

  const next = useCallback(() => go((current + 1) % total), [go, current, total]);
  const prev = useCallback(() => go((current - 1 + total) % total), [go, current, total]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused, next]);

  const slide = SLIDES[current];

  return (
    <div
      className="group relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Slide ───────────────────────────────────────── */}
      <div
        className="relative h-[260px] sm:h-[400px] lg:h-[500px]"
        style={{ backgroundColor: slide.fallbackColor }}
      >
        {/* Imagem — protagonista */}
        <img
          key={slide.id}
          src={slide.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />

        {/* Overlay suave para legibilidade do texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/10" />

        {/* Conteúdo */}
        <div className="absolute inset-0 flex items-center" key={animKey}>
          <div className="container-app">
            <Anim delay={0}>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold uppercase tracking-widest backdrop-blur-sm sm:text-sm ${slide.badgeColor}`}
              >
                {slide.badge}
              </span>
            </Anim>

            <Anim delay={0.1}>
              <h2 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl whitespace-pre-line">
                {slide.title}
              </h2>
            </Anim>

            <Anim delay={0.2}>
              <p className="mt-3 max-w-sm text-base text-white/80 sm:text-lg whitespace-pre-line">
                {slide.subtitle}
              </p>
            </Anim>

            <Anim delay={0.32}>
              <div className="mt-6 flex flex-wrap gap-3">
                {slide.ctas.map((cta) => (
                  <Link
                    key={cta.to}
                    to={cta.to}
                    className={`btn px-6 py-3 font-bold shadow-soft hover:-translate-y-0.5 ${cta.style}`}
                  >
                    {cta.label}
                  </Link>
                ))}
              </div>
            </Anim>
          </div>

          {/* Extra decorativo (badge Copa, badge OFF, etc.) */}
          {slide.extra}
        </div>
      </div>

      {/* ── Seta esquerda ──────────────────────────────── */}
      <button
        onClick={prev}
        aria-label="Slide anterior"
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-soft backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white sm:h-12 sm:w-12"
      >
        <ChevronLeft size={22} className="text-navy-800" />
      </button>

      {/* ── Seta direita ───────────────────────────────── */}
      <button
        onClick={next}
        aria-label="Próximo slide"
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-soft backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white sm:h-12 sm:w-12"
      >
        <ChevronRight size={22} className="text-navy-800" />
      </button>

      {/* ── Dots ───────────────────────────────────────── */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "h-2.5 w-8 bg-white shadow"
                : "h-2.5 w-2.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* ── Progress bar ────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-white/15">
        <div
          ref={progressRef}
          className="h-full bg-white/60"
          key={animKey}
          style={{
            animation: `progress-bar ${INTERVAL_MS}ms linear ${
              paused ? "paused" : "running"
            } forwards`,
          }}
        />
      </div>
    </div>
  );
}
