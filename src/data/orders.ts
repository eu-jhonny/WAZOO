import type { Order } from "@/types";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const BASE = new Date("2025-05-20T15:00:00").getTime();
const daysAgo = (n: number) => BASE - n * DAY;

/** Pedidos simulados — variando os status para demonstrar a timeline e o admin. */
export const seedOrders: Order[] = [
  {
    id: "WZ-1042",
    userId: "u-demo",
    customerName: "Ana Clara Ribeiro",
    customerPhone: "11988887777",
    petName: "Banguela",
    fulfillment: "entrega",
    items: [
      { name: "Caminha Pet Confort", quantity: 1, price: 89.9 },
      { name: "Coleira Ajustável", quantity: 1, price: 34.9, note: "Tamanho M" },
    ],
    total: 124.8,
    note: "Entregar após as 14h, se possível.",
    status: "Pagamento pendente",
    history: [
      { status: "Pedido recebido", at: daysAgo(1) },
      { status: "Pagamento pendente", at: daysAgo(1) + 2 * HOUR },
    ],
    internalNote: "Cliente recorrente — priorizar separação.",
    createdAt: daysAgo(1),
  },
  {
    id: "WZ-1041",
    userId: "u-demo",
    customerName: "Ana Clara Ribeiro",
    customerPhone: "11988887777",
    petName: "Mimi",
    fulfillment: "entrega",
    items: [
      { name: "Sachê para Gatos", quantity: 6, price: 7.9 },
      { name: "Ração Premium para Gatos", quantity: 1, price: 99.9 },
    ],
    total: 147.3,
    status: "Entregue",
    history: [
      { status: "Pedido recebido", at: daysAgo(14) },
      { status: "Pagamento pendente", at: daysAgo(14) + 3 * HOUR },
      { status: "Pagamento pendente", at: daysAgo(13) },
      { status: "Pagamento confirmado", at: daysAgo(13) + 4 * HOUR },
      { status: "Em separação", at: daysAgo(12) },
      { status: "Saiu para entrega", at: daysAgo(11) },
      { status: "Entregue", at: daysAgo(11) + 6 * HOUR },
    ],
    createdAt: daysAgo(14),
  },
  {
    id: "WZ-1040",
    customerName: "Marina Souza",
    customerPhone: "11977776666",
    petName: "Thor",
    fulfillment: "retirada",
    items: [
      { name: "Ração Super Premium para Cães", quantity: 1, price: 129.9 },
      { name: "Brinquedo Mordedor", quantity: 2, price: 24.9 },
    ],
    total: 179.7,
    status: "Pagamento pendente",
    history: [
      { status: "Pedido recebido", at: daysAgo(2) },
      { status: "Pagamento pendente", at: daysAgo(2) + 2 * HOUR },
      { status: "Pagamento pendente", at: daysAgo(2) + 5 * HOUR },
    ],
    internalNote: "Pagamento PIX aguardando confirmação.",
    createdAt: daysAgo(2),
  },
  {
    id: "WZ-1039",
    customerName: "Pedro Henrique",
    customerPhone: "11966665555",
    petName: "Mel",
    fulfillment: "entrega",
    items: [{ name: "Kit Passeio", quantity: 1, price: 79.9 }],
    total: 79.9,
    status: "Pagamento confirmado",
    history: [
      { status: "Pedido recebido", at: daysAgo(3) },
      { status: "Pagamento pendente", at: daysAgo(3) + 1 * HOUR },
      { status: "Pagamento pendente", at: daysAgo(3) + 3 * HOUR },
      { status: "Pagamento confirmado", at: daysAgo(2) },
    ],
    createdAt: daysAgo(3),
  },
  {
    id: "WZ-1038",
    customerName: "Camila Ferreira",
    customerPhone: "11955554444",
    petName: "Pingo",
    fulfillment: "entrega",
    items: [
      { name: "Tapete Higiênico Premium", quantity: 2, price: 59.9 },
      { name: "Shampoo Neutro Pet", quantity: 1, price: 32.9 },
    ],
    total: 152.7,
    status: "Saiu para entrega",
    history: [
      { status: "Pedido recebido", at: daysAgo(4) },
      { status: "Pagamento pendente", at: daysAgo(4) + 2 * HOUR },
      { status: "Pagamento confirmado", at: daysAgo(3) },
      { status: "Em separação", at: daysAgo(2) },
      { status: "Saiu para entrega", at: daysAgo(1) },
    ],
    createdAt: daysAgo(4),
  },
];
