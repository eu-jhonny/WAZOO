import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Camera, Cat, Dog, Home, LogOut,
  Mail, MapPin, Pencil, Phone, PawPrint,
  Plus, ShoppingBag, Store, Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { formatBRL, formatDate } from "@/lib/format";
import { statusStyle } from "@/lib/orderStatus";
import { Modal } from "@/components/ui/Modal";
import { PetForm } from "@/components/forms/PetForm";
import type { Fulfillment, Pet, User } from "@/types";

const sizeLabel: Record<Pet["size"], string> = {
  pequeno: "Pequeno porte",
  medio:   "Médio porte",
  grande:  "Grande porte",
  todos:   "Todos",
};

/* ── Formulário de edição de dados ─────────────────────────────── */
function ProfileForm({ user, onDone }: { user: User; onDone: () => void }) {
  const { updateProfile } = useAuth();
  const { showToast }     = useToast();
  const [f, setF] = useState({
    name:         user.name,
    phone:        user.phone,
    email:        user.email,
    street:       user.address.street,
    neighborhood: user.address.neighborhood,
    city:         user.address.city,
    preference:   user.preference,
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    updateProfile({
      name:      f.name,
      phone:     f.phone,
      email:     f.email,
      address:   { street: f.street, neighborhood: f.neighborhood, city: f.city },
      preference: f.preference as Fulfillment,
    });
    showToast("Dados salvos com sucesso! ✅", "success");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Nome completo</label>
        <input required className="input" value={f.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Telefone</label>
          <input required className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input required type="email" className="input" value={f.email} onChange={(e) => set("email", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Endereço</label>
        <input className="input" value={f.street} onChange={(e) => set("street", e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Bairro</label>
          <input className="input" value={f.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
        </div>
        <div>
          <label className="label">Cidade</label>
          <input className="input" value={f.city} onChange={(e) => set("city", e.target.value)} />
        </div>
      </div>
      <div>
        <span className="label">Preferência de recebimento</span>
        <div className="grid grid-cols-2 gap-3 mt-1">
          {([
            { value: "entrega",  label: "🏠 Entrega",  icon: Home },
            { value: "retirada", label: "🏪 Retirada", icon: Store },
          ] as const).map((opt) => {
            const sel = f.preference === opt.value;
            return (
              <button type="button" key={opt.value}
                onClick={() => set("preference", opt.value)}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 font-bold transition-all text-sm ${
                  sel ? "border-orange-500 bg-orange-50 text-orange-600" : "border-cream-200 text-navy-600 hover:border-orange-200"
                }`}>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onDone} className="btn-ghost flex-1 border border-cream-200">Cancelar</button>
        <button type="submit" className="btn-primary flex-1">Salvar alterações</button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export function Perfil() {
  const { user, logout, addPet, updatePet, removePet } = useAuth();
  const { orders }   = useStore();
  const { showToast } = useToast();

  const [editProfile, setEditProfile] = useState(false);
  const [petModal, setPetModal]       = useState<{ mode: "add" | "edit"; pet?: Pet } | null>(null);
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);

  const myOrders = useMemo(
    () =>
      user
        ? orders.filter((o) => o.userId === user.id).sort((a, b) => b.createdAt - a.createdAt)
        : [],
    [orders, user]
  );

  if (!user) return null;

  const initials = user.name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  const savePet = (data: Omit<Pet, "id">) => {
    if (petModal?.mode === "edit" && petModal.pet) {
      updatePet(petModal.pet.id, data);
      showToast("Pet atualizado! 🐾", "success");
    } else {
      addPet(data);
      showToast("Pet cadastrado! 🐾", "success");
    }
    setPetModal(null);
  };

  return (
    <div className="section bg-cream-50">
      <div className="container-app max-w-5xl">

        {/* ── Hero do perfil ──────────────────────────────────── */}
        <div className="card overflow-hidden mb-6">
          {/* Banner decorativo */}
          <div className="h-24 bg-gradient-to-r from-orange-500 to-orange-600 relative">
            <div className="absolute inset-0 bg-dots-light" />
          </div>

          <div className="px-6 pb-5 relative">
            {/* Avatar */}
            <div className="relative -mt-10 mb-4 inline-block">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-navy-800 shadow-soft-lg ring-4 ring-white font-display text-2xl font-bold text-white">
                {initials}
              </div>
              <button
                onClick={() => setEditProfile(true)}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white shadow hover:bg-orange-600"
                title="Editar perfil"
              >
                <Camera size={12} />
              </button>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold text-navy-800">{user.name}</h1>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-navy-500">
                  <span className="flex items-center gap-1.5"><Mail size={14} className="text-orange-400" /> {user.email}</span>
                  <span className="flex items-center gap-1.5"><Phone size={14} className="text-orange-400" /> {user.phone}</span>
                  {user.address.city && (
                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-orange-400" /> {user.address.city}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setEditProfile(true)} className="btn-outline btn-sm">
                  <Pencil size={14} /> Editar
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-navy-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut size={15} /> Sair
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* ── Coluna esquerda ─────────────────────────────────── */}
          <div className="space-y-5">

            {/* Endereço */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="flex items-center gap-2 font-display font-bold text-navy-700">
                  <MapPin size={16} className="text-orange-500" /> Endereço
                </h2>
                <button onClick={() => setEditProfile(true)} className="rounded-lg p-1.5 text-navy-400 hover:bg-cream-100 hover:text-orange-500">
                  <Pencil size={14} />
                </button>
              </div>
              {user.address.street ? (
                <div className="space-y-0.5 text-sm text-navy-600">
                  <p>{user.address.street}</p>
                  {user.address.neighborhood && <p>{user.address.neighborhood}</p>}
                  {user.address.city && <p className="font-semibold">{user.address.city}</p>}
                </div>
              ) : (
                <p className="text-sm text-navy-400">Endereço não informado</p>
              )}
            </div>

            {/* Preferência */}
            <div className="card p-5">
              <h2 className="mb-3 font-display font-bold text-navy-700">Preferência</h2>
              <div className={`flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-bold ${
                user.preference === "entrega"
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-navy-200 bg-navy-50 text-navy-700"
              }`}>
                {user.preference === "entrega" ? <Home size={16} /> : <Store size={16} />}
                {user.preference === "entrega" ? "Prefere entrega" : "Prefere retirada"}
              </div>
            </div>

            {/* Stats rápidos */}
            <div className="card p-5">
              <h2 className="mb-3 font-display font-bold text-navy-700">Resumo</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-navy-500">Total de pedidos</span>
                  <span className="font-bold text-navy-800">{myOrders.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-navy-500">Pets cadastrados</span>
                  <span className="font-bold text-navy-800">{user.pets.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-navy-500">Total gasto (est.)</span>
                  <span className="font-bold text-orange-600">
                    {formatBRL(myOrders.reduce((s, o) => s + o.total, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Coluna direita ──────────────────────────────────── */}
          <div className="space-y-5 lg:col-span-2">

            {/* Meus pets */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-navy-700">🐾 Meus pets</h2>
                <button onClick={() => setPetModal({ mode: "add" })} className="btn-primary btn-sm">
                  <Plus size={14} /> Cadastrar
                </button>
              </div>

              {user.pets.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-cream-200 py-8 text-center">
                  <PawPrint size={28} className="text-orange-300" />
                  <p className="mt-2 text-sm font-semibold text-navy-600">Nenhum pet cadastrado</p>
                  <p className="text-xs text-navy-400">Cadastre para receber indicações personalizadas</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {user.pets.map((pet) => {
                    const Icon = pet.type === "gato" ? Cat : Dog;
                    const petColor = pet.type === "gato"
                      ? "bg-purple-100 text-purple-600"
                      : "bg-orange-100 text-orange-600";

                    return (
                      <div key={pet.id} className="rounded-xl border border-cream-200 bg-cream-50 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${petColor}`}>
                              <Icon size={20} />
                            </div>
                            <div>
                              <p className="font-display font-bold text-navy-800">{pet.name}</p>
                              <p className="text-xs text-navy-400">
                                {pet.breed || (pet.type === "gato" ? "Gato" : "Cachorro")}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setPetModal({ mode: "edit", pet })}
                              className="rounded-lg p-1.5 text-navy-400 hover:bg-white hover:text-orange-500"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setPetToDelete(pet)}
                              className="rounded-lg p-1.5 text-navy-400 hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          <span className="badge-soft text-xs">{sizeLabel[pet.size]}</span>
                          {pet.age && <span className="badge-soft text-xs">{pet.age}</span>}
                          {pet.weight && <span className="badge-soft text-xs">{pet.weight}</span>}
                        </div>
                        {pet.notes && (
                          <p className="mt-2 text-xs text-navy-500 italic">{pet.notes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pedidos recentes */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-navy-700">📦 Pedidos recentes</h2>
                <Link to="/pedidos" className="flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700">
                  Ver todos <ArrowRight size={14} />
                </Link>
              </div>

              {myOrders.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-cream-200 py-8 text-center">
                  <ShoppingBag size={28} className="text-orange-300" />
                  <p className="mt-2 text-sm font-semibold text-navy-600">Nenhum pedido ainda</p>
                  <Link to="/produtos" className="btn-primary btn-sm mt-3">
                    Fazer primeiro pedido
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {myOrders.slice(0, 4).map((order) => (
                    <Link
                      key={order.id}
                      to="/pedidos"
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream-50 px-4 py-3 transition-colors hover:bg-cream-100"
                    >
                      <div>
                        <p className="font-mono text-xs text-navy-400 uppercase">#{order.id.slice(0, 8)}</p>
                        <p className="text-sm font-semibold text-navy-700">
                          {order.items.length} {order.items.length === 1 ? "item" : "itens"} ·{" "}
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-orange-600">{formatBRL(order.total)}</span>
                        <span className={`badge text-xs ${statusStyle[order.status]}`}>
                          {order.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Modais */}
      <Modal open={editProfile} onClose={() => setEditProfile(false)} title="Editar dados pessoais">
        <ProfileForm user={user} onDone={() => setEditProfile(false)} />
      </Modal>

      <Modal
        open={!!petModal}
        onClose={() => setPetModal(null)}
        title={petModal?.mode === "edit" ? "Editar pet" : "Cadastrar pet"}
      >
        <PetForm
          initial={petModal?.pet}
          onSubmit={savePet}
          onCancel={() => setPetModal(null)}
          submitLabel={petModal?.mode === "edit" ? "Salvar" : "Cadastrar pet"}
        />
      </Modal>

      <Modal open={!!petToDelete} onClose={() => setPetToDelete(null)} title="Remover pet" size="sm">
        <p className="text-navy-600">
          Remover <strong className="text-navy-800">{petToDelete?.name}</strong>? Essa ação não pode ser desfeita.
        </p>
        <div className="mt-4 flex gap-3">
          <button onClick={() => setPetToDelete(null)} className="btn-ghost flex-1 border border-cream-200">
            Cancelar
          </button>
          <button
            onClick={() => { if (petToDelete) { removePet(petToDelete.id); showToast("Pet removido.", "info"); setPetToDelete(null); } }}
            className="btn flex-1 bg-red-500 text-white hover:bg-red-600"
          >
            <Trash2 size={15} /> Remover
          </button>
        </div>
      </Modal>
    </div>
  );
}
