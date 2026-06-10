import { Link } from "react-router-dom";
import type { HomeCategory } from "@/data/categories";

export function CategoryCard({ category }: { category: HomeCategory }) {
  const Icon = category.icon;
  return (
    <Link
      to={category.to}
      className="card card-hover group flex flex-col items-center gap-3 p-5 text-center"
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${category.gradient} text-white shadow-soft transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}
      >
        <Icon size={30} strokeWidth={2} />
      </div>
      <div>
        <p className="font-display text-base font-bold text-navy-700">{category.name}</p>
        <p className="mt-0.5 text-xs text-navy-400">{category.description}</p>
      </div>
    </Link>
  );
}
