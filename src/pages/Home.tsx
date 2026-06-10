import { Link } from "react-router-dom";
import {
  ArrowRight, Heart, PawPrint, ShoppingBag, ShieldCheck,
  Sparkles, Star, Truck, Zap,
} from "lucide-react";
import { img } from "@/config/site";
import { homeCategories } from "@/data/categories";
import { kits } from "@/data/kits";
import { useStore } from "@/context/StoreContext";
import { whatsappLink, defaultContactMessage } from "@/lib/whatsapp";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BannerCarousel } from "@/components/ui/BannerCarousel";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { PromoStrip } from "@/components/ui/PromoStrip";
import { CategoryShelf } from "@/components/ui/CategoryShelf";
import { ProductCard } from "@/components/product/ProductCard";
import { KitCard } from "@/components/product/KitCard";
import { ReviewCard } from "@/components/product/ReviewCard";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { Decor } from "@/components/ui/Decor";

/* ── Constantes ─────────────────────────────────────────────── */
const TRUST = [
  { icon: PawPrint,    label: "Sob encomenda",     color: "text-orange-500", bg: "bg-orange-50"  },
  { icon: Heart,       label: "Atendimento humano", color: "text-brand-pink",  bg: "bg-pink-50"   },
  { icon: ShieldCheck, label: "Compra segura",      color: "text-green-500",  bg: "bg-green-50"  },
  { icon: Truck,       label: "Entrega combinada",  color: "text-brand-teal", bg: "bg-teal-50"   },
] as const;

const PROMO_CARDS = [
  { tag: "🔥 Mais vendido",   label: "Cama Nuvem Luxo",      off: "30% OFF",  grad: "from-orange-500 to-orange-700",  link: "/produtos" },
  { tag: "⭐ Novo",           label: "Kit Copa dos Pets",     off: "Novo",     grad: "from-[#002776] to-[#009C3B]",   link: "/produtos" },
  { tag: "🎉 Especial",       label: "Kit Arraiá Completo",   off: "15% OFF",  grad: "from-orange-600 to-yellow-500", link: "/kits"     },
  { tag: "💎 Premium",        label: "Ração Super Premium",   off: "10% OFF",  grad: "from-brand-purple to-navy-600", link: "/produtos" },
] as const;

const BUNTING = ["#F0427E", "#FFDF00", "#009C3B", "#FF7A1A", "#8B5FD0", "#18B6C4"];
const COPA_ITEMS  = ["Bandanas e lenços temáticos", "Brinquedos Copa", "Roupinhas e acessórios", "Petiscos especiais"];
const FESTA_ITEMS = ["Chapéus de palha pet", "Bandanas xadrez", "Brinquedos e petiscos temáticos", "Kits Arraiá completos"];

/* ── Página ─────────────────────────────────────────────────── */
export function Home() {
  const { products, reviews, settings } = useStore();

  const featured    = products.filter((p) => p.active && p.featured).slice(0, 4);
  const forDogs     = products.filter((p) => p.active && (p.audience === "cachorro" || p.audience === "ambos")).slice(0, 8);
  const forCats     = products.filter((p) => p.active && (p.audience === "gato" || p.audience === "ambos")).slice(0, 8);
  const withPromo   = products.filter((p) => p.active && (p.comparePrice || p.promoLabel)).slice(0, 8);
  const topReviews  = reviews.filter((r) => r.approved && r.featured).slice(0, 3);
  const wa          = whatsappLink(defaultContactMessage, settings.whatsapp);

  /* Flash sale termina na próxima sexta meia-noite */
  const flashSaleEnd = (() => {
    const d = new Date();
    const daysUntilFri = (5 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilFri);
    d.setHours(23, 59, 59, 0);
    return d;
  })();

  return (
    <div className="bg-cream-50">

      {/* ══ PROMO STRIP (marquee) ══════════════════════ */}
      <PromoStrip />

      {/* ══ ANNOUNCEMENT BAR ══════════════════════════ */}
      <div className="bg-navy-800 py-2 text-center text-xs font-bold text-cream-100 sm:text-sm">
        <div className="container-app flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <span>🚚 Entrega ou retirada em São Paulo</span>
          <span className="hidden h-3 w-px bg-white/20 sm:block" />
          <span>💳 Parcele em até 10x sem juros</span>
          <span className="hidden h-3 w-px bg-white/20 sm:block" />
          <span>🐾 Produtos 100% sob encomenda</span>
        </div>
      </div>

      {/* ══ BANNER CAROUSEL (com tabs por categoria) ══ */}
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

      {/* ══ CATEGORIAS (horizontal scroll) ════════════ */}
      <div className="border-b border-cream-200 bg-white py-5">
        <div className="container-app">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:gap-4">
            {homeCategories.map((cat) => (
              <Link key={cat.name} to={cat.to} className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-3 py-2 transition-colors hover:bg-cream-50">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${cat.gradient}`}>
                  <cat.icon size={22} className="text-white" />
                </div>
                <span className="text-[11px] font-bold text-navy-600 whitespace-nowrap sm:text-xs">{cat.name}</span>
              </Link>
            ))}
            <Link to="/cachorros" className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-3 py-2 transition-colors hover:bg-cream-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600">
                <span className="text-xl">🐕</span>
              </div>
              <span className="text-[11px] font-bold text-navy-600 whitespace-nowrap sm:text-xs">Cães</span>
            </Link>
            <Link to="/gatos" className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-3 py-2 transition-colors hover:bg-cream-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700">
                <span className="text-xl">🐈</span>
              </div>
              <span className="text-[11px] font-bold text-navy-600 whitespace-nowrap sm:text-xs">Gatos</span>
            </Link>
            <Link to="/produtos" className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-3 py-2 transition-colors hover:bg-cream-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#002776] to-[#009C3B]">
                <span className="text-xl">⚽</span>
              </div>
              <span className="text-[11px] font-bold text-navy-600 whitespace-nowrap sm:text-xs">Copa</span>
            </Link>
            <Link to="/kits" className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-3 py-2 transition-colors hover:bg-cream-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-yellow-400">
                <span className="text-xl">🎉</span>
              </div>
              <span className="text-[11px] font-bold text-navy-600 whitespace-nowrap sm:text-xs">Festas</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ══ FLASH SALE + COUNTDOWN ═════════════════════ */}
      <section className="py-8 sm:py-12">
        <div className="container-app">
          <Reveal>
            <CountdownTimer
              targetDate={flashSaleEnd}
              label="⚡ Promoção Relâmpago da Semana"
              promoLabel="Aproveite preços especiais — só até sexta!"
            />
          </Reveal>

          {/* Cards de promoção */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {PROMO_CARDS.map((c, i) => (
              <Reveal key={c.label} delay={i * 60}>
                <Link
                  to={c.link}
                  className={`group relative flex h-36 flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br p-4 shadow-soft transition-all hover:-translate-y-1 hover:shadow-soft-lg sm:h-40 ${c.grad}`}
                >
                  <div className="absolute inset-0 bg-dots-light opacity-30" />
                  <div className="relative">
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm sm:text-xs">
                      {c.tag}
                    </span>
                    <span className="mt-1.5 block rounded-full bg-white px-3 py-1 text-xs font-extrabold text-navy-700 shadow-sm animate-pulse-scale w-fit">
                      {c.off}
                    </span>
                  </div>
                  <p className="relative font-display text-sm font-bold text-white sm:text-base">{c.label}</p>
                  <span className="absolute bottom-3 right-3 text-white/60 transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRATELEIRAS POR CATEGORIA ══════════════════ */}
      <div className="bg-white">
        {forDogs.length > 0 && (
          <div className="border-b border-cream-100">
            <Reveal>
              <CategoryShelf title="Para o seu Cachorro" emoji="🐕" viewAllLink="/cachorros" products={forDogs} accentColor="orange" />
            </Reveal>
          </div>
        )}
        {forCats.length > 0 && (
          <div className="border-b border-cream-100">
            <Reveal>
              <CategoryShelf title="Para o seu Gato" emoji="🐈" viewAllLink="/gatos" products={forCats} accentColor="purple" />
            </Reveal>
          </div>
        )}
        {withPromo.length > 0 && (
          <Reveal>
            <CategoryShelf title="Em Promoção" emoji="🔥" viewAllLink="/produtos" products={withPromo} accentColor="teal" />
          </Reveal>
        )}
      </div>

      {/* ══ MINI BANNERS (Copa + Festa Junina) ═════════ */}
      <section className="py-6 sm:py-8">
        <div className="container-app grid gap-4 sm:grid-cols-2">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#002776] to-[#009C3B] shadow-soft">
              <img src="/images/banners/copa.jpg" alt="Copa dos Pets"
                className="absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-500 hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div className="relative flex min-h-[170px] flex-col justify-end p-5 sm:min-h-[210px] sm:p-7">
                <span className="mb-1 text-xs font-extrabold uppercase tracking-widest text-[#FFDF00]">⚽ Coleção Copa</span>
                <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">Torcida Animal! 🏆</h3>
                <p className="mt-1 text-sm text-blue-200">Vista seu pet com as cores do Brasil</p>
                <Link to="/produtos" className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#FFDF00] px-5 py-2.5 text-sm font-bold text-[#002776] transition hover:-translate-y-0.5 hover:bg-yellow-300">
                  Ver coleção →
                </Link>
              </div>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-yellow-500 shadow-soft">
              <div className="pointer-events-none absolute left-0 right-0 top-0 flex overflow-hidden" aria-hidden>
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className="h-6 flex-1" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)", backgroundColor: BUNTING[i % BUNTING.length] }} />
                ))}
              </div>
              <img src="/images/banners/festajunina.jpg" alt="Arraiá Pet"
                className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-500 hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div className="relative flex min-h-[170px] flex-col justify-end p-5 pt-8 sm:min-h-[210px] sm:p-7 sm:pt-10">
                <span className="mb-1 text-xs font-extrabold uppercase tracking-widest text-yellow-200">🎉 Arraiá Pet</span>
                <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">Festa Junina! 🌽</h3>
                <p className="mt-1 text-sm text-yellow-100">Chapéus, bandanas e kits temáticos</p>
                <Link to="/kits" className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-orange-600 transition hover:-translate-y-0.5 hover:bg-cream-50">
                  Ver kits →
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ COPA DOS PETS (seção completa) ═════════════ */}
      <section className="relative overflow-hidden py-14 sm:py-20" style={{ background: "linear-gradient(135deg, #071444 0%, #0A3A1A 50%, #071444 100%)" }}>
        <Decor variant="cool" />
        <div className="pointer-events-none absolute inset-0 select-none overflow-hidden" aria-hidden>
          <span className="absolute -right-4 top-6 text-[100px] opacity-[0.07]">⚽</span>
          <span className="absolute left-6 bottom-6 text-[72px] opacity-[0.07]">🏆</span>
        </div>
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
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#009C3B] px-6 py-3 font-bold text-white shadow-soft hover:-translate-y-0.5 hover:bg-green-700">
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
        <div className="pointer-events-none absolute left-0 right-0 top-0 flex overflow-hidden" aria-hidden>
          {Array.from({ length: 26 }).map((_, i) => (
            <div key={i} className="h-8 flex-1" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)", backgroundColor: BUNTING[i % BUNTING.length] }} />
          ))}
        </div>
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-1 bg-amber-900/20" aria-hidden />
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

      {/* ══ DESTAQUES ════════════════════════════════════ */}
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

      {/* ══ BANNER CONFORTO ══════════════════════════════ */}
      <Reveal>
        <div className="relative overflow-hidden bg-gradient-to-r from-[#F7DCB6] to-cream-100">
          <img src="/images/banners/conforto.jpg" alt="Conforto"
            className="absolute inset-0 h-full w-full object-cover opacity-60"
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

      {/* ══ KITS ═════════════════════════════════════════ */}
      <section className="section bg-cream-100">
        <div className="container-app">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeader eyebrow="Kits prontos" icon={ShoppingBag} title="Tudo em um só pedido 📦" subtitle="Combinações pensadas para facilitar a vida do tutor." />
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

      {/* ══ POR QUE SOB ENCOMENDA ════════════════════════ */}
      <section className="section">
        <div className="container-app">
          <Reveal>
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <span className="eyebrow"><Heart size={16} /> Nosso diferencial</span>
                <h2 className="section-title mt-4">Por que sob encomenda?</h2>
                <p className="mt-4 text-lg leading-relaxed text-navy-500">
                  Trabalhamos sem estoque parado: você escolhe, verificamos disponibilidade com fornecedores parceiros e entregamos com praticidade.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {["Mais variedade de produtos", "Sem desperdício de estoque", "Preços diretos do fornecedor", "Atendimento personalizado"].map((t) => (
                    <div key={t} className="flex items-center gap-2 text-sm font-semibold text-navy-600">✅ {t}</div>
                  ))}
                </div>
                <Link to="/como-funciona" className="btn-secondary mt-6">Entenda como funciona <ArrowRight size={18} /></Link>
              </div>
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-100 via-cream-100 to-brand-teal/15 p-8">
                <Decor variant="warm" />
                <img src={img.mascot.dogTrabalhando} alt="Mascote Wazoo" className="relative mx-auto h-56 w-auto animate-float-slow drop-shadow-2xl" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ NEWSLETTER ══════════════════════════════════ */}
      <section className="section bg-cream-100">
        <div className="container-app">
          <Reveal>
            <div className="mx-auto max-w-xl text-center">
              <span className="eyebrow mx-auto"><Zap size={15} /> Fique por dentro</span>
              <h2 className="section-title mt-4">Receba ofertas exclusivas 🎁</h2>
              <p className="mt-3 text-navy-500">Promoções, lançamentos e dicas para tutores apaixonados — direto no seu e-mail.</p>
              <form
                className="mt-6 flex flex-col gap-3 sm:flex-row"
                onSubmit={(e) => { e.preventDefault(); alert("Obrigado! Em breve você receberá nossas novidades. 🐾"); }}
              >
                <input type="email" required placeholder="seu@email.com" className="input flex-1" />
                <button type="submit" className="btn-primary shrink-0">Quero receber!</button>
              </form>
              <p className="mt-2 text-xs text-navy-400">Sem spam. Cancele quando quiser.</p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
