import { PawPrint } from "lucide-react";
import { getCategoryMeta } from "@/data/categories";

interface ProductImageProps {
  src?: string;
  alt: string;
  category?: string;
  className?: string;
  iconSize?: number;
}

/**
 * Imagem do produto com fallback elegante:
 * quando não há foto, mostra um placeholder com gradiente + ícone da categoria.
 */
export function ProductImage({
  src,
  alt,
  category,
  className = "",
  iconSize = 72,
}: ProductImageProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  const meta = category ? getCategoryMeta(category) : undefined;
  const Icon = meta?.icon ?? PawPrint;
  const gradient = meta?.gradient ?? "from-orange-400 to-orange-600";

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient} ${className}`}
      role="img"
      aria-label={alt}
    >
      <div className="absolute inset-0 bg-dots-light" />
      <Icon className="relative text-white/90 drop-shadow" size={iconSize} strokeWidth={1.5} />
      <span className="absolute bottom-3 right-4 font-display text-sm font-semibold text-white/80">
        Wazoo Pet
      </span>
    </div>
  );
}
