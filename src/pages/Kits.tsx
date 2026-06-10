import { Link } from "react-router-dom";
import { ArrowRight, Gift, PawPrint } from "lucide-react";
import { img } from "@/config/site";
import { kits } from "@/data/kits";
import { PageHero } from "@/components/ui/PageHero";
import { KitCard } from "@/components/product/KitCard";
import { Reveal } from "@/components/ui/Reveal";
import { OnDemandNotice } from "@/components/ui/OnDemandNotice";

export function Kits() {
  return (
    <div>
      <PageHero
        variant="cream"
        eyebrow="Kits prontos"
        icon={Gift}
        title="Kits pet para facilitar"
        subtitle="Combinações montadas com carinho para cada momento do seu pet. Solicite e a gente confirma tudo com você."
        mascot={img.mascot.brincando}
      />

      <section className="section">
        <div className="container-app">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {kits.map((kit, i) => (
              <Reveal key={kit.id} delay={i * 70}>
                <KitCard kit={kit} />
              </Reveal>
            ))}
          </div>

          <div className="mt-10">
            <OnDemandNotice text="Os kits são vendidos sob encomenda. Itens e valores podem variar conforme a disponibilidade — confirmamos tudo com você antes de fechar o pedido." />
          </div>

          <div className="mt-12 rounded-[2.5rem] bg-cream-100 p-8 text-center sm:p-12">
            <PawPrint className="mx-auto text-orange-500" size={36} />
            <h2 className="mt-4 font-display text-2xl font-bold text-navy-700 sm:text-3xl">
              Quer um kit personalizado?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-navy-500">
              Monte seu pedido com os produtos do catálogo ou fale com a gente
              pelo WhatsApp. A gente encontra a melhor combinação para o seu pet.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/produtos" className="btn-primary">
                Ver produtos <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
