/** Faixa de promoções com marquee (rolagem infinita) */
export function PromoStrip() {
  const msgs = [
    "🚚 FRETE GRÁTIS acima de R$200",
    "💳 10% OFF no PIX",
    "🎁 Código WAZOO10 → 10% OFF na primeira compra",
    "⚽ Coleção Copa disponível!",
    "🎉 Kits Festa Junina com desconto",
    "🐾 Todos os produtos sob encomenda",
    "📦 Prazo médio: 5–7 dias úteis",
    "💬 Atendimento pelo WhatsApp",
  ];

  // Duplica para loop infinito sem corte
  const doubled = [...msgs, ...msgs];

  return (
    <div className="overflow-hidden bg-orange-500 py-2 text-white">
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((msg, i) => (
          <span key={i} className="mx-8 shrink-0 text-xs font-bold uppercase tracking-wide sm:text-sm">
            {msg}
            <span className="mx-8 opacity-40">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
