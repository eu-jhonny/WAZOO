import type { LucideIcon } from "lucide-react";
import { Decor } from "./Decor";

// variant prop mantido por compatibilidade (não altera mais o visual)
type Variant = "cream" | "navy" | "orange";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  mascot?: string;
  variant?: Variant;
}

/**
 * Cabeçalho de página — visual fofo: gradiente laranja suave,
 * cantos inferiores arredondados e mascote sempre visível.
 */
export function PageHero({ eyebrow, title, subtitle, icon: Icon, mascot }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-b-[3rem] bg-gradient-to-br from-orange-100 via-cream-100 to-cream-50 sm:rounded-b-[4rem]">
      <Decor variant="warm" dots />

      <div className="container-app relative grid items-center gap-6 py-10 sm:py-12 md:grid-cols-[1fr_auto] md:py-14">
        {/* Texto */}
        <div className="text-center md:text-left">
          {eyebrow && (
            <span className="eyebrow">
              {Icon && <Icon size={16} />}
              {eyebrow}
            </span>
          )}
          <h1 className="mt-3 font-display text-2xl font-bold text-navy-700 sm:text-3xl md:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-navy-500 sm:text-base md:mx-0 md:text-lg">
              {subtitle}
            </p>
          )}
        </div>

        {/* Mascote */}
        {mascot && (
          <div className="relative flex justify-center">
            {/* Blob colorido atrás do mascote */}
            <div className="absolute inset-0 -m-6 rounded-full bg-gradient-to-br from-orange-200/50 via-brand-pink/20 to-brand-teal/20 blur-2xl" />
            <img
              src={mascot}
              alt=""
              className="relative h-28 w-auto animate-float-slow drop-shadow-xl sm:h-36 md:h-44"
            />
          </div>
        )}
      </div>
    </section>
  );
}
