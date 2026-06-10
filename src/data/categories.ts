import {
  Bath,
  Bone,
  Cat,
  Cookie,
  Dog,
  BedDouble,
  Package,
  Fish,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export interface CategoryMeta {
  slug: string;
  name: string;
  icon: LucideIcon;
  gradient: string; // classes tailwind (literais — detectadas no build)
  description: string;
}

/** Categorias funcionais usadas no catálogo e nos filtros. */
export const productCategories: CategoryMeta[] = [
  {
    slug: "higiene",
    name: "Higiene",
    icon: Bath,
    gradient: "from-brand-teal to-navy-600",
    description: "Limpeza, banho e cuidado",
  },
  {
    slug: "brinquedos",
    name: "Brinquedos",
    icon: Bone,
    gradient: "from-green-400 to-green-600",
    description: "Diversão e gasto de energia",
  },
  {
    slug: "acessorios",
    name: "Acessórios",
    icon: ShoppingBag,
    gradient: "from-brand-pink to-orange-500",
    description: "Coleiras, guias, transporte e mais",
  },
  {
    slug: "petiscos",
    name: "Petiscos",
    icon: Cookie,
    gradient: "from-orange-400 to-brand-pink",
    description: "Recompensas saborosas",
  },
  {
    slug: "caminhas",
    name: "Caminhas",
    icon: BedDouble,
    gradient: "from-orange-400 to-orange-600",
    description: "Conforto para o descanso",
  },
  {
    slug: "racoes",
    name: "Rações",
    icon: Package,
    gradient: "from-navy-500 to-navy-700",
    description: "Alimentação completa",
  },
  {
    slug: "saches",
    name: "Sachês",
    icon: Fish,
    gradient: "from-brand-purple to-navy-600",
    description: "Sabor para o dia a dia",
  },
];

/** Cards de categoria exibidos na Home (incluem atalhos por tipo de pet). */
export interface HomeCategory {
  name: string;
  icon: LucideIcon;
  gradient: string;
  to: string;
  description: string;
}

export const homeCategories: HomeCategory[] = [
  {
    name: "Cachorros",
    icon: Dog,
    gradient: "from-orange-400 to-orange-600",
    to: "/produtos?pet=cachorro",
    description: "Tudo para o seu cão",
  },
  {
    name: "Gatos",
    icon: Cat,
    gradient: "from-brand-purple to-navy-600",
    to: "/produtos?pet=gato",
    description: "Mimos para felinos",
  },
  {
    name: "Higiene",
    icon: Bath,
    gradient: "from-brand-teal to-navy-600",
    to: "/produtos?cat=higiene",
    description: "Limpeza e cuidado",
  },
  {
    name: "Brinquedos",
    icon: Bone,
    gradient: "from-green-400 to-green-600",
    to: "/produtos?cat=brinquedos",
    description: "Diversão garantida",
  },
  {
    name: "Acessórios",
    icon: ShoppingBag,
    gradient: "from-brand-pink to-orange-500",
    to: "/produtos?cat=acessorios",
    description: "Coleiras, guias e mais",
  },
  {
    name: "Petiscos",
    icon: Cookie,
    gradient: "from-orange-400 to-brand-pink",
    to: "/produtos?cat=petiscos",
    description: "Recompensas saborosas",
  },
];

export const getCategoryMeta = (slug: string): CategoryMeta | undefined =>
  productCategories.find((c) => c.slug === slug);

export const getCategoryName = (slug: string): string =>
  getCategoryMeta(slug)?.name ?? slug;
