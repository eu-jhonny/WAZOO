import type { Kit } from "@/types";
import { img } from "@/config/site";

/** Kits pet montados (dados simulados). */
export const kits: Kit[] = [
  {
    id: "kit-filhote",
    name: "Kit Filhote",
    slug: "kit-filhote",
    items: ["Brinquedo", "Tapete higiênico", "Petisco", "Potinho"],
    description: "Ideal para quem acabou de receber um novo pet em casa.",
    price: 99.9,
    leadTime: "3 a 5 dias úteis",
    image: img.mascot.brincando,
    audience: "ambos",
    accent: "orange",
  },
  {
    id: "kit-passeio",
    name: "Kit Passeio",
    slug: "kit-passeio",
    items: ["Coleira", "Guia", "Saquinho higiênico", "Plaquinha"],
    description: "Tudo para passear com segurança e estilo.",
    price: 79.9,
    leadTime: "3 a 5 dias úteis",
    image: img.mascot.correndo,
    audience: "cachorro",
    accent: "green",
  },
  {
    id: "kit-higiene",
    name: "Kit Higiene",
    slug: "kit-higiene",
    items: ["Shampoo", "Perfume", "Escova", "Tapete higiênico"],
    description: "Para manter seu pet limpo, cheiroso e confortável.",
    price: 89.9,
    leadTime: "3 a 6 dias úteis",
    image: img.mascot.banho,
    audience: "ambos",
    accent: "teal",
  },
  {
    id: "kit-mimo",
    name: "Kit Mimo Pet",
    slug: "kit-mimo",
    items: ["Brinquedo", "Petisco", "Acessório fofo"],
    description: "Um carinho especial para seu melhor amigo.",
    price: 69.9,
    leadTime: "2 a 5 dias úteis",
    image: img.mascot.comendo,
    audience: "ambos",
    accent: "pink",
  },
  {
    id: "kit-gato",
    name: "Kit Gato",
    slug: "kit-gato",
    items: ["Sachê", "Brinquedo", "Areia", "Arranhador pequeno"],
    description: "Produtos selecionados para deixar seu gato mais feliz.",
    price: 109.9,
    leadTime: "3 a 6 dias úteis",
    image: img.mascot.saudacao,
    audience: "gato",
    accent: "purple",
  },
];

export const getKit = (slug: string): Kit | undefined =>
  kits.find((k) => k.slug === slug || k.id === slug);
