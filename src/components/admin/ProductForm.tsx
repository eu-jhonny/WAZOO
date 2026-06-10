import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, Link as LinkIcon, Trash2, Upload } from "lucide-react";
import { productCategories } from "@/data/categories";
import { ProductImage } from "../ui/ProductImage";
import type { PetAudience, PetSize, Product } from "@/types";

/* ── Comprime imagem via Canvas e retorna base64 ─────────────── */
function compressImage(file: File, maxW = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale  = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width  = img.width  * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/* ── Toggle reutilizável ──────────────────────────────────────── */
function Toggle({
  checked, onChange, label, hint,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all ${
        checked
          ? "border-orange-300 bg-orange-50"
          : "border-cream-200 bg-white hover:border-orange-200"
      }`}
    >
      <span>
        <span className="text-sm font-bold text-navy-700">{label}</span>
        {hint && <span className="block text-xs text-navy-400">{hint}</span>}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-orange-500" : "bg-navy-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? "left-[1.125rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

interface ProductFormProps {
  initial?: Product;
  onSubmit: (data: Omit<Product, "id" | "createdAt">) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function ProductForm({ initial, onSubmit, onCancel, submitLabel = "Salvar produto" }: ProductFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgMode, setImgMode] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);

  const [f, setF] = useState({
    name:             initial?.name             ?? "",
    category:         initial?.category         ?? "acessorios",
    price:            initial?.price            ?? 0,
    comparePrice:     initial?.comparePrice     ?? (undefined as number | undefined),
    leadTime:         initial?.leadTime         ?? "2 a 5 dias úteis",
    shortDescription: initial?.shortDescription ?? "",
    description:      initial?.description      ?? "",
    image:            initial?.image            ?? "",
    active:           initial?.active           ?? true,
    featured:         initial?.featured         ?? false,
    onDemand:         initial?.onDemand         ?? true,
    audience:         (initial?.audience        ?? "ambos") as PetAudience,
    size:             (initial?.size            ?? "todos")  as PetSize,
    availability:     initial?.availability     ?? "Sob consulta",
    promoLabel:       initial?.promoLabel       ?? "",
  });

  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) =>
    setF((p) => ({ ...p, [key]: value }));

  /* ── Upload de arquivo ─────────────────────────────────────── */
  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const b64 = await compressImage(file);
    set("image", b64);
    setUploading(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...f,
      price:        Number(f.price)        || 0,
      comparePrice: f.comparePrice ? Number(f.comparePrice) : undefined,
    });
  };

  const discountPct =
    f.comparePrice && Number(f.comparePrice) > Number(f.price)
      ? Math.round(((Number(f.comparePrice) - Number(f.price)) / Number(f.comparePrice)) * 100)
      : null;

  return (
    <form onSubmit={submit} className="space-y-5">

      {/* Nome */}
      <div>
        <label className="label">Nome do produto *</label>
        <input required className="input" value={f.name}
          onChange={(e) => set("name", e.target.value)} />
      </div>

      {/* Categoria + Público + Porte */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Categoria</label>
          <select className="input" value={f.category}
            onChange={(e) => set("category", e.target.value)}>
            {productCategories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Indicado para</label>
          <select className="input" value={f.audience}
            onChange={(e) => set("audience", e.target.value as PetAudience)}>
            <option value="ambos">Cães e gatos</option>
            <option value="cachorro">Cachorro</option>
            <option value="gato">Gato</option>
          </select>
        </div>
        <div>
          <label className="label">Porte</label>
          <select className="input" value={f.size}
            onChange={(e) => set("size", e.target.value as PetSize)}>
            <option value="todos">Todos</option>
            <option value="pequeno">Pequeno</option>
            <option value="medio">Médio</option>
            <option value="grande">Grande</option>
          </select>
        </div>
      </div>

      {/* Preços */}
      <div className="rounded-xl border border-cream-200 bg-cream-50 p-4">
        <p className="mb-3 text-sm font-bold text-navy-700">💰 Preços</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Preço de venda (R$) *</label>
            <input type="number" min={0} step="0.01" required className="input bg-white"
              value={f.price}
              onChange={(e) => set("price", Number(e.target.value))} />
          </div>
          <div>
            <label className="label">
              Preço original (R$)
              <span className="ml-1 text-xs font-normal text-navy-400">— para exibir o "DE R$X por R$Y"</span>
            </label>
            <input type="number" min={0} step="0.01" className="input bg-white"
              placeholder="Ex: 190,00"
              value={f.comparePrice ?? ""}
              onChange={(e) => set("comparePrice", e.target.value ? Number(e.target.value) : undefined)} />
          </div>
        </div>

        {discountPct && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm">
            <span className="font-bold text-green-700">✓ Desconto de {discountPct}% será exibido no produto</span>
          </div>
        )}

        <div className="mt-3">
          <label className="label">Etiqueta promocional personalizada <span className="font-normal text-navy-400">(opcional)</span></label>
          <input className="input bg-white" placeholder='Ex.: "Lançamento", "Kit Copa", "-30%"'
            value={f.promoLabel ?? ""}
            onChange={(e) => set("promoLabel", e.target.value || undefined as any)} />
        </div>
      </div>

      {/* Prazo + Disponibilidade */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Prazo médio de entrega</label>
          <input className="input" value={f.leadTime}
            onChange={(e) => set("leadTime", e.target.value)} />
        </div>
        <div>
          <label className="label">Disponibilidade</label>
          <input className="input" value={f.availability}
            onChange={(e) => set("availability", e.target.value)}
            placeholder="Ex.: Alta disponibilidade, Sob consulta..." />
        </div>
      </div>

      {/* Descrições */}
      <div>
        <label className="label">Descrição curta</label>
        <input className="input" value={f.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
          placeholder="Aparece no card do produto" />
      </div>
      <div>
        <label className="label">Descrição completa</label>
        <textarea className="input" value={f.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Aparece na página de detalhes" />
      </div>

      {/* Imagem — upload OU URL */}
      <div className="rounded-xl border border-cream-200 bg-cream-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-navy-700">🖼️ Imagem do produto</p>
          <div className="flex rounded-lg border border-cream-200 bg-white p-0.5">
            <button type="button"
              onClick={() => setImgMode("upload")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${imgMode === "upload" ? "bg-navy-800 text-white" : "text-navy-500 hover:text-navy-700"}`}>
              <Upload size={12} /> Arquivo
            </button>
            <button type="button"
              onClick={() => setImgMode("url")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${imgMode === "url" ? "bg-navy-800 text-white" : "text-navy-500 hover:text-navy-700"}`}>
              <LinkIcon size={12} /> URL
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Preview */}
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-cream-200 bg-white">
            {uploading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />
              </div>
            ) : (
              <ProductImage src={f.image} alt="Preview" category={f.category} iconSize={28} />
            )}
            {f.image && (
              <button
                type="button"
                onClick={() => { set("image", ""); if (fileRef.current) fileRef.current.value = ""; }}
                className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white shadow hover:bg-red-600"
                title="Remover imagem"
              >
                <Trash2 size={10} />
              </button>
            )}
          </div>

          {/* Input */}
          <div className="flex-1">
            {imgMode === "upload" ? (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                  id="prod-img-upload"
                />
                <label
                  htmlFor="prod-img-upload"
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-cream-200 bg-white p-4 text-center transition-colors hover:border-orange-300 hover:bg-orange-50"
                >
                  <ImagePlus size={20} className="text-navy-400" />
                  <span className="text-xs font-semibold text-navy-500">
                    Clique para enviar uma foto
                  </span>
                  <span className="text-xs text-navy-400">JPG, PNG, WebP — max 5 MB</span>
                </label>
              </>
            ) : (
              <div>
                <input
                  className="input bg-white"
                  placeholder="https://..."
                  value={f.image.startsWith("data:") ? "" : f.image}
                  onChange={(e) => set("image", e.target.value)}
                />
                <p className="mt-1 text-xs text-navy-400">
                  Cole o link direto da imagem (JPG, PNG, WebP)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="grid gap-2 sm:grid-cols-3">
        <Toggle checked={f.active}   onChange={(v) => set("active", v)}   label="Ativo"         hint="Visível no site" />
        <Toggle checked={f.featured} onChange={(v) => set("featured", v)} label="Destaque"      hint="Aparece na home" />
        <Toggle checked={f.onDemand} onChange={(v) => set("onDemand", v)} label="Sob encomenda" hint="Exibe selo" />
      </div>

      {/* Ações */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 border border-cream-200">
          Cancelar
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={uploading}>
          {uploading ? "Processando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
