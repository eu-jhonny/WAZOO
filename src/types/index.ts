// ============================================================
// Tipos do domínio — Wazoo Pet Express
// ============================================================

export type PetAudience = "cachorro" | "gato" | "ambos";
export type PetSize = "pequeno" | "medio" | "grande" | "todos";
export type Fulfillment = "entrega" | "retirada";

export interface Product {
  id: string;
  name: string;
  category: string; // slug funcional: higiene, brinquedos, acessorios, petiscos, caminhas, racoes, saches
  price: number; // preço estimado (R$)
  comparePrice?: number; // preço "de" (riscado) — para mostrar desconto
  discountPct?: number;  // % calculado automaticamente se comparePrice existir
  promoLabel?: string;   // ex.: "50% OFF", "LEVE 2 PAGUE 1"
  leadTime: string; // prazo médio, ex.: "2 a 5 dias úteis"
  shortDescription: string;
  description: string; // descrição completa
  image: string; // caminho/URL — vazio usa placeholder da marca
  gallery?: string[];
  active: boolean;
  featured: boolean;
  onDemand: boolean; // sob encomenda
  audience: PetAudience; // indicado para
  size: PetSize;
  availability: string; // disponibilidade estimada
  tags?: string[];       // para filtros: "copa", "festajunina", "novidade" etc.
  stock?: number;        // null/undefined = sob encomenda ilimitado
  createdAt: number;
}

export interface Coupon {
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;       // % ou R$
  minOrder?: number;
  expiresAt?: number;
  active: boolean;
}

export interface PaymentInfo {
  method: "credit_card" | "debit_card" | "pix" | "boleto";
  status: "pending" | "approved" | "rejected" | "refunded";
  mpPaymentId?: string;
  paidAt?: number;
  pixCode?: string;
  boletoUrl?: string;
}

export interface Kit {
  id: string;
  name: string;
  slug: string;
  items: string[];
  description: string;
  price: number;
  leadTime: string;
  image: string; // mascote/ilustração
  audience: PetAudience;
  accent: "orange" | "teal" | "green" | "pink" | "purple"; // cor de destaque
}

export type CartKind = "product" | "kit";

export interface CartItem {
  id: string;
  kind: CartKind;
  name: string;
  price: number;
  image: string;
  leadTime: string;
  category?: string;
  quantity: number;
  note?: string;
}

export interface Pet {
  id: string;
  name: string;
  type: "cachorro" | "gato";
  breed: string;
  size: PetSize;
  age: string;
  weight: string;
  restrictions?: string;
  notes?: string;
}

export interface Address {
  street: string;
  neighborhood: string;
  city: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  password: string; // simulado (somente demonstração)
  address: Address;
  preference: Fulfillment;
  pets: Pet[];
  createdAt: number;
}

export const ORDER_STATUSES = [
  "Solicitação enviada",
  "Verificando disponibilidade",
  "Aguardando pagamento",
  "Pedido confirmado",
  "Em separação",
  "Pronto para retirada",
  "Saiu para entrega",
  "Finalizado",
  "Cancelado",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  note?: string;
}

export interface StatusEvent {
  status: OrderStatus;
  at: number;
}

export interface Order {
  id: string; // ex.: WZ-1042
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerDoc?: string; // CPF
  petName?: string;
  fulfillment: Fulfillment;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount?: number;
  shippingAmount?: number;
  total: number;
  couponCode?: string;
  note?: string;
  status: OrderStatus;
  history: StatusEvent[];
  payment?: PaymentInfo;
  internalNote?: string;
  createdAt: number;
}

export interface Review {
  id: string;
  name: string;
  petName?: string;
  rating: number; // 1 a 5
  text: string;
  approved: boolean;
  featured: boolean;
  createdAt: number;
}

export interface SiteSettings {
  storeName: string;
  whatsapp: string;
  instagram: string;
  hours: string;
  institutionalText: string;
  deliveryFee: number;
}
