import { Link } from "react-router-dom";
import { CreditCard, PackageCheck, PawPrint, Truck } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";

const points = [
  { icon: PackageCheck, title: "Disponibilidade clara", text: "A página do produto informa estoque e opções disponíveis antes da compra." },
  { icon: CreditCard, title: "Preço e pagamento", text: "O checkout mostra subtotal, descontos, frete e total antes da confirmação." },
  { icon: Truck, title: "Entrega e acompanhamento", text: "Depois da compra, acompanhe a separação e a entrega pela sua conta." },
];

export function PoliticaSobEncomenda() {
  return (
    <div>
      <PageHero
        variant="navy"
        eyebrow="Política"
        icon={PawPrint}
        title="Política de compra e entrega"
        subtitle="Informações claras sobre disponibilidade, pagamento, entrega e acompanhamento do pedido."
      />

      <section className="section">
        <div className="container-app max-w-4xl">
          <Reveal>
            <div className="card p-6 sm:p-8">
              <p className="leading-relaxed text-navy-600">
                Na Wazoo, a compra é realizada diretamente pelo e-commerce. Antes de finalizar, você confere os produtos, quantidades, descontos, opção de entrega e forma de pagamento. Após a confirmação, o pedido segue para separação e você pode acompanhar seu andamento pela sua conta.
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
