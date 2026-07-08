import { useMemo, useState } from "react";
import { Star, MessageSquarePlus, CheckCircle2 } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ratingForProduct } from "@/lib/ratings";
import { formatDate } from "@/lib/format";
import { Stars } from "../ui/Stars";

/** Seletor de nota (estrelas clicáveis). */
function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
        >
          <Star
            size={28}
            className={(hover || value) >= n ? "fill-orange-400 text-orange-400" : "fill-cream-200 text-cream-200"}
          />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId, productName }: { productId: string; productName: string }) {
  const { reviews, addReview } = useStore();
  const { user } = useAuth();
  const { showToast } = useToast();

  const list = useMemo(
    () =>
      reviews
        .filter((r) => r.approved && r.productId === productId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [reviews, productId],
  );
  const summary = useMemo(() => ratingForProduct(reviews, productId), [reviews, productId]);

  // Distribuição por nota (5→1).
  const dist = useMemo(() => {
    const d = [0, 0, 0, 0, 0];
    list.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) d[5 - r.rating]++; });
    return d;
  }, [list]);

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) {
      showToast("Preencha seu nome e o comentário.", "error");
      return;
    }
    addReview({ name: name.trim(), rating, text: text.trim(), productId, productName });
    setSent(true);
    setText("");
    showToast("Avaliação enviada! Ela aparece após a moderação. 🌟", "success");
  };

  return (
    <div className="mt-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Avaliações do produto</h2>
        {!open && !sent && (
          <button onClick={() => setOpen(true)} className="btn-outline-orange btn-sm">
            <MessageSquarePlus size={16} /> Avaliar este produto
          </button>
        )}
      </div>

      {/* Resumo */}
      <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex flex-col items-center rounded-3xl bg-cream-50 px-8 py-6 text-center">
          <p className="font-display text-5xl font-extrabold text-navy-800">
            {summary.count ? summary.average.toFixed(1) : "—"}
          </p>
          <Stars value={Math.round(summary.average)} size={18} className="mt-1" />
          <p className="mt-1 text-xs font-semibold text-navy-400">
            {summary.count} {summary.count === 1 ? "avaliação" : "avaliações"}
          </p>
        </div>
        <div className="space-y-1.5">
          {dist.map((count, i) => {
            const stars = 5 - i;
            const pct = summary.count ? Math.round((count / summary.count) * 100) : 0;
            return (
              <div key={stars} className="flex items-center gap-2 text-sm">
                <span className="flex w-8 shrink-0 items-center gap-0.5 font-semibold text-navy-500">
                  {stars} <Star size={12} className="fill-orange-400 text-orange-400" />
                </span>
                <div className="h-2 flex-1 rounded-full bg-cream-100">
                  <div className="h-2 rounded-full bg-orange-400 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-right text-xs text-navy-400">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Formulário */}
      {open && !sent && (
        <form onSubmit={submit} className="mt-6 rounded-3xl border border-cream-200 bg-white p-6 shadow-card">
          <p className="font-display font-bold text-navy-700">Conte como foi sua experiência</p>
          <div className="mt-3"><RatingInput value={rating} onChange={setRating} /></div>
          {!user && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="input mt-4"
            />
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`O que você achou de "${productName}"?`}
            className="input mt-3 min-h-[90px]"
          />
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1 border border-cream-200">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Enviar avaliação</button>
          </div>
        </form>
      )}

      {sent && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-green-700">
          <CheckCircle2 size={22} />
          <p className="font-semibold">Obrigado! Sua avaliação será publicada após a moderação. 🐾</p>
        </div>
      )}

      {/* Lista */}
      {list.length > 0 ? (
        <div className="mt-8 space-y-4">
          {list.map((r) => (
            <div key={r.id} className="rounded-2xl border border-cream-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-display font-bold text-orange-600">
                    {r.name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-navy-700">{r.name}</p>
                    <p className="text-xs text-navy-400">{formatDate(r.createdAt)}</p>
                  </div>
                </div>
                <Stars value={r.rating} size={15} />
              </div>
              <p className="mt-3 leading-relaxed text-navy-600">"{r.text}"</p>
            </div>
          ))}
        </div>
      ) : (
        !open && !sent && (
          <p className="mt-8 rounded-2xl border border-dashed border-cream-300 bg-cream-50 px-5 py-8 text-center text-navy-500">
            Ainda não há avaliações deste produto. Seja o primeiro a avaliar! 🌟
          </p>
        )
      )}
    </div>
  );
}
