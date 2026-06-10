import { useState, type FormEvent } from "react";
import { productCategories } from "@/data/categories";
import { ProductImage } from "../ui/ProductImage";
import type { PetAudience, PetSize, Product } from "@/types";

interface ProductFormProps {
  initial?: Product;
  onSubmit: (data: Omit<Product, "id" | "createdAt">) => void;
  onCancel: () => void;
  submitLabel?: string;
}

/** Interruptor (switch) reutilizado nos campos booleanos. */
function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-cream-200 p-3 text-left transition-colors hover:border-orange-300"
    >
      <span>
        <span className="font-bold text-navy-700">{label}</span>
        {hint && <span className="block text-xs text-navy-400">{hint}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-green-500" : "bg-cream-300"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[1.375rem]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export function ProductForm({ initial, onSubmit, onCancel, submitLabel = "Salvar produto" }: ProductFormProps) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    category: initial?.category ?? "acessorios",
    price: initial?.price ?? 0,
    leadTime: initial?.leadTime ?? "2 a 5 dias úteis",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    image: initial?.image ?? "",
    active: initial?.active ?? true,
    featured: initial?.featured ?? false,
    onDemand: initial?.onDemand ?? true,
    audience: (initial?.audience ?? "ambos") as PetAudience,
    size: (initial?.size ?? "todos") as PetSize,
    availability: initial?.availability ?? "Sob consulta",
  });

  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ ...f, price: Number(f.price) || 0 });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Nome</label>
        <input required className="input" value={f.name} onChange={(e) => set("name", e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Categoria</label>
          <select className="input" value={f.category} onChange={(e) => set("category", e.target.value)}>
            {productCategories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Preço estimado (R$)</label>
          <input type="number" min={0} step="0.01" required className="input"
            value={f.price} onChange={(e) => set("price", Number(e.target.value))} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Prazo médio</label>
          <input className="input" value={f.leadTime} onChange={(e) => set("leadTime", e.target.value)} />
        </div>
        <div>
          <label className="label">Indicado para</label>
          <select className="input" value={f.audience} onChange={(e) => set("audience", e.target.value as PetAudience)}>
            <option value="ambos">Cães e gatos</option>
            <option value="cachorro">Cachorro</option>
            <option value="gato">Gato</option>
          </select>
        </div>
        <div>
          <label className="label">Porte</label>
          <select className="input" value={f.size} onChange={(e) => set("size", e.target.value as PetSize)}>
            <option value="todos">Todos</option>
            <option value="pequeno">Pequeno</option>
            <option value="medio">Médio</option>
            <option value="grande">Grande</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Disponibilidade estimada</label>
        <input className="input" value={f.availability} onChange={(e) => set("availability", e.target.value)}
          placeholder="Ex.: Alta disponibilidade, Sob consulta..." />
      </div>

      <div>
        <label className="label">Descrição curta</label>
        <input className="input" value={f.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
      </div>

      <div>
        <label className="label">Descrição completa</label>
        <textarea className="input" value={f.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div>
        <label className="label">Imagem (URL)</label>
        <div className="flex items-center gap-3">
          <input className="input flex-1" placeholder="https://... ou deixe vazio"
            value={f.image} onChange={(e) => set("image", e.target.value)} />
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-cream-200 bg-cream-100">
            <ProductImage src={f.image} alt="Pré-visualização" category={f.category} iconSize={24} />
          </div>
        </div>
        <p className="mt-1 text-xs text-navy-400">Sem imagem, usamos um placeholder ilustrado da categoria.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Toggle checked={f.active} onChange={(v) => set("active", v)} label="Ativo" hint="Aparece no site" />
        <Toggle checked={f.featured} onChange={(v) => set("featured", v)} label="Destaque" hint="Na home" />
        <Toggle checked={f.onDemand} onChange={(v) => set("onDemand", v)} label="Sob encomenda" hint="Selo no card" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Cancelar</button>
        <button type="submit" className="btn-primary flex-1">{submitLabel}</button>
      </div>
    </form>
  );
}
