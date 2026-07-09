/**
 * Wazoo IA — assistente virtual da loja
 * Chatbot rule-based com contexto da loja (produtos, pets, entrega…)
 */
import { useState, useEffect, useRef } from "react";
import { X, Send, Bot, PawPrint, ShoppingBag, Truck, CreditCard, HelpCircle, MessageCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "@/context/StoreContext";
import { useCart } from "@/context/CartContext";
import { whatsappLink } from "@/lib/whatsapp";
import { formatBRL } from "@/lib/format";

/* ── Tipos ─────────────────────────────────── */
interface Message {
  id: string;
  from: "user" | "ai";
  text: string;
  links?: Array<{ label: string; to?: string; href?: string }>;
  time: number;
}
type QuickReply = { label: string; value: string; icon?: React.ReactNode };

/* ── Intents / matching ─────────────────────── */
const match = (msg: string, kws: string[]) =>
  kws.some((k) => msg.toLowerCase().includes(k));

function getResponse(
  raw: string,
  store: ReturnType<typeof useStore>,
  cartCount: number,
): { text: string; links?: Message["links"] } {
  const m = raw.toLowerCase().trim();
  const { products, settings } = store;
  const active = products.filter((p) => p.active);

  /* Saudação */
  if (match(m, ["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite", "hey", "hello", "tudo bem"])) {
    const h = new Date().getHours();
    const g = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
    return {
      text: `${g}! 🐾 Eu sou a Wazy, assistente virtual da Wazoo Pet Express! Posso te ajudar a encontrar produtos, tirar dúvidas sobre entrega, pagamento e muito mais. O que você precisa?`,
    };
  }

  /* Cachorro */
  if (match(m, ["cachorro", "cão", "cao", "dog", "caes", "filhote"])) {
    const dogs = active.filter((p) => p.audience === "cachorro" || p.audience === "ambos").slice(0, 3);
    return {
      text: `🐕 Temos uma linha completa para cachorros! Roupinhas, coleiras, brinquedos, petiscos e muito mais — tudo sob encomenda. Aqui estão alguns produtos:`,
      links: [
        ...dogs.map((p) => ({ label: `${p.name} — ${formatBRL(p.price)}`, to: `/produtos/${p.id}` })),
        { label: "Ver todos para cães →", to: "/cachorros" },
      ],
    };
  }

  /* Gato */
  if (match(m, ["gato", "cat", "felino", "gatinho", "bichano"])) {
    const cats = active.filter((p) => p.audience === "gato" || p.audience === "ambos").slice(0, 3);
    return {
      text: `🐈 Para os felinos, temos arranhadores, casinhas, petiscos e acessórios exclusivos! Veja alguns:`,
      links: [
        ...cats.map((p) => ({ label: `${p.name} — ${formatBRL(p.price)}`, to: `/produtos/${p.id}` })),
        { label: "Ver todos para gatos →", to: "/gatos" },
      ],
    };
  }

  /* Busca de produto */
  if (match(m, ["quero", "procuro", "tem", "vende", "produto", "comprar", "buscar", "achar"])) {
    const query = m.replace(/quero|procuro|tem|vende|produto|comprar|buscar|achar/g, "").trim();
    if (query.length > 2) {
      const found = active.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.shortDescription.toLowerCase().includes(query)
      ).slice(0, 3);
      if (found.length > 0) {
        return {
          text: `🔍 Encontrei ${found.length} produto${found.length > 1 ? "s" : ""} relacionado${found.length > 1 ? "s" : ""}:`,
          links: found.map((p) => ({ label: `${p.name} — ${formatBRL(p.price)}`, to: `/produtos/${p.id}` })),
        };
      }
    }
    return {
      text: `🛍️ Temos ${active.length} produtos no catálogo! Use os filtros para encontrar o ideal:`,
      links: [{ label: "Ver catálogo completo →", to: "/produtos" }],
    };
  }

  /* Entrega / Frete */
  if (match(m, ["entrega", "frete", "prazo", "demora", "quando", "chega", "envio", "transportadora"])) {
    return {
      text: `🚚 Entregamos em São Paulo e região! O prazo médio é de 5 a 7 dias úteis após a confirmação. A taxa de entrega é de ${formatBRL(settings.deliveryFee || 0)} para a região. Também é possível retirar na loja sem custo. Nosso horário de atendimento é ${settings.hours}.`,
      links: [{ label: "Como funciona →", to: "/como-funciona" }],
    };
  }

  /* Pagamento */
  if (match(m, ["pagar", "pagamento", "cartão", "cartao", "pix", "boleto", "parcela", "parcelar", "credito", "débito"])) {
    return {
      text: `💳 Aceitamos várias formas de pagamento:\n\n• **PIX** — à vista com desconto\n• **Cartão de crédito** — em até 10x sem juros\n• **Boleto bancário** — prazo de 3 dias\n\nProcessamento seguro via MercadoPago! 🔒`,
      links: [{ label: "Finalizar pedido →", to: "/carrinho" }],
    };
  }

  /* Troca / Devolução */
  if (match(m, ["troca", "trocar", "devolver", "devolução", "devolucao", "cancelar", "cancelamento", "prazo de troca"])) {
    return {
      text: `🔄 Nossa política de troca é simples: produtos com defeito de fabricação têm troca garantida em até 7 dias. Como trabalhamos sob encomenda, pedimos que verifique bem o tamanho e especificações antes de finalizar.`,
      links: [{ label: "Política de troca →", to: "/politica-troca" }],
    };
  }

  /* Como funciona */
  if (match(m, ["como funciona", "como comprar", "encomenda", "sob encomenda", "processo", "passo"])) {
    return {
      text: `📦 É simples!\n\n1️⃣ Escolha os produtos e adicione ao carrinho\n2️⃣ Finalize o pedido e confirme o pagamento\n3️⃣ Recebemos e confirmamos a disponibilidade com você via WhatsApp\n4️⃣ Fazemos o pedido ao fornecedor\n5️⃣ Entregamos na sua casa ou você retira na loja! 🐾`,
      links: [{ label: "Saiba mais →", to: "/como-funciona" }],
    };
  }

  /* Kits */
  if (match(m, ["kit", "kits", "combo", "pacote", "presente"])) {
    return {
      text: `🎁 Temos kits prontos especiais para facilitar sua vida! Combos montados com carinho para cães e gatos — ótimos para presente ou uso diário!`,
      links: [{ label: "Ver kits →", to: "/kits" }],
    };
  }

  /* Dia dos Pais */
  if (match(m, ["dia dos pais", "pai", "papai", "paidog", "presente para o pai", "presente pai"])) {
    return {
      text: `👔 Especial Dia dos Pais! Kits presente, bandanas “Time do Papai” e acessórios combinando para a dupla pai & pet. 🐾`,
      links: [
        { label: "Ver presentes →", to: "/produtos" },
        { label: "Ver kits →", to: "/kits" },
      ],
    };
  }

  /* Preço */
  if (match(m, ["preço", "preco", "valor", "quanto custa", "quanto é", "caro", "barato"])) {
    const minPrice = Math.min(...active.map((p) => p.price));
    const maxPrice = Math.max(...active.map((p) => p.price));
    return {
      text: `💰 Nossos produtos vão de ${formatBRL(minPrice)} a ${formatBRL(maxPrice)}. Trabalhamos com preço direto do fornecedor, sem intermediários! Acesse o catálogo e use o filtro de preço.`,
      links: [{ label: "Ver catálogo com filtros →", to: "/produtos" }],
    };
  }

  /* Carrinho */
  if (match(m, ["carrinho", "sacola", "meu pedido", "finalizar"])) {
    return {
      text: cartCount > 0
        ? `🛒 Você tem ${cartCount} item${cartCount > 1 ? "s" : ""} no carrinho! Pronto para finalizar?`
        : `🛒 Seu carrinho está vazio. Que tal explorar nosso catálogo?`,
      links: [
        { label: cartCount > 0 ? "Ir ao carrinho →" : "Ver produtos →", to: cartCount > 0 ? "/carrinho" : "/produtos" },
      ],
    };
  }

  /* Contato humano / WhatsApp */
  if (match(m, ["humano", "atendente", "pessoa", "falar com alguem", "whatsapp", "contato", "telefone", "zap"])) {
    return {
      text: `💬 Prefere falar com um atendente humano? Estamos disponíveis via WhatsApp no horário ${settings.hours}. Clica aí!`,
      links: [{ label: "Abrir WhatsApp →", href: whatsappLink("Olá! Vim pelo chat da loja.", settings.whatsapp) }],
    };
  }

  /* Cadastro / Login */
  if (match(m, ["cadastro", "criar conta", "registrar", "login", "entrar", "senha"])) {
    return {
      text: `👤 Com uma conta Wazoo você acompanha pedidos, salva seus pets e faz pedidos com muito mais praticidade!`,
      links: [
        { label: "Criar conta →", to: "/cadastro" },
        { label: "Entrar →", to: "/login" },
      ],
    };
  }

  /* Número de produtos */
  if (match(m, ["quantos", "quantidade"])) {
    return {
      text: `📦 Temos ${active.length} produtos ativos no catálogo, para cães e gatos! Novidades chegam toda semana. 🐾`,
      links: [{ label: "Ver catálogo →", to: "/produtos" }],
    };
  }

  /* Fallback */
  return {
    text: `Hmm, não entendi bem essa! 😅 Posso te ajudar com:\n\n• Encontrar produtos para cão ou gato\n• Informações sobre entrega e frete\n• Formas de pagamento\n• Como funciona a encomenda\n\nOu prefere falar com nossa equipe?`,
    links: [
      { label: "Ver produtos →", to: "/produtos" },
      { label: "Falar no WhatsApp →", href: whatsappLink("Olá! Preciso de ajuda.", settings.whatsapp) },
    ],
  };
}

/* ── Quick replies iniciais ─────────────────── */
const QUICK_REPLIES: QuickReply[] = [
  { label: "Produtos para cachorro", value: "quero produtos para cachorro", icon: "🐕" },
  { label: "Produtos para gato", value: "quero produtos para gato", icon: "🐈" },
  { label: "Como funciona?", value: "como funciona a encomenda", icon: "📦" },
  { label: "Entrega e frete", value: "como é a entrega e frete", icon: "🚚" },
  { label: "Formas de pagamento", value: "quais as formas de pagamento", icon: "💳" },
  { label: "Ver kits", value: "quero ver os kits disponíveis", icon: "🎁" },
];

const WELCOME_MSG: Message = {
  id: "welcome",
  from: "ai",
  text: "Olá! 🐾 Eu sou a **Wazy**, assistente da Wazoo Pet Express! Estou aqui para te ajudar a encontrar o melhor para o seu pet. Como posso te ajudar hoje?",
  time: Date.now(),
};

/* ══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════ */
export function WazooAI() {
  const store   = useStore();
  const { count } = useCart();
  const [open, setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput]   = useState("");
  const [typing, setTyping] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const bottomRef           = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
      setHasNew(false);
    }
  }, [open, messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: `u${Date.now()}`, from: "user", text, time: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const resp = getResponse(text, store, count);
      const aiMsg: Message = {
        id: `a${Date.now()}`,
        from: "ai",
        ...resp,
        time: Date.now(),
      };
      setMessages((m) => [...m, aiMsg]);
      setTyping(false);
      if (!open) setHasNew(true);
    }, 900 + Math.random() * 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  /* Renderiza o texto com **negrito** simples */
  const renderText = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i} className="font-bold text-navy-800">{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    );

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300 sm:right-6 sm:bottom-28 ${
          open ? "bg-navy-800 text-white rotate-0" : "bg-gradient-to-br from-teal-500 to-teal-600 text-white hover:scale-110"
        }`}
        aria-label="Assistente Wazoo"
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
        {!open && hasNew && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
            1
          </span>
        )}
      </button>

      {/* Painel de chat */}
      {open && (
        <div
          className="fixed bottom-44 right-4 z-50 flex w-80 max-h-[70vh] flex-col rounded-2xl border border-cream-200 bg-white shadow-2xl overflow-hidden sm:right-6 sm:bottom-48 sm:w-96"
          style={{ animation: "slide-in-left 0.35s ease-out" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-cream-100 bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-white text-sm leading-none">Wazy ✨</p>
              <p className="text-teal-200 text-xs mt-0.5">Assistente Wazoo Pet Express</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-teal-200">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Online
            </span>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-cream-50/40">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {msg.from === "ai" && (
                  <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                    <PawPrint size={13} />
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.from === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div
                    className={`rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                      msg.from === "user"
                        ? "bg-teal-500 text-white rounded-tr-sm"
                        : "bg-white text-navy-700 shadow-sm rounded-tl-sm border border-cream-100"
                    }`}
                  >
                    {renderText(msg.text)}
                  </div>
                  {msg.links && msg.links.length > 0 && (
                    <div className="flex flex-col gap-1 w-full">
                      {msg.links.map((link, i) =>
                        link.to ? (
                          <Link
                            key={i}
                            to={link.to}
                            className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100 transition-colors"
                            onClick={() => setOpen(false)}
                          >
                            {link.label}
                          </Link>
                        ) : (
                          <a
                            key={i}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors"
                          >
                            {link.label}
                          </a>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100">
                  <PawPrint size={13} className="text-teal-600" />
                </div>
                <div className="flex gap-1 rounded-2xl bg-white border border-cream-100 px-4 py-3 shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-teal-400"
                      style={{ animation: `bounce 1s ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies (só se última msg for do AI) */}
          {messages[messages.length - 1]?.from === "ai" && messages.length <= 3 && (
            <div className="border-t border-cream-100 p-2 flex flex-wrap gap-1.5 bg-white">
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr.value}
                  onClick={() => sendMessage(qr.value)}
                  className="flex items-center gap-1 rounded-full border border-cream-200 bg-cream-50 px-2.5 py-1 text-[10px] font-bold text-navy-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                >
                  <span>{qr.icon}</span> {qr.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-cream-100 bg-white p-2 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre produtos, entrega…"
              className="flex-1 rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-xs outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-white transition-colors hover:bg-teal-600 disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
