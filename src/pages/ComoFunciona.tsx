import { Link } from "react-router-dom";
import {
  CheckCircle2,
  CreditCard,
  HeartHandshake,
  PackageCheck,
  PawPrint,
  ShoppingBag,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { img } from "@/config/site";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Decor } from "@/components/ui/Decor";

const steps = [
  {
    n: "01",
    icon: ShoppingBag,
    title: "Escolha seus produtos",
    text: "Explore categorias, ofertas e produtos para cães e gatos. Confira preço, variações e disponibilidade.",
    bg: "bg-orange-500 shadow-glow",
    iconBg: "bg-orange-100 text-orange-600",
  },
  {
    n: "02",
    icon: ShoppingCart,
    title: "Monte seu carrinho",
    text: "Escolha quantidade, tamanho ou outras opções e revise tudo antes de finalizar.",
    bg: "bg-brand-teal shadow-glow-teal",
    iconBg: "bg-brand-teal/10 text-brand-teal",
  },
  {
    n: "03",
    icon: CreditCard,
    title: "Finalize e pague",
    text: "Informe seus dados, escolha entrega ou retirada, aplique cupons e selecione a forma de pagamento.",
    bg: "bg-brand-purple shadow-glow-purple",
    iconBg: "bg-brand-purple/10 text-brand-purple",
  },
  {
    n: "04",
    icon: Truck,
    title: "Acompanhe até chegar",
    text: "Veja o status do pedido desde a confirmação do pagamento até a entrega ou retirada.",
    bg: "bg-green-500 shadow-glow-green",
    iconBg: "bg-green-100 text-green-600",
  },
] as const;

const benefits = [
  {
    icon: CheckCircle2,
    title: "Preço claro",
    text: "Você vê produto, desconto, frete e total antes de confirmar a compra.",
  },
  {
    icon: PackageCheck,
    title: "Disponibilidade visível",
    text: "Produtos mostram estoque e opções disponíveis diretamente na página.",
  },
  {
    icon: CreditCard,
    title: "Pagamento online",
    text: "PIX, cartão e outras formas habilitadas aparecem no checkout.",
  },
  {
    icon: HeartHandshake,
    title: "Suporte quando precisar",
    text: "O WhatsApp continua disponível para atendimento, não como etapa obrigatória da compra.",
  },
] as const;

export function ComoFunciona() {
  return (
    <div>
      <PageHero
        eyebrow="Como comprar"
        icon={ShoppingCart}
        title="Comprar na Wazoo é simples 🐾"
        subtitle="Escolha, pague online e acompanhe seu pedido em um fluxo direto, sem etapas manuais pelo WhatsApp."
        mascot={img.mascot.dogTrabalhando}
      />

      <section className="section">
        <div className="container-app">
          <Reveal>
            <SectionHeader
              center
              eyebrow="Passo a passo"
              icon={PawPrint}
              title="Da escolha até a entrega"
              subtitle="Um fluxo de e-commerce direto, rápido e transparente."
            />
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <Reveal key={step.n} delay={i * 70}>
                <div className="card card-hover flex h-full flex-col items-center p-6 text-center">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-full font-display text-2xl font-bold text-white ${step.bg}`}>
                    {step.n}
                  </div>
                  <div className={`mt-3 flex h-10 w-10 items-center justify-center rounded-2xl ${step.iconBg}`}>
                    <step.icon size={20} />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-navy-700">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-cream-100 pattern-grid">
        <div className="container-app grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-100 via-cream-100 to-brand-purple/15 p-8">
              <Decor variant="warm" />
              <img
                src={img.mascot.trabalhando}
                alt="Mascote Wazoo preparando um pedido"
                className="relative mx-auto h-64 w-auto animate-float-slow drop-shadow-2xl"
              />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <span className="eyebrow"><PackageCheck size={16} /> E-commerce Wazoo</span>
              <h2 className="section-title mt-4">Compra de verdade, do carrinho ao pagamento</h2>
              <p className="mt-4 leading-relaxed text-navy-600">
                A Wazoo funciona como uma loja online: produtos disponíveis podem ser adicionados ao carrinho,
                o frete é definido no checkout e o pagamento faz parte da própria compra.
              </p>
              <p className="mt-3 leading-relaxed text-navy-600">
                Depois da confirmação, você acompanha a separação e a entrega na sua conta. O atendimento continua
                disponível para dúvidas, trocas e suporte.
              </p>
              <Link to="/produtos" className="btn-primary mt-6">
                <ShoppingBag size={18} /> Explorar produtos
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container-app">
          <Reveal>
            <SectionHeader
              center
              eyebrow="Mais segurança"
              icon={CheckCircle2}
              title="Tudo claro antes de pagar"
            />
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <div className="card h-full p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                    <item.icon size={22} />
                  </div>
                  <h3 className="mt-4 font-display font-bold text-navy-800">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-app">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-teal to-cyan-600 px-6 py-12 text-center shadow-soft-lg sm:px-12">
            <Decor variant="cool" dots />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-white">Seu pet merece uma compra mais fácil 🐶🐱</h2>
              <p className="mx-auto mt-3 max-w-xl text-white/85">
                Encontre o que precisa, finalize pelo site e acompanhe tudo pela Wazoo.
              </p>
              <Link to="/produtos" className="btn mt-6 bg-white px-8 py-4 text-lg font-bold text-teal-700 shadow-soft hover:-translate-y-0.5">
                <ShoppingBag size={20} /> Começar a comprar
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
