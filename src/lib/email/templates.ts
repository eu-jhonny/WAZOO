/**
 * ============================================================
 *  Wazoo Pet Express — Templates de e-mail (HTML responsivo)
 * ============================================================
 *
 * E-mails de verdade rodam em clientes muito antigos (Outlook, Gmail,
 * apps nativos). Por isso, aqui usamos **tabelas** para layout, **estilos
 * inline** e **cores em hexadecimal** — nada de flexbox/grid ou classes.
 *
 * Cada builder devolve `EmailContent` (assunto + HTML + texto puro +
 * preheader). O texto puro é importante para acessibilidade e para
 * clientes que não renderizam HTML.
 *
 * Tudo é parametrizado por `EmailBrand`, então a loja pode trocar nome,
 * cor de destaque, logo e contatos sem editar os templates.
 */
import type { Order, OrderStatus } from "@/types";
import { formatBRL, formatDate } from "@/lib/format";

/* ── Marca / tema do e-mail ─────────────────────────────────── */
export interface EmailBrand {
  storeName: string;
  accent: string;      // cor principal (botões, destaques)
  accentDark: string;  // tom mais escuro (hover/gradiente)
  logoUrl?: string;    // URL absoluta do logo (opcional)
  siteUrl: string;     // base do site (para links/botões)
  whatsapp: string;    // dígitos, formato internacional
  instagram: string;
  supportEmail: string;
  address?: string;
}

export const DEFAULT_BRAND: EmailBrand = {
  storeName: "Wazoo Pet Express",
  accent: "#F97316",
  accentDark: "#EA580C",
  siteUrl: "https://wazoo.com.br",
  whatsapp: "5511999999999",
  instagram: "@wazoopetexpress",
  supportEmail: "contato@wazoo.com",
  address: "São Paulo · SP e região",
};

export interface EmailContent {
  subject: string;
  preheader: string; // texto de "prévia" na caixa de entrada
  html: string;
  text: string;
}

/* Paleta fixa da marca (fallbacks seguros em hex). */
const C = {
  ink: "#0F172A",
  navy700: "#334155",
  navy500: "#64748B",
  navy400: "#94A3B8",
  cream50: "#FAFAFA",
  cream100: "#F4F4F5",
  cream200: "#E4E4E7",
  white: "#FFFFFF",
  green: "#16A34A",
  greenBg: "#F0FDF4",
  amber: "#B45309",
  amberBg: "#FFFBEB",
};

/* ── Helpers de layout ──────────────────────────────────────── */

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function waLink(brand: EmailBrand, msg: string): string {
  const digits = brand.whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}

/** Botão sólido (CTA principal) — usa VML para funcionar no Outlook. */
function button(brand: EmailBrand, label: string, href: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px auto;">
    <tr><td align="center" bgcolor="${brand.accent}" style="border-radius:14px;">
      <a href="${esc(href)}" target="_blank"
         style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;
                font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;
                border-radius:14px;background:${brand.accent};">
        ${esc(label)}
      </a>
    </td></tr>
  </table>`;
}

/** Cabeçalho com logo/nome sobre faixa colorida. */
function header(brand: EmailBrand): string {
  const logo = brand.logoUrl
    ? `<img src="${esc(brand.logoUrl)}" alt="${esc(brand.storeName)}" height="40" style="height:40px;display:block;border:0;" />`
    : `<span style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">🐾 ${esc(brand.storeName)}</span>`;
  return `
  <tr>
    <td style="background:${brand.accent};background:linear-gradient(135deg,${brand.accent} 0%,${brand.accentDark} 100%);padding:26px 32px;text-align:center;border-radius:20px 20px 0 0;">
      ${logo}
    </td>
  </tr>`;
}

/** Rodapé institucional. */
function footer(brand: EmailBrand): string {
  return `
  <tr>
    <td style="padding:26px 32px;background:${C.ink};border-radius:0 0 20px 20px;text-align:center;">
      <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;color:#ffffff;">
        🐾 ${esc(brand.storeName)}
      </p>
      <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${C.navy400};">
        ${esc(brand.address || "")}<br/>
        Atendimento: <a href="${waLink(brand, "Olá! Vim pelo e-mail da Wazoo.")}" style="color:${C.navy400};text-decoration:underline;">WhatsApp</a>
        &nbsp;·&nbsp; ${esc(brand.instagram)}
        &nbsp;·&nbsp; <a href="mailto:${esc(brand.supportEmail)}" style="color:${C.navy400};text-decoration:underline;">${esc(brand.supportEmail)}</a>
      </p>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;color:#475569;">
        Você recebeu este e-mail porque tem uma conta ou fez um pedido na ${esc(brand.storeName)}.<br/>
        © ${new Date().getFullYear()} ${esc(brand.storeName)} · Produtos pet sob encomenda com carinho.
      </p>
    </td>
  </tr>`;
}

/** Envelope: <html> completo com o miolo (`inner`) centralizado. */
function shell(brand: EmailBrand, preheader: string, inner: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(brand.storeName)}</title>
</head>
<body style="margin:0;padding:0;background:${C.cream100};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${C.cream100};">
    ${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream100};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="width:600px;max-width:600px;background:${C.white};border-radius:20px;overflow:hidden;box-shadow:0 8px 40px -8px rgba(15,23,42,0.16);">
        ${header(brand)}
        ${inner}
        ${footer(brand)}
      </table>
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">
        <tr><td style="padding:16px 8px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${C.navy400};">
          Feito com carinho para cães e gatos 🐾
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* Bloco de conteúdo padrão (padding lateral consistente). */
function body(inner: string): string {
  return `<tr><td style="padding:32px 32px 8px;">${inner}</td></tr>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:30px;font-weight:800;color:${C.ink};">${text}</h1>`;
}
function p(text: string): string {
  return `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:${C.navy700};">${text}</p>`;
}
function small(text: string): string {
  return `<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:${C.navy500};">${text}</p>`;
}

/* Caixa de destaque (info/sucesso/aviso). */
function callout(text: string, tone: "info" | "success" | "warn" = "info"): string {
  const map = {
    info: { bg: C.cream50, br: C.cream200, fg: C.navy700 },
    success: { bg: C.greenBg, br: "#BBF7D0", fg: C.green },
    warn: { bg: C.amberBg, br: "#FDE68A", fg: C.amber },
  }[tone];
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
    <tr><td style="background:${map.bg};border:1px solid ${map.br};border-radius:14px;padding:14px 18px;
        font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;color:${map.fg};font-weight:600;">
      ${text}
    </td></tr>
  </table>`;
}

/* ── Sub-blocos de pedido (reaproveitados) ──────────────────── */

interface OrderLike {
  id: string;
  customerName: string;
  items: { name: string; quantity: number; price: number; note?: string }[];
  subtotal?: number;
  discountAmount?: number;
  shippingAmount?: number;
  total: number;
  fulfillment?: "entrega" | "retirada";
  createdAt?: number;
}

function itemsTable(brand: EmailBrand, o: OrderLike): string {
  const rows = o.items
    .map(
      (it) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${C.cream200};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.ink};">
        <strong style="font-weight:700;">${esc(it.name)}</strong>
        ${it.note ? `<br/><span style="font-size:12px;color:${C.navy500};">Obs.: ${esc(it.note)}</span>` : ""}
        <br/><span style="font-size:12px;color:${C.navy500};">Qtd.: ${it.quantity}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid ${C.cream200};text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${brand.accentDark};white-space:nowrap;">
        ${formatBRL(it.price * it.quantity)}
      </td>
    </tr>`,
    )
    .join("");

  const line = (label: string, value: string, strong = false, color = C.navy700) => `
    <tr>
      <td style="padding:5px 0;font-family:Arial,Helvetica,sans-serif;font-size:${strong ? 16 : 13}px;color:${color};${strong ? "font-weight:800;" : ""}">${label}</td>
      <td style="padding:5px 0;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:${strong ? 18 : 13}px;color:${color};${strong ? "font-weight:800;" : "font-weight:600;"}white-space:nowrap;">${value}</td>
    </tr>`;

  const sub = o.subtotal ?? o.items.reduce((s, i) => s + i.price * i.quantity, 0);

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;">
    ${rows}
    <tr><td colspan="2" style="padding-top:12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${line("Subtotal", formatBRL(sub))}
        ${o.discountAmount ? line("Desconto", "- " + formatBRL(o.discountAmount), false, C.green) : ""}
        ${line("Entrega", o.shippingAmount ? formatBRL(o.shippingAmount) : "Grátis", false, o.shippingAmount ? C.navy700 : C.green)}
        <tr><td colspan="2" style="border-top:2px solid ${C.cream200};padding-top:6px;"></td></tr>
        ${line("Total", formatBRL(o.total), true, C.ink)}
      </table>
    </td></tr>
  </table>`;
}

function orderItemsText(o: OrderLike): string {
  return o.items
    .map((it) => `  ${it.quantity}x ${it.name} — ${formatBRL(it.price * it.quantity)}`)
    .join("\n");
}

/* ============================================================ *
 *  TEMPLATES
 * ============================================================ */

/** 1) Boas-vindas (novo cadastro). */
export function welcomeEmail(brand: EmailBrand, opts: { name: string; coupon?: string }): EmailContent {
  const first = opts.name.split(" ")[0] || "amigo(a)";
  const inner =
    body(
      h1(`Bem-vindo(a), ${esc(first)}! 🐾`) +
      p(`Que alegria ter você na <strong>${esc(brand.storeName)}</strong>! Aqui a gente encontra os melhores produtos sob encomenda para o seu pet — você escolhe, a gente busca com os parceiros e entrega com carinho.`) +
      (opts.coupon
        ? callout(`🎁 Presente de boas-vindas: use o cupom <strong>${esc(opts.coupon)}</strong> e ganhe desconto no seu primeiro pedido!`, "success")
        : "") +
      p("Enquanto isso, dá uma olhada no catálogo e monte a lista de mimos do seu companheiro:") +
      button(brand, "🛍️ Ver produtos", `${brand.siteUrl}/produtos`) +
      small("Precisa de ajuda para escolher? Fale com a gente pelo WhatsApp — respondemos rapidinho."),
    );
  const text = [
    `Bem-vindo(a), ${first}!`,
    ``,
    `Que alegria ter você na ${brand.storeName}. Aqui você encontra produtos pet sob encomenda com carinho.`,
    opts.coupon ? `\nCupom de boas-vindas: ${opts.coupon}` : "",
    ``,
    `Ver produtos: ${brand.siteUrl}/produtos`,
  ].join("\n");
  return {
    subject: `Bem-vindo(a) à ${brand.storeName}! 🐾`,
    preheader: opts.coupon ? `Seu presente de boas-vindas: cupom ${opts.coupon}` : "Sua conta foi criada com sucesso.",
    html: shell(brand, opts.coupon ? `Seu cupom de boas-vindas: ${opts.coupon}` : "Sua conta foi criada!", inner),
    text,
  };
}

/** 2) Confirmação de pedido recebido. */
export function orderConfirmationEmail(brand: EmailBrand, o: OrderLike): EmailContent {
  const first = o.customerName.split(" ")[0] || "amigo(a)";
  const inner =
    body(
      h1("Recebemos o seu pedido! 🎉") +
      p(`Oi, ${esc(first)}! Seu pedido <strong>${esc(o.id)}</strong> chegou pra gente. Já estamos verificando a disponibilidade com os parceiros e em breve confirmamos o prazo e o valor final.`) +
      callout(`📦 ${o.fulfillment === "retirada" ? "Você optou por <strong>retirada na loja</strong>." : "Você optou por <strong>entrega</strong>."} Avisaremos por aqui e pelo WhatsApp a cada etapa.`) +
      `<h2 style="margin:6px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;color:${C.ink};">Resumo do pedido</h2>` +
      itemsTable(brand, o) +
      button(brand, "📍 Acompanhar meu pedido", `${brand.siteUrl}/pedidos`) +
      small("Quer agilizar? Envie o comprovante ou tire dúvidas pelo WhatsApp."),
    );
  const text = [
    `Recebemos o seu pedido ${o.id}!`,
    ``,
    `Oi, ${first}! Já estamos verificando a disponibilidade dos itens.`,
    ``,
    `Itens:`,
    orderItemsText(o),
    ``,
    `Total: ${formatBRL(o.total)}`,
    ``,
    `Acompanhe em: ${brand.siteUrl}/pedidos`,
  ].join("\n");
  return {
    subject: `Pedido ${o.id} recebido — ${brand.storeName} 🐾`,
    preheader: `Estamos verificando a disponibilidade dos seus itens. Total: ${formatBRL(o.total)}.`,
    html: shell(brand, `Recebemos o pedido ${o.id}. Total ${formatBRL(o.total)}.`, inner),
    text,
  };
}

/* Copy amigável por status. */
const STATUS_COPY: Record<OrderStatus, { emoji: string; title: string; line: string; tone: "info" | "success" | "warn" }> = {
  "Solicitação enviada": { emoji: "📨", title: "Solicitação enviada", line: "Recebemos o seu pedido e ele entrou na fila de análise.", tone: "info" },
  "Verificando disponibilidade": { emoji: "🔎", title: "Verificando disponibilidade", line: "Estamos conferindo os itens com nossos parceiros. Já já confirmamos tudo.", tone: "info" },
  "Aguardando pagamento": { emoji: "💳", title: "Aguardando pagamento", line: "Tudo certo com a disponibilidade! Falta só o pagamento para seguirmos.", tone: "warn" },
  "Pedido confirmado": { emoji: "✅", title: "Pedido confirmado", line: "Pagamento e disponibilidade confirmados. Seu pedido está garantido!", tone: "success" },
  "Em separação": { emoji: "📦", title: "Em separação", line: "Estamos separando os mimos do seu pet com todo o cuidado.", tone: "info" },
  "Pronto para retirada": { emoji: "🏬", title: "Pronto para retirada", line: "Seu pedido está pronto! Pode vir buscar quando quiser.", tone: "success" },
  "Saiu para entrega": { emoji: "🚚", title: "Saiu para entrega", line: "Seu pedido está a caminho! Fique de olho, logo chega aí.", tone: "success" },
  "Finalizado": { emoji: "🎉", title: "Pedido finalizado", line: "Pedido concluído! Esperamos que o seu pet ame os produtos.", tone: "success" },
  "Cancelado": { emoji: "❌", title: "Pedido cancelado", line: "Seu pedido foi cancelado. Se tiver qualquer dúvida, fale com a gente.", tone: "warn" },
};

/** 3) Atualização de status do pedido. */
export function orderStatusEmail(brand: EmailBrand, o: OrderLike & { status: OrderStatus }): EmailContent {
  const first = o.customerName.split(" ")[0] || "amigo(a)";
  const c = STATUS_COPY[o.status] ?? STATUS_COPY["Solicitação enviada"];
  const showReview = o.status === "Finalizado";
  const inner =
    body(
      `<div style="text-align:center;margin:0 0 8px;font-size:40px;line-height:1;">${c.emoji}</div>` +
      h1(c.title) +
      p(`Oi, ${esc(first)}! O status do seu pedido <strong>${esc(o.id)}</strong> mudou:`) +
      callout(c.line, c.tone) +
      button(brand, "📍 Ver detalhes do pedido", `${brand.siteUrl}/pedidos`) +
      (o.status === "Aguardando pagamento"
        ? small("Assim que confirmarmos o pagamento, seguimos com a separação. 💛")
        : "") +
      (showReview
        ? small(`Adorou os produtos? <a href="${brand.siteUrl}/avaliacoes" style="color:${brand.accentDark};font-weight:700;">Deixe uma avaliação</a> e ajude outros tutores. 🌟`)
        : small("Qualquer dúvida, é só responder este e-mail ou chamar no WhatsApp.")),
    );
  const text = [
    `${c.title} — pedido ${o.id}`,
    ``,
    `Oi, ${first}! ${c.line}`,
    ``,
    `Detalhes: ${brand.siteUrl}/pedidos`,
  ].join("\n");
  return {
    subject: `${c.emoji} ${o.id}: ${c.title} — ${brand.storeName}`,
    preheader: c.line,
    html: shell(brand, c.line, inner),
    text,
  };
}

/** 4) Pagamento confirmado. */
export function paymentConfirmedEmail(brand: EmailBrand, o: OrderLike & { method?: string }): EmailContent {
  const first = o.customerName.split(" ")[0] || "amigo(a)";
  const inner =
    body(
      `<div style="text-align:center;margin:0 0 8px;font-size:40px;line-height:1;">💚</div>` +
      h1("Pagamento confirmado!") +
      p(`Oi, ${esc(first)}! Recebemos o pagamento de <strong>${formatBRL(o.total)}</strong> do pedido <strong>${esc(o.id)}</strong>. Obrigado pela confiança!`) +
      callout("Agora é com a gente: vamos separar tudo com carinho e avisar a cada etapa. 🐾", "success") +
      itemsTable(brand, o) +
      button(brand, "📍 Acompanhar pedido", `${brand.siteUrl}/pedidos`),
    );
  const text = [
    `Pagamento confirmado — pedido ${o.id}`,
    ``,
    `Oi, ${first}! Recebemos ${formatBRL(o.total)}. Obrigado!`,
    ``,
    `Acompanhe: ${brand.siteUrl}/pedidos`,
  ].join("\n");
  return {
    subject: `💚 Pagamento confirmado — pedido ${o.id}`,
    preheader: `Recebemos ${formatBRL(o.total)}. Seu pedido está garantido!`,
    html: shell(brand, `Pagamento de ${formatBRL(o.total)} confirmado.`, inner),
    text,
  };
}

/** 5) Pedido de avaliação (pós-entrega). */
export function reviewRequestEmail(brand: EmailBrand, opts: { name: string; orderId?: string; petName?: string }): EmailContent {
  const first = opts.name.split(" ")[0] || "amigo(a)";
  const pet = opts.petName ? ` e o(a) <strong>${esc(opts.petName)}</strong>` : "";
  const inner =
    body(
      `<div style="text-align:center;margin:0 0 8px;font-size:40px;line-height:1;">🌟</div>` +
      h1("Como foi a experiência?") +
      p(`Oi, ${esc(first)}! Esperamos que você${pet} tenham adorado os produtos${opts.orderId ? ` do pedido <strong>${esc(opts.orderId)}</strong>` : ""}.`) +
      p("Sua opinião ajuda muito outros tutores e a gente a melhorar sempre. Que tal deixar uma avaliação rapidinha?") +
      `<div style="text-align:center;font-size:30px;letter-spacing:6px;margin:4px 0 18px;">⭐️⭐️⭐️⭐️⭐️</div>` +
      button(brand, "✍️ Avaliar minha compra", `${brand.siteUrl}/avaliacoes`) +
      small("Leva menos de 1 minuto — e faz a diferença. 💛"),
    );
  const text = [
    `Como foi a experiência, ${first}?`,
    ``,
    `Sua avaliação ajuda muito! Deixe seu comentário em ${brand.siteUrl}/avaliacoes`,
  ].join("\n");
  return {
    subject: `${first}, conta pra gente como foi? 🌟`,
    preheader: "Sua avaliação ajuda outros tutores — leva menos de 1 minuto.",
    html: shell(brand, "Avalie sua compra e ajude outros tutores.", inner),
    text,
  };
}

/** 6) Carrinho abandonado. */
export function abandonedCartEmail(brand: EmailBrand, opts: {
  name?: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  coupon?: string;
}): EmailContent {
  const first = (opts.name || "").split(" ")[0];
  const inner =
    body(
      h1("Seu pet ainda está esperando 🐶🐱") +
      p(`${first ? `Oi, ${esc(first)}! ` : "Oi! "}Notamos que você deixou alguns mimos no carrinho. Guardamos tudo para você!`) +
      itemsTable(brand, { id: "", customerName: opts.name || "", items: opts.items, total: opts.total }) +
      (opts.coupon
        ? callout(`🎁 Volte agora e use o cupom <strong>${esc(opts.coupon)}</strong> para um desconto especial!`, "success")
        : "") +
      button(brand, "🛒 Finalizar meu pedido", `${brand.siteUrl}/carrinho`) +
      small("Os itens são sob encomenda e o preço é estimado — a disponibilidade final é confirmada pela loja."),
    );
  const text = [
    `${first ? `Oi, ${first}! ` : ""}Você deixou itens no carrinho:`,
    ``,
    orderItemsText({ id: "", customerName: "", items: opts.items, total: opts.total }),
    ``,
    opts.coupon ? `Cupom especial: ${opts.coupon}\n` : "",
    `Finalize em: ${brand.siteUrl}/carrinho`,
  ].join("\n");
  return {
    subject: `Você esqueceu algo no carrinho 🛒🐾`,
    preheader: opts.coupon ? `Volte e use o cupom ${opts.coupon}.` : "Guardamos seus itens para você.",
    html: shell(brand, "Guardamos os itens do seu carrinho.", inner),
    text,
  };
}

/** 7) Boas-vindas à newsletter (com cupom). */
export function newsletterWelcomeEmail(brand: EmailBrand, opts: { coupon?: string }): EmailContent {
  const inner =
    body(
      h1("Inscrição confirmada! 💌") +
      p(`Prontinho! Agora você recebe em primeira mão as novidades, promoções e dicas para o seu pet da <strong>${esc(brand.storeName)}</strong>.`) +
      (opts.coupon
        ? callout(`🎁 Como agradecimento, use o cupom <strong>${esc(opts.coupon)}</strong> na sua próxima compra!`, "success")
        : "") +
      button(brand, "🛍️ Explorar a loja", `${brand.siteUrl}/produtos`) +
      small("Pode ficar tranquilo(a): você pode cancelar a inscrição quando quiser."),
    );
  const text = [
    `Inscrição confirmada!`,
    ``,
    `Você agora recebe novidades e promoções da ${brand.storeName}.`,
    opts.coupon ? `\nCupom: ${opts.coupon}` : "",
    ``,
    `Loja: ${brand.siteUrl}/produtos`,
  ].join("\n");
  return {
    subject: `Inscrição confirmada 💌 ${opts.coupon ? `(cupom ${opts.coupon} dentro!)` : ""}`.trim(),
    preheader: opts.coupon ? `Seu cupom: ${opts.coupon}` : "Você está na nossa lista de novidades.",
    html: shell(brand, opts.coupon ? `Seu cupom de boas-vindas: ${opts.coupon}` : "Inscrição confirmada.", inner),
    text,
  };
}

/** 8) Senha alterada (aviso de segurança). */
export function passwordChangedEmail(brand: EmailBrand, opts: { name?: string }): EmailContent {
  const first = (opts.name || "").split(" ")[0];
  const inner =
    body(
      `<div style="text-align:center;margin:0 0 8px;font-size:40px;line-height:1;">🔒</div>` +
      h1("Sua senha foi alterada") +
      p(`${first ? `Oi, ${esc(first)}! ` : "Olá! "}A senha da sua conta na <strong>${esc(brand.storeName)}</strong> foi alterada com sucesso em ${formatDate(Date.now())}.`) +
      callout("Se foi você, está tudo certo — pode ignorar este e-mail. Se <strong>não</strong> foi você, fale com a gente imediatamente.", "warn") +
      button(brand, "Falar com o suporte", waLink(brand, "Olá! Não reconheço a alteração de senha na minha conta Wazoo.")),
    );
  const text = [
    `Sua senha foi alterada`,
    ``,
    `${first ? `Oi, ${first}! ` : ""}A senha da sua conta ${brand.storeName} foi alterada em ${formatDate(Date.now())}.`,
    `Se não foi você, entre em contato imediatamente.`,
  ].join("\n");
  return {
    subject: `🔒 Sua senha foi alterada — ${brand.storeName}`,
    preheader: "Confirmação de alteração de senha da sua conta.",
    html: shell(brand, "Sua senha foi alterada com sucesso.", inner),
    text,
  };
}

/** 9) Promoção / comunicado (broadcast genérico). */
export function promoEmail(brand: EmailBrand, opts: {
  title: string;
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
  coupon?: string;
  emoji?: string;
}): EmailContent {
  const inner =
    body(
      `<div style="text-align:center;margin:0 0 8px;font-size:40px;line-height:1;">${opts.emoji || "🎉"}</div>` +
      h1(esc(opts.title)) +
      p(esc(opts.message).replace(/\n/g, "<br/>")) +
      (opts.coupon ? callout(`🎁 Use o cupom <strong>${esc(opts.coupon)}</strong>!`, "success") : "") +
      button(brand, opts.ctaLabel || "Aproveitar agora", opts.ctaUrl || `${brand.siteUrl}/produtos`),
    );
  const text = [
    opts.title,
    ``,
    opts.message,
    opts.coupon ? `\nCupom: ${opts.coupon}` : "",
    ``,
    `${opts.ctaUrl || `${brand.siteUrl}/produtos`}`,
  ].join("\n");
  return {
    subject: `${opts.emoji || "🎉"} ${opts.title} — ${brand.storeName}`,
    preheader: opts.message.slice(0, 90),
    html: shell(brand, opts.message.slice(0, 90), inner),
    text,
  };
}

/* Também exportamos Order completo aceito nos helpers (compat). */
export type { Order };
