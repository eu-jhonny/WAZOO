import type { CartItem, Kit, Order, Product } from "@/types";
import { formatBRL } from "./format";
import { site } from "@/config/site";

/** Monta o link do WhatsApp (wa.me) com a mensagem já codificada. */
export const whatsappLink = (
  message: string,
  phone: string = site.whatsappNumber
): string => {
  let digits = phone.replace(/\D/g, "");
  // Adiciona o DDI do Brasil (55) quando o número vem só com DDD + número.
  if (digits.length > 0 && digits.length <= 11) digits = "55" + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

/** Mensagem padrão do botão flutuante "Fale conosco". */
export const defaultContactMessage =
  "Olá! Vim pelo site da Wazoo e gostaria de tirar uma dúvida sobre os produtos.";

interface CartMessageInput {
  items: CartItem[];
  total: number;
  customerName?: string;
  petName?: string;
  observation?: string;
}

/** Mensagem automática a partir do carrinho. */
export const buildCartMessage = ({
  items,
  total,
  customerName,
  petName,
  observation,
}: CartMessageInput): string => {
  const lines: string[] = [];
  lines.push("Olá! Gostaria de tirar uma dúvida sobre estes produtos:");
  lines.push("");

  items.forEach((item) => {
    let line = `${item.quantity}x ${item.name}`;
    if (item.variant) line += ` [${item.variant}]`;
    line += ` - ${formatBRL(item.price)}`;
    if (item.note) line += ` (Obs: ${item.note})`;
    lines.push(line);
  });

  lines.push("");
  lines.push(`Total estimado: ${formatBRL(total)}`);
  lines.push("");

  if (customerName) lines.push(`Cliente: ${customerName}`);
  if (petName) lines.push(`Pet: ${petName}`);
  if (observation) lines.push(`Observação: ${observation}`);
  if (customerName || petName || observation) lines.push("");

  lines.push("Aguardo confirmação de disponibilidade e prazo. 🐾");
  return lines.join("\n");
};

/** Mensagem para pedir um único produto. */
export const buildProductMessage = (product: Product, note?: string): string => {
  const lines = [
    "Olá! Tenho uma dúvida sobre este produto:",
    "",
    `• ${product.name} - ${formatBRL(product.price)}`,
    `Prazo médio: ${product.leadTime}`,
  ];
  if (note) lines.push(`Observação: ${note}`);
  lines.push("");
  lines.push("Pode me ajudar com prazo, entrega ou alguma dúvida sobre estes itens?");
  return lines.join("\n");
};

/** Mensagem para solicitar um kit. */
export const buildKitMessage = (kit: Kit): string =>
  [
    `Olá! Gostaria de saber mais sobre o ${kit.name}.`,
    "",
    `Itens: ${kit.items.join(", ")}`,
    `Valor estimado: ${formatBRL(kit.price)}`,
    `Prazo médio: ${kit.leadTime}`,
    "",
    "Pode me ajudar com alguma dúvida sobre este item? 🐾",
  ].join("\n");

/** Mensagem do admin para falar com o cliente sobre o pedido. */
export const buildOrderContactMessage = (order: Order): string =>
  [
    `Olá, ${order.customerName}! Aqui é da Wazoo. 🐾`,
    "",
    `Sobre o seu pedido ${order.id}:`,
    `Status atual: ${order.status}`,
    "",
    "Como podemos ajudar?",
  ].join("\n");
