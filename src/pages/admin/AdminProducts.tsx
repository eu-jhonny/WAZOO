import { useMemo, useState } from "react";
import { Eye, EyeOff, Package, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { formatBRL } from "@/lib/format";
import { productCategories, getCategoryName } from "@/data/categories";
import { ProductImage } from "@/components/ui/ProductImage";
import { ProductForm } from "@/components/admin/ProductForm";
import { Modal } from "@/components/ui/Modal";
import type { Product } from "@/types";

export function AdminProducts() {
  const { products, addProduct, updateProduct, deleteProduct, toggleProductActive, toggleProductFeatured } = useStore();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("todos");
  const [modal, setModal] = useState<{ mode: "add" | "edit"; product?: Product } | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const filtered = useMemo(
    () =>
      products
        .filter((p) => (cat === "todos" ? true : p.category === cat))
        .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => b.createdAt - a.createdAt),
    [products, cat, search]
  );

  const handleSubmit = (data: Omit<Product, "id" | "createdAt">) => {
    if (modal?.mode === "edit" && modal.product) {
      updateProduct(modal.product.id, data);
      showToast("Produto atualizado com sucesso! ✅", "success");
    } else {
      addProduct(data);
      showToast("Produto cadastrado com sucesso! 🎉", "success");
    }
    setModal(null);
  };

  const confirmDelete = () => {
    if (toDelete) {
      deleteProduct(toDelete.id);
      showToast("Produto excluído.", "info");
      setToDelete(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-700">Produtos</h1>
          <p className="mt-1 text-navy-500">{products.length} produtos cadastrados.</p>
        </div>
        <button onClick={() => setModal({ mode: "add" })} className="btn-primary btn-sm">
          <Plus size={16} /> Cadastrar produto
        </button>
      </div>

      {/* Filtros */}
      <div className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300" size={18} />
          <input className="input pl-11" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-56" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="todos">Todas as categorias</option>
          {productCategories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center p-12 text-center">
          <Package className="text-orange-400" size={40} />
          <p className="mt-3 font-semibold text-navy-600">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className={`card flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${!p.active ? "opacity-70" : ""}`}>
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-cream-100">
                <ProductImage src={p.image} alt={p.name} category={p.category} iconSize={22} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-bold text-navy-700">{p.name}</h3>
                  {p.featured && <span className="badge bg-navy-700 text-white">Destaque</span>}
                  {!p.active && <span className="badge bg-red-100 text-red-600">Inativo</span>}
                </div>
                <p className="text-sm text-navy-400">
                  {getCategoryName(p.category)} · {p.leadTime}
                </p>
              </div>

              <p className="font-display text-lg font-bold text-orange-600 sm:w-28 sm:text-right">
                {formatBRL(p.price)}
              </p>

              <div className="flex items-center gap-1 sm:justify-end">
                <button
                  onClick={() => { toggleProductFeatured(p.id); showToast("Destaque atualizado.", "success"); }}
                  className={`rounded-full p-2 transition-colors ${p.featured ? "text-orange-500" : "text-navy-300 hover:bg-cream-100 hover:text-orange-500"}`}
                  title="Marcar como destaque"
                >
                  <Star size={18} className={p.featured ? "fill-orange-400" : ""} />
                </button>
                <button
                  onClick={() => { toggleProductActive(p.id); showToast(p.active ? "Produto desativado." : "Produto ativado.", "success"); }}
                  className="rounded-full p-2 text-navy-400 transition-colors hover:bg-cream-100 hover:text-navy-700"
                  title={p.active ? "Desativar" : "Ativar"}
                >
                  {p.active ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button
                  onClick={() => setModal({ mode: "edit", product: p })}
                  className="rounded-full p-2 text-navy-400 transition-colors hover:bg-cream-100 hover:text-orange-600"
                  title="Editar"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => setToDelete(p)}
                  className="rounded-full p-2 text-navy-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de cadastro/edição */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Editar produto" : "Cadastrar produto"}
        size="lg"
      >
        <ProductForm
          initial={modal?.product}
          onSubmit={handleSubmit}
          onCancel={() => setModal(null)}
          submitLabel={modal?.mode === "edit" ? "Salvar alterações" : "Cadastrar produto"}
        />
      </Modal>

      {/* Confirmar exclusão */}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Excluir produto" size="sm">
        <p className="text-navy-600">
          Tem certeza que deseja excluir <strong>{toDelete?.name}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setToDelete(null)} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={confirmDelete} className="btn flex-1 bg-red-500 text-white hover:bg-red-600">
            <Trash2 size={16} /> Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
}
