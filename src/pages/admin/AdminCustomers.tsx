import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  Search,
  ShoppingBag,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { formatBRL, formatDate } from "@/lib/format";
import {
  listApiCustomersAdmin,
  setApiCustomerActive,
  type ApiAdminCustomer,
} from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/ui/Modal";

export function AdminCustomers() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<ApiAdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ApiAdminCustomer | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listApiCustomersAdmin({ limit: 200 })
      .then(({ data }) => {
        if (active) setCustomers(data);
      })
      .catch((error) => {
        showToast(error instanceof Error ? error.message : "Não foi possível carregar os clientes.", "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone]
        .some((value) => value?.toLowerCase().includes(q)),
    );
  }, [customers, search]);

  const summary = useMemo(() => {
    const now = new Date();
    const thisMonth = customers.filter((customer) => {
      const created = new Date(customer.createdAt);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    return {
      total: customers.length,
      thisMonth,
      buyers: customers.filter((customer) => customer._count.orders > 0).length,
      revenue: customers.reduce((sum, customer) => sum + customer.totalSpent, 0),
    };
  }, [customers]);

  async function toggleActive(customer: ApiAdminCustomer) {
    try {
      const result = await setApiCustomerActive(customer.id, !customer.active);
      setCustomers((prev) =>
        prev.map((item) => item.id === customer.id ? { ...item, active: result.active } : item),
      );
      setSelected((prev) => prev?.id === customer.id ? { ...prev, active: result.active } : prev);
      showToast(result.active ? "Cliente reativado." : "Cliente desativado.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível atualizar o cliente.", "error");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-800 sm:text-3xl">Clientes</h1>
          <p className="mt-1 text-sm text-navy-500">
            Contas, compras e relacionamento com quem compra na Wazoo.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Clientes", value: summary.total, icon: Users, tone: "text-navy-700 bg-navy-50" },
          { label: "Novos no mês", value: summary.thisMonth, icon: UserRound, tone: "text-orange-600 bg-orange-50" },
          { label: "Já compraram", value: summary.buyers, icon: ShoppingBag, tone: "text-teal-600 bg-teal-50" },
          { label: "Receita paga", value: formatBRL(summary.revenue), icon: Wallet, tone: "text-green-600 bg-green-50" },
        ].map((item) => (
          <div key={item.label} className="card p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}>
              <item.icon size={19} />
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-navy-400">{item.label}</p>
            <p className="mt-1 font-display text-xl font-bold text-navy-800">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="card mt-5 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300" />
          <input
            className="input pl-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone..."
          />
        </div>
      </div>

      {loading ? (
        <div className="card mt-5 flex items-center justify-center gap-2 py-16 text-navy-500">
          <Loader2 size={19} className="animate-spin text-orange-500" /> Carregando clientes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card mt-5 py-16 text-center text-navy-500">
          Nenhum cliente encontrado.
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-cream-50 text-left">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-navy-400">Cliente</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-navy-400">Pedidos</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-navy-400">Pets</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-navy-400">Total pago</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-navy-400">Cadastro</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-navy-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    className="cursor-pointer transition-colors hover:bg-orange-50/60"
                    onClick={() => setSelected(customer)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-navy-800">{customer.name}</p>
                      <p className="text-xs text-navy-400">{customer.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-navy-700">{customer._count.orders}</td>
                    <td className="px-4 py-3 font-semibold text-navy-700">{customer._count.pets}</td>
                    <td className="px-4 py-3 font-bold text-green-600">{formatBRL(customer.totalSpent)}</td>
                    <td className="px-4 py-3 text-navy-500">{formatDate(new Date(customer.createdAt).getTime())}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${customer.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {customer.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Cliente"}
        size="lg"
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-cream-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-navy-700"><Mail size={15} /> E-mail</p>
                <p className="mt-1 text-sm text-navy-500">{selected.email}</p>
              </div>
              <div className="rounded-2xl bg-cream-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-navy-700"><Phone size={15} /> Telefone</p>
                <p className="mt-1 text-sm text-navy-500">{selected.phone || "Não informado"}</p>
              </div>
            </div>

            {selected.addresses.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-display font-bold text-navy-800">
                  <MapPin size={16} className="text-orange-500" /> Endereços
                </h3>
                <div className="mt-2 space-y-2">
                  {selected.addresses.map((address) => (
                    <div key={address.id} className="rounded-xl border border-cream-200 p-3 text-sm text-navy-600">
                      <strong>{address.label}{address.isDefault ? " · principal" : ""}</strong>
                      <p>{address.street}, {address.number} · {address.neighborhood}</p>
                      <p>{address.city}/{address.state} · CEP {address.zip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="flex items-center gap-2 font-display font-bold text-navy-800">
                <PawPrint size={16} className="text-teal-600" /> Pets
              </h3>
              {selected.pets.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.pets.map((pet) => (
                    <span key={pet.id} className="badge-soft">
                      {pet.name} · {pet.type === "gato" ? "Gato" : "Cão"}{pet.breed ? ` · ${pet.breed}` : ""}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-navy-400">Nenhum pet cadastrado.</p>
              )}
            </div>

            <div>
              <h3 className="font-display font-bold text-navy-800">Compras recentes</h3>
              <div className="mt-2 space-y-2">
                {selected.orders.length ? selected.orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-xl bg-cream-50 px-3 py-2.5 text-sm">
                    <span>
                      <strong className="font-mono text-navy-700">{order.number}</strong>
                      <span className="ml-2 text-navy-400">{formatDate(new Date(order.createdAt).getTime())}</span>
                    </span>
                    <span className="font-bold text-green-600">{formatBRL(order.total)}</span>
                  </div>
                )) : (
                  <p className="text-sm text-navy-400">Nenhuma compra ainda.</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleActive(selected)}
              className={selected.active ? "btn-outline w-full border-red-200 text-red-600 hover:bg-red-50" : "btn-primary w-full"}
            >
              {selected.active ? "Desativar cliente" : "Reativar cliente"}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
