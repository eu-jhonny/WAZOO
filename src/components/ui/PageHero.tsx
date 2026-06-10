import type { LucideIcon } from "lucide-react";
import { Decor } from "./Decor";

type Variant = "cream" | "navy" | "orange";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  mascot?: string;
  variant?: Variant;
  /** Chips extras abaixo do subtítulo */
  chips?: Array<{ label: string; color?: string }>;
}

/**
 * Cabeçalho de página — visual dramático e impactante.
 * Gradiente rico, tipografia grande, mascote flutuante com glow.
 */
export function PageHero({ eyebrow, title, subtitle, icon: Icon, mascot, chips }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Fundo em camadas */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-700 to-orange-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

      {/* Texturas sutis */}
      <div className="pattern-diagonal absolute inset-0 opacity-60" aria-hidden />
      <div className="bg-dots-light absolute inset-0 opacity-[0.4]" aria-hidden />

      {/* Círculos decorativos de fundo */}
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-orange-500/15 blur-3xl" aria-hidden />
      <div className="absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" aria-hidden />

      <Decor />

      <div className="container-app relative grid items-center gap-6 py-12 sm:py-16 md:grid-cols-[1fr_auto] md:py-20">
        {/* Texto */}
        <div
          className="text-center md:text-left"
          style={{ animation: "slide-in-left 0.5s ease-out" }}
        >
          {eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/20 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-orange-300 backdrop-blur-sm sm:text-sm">
              {Icon && <Icon size={14} className="text-orange-400" />}
              {eyebrow}
            </span>
          )}

          <h1
            className="mt-4 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}
          >
            {title}
          </h1>

          {subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base md:mx-0 md:text-lg">
              {subtitle}
            </p>
          )}

          {chips && chips.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
              {chips.map((chip) => (
                <span
                  key={chip.label}
                  className={`rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm ${chip.color ?? ""}`}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Mascote */}
        {mascot && (
          <div
            className="relative flex justify-center"
            style={{ animation: "slide-in-left 0.5s 0.15s ease-out both" }}
          >
            {/* Glow atrás */}
            <div className="absolute inset-0 -m-4 rounded-full bg-orange-400/30 blur-2xl" aria-hidden />
            {/* Blob colorido */}
            <div className="absolute inset-0 -m-8 rounded-full bg-gradient-to-br from-orange-400/20 via-brand-pink/15 to-brand-teal/15 blur-3xl" aria-hidden />
            <img
              src={mascot}
              alt=""
              className="relative h-36 w-auto animate-float-slow drop-shadow-2xl sm:h-44 md:h-52"
            />
          </div>
        )}
      </div>

      {/* Wave de transição na base */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none" aria-hidden>
        <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className="block w-full h-10 fill-cream-50">
          <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" />
        </svg>
      </div>
    </section>
  );
}
