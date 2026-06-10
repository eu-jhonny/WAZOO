/**
 * Configuração central da loja.
 * 👉 Para trocar o número do WhatsApp, Instagram, horário, etc.,
 *    basta editar os valores abaixo.
 */

export const site = {
  storeName: "Wazoo Pet Express",
  slogan:
    "Produtos pet sob encomenda para cães e gatos. Você pede, a gente encontra e entrega com carinho.",

  // WhatsApp no formato internacional, apenas dígitos (DDI + DDD + número).
  // Ex.: Brasil (55) + DDD (11) + número (9 9999-9999) => "5511999999999"
  whatsappNumber: "5511999999999",

  instagram: "@wazoopetexpress",
  instagramUrl: "https://instagram.com/wazoopetexpress",
  email: "contato@wazoo.com",
  hours: "Segunda a sábado, das 9h às 18h",
  city: "São Paulo · SP e região",

  institutionalText:
    "Na Wazoo Pet Express, você encontra produtos para cães e gatos de forma prática, personalizada e segura. Trabalhamos com produtos sob encomenda, buscando as melhores opções com fornecedores parceiros para atender às necessidades do seu pet. Você escolhe, a gente verifica a disponibilidade e combina o prazo de entrega ou retirada.",

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
} as const;
