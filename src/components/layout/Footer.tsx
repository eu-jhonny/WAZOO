import { Link } from "react-router-dom";
import { Clock, Instagram, MapPin, PawPrint } from "lucide-react";
import { img, site } from "@/config/site";
import { useStore } from "@/context/StoreContext";
import { whatsappLink, defaultContactMessage } from "@/lib/whatsapp";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";

export function Footer() {
  const { settings } = useStore();
  const year = new Date().getFullYear();
  const wa = whatsappLink(defaultContactMessage, settings.whatsapp);

  return (
    <footer className="mt-auto">
      {/* ── Barra colorida de topo (laranja → rosa → teal) ── */}
      <div className="h-1.5 bg-gradient-to-r from-orange-400 via-brand-pink to-brand-teal" />

      {/* ── Corpo do footer — fundo creme claro ── */}
      <div className="bg-cream-100">
        <div className="container-app py-12 md:py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

            {/* Marca */}
            <div className="lg:col-span-1">
              <img
                src={img.logo}
                alt="Wazoo Pet Express"
                className="h-12 w-auto"
              />
              <p className="mt-4 text-sm leading-relaxed text-navy-500">
                Produtos pet sob encomenda para cães e gatos. Você pede, a
                gente encontra e entrega com carinho. 🐾
              </p>
              <div className="mt-5 flex gap-3">
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-green-500 text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow-green"
                  aria-label="WhatsApp"
                >
                  <WhatsAppIcon size={20} />
                </a>
                <a
                  href={site.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-navy-700 text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-navy-800"
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </a>
              </div>
            </div>

            {/* Navegação */}
            <div>
              <h4 className="font-display text-lg font-bold text-navy-700">
                Navegação
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {(
                  [
                    ["Início", "/"],
                    ["Produtos", "/produtos"],
                    ["Kits", "/kits"],
                    ["Favoritos", "/favoritos"],
                    ["Rastrear pedido", "/rastrear"],
                    ["Avaliações", "/avaliacoes"],
                  ] as [string, string][]
                ).map(([label, to]) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="font-semibold text-navy-500 transition-colors hover:text-orange-600"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Institucional */}
            <div>
              <h4 className="font-display text-lg font-bold text-navy-700">
                Institucional
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {(
                  [
                    ["Sobre a loja", "/sobre"],
                    ["Como funciona", "/como-funciona"],
                    ["Compra sob encomenda", "/politica-sob-encomenda"],
                    ["Política de troca", "/politica-troca"],
                  ] as [string, string][]
                ).map(([label, to]) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="font-semibold text-navy-500 transition-colors hover:text-orange-600"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Atendimento */}
            <div>
              <h4 className="font-display text-lg font-bold text-navy-700">
                Atendimento
              </h4>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <WhatsAppIcon
                    size={18}
                    className="mt-0.5 shrink-0 text-green-500"
                  />
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-navy-500 transition-colors hover:text-orange-600"
                  >
                    Pedidos pelo WhatsApp
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <Instagram
                    size={18}
                    className="mt-0.5 shrink-0 text-orange-500"
                  />
                  <span className="font-semibold text-navy-500">
                    {settings.instagram}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock
                    size={18}
                    className="mt-0.5 shrink-0 text-orange-500"
                  />
                  <span className="font-semibold text-navy-500">
                    {settings.hours}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin
                    size={18}
                    className="mt-0.5 shrink-0 text-orange-500"
                  />
                  <span className="font-semibold text-navy-500">
                    {site.city}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Aviso sob encomenda */}
          <div className="mt-10 flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm text-navy-600">
            <PawPrint className="mt-0.5 shrink-0 text-orange-500" size={18} />
            <p>
              <strong className="text-navy-700">
                Trabalhamos sob encomenda:
              </strong>{" "}
              os valores e prazos exibidos são estimativas. A confirmação final
              acontece após verificarmos a disponibilidade com nossos
              fornecedores parceiros.
            </p>
          </div>
        </div>
      </div>

      {/* ── Barra inferior — navy ── */}
      <div className="bg-navy-800 py-5">
        <div className="container-app flex flex-col items-center justify-between gap-2 text-center text-sm font-semibold text-cream-200/70 sm:flex-row">
          <p>
            © {year}{" "}
            <span className="text-cream-200/90">{settings.storeName}</span> —
            feito com 🐾 carinho
          </p>
          <p className="text-cream-200/40">Todos os direitos reservados</p>
        </div>
      </div>
    </footer>
  );
}
