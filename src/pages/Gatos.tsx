import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Filter } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { whatsappLink, defaultContactMessage } from "@/lib/whatsapp";
import { ProductCard } from "@/components/product/ProductCard";
import { KitCard } from "@/components/product/KitCard";
import { Reveal } from "@/components/ui/Reveal";
import { Decor } from "@/components/ui/Decor";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { kits } from "@/data/kits";

/* ── Sub-categorias de gato ─────────────────────────────────── */
const CAT_CATS = [
  { slug: "",            label: "🐾 Todos",           },
  { slug: "brinquedos",  label: "🎣 Brinquedos",      },
  { slug: "acessorios",  label: "🎀 Acessórios",      },
  { slug: "higiene",     label: "🛁 Higiene",         },
  { slug: "petiscos",    label: "🐟 Petiscos",        },
  { slug: "caminhas",    label: "🛏️ Caminhas",       },
  { slug: "racoes",      label: "🥣 Sachês & Rações", },
] as const;

/* ── Destaques visuais ─────────────────────────────────────── */
const CAT_HIGHLIGHTS = [
  { emoji: "🪄",  label: "Varinha & Brinquedos", bg: "from-violet-400 to-purple-500"   },
  { emoji: "🏠",  label: "Casinhas & Camas",     bg: "from-purple-400 to-indigo-500"   },
  { emoji: "🪮",  label: "Higiene & Beleza",     bg: "from-blue-400 to-teal-400"       },
  { emoji: "🐟",  label: "Petiscos",             bg: "from-teal-400 to-cyan-500"       },
  { emoji: "🧶",  label: "Arranhadores",         bg: "from-pink-400 to-rose-500"       },
  { emoji: "🎀",  label: "Acessórios",           bg: "from-brand-pink to-orange-400"   },
] as const;

export function Gatos() {
  const { products, settings } = useStore();
  const [activeCategory, setActiveCategory] = useState("");
  const wa = whatsappLink(defaultContactMessage, settings.whatsapp);

  const catProducts = products.filter((p) => {
    if (!p.active) return false;
    if (p.audience !== "gato" && p.audience !== "ambos") return false;
    if (activeCategory && p.category !== activeCategory) return false;
    return true;
  });

  const catKits   = kits.filter((k) => k.audience === "gato" || k.audience === "ambos");
  const featured  = catProducts.filter((p) => p.featured).slice(0, 4);

  return (
    <div className="bg-cream-50">

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2D1B69 0%, #5B21B6 50%, #1E3A8A 100%)" }}
      >
        <Decor variant="cool" />

        {/* Elementos decorativos */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {/* Estrelinhas */}
          {["top-6 left-1/4","top-20 left-2/3","bottom-14 left-1/3","top-1/3 right-1/4","bottom-8 right-1/2","top-10 right-1/3"].map((pos,i) => (
            <span key={i} className={`absolute ${pos} text-white/20 select-none ${i % 2 === 0 ? "text-2xl" : "text-lg"}`}>{i % 3 === 0 ? "✦" : i % 3 === 1 ? "✧" : "⋆"}</span>
          ))}
          <span className="absolute top-10 right-16 text-[60px] text-white/10 select-none hidden sm:block">🌙</span>
          <span className="absolute bottom-0 right-4 text-[180px] leading-none text-white/10 select-none sm:text-[260px] sm:right-8">🐈</span>
          {/* Blobs */}
          <div className="absolute -left-12 bottom-0 h-72 w-72 rounded-full bg-violet-800/40 blur-3xl" />
          <div className="absolute -right-12 top-0 h-64 w-64 rounded-full bg-indigo-400/15 blur-3xl" />
          <div className="absolute right-1/3 bottom-0 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl" />
        </div>

        <div className="container-app relative py-14 sm:py-20">
          <div className="max-w-xl">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-300/40 bg-purple-400/15 px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-purple-200">
                🐈 Área dos Gatos
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                Mimos para<br />os felinos 🌙
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-4 text-lg text-purple-200 sm:text-xl">
                Arranhadores, casinhas, petiscos e acessórios especiais.<br className="hidden sm:block" />
                Conforto e estilo para o seu gato, sob encomenda.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#produtos" className="btn bg-white px-6 py-3 font-bold text-purple-700 shadow-soft hover:-translate-y-0.5">
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
              {CAT_HIGHLIGHTS.map((h) => (
                <button
                  key={h.label}
                  onClick={() => {
                    if (h.label.toLowerCase().includes("brinq") || h.label.toLowerCase().includes("varin")) setActiveCategory("brinquedos");
                    else if (h.label.toLowerCase().includes("higiene")) setActiveCategory("higiene");
                    else if (h.label.toLowerCase().includes("petisco")) setActiveCategory("petiscos");
                    else if (h.label.toLowerCase().includes("cama") || h.label.toLowerCase().includes("casinha")) setActiveCategory("caminhas");
                    else setActiveCategory("");
                  }}
                  className="flex shrink-0 flex-col items-center gap-2 rounded-2xl p-4 transition-all hover:bg-cream-50 hover:-translate-y-1 sm:shrink"
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${h.bg} shadow-soft`}>
                    <span className="text-2xl">{h.emoji}</span>
                  </div>
                  <span className="text-xs font-bold text-navy-600 text-center whitespace-nowrap">{h.label}</span>
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
                <h2 className="section-title">Produtos para Gatos 🐾</h2>
                <p className="mt-1 text-navy-500">{catProducts.length} produto{catProducts.length !== 1 ? "s" : ""} encontrado{catProducts.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </Reveal>

          {/* Filtros de categoria */}
          <Reveal>
            <div className="mt-5 flex flex-wrap gap-2">
              {CAT_CATS.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-all duration-200 ${
                    activeCategory === cat.slug
                      ? "border-brand-purple bg-brand-purple text-white"
                      : "border-cream-200 bg-white text-navy-600 hover:border-purple-300 hover:text-purple-600"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </Reveal>

          {catProducts.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {catProducts.map((p, i) => (
                <Reveal key={p.id} delay={Math.min(i, 7) * 50}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center gap-4 text-center">
              <span className="text-6xl">🐈</span>
              <p className="text-lg font-semibold text-navy-500">Nenhum produto nessa categoria ainda.</p>
              <button onClick={() => setActiveCategory("")} className="btn border-2 border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white">
                Ver todos os produtos
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══ KITS PARA GATOS ═══════════════════════════════════ */}
      {catKits.length > 0 && (
        <section className="section bg-gradient-to-br from-purple-50 to-cream-100">
          <div className="container-app">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-brand-purple/10 px-4 py-1.5 text-sm font-extrabold text-brand-purple">📦 Kits prontos</span>
                  <h2 className="section-title mt-3">Kits especiais para gatos</h2>
                </div>
                <Link to="/kits" className="btn border-2 border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white btn-sm">
                  Ver todos <ArrowRight size={16} />
                </Link>
              </div>
            </Reveal>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {catKits.slice(0, 3).map((kit, i) => (
                <Reveal key={kit.id} delay={i * 70}><KitCard kit={kit} /></Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ BLOCO CONFORTO ══════════════════════════════════════ */}
      <section className="section">
        <div className="container-app">
          <Reveal>
            <div className="grid items-center gap-10 lg:grid-cols-2">
              {/* Visual */}
              <div
                className="relative flex h-64 items-center justify-center overflow-hidden rounded-[2.5rem] sm:h-80"
                style={{ background: "linear-gradient(135deg, #2D1B69, #5B21B6, #1E3A8A)" }}
              >
                <Decor variant="cool" />
                {/* Estrelinhas */}
                <div className="pointer-events-none absolute inset-0" aria-hidden>
                  {["top-6 left-1/4","top-16 right-1/4","bottom-12 left-1/3","top-1/2 left-2/3","bottom-6 right-1/3"].map((pos,i) => (
                    <span key={i} className={`absolute ${pos} text-white/30 text-xl`}>✦</span>
                  ))}
                </div>
                <span className="relative text-[100px] sm:text-[140px]">🐈</span>
              </div>
              {/* Texto */}
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-1.5 text-sm font-extrabold text-purple-700">🌙 Conforto felino</span>
                <h2 className="section-title mt-4">Seu gato merece o melhor</h2>
                <p className="mt-4 text-lg leading-relaxed text-navy-500">
                  Gatos são exigentes — e por isso selecionamos os melhores produtos do mercado, disponíveis sob encomenda com prazo garantido.
                </p>
                <ul className="mt-5 space-y-2">
                  {["Produtos 100% sob encomenda","Qualidade verificada","Prazo médio 5–7 dias úteis","Atendimento personalizado"].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm font-semibold text-navy-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs">✓</span>
                      {t}
                    </li>
                  ))}
                </ul>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn mt-6 bg-brand-purple px-6 py-3 font-bold text-white shadow-soft hover:-translate-y-0.5">
                  <WhatsAppIcon size={18} /> Fale conosco
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ CTA ════════════════════════════════════════════════ */}
      <section className="section bg-cream-100">
        <div className="container-app">
          <Reveal>
            <div
              className="rounded-[2.5rem] p-8 text-center shadow-soft-lg sm:p-12"
              style={{ background: "linear-gradient(135deg, #2D1B69, #5B21B6)" }}
            >
              <span className="text-5xl">🐈</span>
              <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">Não achou o que procura?</h2>
              <p className="mt-3 text-purple-200">Buscamos qualquer produto para o seu gato. Fale com a gente!</p>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn mt-6 bg-white px-8 py-4 text-lg font-bold text-purple-700 shadow-soft hover:-translate-y-0.5">
                <WhatsAppIcon size={20} /> Chamar no WhatsApp
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
