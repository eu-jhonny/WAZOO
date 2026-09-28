/**
 * Configuração central da loja.
 * 👉 Para trocar o número do WhatsApp, Instagram, horário, etc.,
 *    basta editar os valores abaixo.
 */

export const site = {
  storeName: "Wazoo",
  slogan:
    "Tudo para o bem-estar do seu pet: produtos, cuidados, diversão e muito mais.",

  // WhatsApp no formato internacional, apenas dígitos (DDI + DDD + número).
  // Ex.: Brasil (55) + DDD (11) + número (9 9999-9999) => "5511999999999"
  whatsappNumber: "5511999999999",

  instagram: "@wazoo",
  instagramUrl: "https://instagram.com/wazoo",
  email: "contato@wazoo.com",
  hours: "Segunda a sábado, das 9h às 18h",
  city: "São Paulo · SP e região",

  institutionalText:
    "Na Wazoo, você encontra produtos para cães e gatos com uma experiência de compra simples, segura e divertida. Escolha seus produtos, confira estoque e opções de entrega, pague online e acompanhe cada etapa do pedido até chegar até você.",

  deliveryFee: 0,

  // Credenciais de teste (simuladas)
  admin: { email: "admin@wazoo.com", password: "admin123" },
  demoClient: { email: "cliente@wazoo.com", password: "123456" },
} as const;

/** Caminhos das imagens da marca (otimizadas em /public/images). */
export const img = {
  logo: "/images/logo-wazoo-white.webp", // logo principal (W com carinha + patinha)
  logoFlat: "/images/logo-wazoo.webp", // wordmark alternativo
  favicon: "/images/logo-icon.png",

  // Mascotes (PNG/WebP com fundo transparente)
  mascot: {
    saudacao: "/images/mascote-saudacao.webp",
    trabalhando: "/images/mascote-trabalhando.webp",
    dormindo: "/images/mascote-dormindo.webp",
    brincando: "/images/mascote-brincando.webp",
    banho: "/images/cachorro-banho.webp",
    comendo: "/images/cachorro-comendo.webp",
    correndo: "/images/cachorro-correndo.webp",
    dogTrabalhando: "/images/cachorro-trabalhando.webp",
  },

  // Fotos de produtos
  produto: {
    brinquedo: "/images/produto-brinquedo.webp",
    caixa: "/images/produto-caixa-transporte.webp",
    cama: "/images/produto-cama.webp",
    coleira: "/images/produto-coleira.webp",
    petiscos: "/images/produto-petiscos.webp",
    racao: "/images/produto-racao.webp",
    shampoo: "/images/produto-shampoo.webp",
    tigelas: "/images/produto-tigelas.webp",
  },

  // Fotos publicitárias / modelos (fundo laranja, ótimas para banners)
  modelo: {
    criancaBeagle: "/images/modelo-crianca-beagle.webp",
    homemGolden: "/images/modelo-homem-golden.webp",
    mulherPoodle: "/images/modelo-mulher-poodle.webp",
    bulldogs: "/images/ad-bulldogs.webp",
    risada: "/images/ad-risada.webp",
    surpresa: "/images/ad-surpresa.webp",
    ternura: "/images/ad-ternura.webp",
  },
} as const;

/** Chaves usadas no localStorage (versão facilita futuras migrações). */
export const STORAGE_KEYS = {
  products: "wazoo:products:v1",
  orders: "wazoo:orders:v1",
  reviews: "wazoo:reviews:v1",
  settings: "wazoo:settings:v1",
  cart: "wazoo:cart:v1",
  cartNote: "wazoo:cartNote:v1",
  user: "wazoo:user:v1",
  users: "wazoo:users:v1",
  admin: "wazoo:admin:v1",
  wishlist: "wazoo:wishlist:v1",
  recentlyViewed: "wazoo:recently_viewed:v1",
} as const;
