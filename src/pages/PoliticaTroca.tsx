import { Link } from "react-router-dom";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";

const eligible = [
  "Erro no pedido enviado pela loja",
  "Defeito informado dentro do prazo",
  "Item diferente do que foi combinado",
];
const notEligible = [
  "Produtos personalizados",
  "Itens usados, abertos ou com sinais de uso",
  "Solicitações fora do prazo informado",
];

export function PoliticaTroca() {
  return (
    <div>
      <PageHero
        variant="cream"
        eyebrow="Política"
        icon={RefreshCw}
        title="Política de troca"
        subtitle="Queremos que você e seu pet fiquem felizes. Veja como funcionam as trocas."
      />

      <section className="section">
        <div className="container-app max-w-4xl">
          <Reveal>
            <div className="card p-6 sm:p-8">
              <p className="leading-relaxed text-navy-600">
                Trocas são analisadas conforme o tipo de produto, prazo de
                solicitação e condições do item. Produtos personalizados, usados,
                abertos ou com sinais de uso podem não ser elegíveis para troca.
                Em caso de erro no pedido ou defeito informado dentro do prazo, a
                equipe fará a análise e orientará o cliente.
              </p>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Reveal>
              <div className="card h-full p-6">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 size={22} />
                  <h3 className="font-display text-lg font-bold">Costuma ser elegível</h3>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {eligible.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-navy-600">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="card h-full p-6">
                <div className="flex items-center gap-2 text-red-500">
                  <XCircle size={22} />
                  <h3 className="font-display text-lg font-bold">Pode não ser elegível</h3>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {notEligible.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-navy-600">
                      <XCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          <div className="mt-10 rounded-3xl bg-cream-100 p-6 text-center">
            <p className="font-semibold text-navy-600">
              Precisa de uma troca ou tem alguma dúvida?
            </p>
            <Link to="/como-funciona" className="btn-primary mt-4">
              Fale com a nossa equipe
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
