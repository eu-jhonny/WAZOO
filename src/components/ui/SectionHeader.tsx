import type { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  center?: boolean;
  className?: string;
}

/** Cabeçalho padrão de seção: selo + título + subtítulo. */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  center = false,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`${center ? "mx-auto text-center" : ""} max-w-2xl ${className}`}>
      {eyebrow && (
        <span className={`eyebrow ${center ? "mx-auto" : ""}`}>
          {Icon && <Icon size={16} />}
          {eyebrow}
        </span>
      )}
      <h2 className="section-title mt-4">{title}</h2>
      {subtitle && (
        <p className="mt-3 text-lg leading-relaxed text-navy-500">{subtitle}</p>
      )}
    </div>
  );
}
