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
    ["storeName", "Wazoo Pet Express"],
    ["whatsapp", "5511999999999"],
    ["instagram", "@wazoo.pet"],
    ["hours", "Seg–Sex 9h–18h | Sáb 9h–13h"],
    ["institutionalText", "Loja pet sob encomenda em São Paulo. Qualidade e carinho para seu melhor amigo!"],
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
          image: "/images/banners/copa.jpg",
          fallback: "from-[#002776] via-[#004A1C] to-[#002776]",
          tag: "⚽ Copa dos Pets",
          title: "Torcida Animal!",
          subtitle: "Vista seu pet com as cores do Brasil",
          cta: "Ver coleção Copa",
          ctaStyle: "bg-[#FFDF00] text-[#002776]",
          link: "/produtos",
          category: "copa",
          order: 1,
        },
        {
          image: "/images/banners/festajunina.jpg",
          fallback: "from-orange-700 via-orange-500 to-yellow-500",
          tag: "🎉 Arraiá Pet",
          title: "Festa Junina dos Pets!",
          subtitle: "Chapéus, bandanas e muito amor",
          cta: "Ver kits Festa Junina",
          ctaStyle: "bg-white text-orange-600",
          link: "/kits",
          category: "festas",
          order: 2,
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
