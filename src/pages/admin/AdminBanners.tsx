import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  apiEnabled,
  createApiBanner,
  deleteApiBanner,
  listApiBannersAdmin,
  updateApiBanner,
  type ApiBanner,
} from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/ui/Modal";

type BannerDraft = Omit<ApiBanner, "id" | "createdAt">;

const EMPTY: BannerDraft = {
  image: "",
  fallback: "from-orange-400 to-orange-600",
  tag: "Oferta Wazoo",
  title: "",
  subtitle: "",
  cta: "Ver ofertas →",
  ctaStyle: "bg-orange-500 text-white hover:bg-orange-600 font-bold",
  link: "/produtos",
  category: "geral",
  order: 0,
  active: true,
};

function BannerForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: BannerDraft;
  onSave: (draft: BannerDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const set = <K extends keyof BannerDraft>(key: K, value: BannerDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
    >
      <div>
        <label className="label">Título</label>
        <input
          required
          className="input"
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Ex.: Semana Wazoo"
        />
      </div>

      <div>
        <label className="label">Subtítulo</label>
        <textarea
          className="input min-h-[90px]"
          value={draft.subtitle ?? ""}
          onChange={(e) => set("subtitle", e.target.value)}
          placeholder="Mensagem curta da campanha"
        />
      </div>

      <div>
        <label className="label">Imagem</label>
        <input
          className="input"
          value={draft.image ?? ""}
          onChange={(e) => set("image", e.target.value)}
          placeholder="/images/banners/campanha.jpg ou URL"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Etiqueta</label>
          <input
            className="input"
            value={draft.tag ?? ""}
            onChange={(e) => set("tag", e.target.value)}
            placeholder="🔥 Oferta especial"
          />
        </div>
        <div>
          <label className="label">Ordem</label>
          <input
            type="number"
            className="input"
            value={draft.order}
            onChange={(e) => set("order", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Texto do botão</label>
          <input
            className="input"
            value={draft.cta}
            onChange={(e) => set("cta", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Destino do botão</label>
          <input
            className="input"
            value={draft.link}
            onChange={(e) => set("link", e.target.value)}
            placeholder="/produtos?cat=brinquedos"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-navy-700">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(e) => set("active", e.target.checked)}
          className="h-4 w-4 accent-orange-500"
        />
        Banner ativo
      </label>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 border border-cream-200">
          Cancelar
        </button>
        <button type="submit" className="btn-primary flex-1">Salvar banner</button>
      </div>
    </form>
  );
}

export function AdminBanners() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<ApiBanner[]>([]);
  const [loading, setLoading] = useState(apiEnabled);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; banner?: ApiBanner } | null>(null);

  useEffect(() => {
    if (!apiEnabled) {
      setLoading(false);
      return;
    }

    let active = true;
    listApiBannersAdmin()
      .then((data) => {
        if (active) setBanners(data);
      })
      .catch((error) => {
        showToast(error instanceof Error ? error.message : "Não foi possível carregar os banners.", "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const ordered = useMemo(
    () => [...banners].sort((a, b) => a.order - b.order),
    [banners],
  );

  async function save(draft: BannerDraft) {
    try {
      const saved = modal?.mode === "edit" && modal.banner
        ? await updateApiBanner(modal.banner.id, draft)
        : await createApiBanner(draft);

      setBanners((prev) => [
        ...prev.filter((item) => item.id !== saved.id),
        saved,
      ]);
      showToast("Banner salvo com sucesso! 🎨", "success");
      setModal(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível salvar o banner.", "error");
    }
  }

  async function toggle(banner: ApiBanner) {
    try {
      const updated = await updateApiBanner(banner.id, { active: !banner.active });
      setBanners((prev) => prev.map((item) => item.id === banner.id ? updated : item));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível atualizar o banner.", "error");
    }
  }

  async function remove(banner: ApiBanner) {
    if (!confirm(`Excluir o banner "${banner.title}"?`)) return;
    try {
      await deleteApiBanner(banner.id);
      setBanners((prev) => prev.filter((item) => item.id !== banner.id));
      showToast("Banner excluído.", "info");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível excluir o banner.", "error");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-800">Banners</h1>
          <p className="mt-1 text-navy-500">
            Gerencie campanhas e destaques da página inicial.
          </p>
        </div>
        <button onClick={() => setModal({ mode: "add" })} className="btn-primary btn-sm" disabled={!apiEnabled}>
          <Plus size={16} /> Novo banner
        </button>
      </div>

      {!apiEnabled && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Configure <strong>VITE_API_URL</strong> para gerenciar banners pelo painel.
        </div>
      )}

      {loading ? (
        <div className="card mt-6 flex items-center justify-center gap-2 py-16 text-navy-500">
          <Loader2 size={18} className="animate-spin text-orange-500" /> Carregando banners...
        </div>
      ) : ordered.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center p-12 text-center">
          <ImageIcon size={42} className="text-orange-400" />
          <p className="mt-3 font-semibold text-navy-600">Nenhum banner cadastrado na API.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {ordered.map((banner) => (
            <div key={banner.id} className={`card overflow-hidden ${banner.active ? "" : "opacity-60"}`}>
              <div className="relative h-44 bg-navy-800">
                {banner.image ? (
                  <img src={banner.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/50">
                    <ImageIcon size={36} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/20" />
                <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                  {banner.tag && <span className="text-xs font-bold uppercase tracking-wide text-orange-300">{banner.tag}</span>}
                  <h3 className="mt-1 font-display text-2xl font-bold">{banner.title}</h3>
                  {banner.subtitle && <p className="mt-1 line-clamp-2 text-sm text-white/80">{banner.subtitle}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs font-bold uppercase text-navy-400">Ordem {banner.order}</p>
                  <p className="text-sm font-semibold text-navy-700">{banner.cta} → {banner.link}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggle(banner)} className="rounded-full p-2 text-navy-400 hover:bg-cream-100">
                    {banner.active ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button onClick={() => setModal({ mode: "edit", banner })} className="rounded-full p-2 text-navy-400 hover:bg-cream-100 hover:text-orange-600">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => remove(banner)} className="rounded-full p-2 text-red-400 hover:bg-red-50">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Editar banner" : "Novo banner"}
        size="lg"
      >
        {modal && (
          <BannerForm
            initial={modal.banner
              ? {
                  image: modal.banner.image,
                  fallback: modal.banner.fallback,
                  tag: modal.banner.tag,
                  title: modal.banner.title,
                  subtitle: modal.banner.subtitle,
                  cta: modal.banner.cta,
                  ctaStyle: modal.banner.ctaStyle,
                  link: modal.banner.link,
                  category: modal.banner.category,
                  order: modal.banner.order,
                  active: modal.banner.active,
                }
              : { ...EMPTY }}
            onSave={save}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}
