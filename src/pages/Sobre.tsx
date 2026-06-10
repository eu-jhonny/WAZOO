import { Link } from "react-router-dom";
import {
  HandHeart,
  Heart,
  PackageSearch,
  PawPrint,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { img, site } from "@/config/site";
import { useStore } from "@/context/StoreContext";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Decor } from "@/components/ui/Decor";

const values = [
  { icon: HandHeart, title: "Atendimento humano", text: "Gente de verdade para ajudar você a escolher o melhor para o seu pet." },
  { icon: PackageSearch, title: "Variedade sob encomenda", text: "Buscamos opções com fornecedores parceiros: mais escolha, menos desperdício." },
  { icon: ShieldCheck, title: "Compra segura", text: "Você só confirma depois que verificamos disponibilidade, prazo e valor." },
  { icon: Heart, title: "Feito com carinho", text: "Cuidamos de cada pedido como se fosse para o nosso próprio pet." },
];

const stats = [
  { n: "+500", l: "Pets atendidos", c: "text-orange-500" },
  { n: "4.9", l: "Nota média", c: "text-brand-teal" },
  { n: "100%", l: "Sob encomenda", c: "text-brand-purple" },
  { n: "2 a 7", l: "Dias de prazo", c: "text-green-600" },
];

export function Sobre() {
  const { settings } = useStore();

  return (
    <div>
      <PageHero
        variant="cream"
        eyebrow="Sobre nós"
        icon={PawPrint}
        title="Sobre a Wazoo Pet Express"
        subtitle={site.slogan}
        mascot={img.mascot.saudacao}
      />

      {/* Institucional */}
      <section className="section">
        <div className="container-app grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="overflow-hidden rounded-[2.5rem] border-4 border-white shadow-soft-lg">
              <img
                src={img.modelo.homemGolden}
                alt="Tutor com seu cão"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <span className="eyebrow">
                <Heart size={16} /> Nossa história
              </span>
              <h2 className="section-title mt-4">Praticidade, carinho e segurança</h2>
              <p className="mt-4 leading-relaxed text-navy-600">
                {settings.institutionalText}
              </p>
              <Link to="/produtos" className="btn-primary mt-6">
                <ShoppingBag size={18} /> Conhecer produtos
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Valores */}
      <section className="section bg-cream-100 pattern-grid">
        <div className="container-app">
          <Reveal>
            <SectionHeader
              center
              eyebrow="No que acreditamos"
              icon={PawPrint}
              title="Nossos valores"
            />
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, i) => (
              <Reveal key={value.title} delay={i * 60}>
                <div className="card card-hover h-full p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                    <value.icon size={26} />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-navy-700">{value.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{value.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Números */}
      <section className="section">
        <div className="container-app">
          <div className="relative grid grid-cols-2 gap-4 overflow-hidden rounded-[2.5rem] border border-cream-200 bg-gradient-to-br from-cream-100 via-white to-orange-50 p-8 text-center shadow-card sm:p-12 lg:grid-cols-4">
            <Decor />
            {stats.map((s) => (
              <div key={s.l} className="relative">
                <p className={`font-display text-4xl font-bold sm:text-5xl ${s.c}`}>{s.n}</p>
                <p className="mt-1 text-sm font-semibold text-navy-500">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
