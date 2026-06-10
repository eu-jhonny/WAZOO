import { Link } from "react-router-dom";
import { ClipboardCheck, PackageSearch, PawPrint, RefreshCw } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";

const points = [
  { icon: PackageSearch, title: "Verificamos a disponibilidade", text: "Após o envio do pedido, conferimos com fornecedores parceiros se o item está disponível." },
  { icon: ClipboardCheck, title: "Confirmamos prazo e valor", text: "Você recebe o prazo médio e o valor final antes de qualquer cobrança." },
  { icon: RefreshCw, title: "Sem disponibilidade? Sem problema", text: "Caso algo não esteja disponível, oferecemos alternativas ou cancelamos o item." },
];

export function PoliticaSobEncomenda() {
  return (
    <div>
      <PageHero
        variant="navy"
        eyebrow="Política"
        icon={PawPrint}
        title="Compra sob encomenda"
        subtitle="Transparência do início ao fim: você só confirma depois que verificamos tudo."
      />

      <section className="section">
        <div className="container-app max-w-4xl">
          <Reveal>
            <div className="card p-6 sm:p-8">
              <p className="leading-relaxed text-navy-600">
                Na Wazoo Pet Express, os produtos são vendidos sob encomenda. Isso
                significa que, após o envio da solicitação, nossa equipe verifica
                disponibilidade, prazo e valor com fornecedores parceiros. O
                pedido só é confirmado após essa validação e após a confirmação do
                pagamento, quando aplicável. Caso algum produto não esteja
                disponível, entraremos em contato para oferecer alternativas ou
                cancelar o item.
              </p>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {points.map((point, i) => (
              <Reveal key={point.title} delay={i * 70}>
                <div className="card card-hover h-full p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                    <point.icon size={26} />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-navy-700">{point.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{point.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-cream-100 p-6">
            <p className="font-semibold text-navy-600">Ficou com dúvidas sobre como funciona?</p>
            <div className="flex gap-3">
              <Link to="/como-funciona" className="btn-outline btn-sm">Como funciona</Link>
              <Link to="/politica-troca" className="btn-ghost btn-sm">Política de troca</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
