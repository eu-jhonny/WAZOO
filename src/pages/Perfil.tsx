import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Cat,
  Dog,
  Home,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  PawPrint,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
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
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
  todos: "Todos",
};

/** Formulário de edição dos dados pessoais. */
function ProfileForm({ user, onDone }: { user: User; onDone: () => void }) {
  const { updateProfile } = useAuth();
  const { showToast } = useToast();
  const [f, setF] = useState({
    name: user.name,
    phone: user.phone,
    email: user.email,
    street: user.address.street,
    neighborhood: user.address.neighborhood,
    city: user.address.city,
    preference: user.preference,
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: f.name,
      phone: f.phone,
      email: f.email,
      address: { street: f.street, neighborhood: f.neighborhood, city: f.city },
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
      <div className="grid gap-4 sm:grid-cols-2">
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
      <div className="grid gap-4 sm:grid-cols-2">
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
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: "entrega", label: "Entrega", icon: Home },
            { value: "retirada", label: "Retirada", icon: Store },
          ] as const).map((opt) => {
            const selected = f.preference === opt.value;
            return (
              <button type="button" key={opt.value} onClick={() => set("preference", opt.value)}
                className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-3 font-bold transition-all ${
                  selected ? "border-orange-500 bg-orange-50 text-orange-600" : "border-cream-200 text-navy-600"
                }`}>
                <opt.icon size={18} /> {opt.label}
              </button>
            );
          })}
        </div>
      </div>
      <button type="submit" className="btn-primary w-full">Salvar alterações</button>
    </form>
  );
}

export function Perfil() {
  const { user, logout, addPet, updatePet, removePet } = useAuth();
  const { orders } = useStore();
  const { showToast } = useToast();

  const [editProfile, setEditProfile] = useState(false);
  const [petModal, setPetModal] = useState<{ mode: "add" | "edit"; pet?: Pet } | null>(null);
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);

  const myOrders = useMemo(
    () => (user ? orders.filter((o) => o.userId === user.id).sort((a, b) => b.createdAt - a.createdAt) : []),
    [orders, user]
  );

  if (!user) return null;

  const savePet = (data: Omit<Pet, "id">) => {
    if (petModal?.mode === "edit" && petModal.pet) {
      updatePet(petModal.pet.id, data);
      showToast("Pet atualizado! 🐾", "success");
    } else {
      addPet(data);
      showToast("Pet cadastrado com sucesso! 🐾", "success");
    }
    setPetModal(null);
  };

  const confirmDelete = () => {
    if (petToDelete) {
      removePet(petToDelete.id);
      showToast("Pet removido.", "info");
      setPetToDelete(null);
    }
  };

  return (
    <section className="section bg-cream-50">
      <div className="container-app">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-navy-700 sm:text-4xl">
              Olá, {user.name.split(" ")[0]}! 🐾
            </h1>
            <p className="mt-1 text-navy-500">Bem-vindo(a) à sua área Wazoo Pet Express.</p>
          </div>
          <button onClick={logout} className="btn-ghost text-navy-500 hover:text-red-500">
            <LogOut size={18} /> Sair
          </button>
        </div>

        {/* Dados + endereço */}
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 font-display text-2xl font-bold text-orange-600">
                  {user.name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-navy-700">{user.name}</h2>
                  <span className="badge-soft mt-1 capitalize">Prefere {user.preference}</span>
                </div>
              </div>
              <button onClick={() => setEditProfile(true)} className="btn-outline btn-sm">
                <Pencil size={15} /> Editar
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <p className="flex items-center gap-2 text-navy-600"><Mail size={18} className="text-orange-500" /> {user.email}</p>
              <p className="flex items-center gap-2 text-navy-600"><Phone size={18} className="text-orange-500" /> {user.phone}</p>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy-700">
              <MapPin size={20} className="text-orange-500" /> Endereço
            </h2>
            <div className="mt-3 space-y-1 text-navy-600">
              <p>{user.address.street || "—"}</p>
              <p>{user.address.neighborhood}</p>
              <p>{user.address.city}</p>
            </div>
          </div>
        </div>

        {/* Pets */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-navy-700">Meus pets</h2>
            <button onClick={() => setPetModal({ mode: "add" })} className="btn-primary btn-sm">
              <Plus size={16} /> Cadastrar pet
            </button>
          </div>

          {user.pets.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed border-cream-300 bg-white px-6 py-12 text-center">
              <PawPrint className="text-orange-400" size={36} />
              <p className="mt-3 font-semibold text-navy-600">Você ainda não cadastrou nenhum pet.</p>
              <p className="text-sm text-navy-400">Cadastre para receber indicações personalizadas.</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {user.pets.map((pet) => {
                const Icon = pet.type === "gato" ? Cat : Dog;
                return (
                  <div key={pet.id} className="card card-hover p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-100 text-orange-500">
                          <Icon size={24} />
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-bold text-navy-700">{pet.name}</h3>
                          <p className="text-xs text-navy-400">{pet.breed || (pet.type === "gato" ? "Gato" : "Cachorro")}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setPetModal({ mode: "edit", pet })} className="rounded-full p-2 text-navy-400 hover:bg-cream-100 hover:text-orange-600" aria-label="Editar pet">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setPetToDelete(pet)} className="rounded-full p-2 text-navy-400 hover:bg-red-50 hover:text-red-500" aria-label="Remover pet">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="badge-soft">{sizeLabel[pet.size]}</span>
                      <span className="badge-soft">{pet.age}</span>
                      {pet.weight && <span className="badge-soft">{pet.weight}</span>}
                    </div>
                    {pet.notes && <p className="mt-3 text-sm text-navy-500">{pet.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pedidos recentes */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-navy-700">Pedidos recentes</h2>
            <Link to="/pedidos" className="btn-ghost btn-sm">Ver todos <ArrowRight size={16} /></Link>
          </div>

          {myOrders.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed border-cream-300 bg-white px-6 py-12 text-center">
              <ShoppingBag className="text-orange-400" size={36} />
              <p className="mt-3 font-semibold text-navy-600">Nenhum pedido por aqui ainda.</p>
              <Link to="/produtos" className="btn-primary btn-sm mt-4">Fazer meu primeiro pedido</Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {myOrders.slice(0, 3).map((order) => (
                <Link key={order.id} to="/pedidos" className="card card-hover flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-display font-bold text-navy-700">{order.id}</p>
                    <p className="text-xs text-navy-400">{formatDate(order.createdAt)} · {order.items.length} itens</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-orange-600">{formatBRL(order.total)}</span>
                    <span className={`badge ${statusStyle[order.status]}`}>{order.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      <Modal open={editProfile} onClose={() => setEditProfile(false)} title="Editar dados">
        <ProfileForm user={user} onDone={() => setEditProfile(false)} />
      </Modal>

      <Modal
        open={!!petModal}
        onClose={() => setPetModal(null)}
        title={petModal?.mode === "edit" ? "Editar pet" : "Cadastrar novo pet"}
      >
        <PetForm
          initial={petModal?.pet}
          onSubmit={savePet}
          onCancel={() => setPetModal(null)}
          submitLabel={petModal?.mode === "edit" ? "Salvar pet" : "Cadastrar pet"}
        />
      </Modal>

      <Modal open={!!petToDelete} onClose={() => setPetToDelete(null)} title="Remover pet" size="sm">
        <p className="text-navy-600">
          Tem certeza que deseja remover <strong>{petToDelete?.name}</strong>?
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setPetToDelete(null)} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={confirmDelete} className="btn flex-1 bg-red-500 text-white hover:bg-red-600">
            <Trash2 size={16} /> Remover
          </button>
        </div>
      </Modal>
    </section>
  );
}
