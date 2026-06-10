import { Link } from "react-router-dom";
import {
  ArrowRight, Heart, PawPrint, ShoppingBag, ShieldCheck,
  Sparkles, Star, Truck, Zap, Gift, Package,
} from "lucide-react";
import { img } from "@/config/site";
import { homeCategories } from "@/data/categories";
import { kits } from "@/data/kits";
import { useStore } from "@/context/StoreContext";
import { whatsappLink, defaultContactMessage } from "@/lib/whatsapp";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BannerCarousel } from "@/components/ui/BannerCarousel";
import { PromoStrip } from "@/components/ui/PromoStrip";
import { CategoryShelf } from "@/components/ui/CategoryShelf";
import { ProductCard } from "@/components/product/ProductCard";
import { KitCard } from "@/components/product/KitCard";
import { ReviewCard } from "@/components/product/ReviewCard";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { Decor } from "@/components/ui/Decor";
import { Bunting } from "@/components/ui/Bunting";

/* ── Constantes ─────────────────────────────────────────────── */
const TRUST = [
  { icon: PawPrint,    label: "Sob encomenda",     color: "text-orange-500", bg: "bg-orange-50"  },
  { icon: Heart,       label: "Atendimento humano", color: "text-pink-500",   bg: "bg-pink-50"    },
  { icon: ShieldCheck, label: "Compra segura",      color: "text-green-500",  bg: "bg-green-50"   },
  { icon: Truck,       label: "Entrega combinada",  color: "text-teal-500",   bg: "bg-teal-50"    },
] as const;

const COPA_ITEMS  = ["Bandanas e lenços temáticos", "Brinquedos Copa", "Roupinhas e acessórios", "Petiscos especiais"];
const FESTA_ITEMS = ["Chapéus de palha pet", "Bandanas xadrez", "Brinquedos e petiscos temáticos", "Kits Arraiá completos"];

const MINI_BANNERS = [
  {
    image: "/images/banners/cachorros.jpg",
    bg: "from-amber-700 to-orange-900",
    eyebrow: "🐕 Linha Cachorros",
    eyebrowColor: "text-orange-300",
    title: "Tudo para o seu cão",
    desc: "Coleiras, roupinhas, brinquedos e acessórios",
    btnLabel: "Explorar →",
    btnStyle: "bg-orange-500 text-white hover:bg-orange-600",
    link: "/cachorros",
  },
  {
    image: "/images/banners/gatos.jpg",
    bg: "from-purple-900 to-indigo-900",
    eyebrow: "🐈 Linha Gatos",
    eyebrowColor: "text-purple-300",
    title: "Mimos para o seu gato",
    desc: "Arranhadores, casinhas, petiscos e muito mais",
    btnLabel: "Explorar →",
    btnStyle: "bg-purple-500 text-white hover:bg-purple-600",
    link: "/gatos",
  },
] as const;

const WHY_ITEMS = [
  { icon: Package,  title: "Mais variedade",         desc: "Sem estoque fixo — buscamos o que você precisa." },
  { icon: Heart,    title: "Atendimento personalizado", desc: "Cada pedido é único, com cuidado e atenção." },
  { icon: ShieldCheck, title: "Preço direto",         desc: "Sem intermediários. Valor real do fornecedor." },
  { icon: Truck,    title: "Entrega ou retirada",     desc: "Combinamos a melhor forma para você." },
] as const;

/* ── Página ─────────────────────────────────────────────────── */
export function Home() {
  const { products, reviews, settings } = useStore();

  const featured   = products.filter((p) => p.active && p.featured).slice(0, 4);
  const forDogs    = products.filter((p) => p.active && (p.audience === "cachorro" || p.audience === "ambos")).slice(0, 8);
  const forCats    = products.filter((p) => p.active && (p.audience === "gato"     || p.audience === "ambos")).slice(0, 8);
  const withPromo  = products.filter((p) => p.active && (p.comparePrice || p.promoLabel)).slice(0, 8);
  const topReviews = reviews.filter((r) => r.approved && r.featured).slice(0, 3);
  const wa         = whatsappLink(defaultContactMessage, settings.whatsapp);

  return (
    <div className="bg-cream-50">

      {/* ══ PROMO STRIP ═════════════════════════════════ */}
      <PromoStrip />

      {/* ══ ANNOUNCEMENT BAR ═══════════════════════════ */}
      <div className="bg-navy-800 py-2 text-center text-xs font-bold text-cream-100 sm:text-sm">
        <div className="container-app flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <span>🚚 Entrega ou retirada em São Paulo</span>
          <span className="hidden h-3 w-px bg-white/20 sm:block" />
          <span>💳 Parcele em até 10x sem juros</span>
          <span className="hidden h-3 w-px bg-white/20 sm:block" />
          <span>🐾 Produtos 100% sob encomenda</span>
        </div>
      </div>

      {/* ══ BANNER CAROUSEL ════════════════════════════ */}
      <BannerCarousel />

      {/* ══ TRUST STRIP ════════════════════════════════ */}
      <div className="bg-white py-4 shadow-sm">
        <div className="container-app grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.label} className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 ${t.bg}`}>
              <t.icon size={17} className={`shrink-0 ${t.color}`} />
              <span className="text-xs font-bold text-navy-700 sm:text-sm">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ CATEGORIAS ═════════════════════════════════ */}
      <div className="border-b border-cream-200 bg-white py-5">
        <div className="container-app">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:gap-4">
            {homeCategories.map((cat) => (
              <Link key={cat.name} to={cat.to} className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-3 py-2 transition-colors hover:bg-cream-50">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${cat.gradient}`}>
                  <span className="text-2xl">{cat.emoji}</span>
                </div>
                <span className="text-xs font-semibold text-navy-600">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ══ MINI BANNERS (Cães + Gatos) ════════════════ */}
      <section className="py-6 sm:py-10">
        <div className="container-app grid gap-4 sm:grid-cols-2">
          {MINI_BANNERS.map((b, i) => (
            <Reveal key={b.link} delay={i * 80}>
              <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${b.bg} shadow-md`}>
                <img
                  src={b.image}
                  alt={b.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-500 hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="relative flex min-h-[170px] flex-col justify-end p-5 sm:min-h-[210px] sm:p-7">
                  <span className={`mb-1 text-xs font-extrabold uppercase tracking-widest ${b.eyebrowColor}`}>{b.eyebrow}</span>
                  <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">{b.title}</h3>
                  <p className="mt-1 text-sm text-white/70">{b.desc}</p>
                  <Link
                    to={b.link}
                    className={`mt-4 inline-flex w-fit items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 ${b.btnStyle}`}
                  >
                    {b.btnLabel}
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ PRATELEIRAS DE PRODUTOS ════════════════════ */}
      <div className="space-y-2 bg-cream-50 pb-4">
        {forDogs.length > 0 && (
          <Reveal>
            <CategoryShelf title="Para o seu Cachorro" emoji="🐕" viewAllLink="/cachorros" products={forDogs} accentColor="orange" />
          </Reveal>
        )}
        {forCats.length > 0 && (
          <Reveal>
            <CategoryShelf title="Para o seu Gato" emoji="🐈" viewAllLink="/gatos" products={forCats} accentColor="purple" />
          </Reveal>
        )}
        {withPromo.length > 0 && (
          <Reveal>
            <CategoryShelf title="Em Promoção" emoji="🔥" viewAllLink="/produtos" products={withPromo} accentColor="teal" />
          </Reveal>
        )}
      </div>

      {/* ══ DESTAQUES ══════════════════════════════════ */}
      <section className="section bg-white">
        <div className="container-app">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeader eyebrow="Mais pedidos" icon={Star} title="Destaques da semana ⭐" subtitle="Os queridinhos dos tutores Wazoo." />
              <Link to="/produtos" className="btn-outline-orange btn-sm hidden sm:inline-flex">Ver todos <ArrowRight size={16} /></Link>
            </div>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product, i) => (
              <Reveal key={product.id} delay={i * 60}><ProductCard product={product} /></Reveal>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link to="/produtos" className="btn-outline-orange">Ver todos os produtos <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* ══ MINI BANNERS Copa + Festa ══════════════════ */}
      <section className="py-6 sm:py-8">
        <div className="container-app grid gap-4 sm:grid-cols-2">
          {/* Copa 2026 */}
          <Reveal>
            <div className="group relative overflow-hidden rounded-3xl shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-[#001a5e] via-[#002776] to-[#004d18]" />
              <img src="/images/banners/copa.jpg" alt="Copa dos Pets"
                className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              {/* Troféu decorativo */}
              <div className="absolute right-4 top-4 flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-[#FFDF00]/50 bg-[#FFDF00]/15 backdrop-blur-sm">
                <span className="text-2xl">⚽</span>
                <span className="text-[9px] font-extrabold uppercase text-[#FFDF00] leading-none">2026</span>
              </div>
              {/* Faixas brasileiras na base */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 flex">
                <div className="flex-1 bg-[#002776]" /><div className="flex-1 bg-[#FFDF00]" />
                <div className="flex-1 bg-[#009C3B]" /><div className="flex-1 bg-[#FFDF00]" />
                <div className="flex-1 bg-[#002776]" />
              </div>
              <div className="relative flex min-h-[190px] flex-col justify-end p-5 sm:min-h-[220px] sm:p-7">
                <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#FFDF00]/30 bg-[#FFDF00]/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#FFDF00]">
                  ⚽ Coleção Copa 2026
                </span>
                <h3 className="font-display text-2xl font-bold text-white drop-shadow sm:text-3xl">Torcida Animal! 🏆</h3>
                <p className="mt-1 text-sm text-blue-100/80">Vista seu pet com as cores do Brasil</p>
                <Link to="/produtos" className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#FFDF00] px-5 py-2.5 text-sm font-bold text-[#002776] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-yellow-300">
                  Ver coleção →
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Festa Junina */}
          <Reveal delay={80}>
            <div className="group relative overflow-hidden rounded-3xl shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-[#7c1d00] via-[#b83200] to-[#c8640a]" />
              <img src="/images/banners/festajunina.jpg" alt="Arraiá Pet"
                className="absolute inset-0 h-full w-full object-cover opacity-35 transition-transform duration-700 group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              {/* Bandeirinhas reais no topo */}
              <div className="absolute left-0 right-0 top-0">
                <Bunting count={14} height={52} colors={["#E63946","#FFBE0B","#2A9D8F","#ffffff","#8338EC","#F4A261","#06D6A0","#EF476F"]} />
              </div>
              <div className="relative flex min-h-[190px] flex-col justify-end p-5 pt-16 sm:min-h-[220px] sm:p-7 sm:pt-16">
                <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-yellow-300/40 bg-yellow-400/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-yellow-200">
                  🎉 Arraiá Pet 2025
                </span>
                <h3 className="font-display text-2xl font-bold text-white drop-shadow sm:text-3xl">Festa Junina! 🌽</h3>
                <p className="mt-1 text-sm text-yellow-100/80">Chapéus de palha, bandanas xadrez e kits temáticos</p>
                <Link to="/kits" className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-orange-700 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-yellow-50">
                  Ver kits →
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ COPA DOS PETS ══════════════════════════════ */}
      <section className="relative overflow-hidden py-14 sm:py-20" style={{ background: "linear-gradient(135deg, #071444 0%, #0A3A1A 50%, #071444 100%)" }}>
        <div className="container-app relative">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <div className="relative overflow-hidden rounded-[2.5rem] shadow-soft-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-[#002776] to-[#009C3B]" />
                <img src="/images/banners/copa.jpg" alt="Copa dos Pets"
                  className="relative h-64 w-full object-cover sm:h-80"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute bottom-0 left-0 right-0 flex h-2">
                  <div className="flex-1 bg-[#002776]" /><div className="flex-1 bg-[#FFDF00]" /><div className="flex-1 bg-[#009C3B]" />
                </div>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#FFDF00]/15 px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-[#FFDF00]">⚽ Coleção Especial</span>
                <h2 className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl">Copa dos Pets! 🏆</h2>
                <p className="mt-3 text-lg text-blue-200">Deixe seu pet pronto para torcer. Acessórios temáticos, brinquedos e muito mais!</p>
                <ul className="mt-6 space-y-3">
                  {COPA_ITEMS.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#009C3B] text-xs font-bold text-white">✓</span>
                      <span className="font-semibold text-blue-100">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/produtos" className="btn bg-[#FFDF00] px-6 py-3 font-bold text-[#002776] shadow-soft hover:-translate-y-0.5 hover:bg-yellow-300">
                    <ShoppingBag size={18} /> Ver coleção Copa
                  </Link>
                  <a href={whatsappLink("Olá! Quero saber mais sobre a coleção Copa dos Pets!", settings.whatsapp)} target="_blank" rel="noopener noreferrer" className="btn bg-[#009C3B] px-6 py-3 font-bold text-white shadow-soft hover:-translate-y-0.5 hover:bg-green-700">
                    <WhatsAppIcon size={18} /> Pedir agora
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ ARRAIÁ PET ══════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-yellow-50 to-cream-50 py-14 sm:py-20">
        {/* Bandeirinhas duplas no topo */}
        <div className="pointer-events-none absolute left-0 right-0 top-0" aria-hidden>
          <Bunting count={20} height={62} colors={["#E63946","#FFBE0B","#2A9D8F","#fff","#8338EC","#F4A261","#06D6A0","#EF476F","#3A86FF","#FB5607"]} />
        </div>
        {/* Segunda fileira com deslocamento */}
        <div className="pointer-events-none absolute left-0 right-0 top-10" aria-hidden style={{ opacity: 0.55 }}>
          <Bunting count={18} height={48} colors={["#FFBE0B","#E63946","#fff","#2A9D8F","#F4A261","#8338EC","#FB5607","#06D6A0"]} />
        </div>
        <div className="container-app pt-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <div>
                <span className="eyebrow">🎉 Arraiá Pet</span>
                <h2 className="section-title mt-4">Festa Junina dos Pets! 🌽</h2>
                <p className="mt-3 text-lg leading-relaxed text-navy-500">Vista seu pet com chapéus de palha, bandanas xadrez e looks caipiras fofíssimos.</p>
                <ul className="mt-6 space-y-3">
                  {FESTA_ITEMS.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm">🌟</span>
                      <span className="font-semibold text-navy-600">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/kits" className="btn-primary"><ShoppingBag size={18} /> Ver kits Festa Junina</Link>
                  <Link to="/produtos" className="btn-outline-orange">Ver todos <ArrowRight size={16} /></Link>
                </div>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="relative overflow-hidden rounded-[2.5rem] shadow-soft-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-yellow-500" />
                <img src="/images/banners/festajunina.jpg" alt="Arraiá Pet"
                  className="relative h-72 w-full object-cover sm:h-80"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ BANNER CONFORTO ════════════════════════════ */}
      <Reveal>
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-cream-100">
          <img
            src="/images/banners/conforto.jpg"
            alt="Conforto"
            className="absolute inset-0 h-full w-full object-cover opacity-50"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="container-app relative flex items-center gap-10 py-12 sm:py-16">
            <div className="max-w-md">
              <span className="eyebrow"><Sparkles size={15} /> Temporada de conforto</span>
              <h2 className="section-title mt-4">Conforto em primeiro lugar 🐾</h2>
              <p className="mt-3 text-lg text-navy-500">Caminhas, mantas e acessórios para deixar seu pet aconchegante o ano todo.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/produtos" className="btn-primary"><ShoppingBag size={18} /> Ver produtos</Link>
                <Link to="/kits" className="btn-outline-orange">Ver kits</Link>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ══ KITS ═══════════════════════════════════════ */}
      <section className="section bg-cream-100">
        <div className="container-app">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeader eyebrow="Kits prontos" icon={Gift} title="Tudo em um só pedido 📦" subtitle="Combinações pensadas para facilitar a vida do tutor." />
              <Link to="/kits" className="btn-outline-orange btn-sm hidden sm:inline-flex">Ver todos os kits <ArrowRight size={16} /></Link>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {kits.slice(0, 3).map((kit, i) => (
              <Reveal key={kit.id} delay={i * 70}><KitCard kit={kit} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ POR QUE SOB ENCOMENDA ══════════════════════ */}
      <section className="section bg-white">
        <div className="container-app">
          <Reveal>
            <div className="mb-10 text-center">
              <span className="eyebrow mx-auto"><Heart size={16} /> Nosso diferencial</span>
              <h2 className="section-title mt-4">Por que escolher a Wazoo?</h2>
              <p className="mt-3 text-navy-500 max-w-xl mx-auto">Trabalhamos sem estoque parado: você escolhe, verificamos disponibilidade e entregamos com praticidade.</p>
            </div>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_ITEMS.map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <div className="flex flex-col items-center rounded-2xl border border-cream-200 bg-cream-50 p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 mb-3">
                    <item.icon size={22} className="text-orange-500" />
                  </div>
                  <h3 className="font-display font-bold text-navy-800">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-navy-500">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/como-funciona" className="btn-secondary">Entenda como funciona <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>

      {/* ══ CTA WHATSAPP ════════════════════════════════ */}
      <section className="section">
        <div className="container-app">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-green-500 to-green-600 px-6 py-12 shadow-soft-lg sm:px-12">
              <Decor variant="cool" dots />
              <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
                <div className="text-center text-white lg:text-left">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold uppercase tracking-wide backdrop-blur-sm">
                    <WhatsAppIcon size={14} /> Atendimento direto
                  </span>
                  <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Fale com a gente pelo WhatsApp! 💬</h2>
                  <p className="mt-3 text-lg text-green-100">Monte seu pedido e verificamos disponibilidade, prazo e o melhor valor.</p>
                  <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                    <Link to="/produtos" className="btn bg-white px-8 py-4 text-lg text-green-700 shadow-soft hover:-translate-y-0.5 hover:bg-cream-50">
                      <ShoppingBag size={20} /> Ver produtos
                    </Link>
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-navy-800 px-8 py-4 text-lg text-white shadow-soft hover:-translate-y-0.5 hover:bg-navy-900">
                      <WhatsAppIcon size={20} /> Chamar agora
                    </a>
                  </div>
                </div>
                <div className="relative hidden justify-center lg:flex">
                  <img src={img.mascot.saudacao} alt="Mascote" className="h-56 w-auto animate-bounce-soft drop-shadow-2xl" />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ AVALIAÇÕES ══════════════════════════════════ */}
      {topReviews.length > 0 && (
        <section className="section bg-cream-100">
          <div className="container-app">
            <Reveal>
              <SectionHeader center eyebrow="Avaliações" icon={Star} title="Quem confia na Wazoo 🐾" subtitle="Histórias reais de tutores que já pediram com a gente." />
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {topReviews.map((review, i) => (
                <Reveal key={review.id} delay={i * 70}><ReviewCard review={review} /></Reveal>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link to="/avaliacoes" className="btn-outline-orange">Ver todas as avaliações <ArrowRight size={16} /></Link>
            </div>
          </div>
        </section>
      )}

      {/* ══ NEWSLETTER ══════════════════════════════════ */}
      <section className="section bg-navy-800">
        <div className="container-app">
          <Reveal>
            <div className="mx-auto max-w-xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold text-cream-200 uppercase tracking-wide mb-4">
                <Zap size={15} /> Fique por dentro
              </span>
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Receba ofertas exclusivas 🎁</h2>
              <p className="mt-3 text-cream-300">Promoções, lançamentos e dicas para tutores apaixonados — direto no seu e-mail.</p>
              <form
                className="mt-6 flex flex-col gap-3 sm:flex-row"
                onSubmit={(e) => { e.preventDefault(); alert("Obrigado! Em breve você receberá nossas novidades. 🐾"); }}
              >
                <input type="email" required placeholder="seu@email.com" className="input flex-1 bg-white/10 border-white/20 text-white placeholder:text-cream-400 focus:border-orange-400" />
                <button type="submit" className="btn-primary shrink-0">Quero receber!</button>
              </form>
              <p className="mt-2 text-xs text-cream-400">Sem spam. Cancele quando quiser.</p>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  );
}
