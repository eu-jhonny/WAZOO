import { useMemo, useState } from "react";
import { Check, MessageSquare, Star, Trash2 } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/format";
import { Stars } from "@/components/ui/Stars";

type Filter = "todas" | "pendentes" | "aprovadas";

export function AdminReviews() {
  const { reviews, approveReview, deleteReview, toggleReviewFeatured } = useStore();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<Filter>("todas");

  const list = useMemo(
    () =>
      reviews
        .filter((r) =>
          filter === "pendentes" ? !r.approved : filter === "aprovadas" ? r.approved : true
        )
        .sort((a, b) => Number(a.approved) - Number(b.approved) || b.createdAt - a.createdAt),
    [reviews, filter]
  );

  const pending = reviews.filter((r) => !r.approved).length;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-navy-700">Avaliações</h1>
      <p className="mt-1 text-navy-500">
        {reviews.length} avaliações · {pending} aguardando aprovação.
      </p>

      {/* Filtros */}
      <div className="mt-6 flex gap-2">
        {([
          { value: "todas", label: "Todas" },
          { value: "pendentes", label: "Pendentes" },
          { value: "aprovadas", label: "Aprovadas" },
        ] as const).map((opt) => (
          <button key={opt.value} onClick={() => setFilter(opt.value)} className={`chip ${filter === opt.value ? "chip-active" : ""}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {list.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center p-12 text-center">
          <MessageSquare className="text-orange-400" size={40} />
          <p className="mt-3 font-semibold text-navy-600">Nenhuma avaliação nesta categoria.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {list.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    {!r.approved ? (
                      <span className="badge bg-amber-100 text-amber-700">Pendente</span>
                    ) : (
                      <span className="badge bg-green-100 text-green-700">Publicada</span>
                    )}
                    {r.featured && <span className="badge bg-navy-700 text-white">Destaque</span>}
                  </div>
                  <p className="mt-2 text-navy-600">“{r.text}”</p>
                  <p className="mt-2 text-sm font-semibold text-navy-700">
                    {r.name}
                    {r.petName && <span className="font-normal text-navy-400"> · tutor(a) do {r.petName}</span>}
                    <span className="font-normal text-navy-400"> · {formatDate(r.createdAt)}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!r.approved && (
                    <button
                      onClick={() => { approveReview(r.id); showToast("Avaliação aprovada! ✅", "success"); }}
                      className="btn-green btn-sm"
                    >
                      <Check size={15} /> Aprovar
                    </button>
                  )}
                  <button
                    onClick={() => { toggleReviewFeatured(r.id); showToast("Destaque atualizado.", "success"); }}
                    className={`btn-sm btn ${r.featured ? "bg-navy-700 text-white" : "btn-outline"}`}
                  >
                    <Star size={15} className={r.featured ? "fill-white" : ""} /> Destacar
                  </button>
                  <button
                    onClick={() => { deleteReview(r.id); showToast("Avaliação excluída.", "info"); }}
                    className="btn-sm btn bg-red-50 text-red-500 hover:bg-red-100"
                  >
                    <Trash2 size={15} /> Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
