import { useMemo, useState, type FormEvent } from "react";
import { PawPrint, Send, Star } from "lucide-react";
import { img } from "@/config/site";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { ReviewCard } from "@/components/product/ReviewCard";
import { Stars } from "@/components/ui/Stars";

export function Avaliacoes() {
  const { reviews, addReview } = useStore();
  const { showToast } = useToast();

  const approved = useMemo(
    () => reviews.filter((r) => r.approved).sort((a, b) => b.createdAt - a.createdAt),
    [reviews]
  );
  const average = useMemo(
    () =>
      approved.length
        ? approved.reduce((sum, r) => sum + r.rating, 0) / approved.length
        : 0,
    [approved]
  );

  const [name, setName] = useState("");
  const [petName, setPetName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    addReview({ name, petName: petName || undefined, rating, text });
    showToast("Avaliação enviada! Ela aparecerá após aprovação. 🐾", "success");
    setName("");
    setPetName("");
    setText("");
    setRating(5);
  };

  return (
    <div>
      <PageHero
        variant="cream"
        eyebrow="Avaliações"
        icon={Star}
        title="O que dizem os tutores"
        subtitle="A confiança de quem já pediu com a gente é o nosso maior orgulho."
        mascot={img.mascot.saudacao}
      />

      <section className="section">
        <div className="container-app">
          {/* Resumo */}
          <Reveal>
            <div className="mb-10 flex flex-col items-center gap-3 rounded-3xl bg-cream-100 p-8 text-center sm:flex-row sm:justify-center sm:gap-6">
              <p className="font-display text-6xl font-bold text-orange-500">
                {average.toFixed(1)}
              </p>
              <div className="sm:text-left">
                <Stars value={Math.round(average)} size={24} />
                <p className="mt-1 font-semibold text-navy-600">
                  Baseado em {approved.length} avaliações
                </p>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-10 lg:grid-cols-3">
            {/* Lista */}
            <div className="lg:col-span-2">
              <div className="grid gap-5 sm:grid-cols-2">
                {approved.map((review, i) => (
                  <Reveal key={review.id} delay={(i % 2) * 70}>
                    <ReviewCard review={review} />
                  </Reveal>
                ))}
              </div>
            </div>

            {/* Formulário */}
            <div>
              <div className="card sticky top-24 p-6">
                <h2 className="font-display text-xl font-bold text-navy-700">
                  Deixe sua avaliação
                </h2>
                <p className="mt-1 text-sm text-navy-500">
                  Conte como foi sua experiência. Sua avaliação passa por
                  aprovação antes de aparecer.
                </p>

                <form onSubmit={submit} className="mt-5 space-y-4">
                  <div>
                    <label className="label" htmlFor="rev-name">Seu nome</label>
                    <input id="rev-name" required className="input" placeholder="Como quer ser identificado"
                      value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="label" htmlFor="rev-pet">Nome do pet (opcional)</label>
                    <input id="rev-pet" className="input" placeholder="Ex.: Banguela"
                      value={petName} onChange={(e) => setPetName(e.target.value)} />
                  </div>
                  <div>
                    <span className="label">Sua nota</span>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const v = i + 1;
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setRating(v)}
                            onMouseEnter={() => setHover(v)}
                            onMouseLeave={() => setHover(0)}
                            aria-label={`${v} estrelas`}
                          >
                            <Star
                              size={30}
                              className={
                                v <= (hover || rating)
                                  ? "fill-orange-400 text-orange-400"
                                  : "fill-cream-200 text-cream-200"
                              }
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="rev-text">Comentário</label>
                    <textarea id="rev-text" required className="input" placeholder="Conte como foi sua experiência..."
                      value={text} onChange={(e) => setText(e.target.value)} />
                  </div>
                  <button type="submit" className="btn-primary w-full">
                    <Send size={18} /> Enviar avaliação
                  </button>
                </form>
              </div>
            </div>
          </div>

          {approved.length === 0 && (
            <div className="mt-8 flex flex-col items-center gap-3 text-center">
              <PawPrint className="text-orange-400" size={40} />
              <p className="font-semibold text-navy-500">
                Ainda não há avaliações por aqui. Seja o primeiro!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
