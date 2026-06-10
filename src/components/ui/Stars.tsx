import { Star } from "lucide-react";

interface StarsProps {
  value: number;
  size?: number;
  className?: string;
}

/** Exibe uma nota de 1 a 5 com estrelas. */
export function Stars({ value, size = 16, className = "" }: StarsProps) {
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < value ? "fill-orange-400 text-orange-400" : "fill-cream-200 text-cream-200"
          }
        />
      ))}
    </div>
  );
}
