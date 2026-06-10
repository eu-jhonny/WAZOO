import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Star, Filter } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { whatsappLink, defaultContactMessage } from "@/lib/whatsapp";
import { ProductCard } from "@/components/product/ProductCard";
import { KitCard } from "@/components/product/KitCard";
import { Reveal } from "@/components/ui/Reveal";
import { Decor } from "@/components/ui/Decor";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { kits } from "@/data/kits";

/* ── Sub-categorias de cachorro ────────────────────────────── */
const DOG_CATS = [
  { slug: "",              label: "🐾 Todos",       color: "bg-orange-500 text-white"           },
  { slug: "brinquedos",    label: "🦴 Brinquedos",  color: "bg-amber-100 text-amber-800"        },
  { slug: "acessorios",    label: "🎀 Acessórios",  color: "bg-orange-100 text-orange-800"      },
  { slug: "higiene",       label: "🛁 Higiene",     color: "bg-blue-100 text-blue-800"          },
  { slug: "petiscos",      label: "🍖 Petiscos",    color: "bg-green-100 text-green-800"        },
  { slug: "caminhas",      label: "🛏️ Caminhas",   color: "bg-purple-100 text-purple-800"      },
  { slug: "racoes",        label: "🥣 Rações",      color: "bg-teal-100 text-teal-800"          },
] as const;

/* ── Tamanhos ───────────────────────────────────────────────── */
const SIZES = [
  { val: "",        label: "Todos os tamanhos" },
  { val: "pequeno", label: "Pequeno porte"     },
  { val: "medio",   label: "Médio porte"       },
  { val: "grande",  label: "Grande porte"      },
] as const;

/* ── Destaques visuais ─────────────────────────────────────── */
const DOG_HIGHLIGHTS = [
  { emoji: "🦮", label: "Coleiras & Guias",   bg: "from-amber-400 to-orange-500" },
  { emoji: "🏠", label: "Casinhas & Camas",   bg: "from-orange-400 to-red-400"   },
  { emoji: "🎾", label: "Brinquedos",          bg: "from-yellow-400 to-orange-400"},
  { emoji: "✂️", label: "Higiene",            bg: "from-blue-400 to-teal-400"    },
  { emoji: "🍖", label: "Petiscos",           bg: "from-green-400 to-emerald-500"},
  { emoji: "👕", label: "Roupas",             bg: "from-pink-400 to-rose-500"    },
] as const;

export function Cachorros() {
  const { products, settings } = useStore();
  const [activeCategory, setActiveCategory] = useState("");
  const [activeSize, setActiveSize]         = useState("");
  const wa = whatsappLink(defaultContactMessage, settings.whatsapp);

  const dogProducts = products.filter((p) => {
    if (!p.active) return false;
    if (p.audience !== "cachorro" && p.audience !== "ambos") return false;
    if (activeCategory && p.category !== activeCategory) return false;
    if (activeSize && p.size !== activeSize && p.size !== "todos") return false;
    return true;
  });

  const dogKits = kits.filter((k) => k.audience === "cachorro" || k.audience === "ambos");
  const featuredDogs = dogProducts.filter((p) => p.featured).slice(0, 4);

  return (
    <div className="bg-cream-50">

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #7C3A00 0%, #C85A00 50%, #FF9A3D 100%)" }}
      >
        <Decor variant="warm" />

        {/* Patinhas decorativas */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {["top-6 left-1/4 rotate-12","bottom-10 left-1/2 -rotate-6","top-1/3 left-2/3 rotate-45","bottom-6 right-1/4 rotate-30","top-8 right-1/3 -rotate-20"].map((pos,i) => (
            <span key={i} className={`absolute ${pos} text-4xl text-white/10 select-none`}>🐾</span>
          ))}
          <span className="absolute bottom-0 right-4 text-[180px] leading-none text-white/10 select-none sm:text-[260px] sm:right-8">🐕</span>
        </div>

        <div className="container-app relative py-14 sm:py-20">
          <div className="max-w-xl">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/15 px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-amber-200">
                🐕 Área dos Cachorros
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                Tudo para o seu<br />melhor amigo 🦴
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-4 text-lg text-orange-100 sm:text-xl">
                Coleiras, roupinhas, brinquedos, petiscos e muito mais.<br className="hidden sm:block" />
                Produtos sob encomenda, com amor e carinho.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#produtos" className="btn bg-white px-6 py-3 font-bold text-orange-700 shadow-soft hover:-translate-y-0.5">
                  <ShoppingBag size={18} /> Ver produtos
                </a>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] px-6 py-3 font-bold text-white shadow-soft hover:-translate-y-0.5">
                  <WhatsAppIcon size={18} /> Pedir pelo WhatsApp
                </a>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" className="w-full text-cream-50" preserveAspectRatio="none" height="48">
            <path d="M0 48V24C360 0 720 48 1080 24L1440 0V48H0Z" fill="currentColor"/>
          </svg>
        </div>
      </section>

      {/* ══ DESTAQUES VISUAIS ════════════════════════════════ */}
      <section className="bg-white py-8">
        <div className="container-app">
          <Reveal>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-6 sm:overflow-visible sm:pb-0">
              {DOG_HIGHLIGHTS.map((h) => (
                <button
                  key={h.label}
                  onClick={() => setActiveCategory(h.label.toLowerCase().includes("brinq") ? "brinquedos" : h.label.toLowerCase().includes("higiene") ? "higiene" : h.label.toLowerCase().includes("petisco") ? "petiscos" : h.label.toLowerCase().includes("cama") ? "caminhas" : "")}
                  className="flex shrink-0 flex-col items-center gap-2 rounded-2xl p-4 transition-all hover:bg-cream-50 hover:-translate-y-1 sm:shrink"
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${h.bg} shadow-soft`}>
                    <span className="text-2xl">{h.emoji}</span>
                  </div>
                  <span className="text-xs font-bold text-navy-600 whitespace-nowrap">{h.label}</span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ PRODUTOS ════════════════════════════════════════ */}
      <section id="produtos" className="section">
        <div className="container-app">
          <Reveal>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="section-title">Produtos para Cachorros 🐾</h2>
                <p className="mt-1 text-navy-500">{dogProducts.length} produto{dogProducts.length !== 1 ? "s" : ""} encontrado{dogProducts.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </Reveal>

          {/* Filtros de categoria */}
          <Reveal>
            <div className="mt-5 flex flex-wrap gap-2">
              {DOG_CATS.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-all duration-200 ${
                    activeCategory === cat.slug
                      ? "border-orange-500 bg-orange-500 text-white shadow-glow"
                      : "border-cream-200 bg-white text-navy-600 hover:border-orange-300 hover:text-orange-600"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </Reveal>

          {/* Filtros de porte */}
          <Reveal>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="flex items-center gap-1 text-xs font-bold text-navy-400"><Filter size={12} /> Porte:</span>
              {SIZES.map((s) => (
                <button
                  key={s.val}
                  onClick={() => setActiveSize(s.val)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    activeSize === s.val
                      ? "bg-amber-500 text-white"
                      : "bg-cream-100 text-navy-600 hover:bg-amber-100 hover:text-amber-700"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Reveal>

          {dogProducts.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {dogProducts.map((p, i) => (
                <Reveal key={p.id} delay={Math.min(i, 7) * 50}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center gap-4 text-center">
              <span className="text-6xl">🐕</span>
              <p className="text-lg font-semibold text-navy-500">Nenhum produto nessa categoria ainda.</p>
              <button onClick={() => { setActiveCategory(""); setActiveSize(""); }} className="btn-outline-orange">
                Ver todos os produtos
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══ KITS PARA CACHORROS ═══════════════════════════════ */}
      {dogKits.length > 0 && (
        <section className="section bg-gradient-to-br from-orange-50 to-cream-100">
          <div className="container-app">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="eyebrow">📦 Kits prontos</span>
                  <h2 className="section-title mt-3">Kits especiais para cães</h2>
                </div>
                <Link to="/kits" className="btn-outline-orange btn-sm">Ver todos os kits <ArrowRight size={16} /></Link>
              </div>
            </Reveal>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {dogKits.slice(0, 3).map((kit, i) => (
                <Reveal key={kit.id} delay={i * 70}><KitCard kit={kit} /></Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ DESTAQUE COPA ══════════════════════════════════════ */}
      <section className="section" style={{ background:"linear-gradient(135deg,#071444 0%,#0A3A1A 50%,#071444 100%)" }}>
        <div className="container-app">
          <Reveal>
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              <div className="flex-1">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#FFDF00]/15 px-4 py-1.5 text-sm font-extrabold text-[#FFDF00]">⚽ Copa dos Pets</span>
                <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">Seu cachorro merece<br />torcer com estilo! 🏆</h2>
                <p className="mt-3 text-blue-200">Bandanas, camisas e kits temáticos com as cores do Brasil para seu cão torcer na Copa 2026.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
                  <Link to="/produtos" className="btn bg-[#FFDF00] px-6 py-3 font-bold text-[#002776] hover:-translate-y-0.5 hover:bg-yellow-300">Ver coleção Copa</Link>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#009C3B] px-6 py-3 font-bold text-white hover:-translate-y-0.5">
                    <WhatsAppIcon size={18} /> Pedir kit
                  </a>
                </div>
              </div>
              <div className="relative hidden sm:block">
                <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-4 border-[#FFDF00] shadow-soft-lg"
                  style={{ background:"linear-gradient(135deg,#002776,#004A1C)" }}>
                  <span className="text-5xl">⚽</span>
                  <span className="mt-1 font-display text-xs font-bold text-[#FFDF00]">COPA 2026</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ CTA WHATSAPP ════════════════════════════════════════ */}
      <section className="section bg-white">
        <div className="container-app">
          <Reveal>
            <div className="rounded-[2.5rem] bg-gradient-to-br from-green-500 to-green-600 p-8 text-center shadow-soft-lg sm:p-12">
              <span className="text-5xl">🐕</span>
              <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">Não achou o que procura?</h2>
              <p className="mt-3 text-green-100">Fale com a gente! Buscamos qualquer produto para o seu cachorro.</p>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn mt-6 bg-white px-8 py-4 text-lg font-bold text-green-700 shadow-soft hover:-translate-y-0.5">
                <WhatsAppIcon size={20} /> Chamar no WhatsApp
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
