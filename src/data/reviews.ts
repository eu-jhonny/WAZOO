import type { Review } from "@/types";

const DAY = 24 * 60 * 60 * 1000;
const BASE = new Date("2025-05-18T10:00:00").getTime();
const daysAgo = (n: number) => BASE - n * DAY;

/** Avaliações simuladas (algumas pendentes para o admin moderar). */
export const seedReviews: Review[] = [
  {
    id: "r-1",
    name: "Mariana Souza",
    petName: "Thor",
    rating: 5,
    text: "Atendimento rápido e muito atencioso. Me ajudaram a escolher tudo certinho!",
    approved: true,
    featured: true,
    createdAt: daysAgo(1),
  },
  {
    id: "r-2",
    name: "João Pedro",
    petName: "Mel",
    rating: 5,
    text: "Consegui comprar tudo para meu cachorro sem sair de casa. Recomendo demais.",
    approved: true,
    featured: true,
    createdAt: daysAgo(3),
  },
  {
    id: "r-3",
    name: "Carla Martins",
    petName: "Frajola",
    rating: 5,
    text: "Gostei porque explicaram o prazo antes de fechar o pedido. Tudo transparente.",
    approved: true,
    featured: true,
    createdAt: daysAgo(5),
  },
  {
    id: "r-4",
    name: "Rafael Lima",
    petName: "Bita",
    rating: 5,
    text: "A caminha chegou linda e do tamanho certo. Meu pet amou o cantinho novo dele.",
    approved: true,
    featured: false,
    createdAt: daysAgo(8),
  },
  {
    id: "r-5",
    name: "Patrícia Gomes",
    petName: "Nina",
    rating: 4,
    text: "Produtos de qualidade e entrega combinada direitinho. Voltarei a comprar.",
    approved: true,
    featured: false,
    createdAt: daysAgo(12),
  },
  {
    id: "r-6",
    name: "Bruno Carvalho",
    petName: "Simba",
    rating: 5,
    text: "Encomendei o kit gato e foi tudo perfeito. Atendimento pelo WhatsApp nota 10.",
    approved: true,
    featured: false,
    createdAt: daysAgo(16),
  },
  {
    id: "r-7",
    name: "Fernanda Dias",
    petName: "Bidu",
    rating: 5,
    text: "Adorei poder pedir sob encomenda e ainda escolher o melhor prazo de entrega.",
    approved: false, // pendente de aprovação
    featured: false,
    createdAt: daysAgo(0),
  },
  {
    id: "r-8",
    name: "Lucas Almeida",
    petName: "Pingo",
    rating: 4,
    text: "Boa variedade de produtos. Só achei que poderiam ter ainda mais opções de ração.",
    approved: false, // pendente de aprovação
    featured: false,
    createdAt: daysAgo(0),
  },
];
