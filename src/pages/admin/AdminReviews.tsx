import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, MessageSquare, Star, Trash2 } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/format";
import { Stars } from "@/components/ui/Stars";
import {
  apiEnabled,
  deleteApiReviewAdmin,
  listApiReviewsAdmin,
  updateApiReviewAdmin,
  type ApiReview,
} from "@/lib/api";

type Filter = "todas" | "pendentes" | "aprovadas";

export function AdminReviews() {
  const { reviews, approveReview, deleteReview, toggleReviewFeatured } = useStore();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<Filter>("todas");
  const [remoteReviews, setRemoteReviews] = useState<ApiReview[] | null>(null);
  const [loading, setLoading] = useState(apiEnabled);

  useEffect(() => {
    if (!apiEnabled) {
      setLoading(false);
      return;
    }
    let active = true;
    listApiReviewsAdmin()
      .then((data) => {
        if (active) setRemoteReviews(data);
      })
      .catch((error) => {
        showToast(error instanceof Error ? error.message : "Não foi possível carregar as avaliações.", "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const managedReviews = useMemo(
    () => remoteReviews
      ? remoteReviews.map((r) => ({
          id: r.id,
          name: r.name,
          petName: r.petName ?? undefined,
          rating: r.rating,
          text: r.text,
          productId: r.productId ?? undefined,
          approved: r.approved,
          featured: r.featured,
          createdAt: new Date(r.createdAt).getTime(),
        }))
      : reviews,
    [remoteReviews, reviews],
  );

  const list = useMemo(
    () =>
      managedReviews
        .filter((r) =>
          filter === "pendentes" ? !r.approved : filter === "aprovadas" ? r.approved : true
        )
        .sort((a, b) => Number(a.approved) - Number(b.approved) || b.createdAt - a.createdAt),
    [managedReviews, filter]
  );

  const pending = managedReviews.filter((r) => !r.approved).length;

  const approve = async (id: string) => {
    if (apiEnabled && remoteReviews) {
      try {
        const updated = await updateApiReviewAdmin(id, { approved: true });
        setRemoteReviews((prev) => prev?.map((r) => r.id === id ? updated : r) ?? prev);
        showToast("Avaliação aprovada! ✅", "success");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Não foi possível aprovar.", "error");
      }
      return;
    }
    approveReview(id);
    showToast("Avaliação aprovada! ✅", "success");
  };

  const toggleFeatured = async (id: string) => {
    const current = managedReviews.find((r) => r.id === id);
    if (!current) return;
    if (apiEnabled && remoteReviews) {
      try {
        const updated = await updateApiReviewAdmin(id, {
          featured: !current.featured,
          approved: true,
        });
        setRemoteReviews((prev) => prev?.map((r) => r.id === id ? updated : r) ?? prev);
        showToast("Destaque atualizado.", "success");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Não foi possível atualizar.", "error");
      }
      return;
    }
    toggleReviewFeatured(id);
    showToast("Destaque atualizado.", "success");
  };

  const remove = async (id: string) => {
    if (apiEnabled && remoteReviews) {
      try {
        await deleteApiReviewAdmin(id);
        setRemoteReviews((prev) => prev?.filter((r) => r.id !== id) ?? prev);
        showToast("Avaliação excluída.", "info");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Não foi possível excluir.", "error");
      }
      return;
    }
    deleteReview(id);
    showToast("Avaliação excluída.", "info");
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-navy-700">Avaliações</h1>
      <p className="mt-1 text-navy-500">
        {managedReviews.length} avaliações · {pending} aguardando aprovação.
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
      {loading ? (
        <div className="card mt-6 flex items-center justify-center gap-2 py-14 text-navy-500">
          <Loader2 size={18} className="animate-spin text-orange-500" /> Carregando avaliações...
        </div>
      ) : list.length === 0 ? (
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
                    {r.productId ? (
                      <span className="badge bg-teal-100 text-teal-700">🛍️ {r.productName ?? "Produto"}</span>
                    ) : (
                      <span className="badge bg-cream-200 text-navy-500">Geral / loja</span>
                    )}
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
                      onClick={() => approve(r.id)}
                      className="btn-green btn-sm"
                    >
                      <Check size={15} /> Aprovar
                    </button>
                  )}
                  <button
                    onClick={() => toggleFeatured(r.id)}
                    className={`btn-sm btn ${r.featured ? "bg-navy-700 text-white" : "btn-outline"}`}
                  >
                    <Star size={15} className={r.featured ? "fill-white" : ""} /> Destacar
                  </button>
                  <button
                    onClick={() => remove(r.id)}
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
