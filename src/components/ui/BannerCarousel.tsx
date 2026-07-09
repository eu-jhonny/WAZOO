import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const INTERVAL_MS = 6000;

const SLIDES = [
  {
    id: "diapais",
    image: "/images/modelo-homem-golden.webp",
    fallbackColor: "#0F2A4A",
    badge: "👔 Especial · Dia dos Pais",
    badgeColor: "bg-orange-400/20 text-orange-200 border-orange-300/30",
    title: "Dia dos Pais Pet! 🐾",
    subtitle: "Presenteie a dupla favorita: pai & pet.\nKits, mimos e acessórios combinando.",
    ctas: [
      { to: "/produtos", label: "Ver presentes →", style: "bg-orange-500 text-white hover:bg-orange-600 font-bold" },
      { to: "/kits",     label: "Ver kits",        style: "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/30 font-bold" },
    ],
    extra: (
      <div className="absolute right-8 bottom-6 hidden sm:flex lg:right-16">
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 border-orange-300 text-center shadow-lg sm:h-28 sm:w-28 bg-navy-800">
          <span className="text-2xl sm:text-3xl">👔</span>
          <span className="font-display text-[10px] font-extrabold uppercase text-orange-200 sm:text-xs">Dia dos<br/>Pais</span>
        </div>
      </div>
    ),
  },
  {
    id: "caes",
    image: "/images/banners/cachorros.jpg",
    fallbackColor: "#78350F",
    badge: "🐕 Linha Cachorros",
    badgeColor: "bg-orange-400/25 text-orange-100 border-orange-400/30",
    title: "Para o seu\nmelhor amigo",
    subtitle: "Coleiras, roupinhas, brinquedos e muito amor.\nTudo sob encomenda, com entrega garantida.",
    ctas: [
      { to: "/cachorros", label: "Ver produtos para cães →", style: "bg-orange-500 text-white hover:bg-orange-600 shadow-lg" },
      { to: "/kits",      label: "Ver kits",                 style: "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/30" },
    ],
    extra: null,
  },
  {
    id: "gatos",
    image: "/images/banners/gatos.jpg",
    fallbackColor: "#2D1B69",
    badge: "🐈 Linha Gatos",
    badgeColor: "bg-purple-400/25 text-purple-100 border-purple-400/30",
    title: "Mimos para\nos felinos",
    subtitle: "Arranhadores, casinhas, petiscos e acessórios.\nConforto e estilo para o seu gato.",
    ctas: [
      { to: "/gatos", label: "Ver produtos para gatos →", style: "bg-purple-500 text-white hover:bg-purple-600 shadow-lg" },
      { to: "/kits",  label: "Ver kits",                  style: "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/30" },
    ],
    extra: null,
  },
  {
    id: "conforto",
    image: "/images/banners/conforto.jpg",
    fallbackColor: "#1C3A2E",
    badge: "🛏️ Conforto & Bem-estar",
    badgeColor: "bg-emerald-400/25 text-emerald-100 border-emerald-400/30",
    title: "Conforto que\neles merecem",
    subtitle: "Caminhas, cobertores e almofadas premium.\nProdutos selecionados para o descanso do seu pet.",
    ctas: [
      { to: "/produtos", label: "Ver produtos →", style: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg" },
    ],
    extra: null,
  },
];

function Anim({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div style={{ animation: `slide-in-left 0.55s ${delay}s ease-out both` }}>
      {children}
    </div>
  );
}

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
      <div
        className="relative h-[260px] sm:h-[400px] lg:h-[500px]"
        style={{ backgroundColor: slide.fallbackColor }}
      >
        <img
          key={slide.id}
          src={slide.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />

        <div className="absolute inset-0 flex items-center" key={animKey}>
          <div className="container-app">
            <Anim delay={0}>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold uppercase tracking-widest backdrop-blur-sm sm:text-sm ${slide.badgeColor}`}>
                {slide.badge}
              </span>
            </Anim>

            <Anim delay={0.1}>
              <h2 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl whitespace-pre-line drop-shadow-lg">
                {slide.title}
              </h2>
            </Anim>

            <Anim delay={0.2}>
              <p className="mt-3 max-w-sm text-base text-white/85 sm:text-lg whitespace-pre-line">
                {slide.subtitle}
              </p>
            </Anim>

            <Anim delay={0.32}>
              <div className="mt-6 flex flex-wrap gap-3">
                {slide.ctas.map((cta) => (
                  <Link
                    key={cta.to}
                    to={cta.to}
                    className={`btn px-6 py-3 font-bold hover:-translate-y-0.5 transition-all ${cta.style}`}
                  >
                    {cta.label}
                  </Link>
                ))}
              </div>
            </Anim>
          </div>

          {slide.extra}
        </div>
      </div>

      {/* Seta esquerda */}
      <button
        onClick={prev}
        aria-label="Slide anterior"
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white sm:h-12 sm:w-12"
      >
        <ChevronLeft size={22} className="text-navy-800" />
      </button>

      {/* Seta direita */}
      <button
        onClick={next}
        aria-label="Próximo slide"
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white sm:h-12 sm:w-12"
      >
        <ChevronRight size={22} className="text-navy-800" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current ? "h-2.5 w-8 bg-white shadow" : "h-2.5 w-2.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-white/15">
        <div
          ref={progressRef}
          className="h-full bg-orange-400"
          key={animKey}
          style={{
            animation: `progress-bar ${INTERVAL_MS}ms linear ${paused ? "paused" : "running"} forwards`,
          }}
        />
      </div>
    </div>
  );
}
