import { useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Camera, Cat, Dog, Home, LogOut,
  Mail, MapPin, Pencil, Phone, PawPrint,
  Plus, ShoppingBag, Store, Trash2, Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { useLoyalty } from "@/context/LoyaltyContext";
import { formatBRL, formatDate } from "@/lib/format";
import { statusStyle } from "@/lib/orderStatus";
import { compressImage } from "@/lib/imageUtils";
import { Modal } from "@/components/ui/Modal";
import { PetForm } from "@/components/forms/PetForm";
import type { Fulfillment, Pet, User } from "@/types";

const sizeLabel: Record<Pet["size"], string> = {
  pequeno: "Pequeno porte",
  medio:   "Médio porte",
  grande:  "Grande porte",
  todos:   "Todos",
};

/* ── Formulário de edição de dados ──────────────── */
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
    showToast("Dados salvos! ✅", "success");
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
          {(["entrega", "retirada"] as const).map((opt) => {
            const sel = f.preference === opt;
            const Icon = opt === "entrega" ? Home : Store;
            return (
              <button type="button" key={opt}
                onClick={() => set("preference", opt)}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 font-bold text-sm transition-all ${
                  sel ? "border-orange-500 bg-orange-50 text-orange-600" : "border-cream-200 text-navy-600 hover:border-orange-200"
                }`}>
                <Icon size={15} />
                {opt === "entrega" ? "🏠 Entrega" : "🏪 Retirada"}
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

/* ── Avatar — foto ou iniciais ────────────────────── */
function Avatar({
  user, size = 20, className = "",
}: { user: User; size?: number; className?: string }) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`rounded-2xl object-cover ring-4 ring-white shadow-soft-lg ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = user.name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-navy-800 ring-4 ring-white shadow-soft-lg font-display font-bold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.3 }}
    >
      {initials}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export function Perfil() {
  const { user, logout, addPet, updatePet, removePet, updateProfile } = useAuth();
  const { orders }    = useStore();
  const { showToast } = useToast();
  const loyalty       = useLoyalty();

  const [editProfile, setEditProfile] = useState(false);
  const [petModal, setPetModal]       = useState<{ mode: "add" | "edit"; pet?: Pet } | null>(null);
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myOrders = useMemo(
    () =>
      user
        ? orders.filter((o) => o.userId === user.id).sort((a, b) => b.createdAt - a.createdAt)
        : [],
    [orders, user],
  );

  if (!user) return null;

  /* ── Upload de foto ─────────────────────── */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("Imagem muito grande. Use um arquivo menor que 10 MB.", "error");
      return;
    }
    setUploadingAvatar(true);
    try {
      const compressed = await compressImage(file, 320, 0.80);
      updateProfile({ avatar: compressed });
      showToast("Foto atualizada! 📸", "success");
    } catch {
      showToast("Não foi possível processar a imagem.", "error");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAvatar = () => {
    updateProfile({ avatar: undefined });
    showToast("Foto removida.", "info");
  };

  /* ── Salvar pet ─────────────────────────── */
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

        {/* ── Hero ────────────────────────────────────────── */}
        <div className="card overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-orange-500 to-orange-600 relative">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }}
            />
          </div>

          <div className="px-6 pb-5 relative">
            {/* Avatar com botão de câmera */}
            <div className="relative -mt-10 mb-4 inline-block">
              {/* Input oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white shadow-soft-lg"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-navy-800 shadow-soft-lg ring-4 ring-white font-display text-2xl font-bold text-white">
                  {user.name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
                </div>
              )}

              {/* Botão câmera */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white shadow-md hover:bg-orange-600 transition-colors disabled:opacity-60"
                title="Alterar foto"
              >
                {uploadingAvatar
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Camera size={13} />
                }
              </button>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold text-navy-800">{user.name}</h1>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-navy-500">
                  <span className="flex items-center gap-1.5"><Mail size={14} className="text-orange-400" /> {user.email}</span>
                  {user.phone && <span className="flex items-center gap-1.5"><Phone size={14} className="text-orange-400" /> {user.phone}</span>}
                  {user.address.city && (
                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-orange-400" /> {user.address.city}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {user.avatar && (
                  <button
                    onClick={removeAvatar}
                    className="btn-ghost btn-sm text-red-500 border border-red-200 hover:bg-red-50"
                  >
                    Remover foto
                  </button>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="btn-outline btn-sm"
                >
                  <Camera size={14} /> {user.avatar ? "Alterar foto" : "Adicionar foto"}
                </button>
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

          {/* ── Coluna esquerda ───────────────────────── */}
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
                <button onClick={() => setEditProfile(true)} className="text-sm text-orange-500 font-semibold hover:underline">
                  + Adicionar endereço
                </button>
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

            {/* Stats */}
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

            {/* Fidelidade — Patinhas Wazoo */}
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-br from-navy-800 to-navy-900 p-5 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display font-bold">
                    🐾 Patinhas Wazoo
                  </h2>
                  <span className={`badge ${loyalty.tier.color}`}>
                    {loyalty.tier.emoji} {loyalty.tier.name}
                  </span>
                </div>
                <p className="mt-3 font-display text-3xl font-extrabold">
                  {loyalty.balance} <span className="text-lg font-bold text-cream-300">patinhas</span>
                </p>
                <p className="text-sm text-cream-300">
                  = {formatBRL(loyalty.balanceBRL)} em desconto
                </p>
              </div>
              <div className="p-5">
                {loyalty.next ? (
                  <>
                    <div className="mb-1.5 flex justify-between text-xs font-semibold text-navy-500">
                      <span>Nível {loyalty.tier.name}</span>
                      <span>{loyalty.next.emoji} {loyalty.next.name}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-cream-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all"
                        style={{ width: `${loyalty.progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-navy-500">
                      Faltam <strong className="text-navy-700">{Math.max(0, loyalty.next.min - loyalty.lifetime)}</strong> patinhas
                      para o nível {loyalty.next.name} — {loyalty.next.perk.toLowerCase()}.
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-navy-600">
                    🎉 Você chegou ao nível máximo! Aproveite todos os benefícios.
                  </p>
                )}
                <p className="mt-3 rounded-xl bg-cream-50 px-3 py-2 text-xs text-navy-500">
                  Ganhe <strong>1 patinha</strong> a cada R$ 1 em compras. Use as patinhas como desconto no checkout.
                </p>
              </div>
            </div>
          </div>

          {/* ── Coluna direita ────────────────────────── */}
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
                  <button onClick={() => setPetModal({ mode: "add" })} className="btn-primary btn-sm mt-4">
                    <Plus size={14} /> Cadastrar pet
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {user.pets.map((pet) => {
                    const Icon = pet.type === "gato" ? Cat : Dog;
                    const petColor = pet.type === "gato" ? "bg-purple-100 text-purple-600" : "bg-orange-100 text-orange-600";
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
                          {pet.age    && <span className="badge-soft text-xs">{pet.age}</span>}
                          {pet.weight && <span className="badge-soft text-xs">{pet.weight}</span>}
                        </div>
                        {pet.notes && <p className="mt-2 text-xs text-navy-500 italic">{pet.notes}</p>}
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
                          {order.items.length} {order.items.length === 1 ? "item" : "itens"} · {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-orange-600">{formatBRL(order.total)}</span>
                        <span className={`badge text-xs ${statusStyle[order.status]}`}>{order.status}</span>
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

      <Modal open={!!petModal} onClose={() => setPetModal(null)} title={petModal?.mode === "edit" ? "Editar pet" : "Cadastrar pet"}>
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
          <button onClick={() => setPetToDelete(null)} className="btn-ghost flex-1 border border-cream-200">Cancelar</button>
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
