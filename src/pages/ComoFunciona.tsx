import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  HandHeart,
  PawPrint,
  ShoppingBag,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { img } from "@/config/site";
import { ORDER_STATUSES } from "@/types";
import { useStore } from "@/context/StoreContext";
import { whatsappLink, defaultContactMessage } from "@/lib/whatsapp";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { Decor } from "@/components/ui/Decor";

const steps = [
  {
    n: "01",
    icon: ShoppingBag,
    title: "Escolha o produto",
    text: "Navegue pelo catálogo e escolha os itens para o seu pet.",
    bg: "bg-orange-500 shadow-glow",
    iconBg: "bg-orange-100 text-orange-600",
  },
  {
    n: "02",
    icon: ShoppingCart,
    title: "Envie seu pedido",
    text: "Monte seu carrinho e envie a solicitação pelo WhatsApp.",
    bg: "bg-brand-teal shadow-glow-teal",
    iconBg: "bg-brand-teal/10 text-brand-teal",
  },
  {
    n: "03",
    icon: ClipboardCheck,
    title: "Confirmamos com o fornecedor",
    text: "Verificamos disponibilidade, prazo e valor final.",
    bg: "bg-brand-purple shadow-glow-purple",
    iconBg: "bg-brand-purple/10 text-brand-purple",
  },
  {
    n: "04",
    icon: Truck,
    title: "Você recebe ou retira",
    text: "Combinamos entrega local ou retirada de forma prática.",
    bg: "bg-green-500 shadow-glow-green",
    iconBg: "bg-green-100 text-green-600",
  },
];

export function ComoFunciona() {
  const { settings } = useStore();
  const wa = whatsappLink(defaultContactMessage, settings.whatsapp);

  return (
    <div>
      <PageHero
        eyebrow="Como funciona"
        icon={HandHeart}
        title="Compra sob encomenda, do seu jeito 🐾"
        subtitle="Sem estoque parado e com atendimento de verdade. Você escolhe, a gente verifica e combina o melhor prazo."
        mascot={img.mascot.dogTrabalhando}
      />

      {/* Passos */}
      <section className="section">
        <div className="container-app">
          <Reveal>
            <SectionHeader
              center
              eyebrow="Passo a passo"
              icon={PawPrint}
              title="É simples e transparente 😊"
            />
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <Reveal key={step.n} delay={i * 70}>
                <div className="card card-hover flex h-full flex-col items-center p-6 text-center">
                  {/* Número colorido */}
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full font-display text-2xl font-bold text-white ${step.bg}`}
                  >
                    {step.n}
                  </div>
                  {/* Ícone */}
                  <div
                    className={`mt-3 flex h-10 w-10 items-center justify-center rounded-2xl ${step.iconBg}`}
                  >
                    <step.icon size={20} />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-navy-700">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500">
                    {step.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Significado */}
      <section className="section bg-cream-100 pattern-grid">
        <div className="container-app grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-100 via-cream-100 to-brand-purple/15 p-8">
              <Decor variant="warm" />
              <img
                src={img.mascot.trabalhando}
                alt="Mascote Wazoo organizando pedidos"
                className="relative mx-auto h-64 w-auto animate-float-slow drop-shadow-2xl"
              />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <h2 className="section-title">O que significa "sob encomenda"?</h2>
              <p className="mt-4 leading-relaxed text-navy-600">
                Na Wazoo Pet Express, os produtos são vendidos sob encomenda. Isso
                significa que, após o envio da solicitação, nossa equipe verifica
                disponibilidade, prazo e valor com fornecedores parceiros. O
                pedido só é confirmado após essa validação e após a confirmação do
                pagamento, quando aplicável.
              </p>
              <p className="mt-3 leading-relaxed text-navy-600">
                Caso algum produto não esteja disponível, entraremos em contato
                para oferecer alternativas ou cancelar o item. Assim você tem mais
                variedade, atendimento personalizado e menos desperdício.
              </p>
              <Link to="/politica-sob-encomenda" className="btn-outline mt-6">
                Ler a política completa
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Status do pedido */}
      <section className="section">
        <div className="container-app">
          <Reveal>
            <SectionHeader
              center
              eyebrow="Acompanhe tudo"
              icon={Truck}
              title="As etapas do seu pedido"
              subtitle="Você acompanha cada passo pela sua conta, do envio à finalização."
            />
          </Reveal>
          <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-3">
            {ORDER_STATUSES.filter((s) => s !== "Cancelado").map((status, i) => (
              <Reveal key={status} delay={i * 40}>
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-cream-200 bg-white px-4 py-2 text-sm font-bold text-navy-600 shadow-card">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                    {i + 1}
                  </span>
                  {status}
                </span>
              </Reveal>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl rounded-2xl bg-orange-50 border border-orange-100 p-4 text-center text-sm text-navy-500">
            Como trabalhamos sob encomenda, alguns pedidos passam pela etapa de
            verificação com fornecedor antes da confirmação final.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="section pt-0">
        <div className="container-app">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-green-500 to-green-600 px-6 py-12 text-center shadow-glow-green sm:px-12">
            <Decor variant="cool" dots />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-white">
                Pronto para começar? 🐶
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-green-100">
                Monte seu pedido e fale com a gente. A gente verifica para você.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to="/produtos" className="btn bg-white px-8 py-4 text-lg text-green-700 shadow-soft hover:-translate-y-0.5 hover:bg-cream-50">
                  <ShoppingBag size={20} /> Ver produtos
                </Link>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn bg-navy-800 px-8 py-4 text-lg text-white shadow-soft hover:-translate-y-0.5 hover:bg-navy-900"
                >
                  <WhatsAppIcon size={20} /> Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
