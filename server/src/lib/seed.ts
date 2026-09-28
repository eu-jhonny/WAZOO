/**
 * Seed inicial do banco de dados Wazoo
 * Execute com: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  /* ── Admin ──────────────────────────────────── */
  const hashedPass = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "WazooAdmin2024!", 12);
  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? "admin@wazoo.com.br" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL ?? "admin@wazoo.com.br",
      password: hashedPass,
      name: "Administrador Wazoo",
      role: "SUPER_ADMIN",
    },
  });
  console.log("✅ Admin criado");

  /* ── Configurações da loja ──────────────────── */
  const defaultSettings = [
    ["storeName", "Wazoo"],
    ["whatsapp", "5511999999999"],
    ["instagram", "@wazoo.pet"],
    ["hours", "Seg–Sex 9h–18h | Sáb 9h–13h"],
    ["institutionalText", "Tudo para o bem-estar do seu pet, com compra online segura e prática."],
    ["deliveryFee", "15"],
    ["freeShippingThreshold", "200"],
  ];
  for (const [key, value] of defaultSettings) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  console.log("✅ Configurações criadas");

  /* ── Categorias ─────────────────────────────── */
  const categories = [
    { slug: "higiene",     name: "Higiene",    gradient: "from-brand-teal to-navy-600",   petType: null  },
    { slug: "brinquedos",  name: "Brinquedos", gradient: "from-brand-purple to-navy-600", petType: null  },
    { slug: "acessorios",  name: "Acessórios", gradient: "from-brand-pink to-orange-500", petType: null  },
    { slug: "petiscos",    name: "Petiscos",   gradient: "from-orange-400 to-brand-pink", petType: null  },
    { slug: "caminhas",    name: "Caminhas",   gradient: "from-orange-400 to-orange-600", petType: null  },
    { slug: "racoes",      name: "Rações",     gradient: "from-green-400 to-green-600",   petType: null  },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
  }
  console.log("✅ Categorias criadas");


  /* ── Produtos iniciais ───────────────────────── */
  const products = [
    {
      id: "p-cama-confort",
      slug: "caminha-pet-confort",
      name: "Caminha Pet Confort",
      categorySlug: "caminhas",
      shortDescription: "Caminha macia e aconchegante para cães e gatos de pequeno e médio porte.",
      description: "Caminha confortável com enchimento fofo e base antiderrapante. Ideal para cães e gatos de pequeno e médio porte.",
      price: 89.9,
      comparePrice: 119.9,
      promoLabel: "Oferta 🔥",
      image: "/images/produto-cama.webp",
      audience: "ambos",
      size: "medio",
      leadTime: "3 a 7 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: true,
      onDemand: false,
      stock: 14,
      variants: [
        { name: "Tamanho", options: [
          { label: "Pequeno", priceDelta: -15 },
          { label: "Médio", priceDelta: 0 },
          { label: "Grande", priceDelta: 25 },
        ] },
      ],
    },
    {
      id: "p-coleira-ajustavel",
      slug: "coleira-ajustavel",
      name: "Coleira Ajustável",
      categorySlug: "acessorios",
      shortDescription: "Confortável, segura e disponível em diferentes tamanhos.",
      description: "Coleira ajustável com fecho resistente e regulagem fácil para passeios seguros.",
      price: 34.9,
      comparePrice: 49.9,
      image: "/images/produto-coleira.webp",
      audience: "cachorro",
      size: "todos",
      leadTime: "2 a 5 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: true,
      onDemand: false,
      stock: 4,
      variants: [
        { name: "Tamanho", options: [
          { label: "P", priceDelta: 0 },
          { label: "M", priceDelta: 0 },
          { label: "G", priceDelta: 5 },
        ] },
        { name: "Cor", options: [
          { label: "Vermelho" },
          { label: "Azul" },
          { label: "Preto" },
        ] },
      ],
    },
    {
      id: "p-brinquedo-mordedor",
      slug: "brinquedo-mordedor",
      name: "Brinquedo Mordedor",
      categorySlug: "brinquedos",
      shortDescription: "Ajuda na diversão e no gasto de energia do seu cão.",
      description: "Brinquedo mordedor resistente, atóxico e ideal para brincadeiras diárias.",
      price: 24.9,
      comparePrice: 32.9,
      image: "/images/produto-brinquedo.webp",
      audience: "cachorro",
      size: "todos",
      leadTime: "2 a 4 dias úteis",
      availability: "Esgotado",
      active: true,
      featured: true,
      onDemand: false,
      stock: 0,
    },
    {
      id: "p-racao-super-premium",
      slug: "racao-super-premium-caes",
      name: "Ração Super Premium para Cães",
      categorySlug: "racoes",
      shortDescription: "Alimentação completa e balanceada para cães adultos.",
      description: "Ração super premium formulada com ingredientes selecionados para uma alimentação completa e balanceada.",
      price: 129.9,
      image: "/images/produto-racao.webp",
      audience: "cachorro",
      size: "todos",
      leadTime: "2 a 5 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: true,
      onDemand: false,
      stock: 20,
      variants: [
        { name: "Peso", options: [
          { label: "3 kg", priceDelta: 0 },
          { label: "10,1 kg", priceDelta: 180 },
          { label: "15 kg", priceDelta: 260 },
        ] },
      ],
    },
    {
      id: "p-tapete-higienico",
      slug: "tapete-higienico-premium",
      name: "Tapete Higiênico Premium",
      categorySlug: "higiene",
      shortDescription: "Ideal para manter a rotina do seu pet mais limpa e prática.",
      description: "Tapete higiênico premium com alta absorção e controle de odor.",
      price: 59.9,
      image: "",
      audience: "ambos",
      size: "todos",
      leadTime: "2 a 5 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: true,
      onDemand: false,
      stock: 25,
    },
    {
      id: "p-sache-gatos",
      slug: "sache-para-gatos",
      name: "Sachê para Gatos",
      categorySlug: "petiscos",
      shortDescription: "Opção saborosa para complementar a alimentação do seu gato.",
      description: "Sachê úmido saboroso para complementar a alimentação do seu gato.",
      price: 7.9,
      image: "",
      audience: "gato",
      size: "todos",
      leadTime: "1 a 3 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: true,
      onDemand: false,
      stock: 60,
    },
    {
      id: "p-shampoo-neutro",
      slug: "shampoo-neutro-pet",
      name: "Shampoo Neutro Pet",
      categorySlug: "higiene",
      shortDescription: "Banho suave que respeita a pele de cães e gatos.",
      description: "Shampoo neutro de fórmula suave que limpa sem agredir pele e pelagem.",
      price: 32.9,
      image: "/images/produto-shampoo.webp",
      audience: "ambos",
      size: "todos",
      leadTime: "2 a 4 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: false,
      onDemand: false,
      stock: 18,
    },
    {
      id: "p-caixa-transporte",
      slug: "caixa-de-transporte",
      name: "Caixa de Transporte",
      categorySlug: "acessorios",
      shortDescription: "Segurança e conforto para levar seu pet a qualquer lugar.",
      description: "Caixa de transporte resistente com boa ventilação e travas seguras.",
      price: 119.9,
      image: "/images/produto-caixa-transporte.webp",
      audience: "ambos",
      size: "medio",
      leadTime: "3 a 7 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: false,
      onDemand: false,
      stock: 8,
    },
    {
      id: "p-comedouro-duplo",
      slug: "comedouro-duplo-inox",
      name: "Comedouro Duplo Inox",
      categorySlug: "acessorios",
      shortDescription: "Tigelas de inox com base antiderrapante para água e ração.",
      description: "Comedouro duplo em inox com base antiderrapante, higiênico e fácil de limpar.",
      price: 44.9,
      image: "/images/produto-tigelas.webp",
      audience: "ambos",
      size: "todos",
      leadTime: "2 a 5 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: false,
      onDemand: false,
      stock: 16,
    },
    {
      id: "p-petisco-natural",
      slug: "petisco-natural",
      name: "Petisco Natural",
      categorySlug: "petiscos",
      shortDescription: "Recompensa saudável feita com ingredientes naturais.",
      description: "Petisco natural sem corantes artificiais, ideal para recompensas e adestramento.",
      price: 19.9,
      image: "/images/produto-petiscos.webp",
      audience: "ambos",
      size: "todos",
      leadTime: "1 a 3 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: false,
      onDemand: false,
      stock: 30,
    },
    {
      id: "p-cama-aconchego-g",
      slug: "caminha-aconchego-grande",
      name: "Caminha Aconchego (Grande)",
      categorySlug: "caminhas",
      shortDescription: "Versão maior e ainda mais fofa para pets de grande porte.",
      description: "Caminha espaçosa e ultra macia para pets de grande porte.",
      price: 109.9,
      image: "/images/produto-cama.webp",
      audience: "ambos",
      size: "grande",
      leadTime: "3 a 7 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: false,
      onDemand: false,
      stock: 7,
    },
    {
      id: "p-coleira-couro",
      slug: "coleira-premium-couro",
      name: "Coleira Premium em Couro",
      categorySlug: "acessorios",
      shortDescription: "Elegância e resistência para passeios com estilo.",
      description: "Coleira premium em couro sintético com acabamento elegante e durável.",
      price: 49.9,
      image: "/images/produto-coleira.webp",
      audience: "cachorro",
      size: "todos",
      leadTime: "3 a 6 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: false,
      onDemand: false,
      stock: 10,
    },
    {
      id: "p-racao-gatos",
      slug: "racao-premium-gatos",
      name: "Ração Premium para Gatos",
      categorySlug: "racoes",
      shortDescription: "Nutrição completa para a saúde e energia do seu gato.",
      description: "Ração premium para gatos com nutrientes para saúde urinária e controle de bolas de pelo.",
      price: 99.9,
      image: "/images/produto-racao.webp",
      audience: "gato",
      size: "todos",
      leadTime: "2 a 5 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: false,
      onDemand: false,
      stock: 15,
    },
    {
      id: "p-bifinho-caes",
      slug: "bifinho-para-caes",
      name: "Bifinho para Cães",
      categorySlug: "petiscos",
      shortDescription: "Macio e saboroso, perfeito para o adestramento.",
      description: "Bifinho macio e saboroso, ideal para recompensar bons comportamentos.",
      price: 16.9,
      image: "/images/produto-petiscos.webp",
      audience: "cachorro",
      size: "todos",
      leadTime: "1 a 3 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: false,
      onDemand: false,
      stock: 35,
    },
    {
      id: "p-brinquedo-pelucia",
      slug: "brinquedo-de-pelucia",
      name: "Brinquedo de Pelúcia",
      categorySlug: "brinquedos",
      shortDescription: "Macio e divertido, companhia perfeita para brincar.",
      description: "Brinquedo de pelúcia macio com apito interno para brincadeiras e descanso.",
      price: 29.9,
      image: "/images/produto-brinquedo.webp",
      audience: "ambos",
      size: "todos",
      leadTime: "2 a 4 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: false,
      onDemand: false,
      stock: 22,
    },
    {
      id: "p-tigela-antiderrapante",
      slug: "kit-tigela-antiderrapante",
      name: "Kit Tigela Antiderrapante",
      categorySlug: "acessorios",
      shortDescription: "Conjunto prático que não escorrega na hora da refeição.",
      description: "Conjunto de tigelas com base emborrachada antiderrapante e material resistente.",
      price: 39.9,
      image: "/images/produto-tigelas.webp",
      audience: "ambos",
      size: "todos",
      leadTime: "2 a 5 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: false,
      onDemand: false,
      stock: 14,
    },
    {
      id: "p-arranhador-gato",
      slug: "arranhador-para-gatos",
      name: "Arranhador para Gatos",
      categorySlug: "acessorios",
      shortDescription: "Diversão e bem-estar, protegendo os móveis da casa.",
      description: "Arranhador resistente com plataforma para descanso e brincadeira.",
      price: 74.9,
      image: "",
      audience: "gato",
      size: "todos",
      leadTime: "3 a 7 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: false,
      onDemand: false,
      stock: 9,
    },
    {
      id: "p-areia-higienica",
      slug: "areia-higienica-gatos",
      name: "Areia Higiênica para Gatos",
      categorySlug: "higiene",
      shortDescription: "Alta absorção e controle de odor para a caixinha.",
      description: "Areia higiênica com excelente absorção e controle de odor.",
      price: 27.9,
      image: "",
      audience: "gato",
      size: "todos",
      leadTime: "1 a 3 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: false,
      onDemand: false,
      stock: 28,
    },
    {
      id: "p-perfume-colonia",
      slug: "perfume-colonia-pet",
      name: "Perfume Colônia Pet",
      categorySlug: "higiene",
      shortDescription: "Toque final cheiroso e suave após o banho.",
      description: "Colônia pet com fragrância suave e duradoura.",
      price: 28.9,
      image: "",
      audience: "ambos",
      size: "todos",
      leadTime: "2 a 4 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: false,
      onDemand: false,
      stock: 12,
    },
    {
      id: "p-guia-retratil",
      slug: "guia-retratil",
      name: "Guia Retrátil",
      categorySlug: "acessorios",
      shortDescription: "Liberdade controlada e segurança nos passeios.",
      description: "Guia retrátil com trava de segurança e pegada ergonômica.",
      price: 54.9,
      image: "",
      audience: "cachorro",
      size: "todos",
      leadTime: "2 a 5 dias úteis",
      availability: "Em estoque",
      active: true,
      featured: false,
      onDemand: false,
      stock: 11,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: { ...product, gallery: [], tags: [] },
      create: { ...product, gallery: [], tags: [] },
    });
  }
  console.log(`✅ ${products.length} produtos criados/atualizados`);

  /* ── Kits iniciais ───────────────────────────── */
  const kits = [
    { id: "kit-filhote", slug: "kit-filhote", name: "Kit Filhote", items: ["Brinquedo", "Tapete higiênico", "Petisco", "Potinho"], description: "Ideal para quem acabou de receber um novo pet em casa.", price: 99.9, leadTime: "3 a 5 dias úteis", image: "/images/mascote-brincando.webp", audience: "ambos", accent: "orange", active: true },
    { id: "kit-passeio", slug: "kit-passeio", name: "Kit Passeio", items: ["Coleira", "Guia", "Saquinho higiênico", "Plaquinha"], description: "Tudo para passear com segurança e estilo.", price: 79.9, leadTime: "3 a 5 dias úteis", image: "/images/cachorro-correndo.webp", audience: "cachorro", accent: "green", active: true },
    { id: "kit-higiene", slug: "kit-higiene", name: "Kit Higiene", items: ["Shampoo", "Perfume", "Escova", "Tapete higiênico"], description: "Para manter seu pet limpo, cheiroso e confortável.", price: 89.9, leadTime: "3 a 6 dias úteis", image: "/images/cachorro-banho.webp", audience: "ambos", accent: "teal", active: true },
    { id: "kit-mimo", slug: "kit-mimo", name: "Kit Mimo Pet", items: ["Brinquedo", "Petisco", "Acessório fofo"], description: "Um carinho especial para seu melhor amigo.", price: 69.9, leadTime: "2 a 5 dias úteis", image: "/images/cachorro-comendo.webp", audience: "ambos", accent: "pink", active: true },
    { id: "kit-gato", slug: "kit-gato", name: "Kit Gato", items: ["Sachê", "Brinquedo", "Areia", "Arranhador pequeno"], description: "Produtos selecionados para deixar seu gato mais feliz.", price: 109.9, leadTime: "3 a 6 dias úteis", image: "/images/mascote-saudacao.webp", audience: "gato", accent: "purple", active: true },
  ];
  for (const kit of kits) {
    await prisma.kit.upsert({ where: { id: kit.id }, update: kit, create: kit });
  }
  console.log(`✅ ${kits.length} kits criados/atualizados`);

  /* ── Cupons de exemplo ──────────────────────── */
  const coupons = [
    { code: "WAZOO10",   type: "PERCENTAGE" as const, value: 10, active: true },
    { code: "FRETEGRATIS", type: "FREE_SHIPPING" as const, value: 0, minOrder: 100, active: true },
    { code: "PRIMEIRA",  type: "PERCENTAGE" as const, value: 15, maxUses: 100, active: true },
  ];
  for (const coupon of coupons) {
    await prisma.coupon.upsert({ where: { code: coupon.code }, update: {}, create: coupon });
  }
  console.log("✅ Cupons criados");

  /* ── Banners ────────────────────────────────── */
  const bannerCount = await prisma.banner.count();
  if (bannerCount === 0) {
    await prisma.banner.createMany({
      data: [
        {
          image: "/images/modelo-homem-golden.webp",
          fallback: "from-[#0F2A4A] via-[#123a63] to-[#0b2038]",
          tag: "👔 Dia dos Pais",
          title: "Dia dos Pais Pet!",
          subtitle: "Presenteie a dupla favorita: pai & pet",
          cta: "Ver presentes",
          ctaStyle: "bg-orange-500 text-white",
          link: "/produtos",
          category: "diadospais",
          order: 1,
        },
        {
          image: "/images/banners/conforto.jpg",
          fallback: "from-[#F7DCB6] via-orange-100 to-cream-100",
          tag: "🐾 Novidades",
          title: "Conforto em 1º lugar",
          subtitle: "Caminhas, mantas e acessórios",
          cta: "Ver produtos",
          link: "/produtos",
          category: "geral",
          order: 3,
        },
      ],
    });
    console.log("✅ Banners criados");
  }

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log(`   Admin: ${process.env.ADMIN_EMAIL ?? "admin@wazoo.com.br"}`);
  console.log(`   Senha: ${process.env.ADMIN_PASSWORD ?? "WazooAdmin2024!"}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
