import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Home, Store, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { Fulfillment } from "@/types";

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const { register } = useAuth();
  const { showToast } = useToast();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    street: "",
    neighborhood: "",
    city: "",
    preference: "entrega" as Fulfillment,
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const result = register({
      name: form.name,
      phone: form.phone,
      email: form.email,
      password: form.password,
      address: {
        street: form.street,
        neighborhood: form.neighborhood,
        city: form.city,
      },
      preference: form.preference,
    });
    if (result.ok) {
      showToast("Cadastro realizado com sucesso! 🎉", "success");
      onSuccess?.();
    } else {
      setError(result.error ?? "Não foi possível concluir o cadastro.");
      showToast(result.error ?? "Erro no cadastro.", "error");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <div>
        <label className="label" htmlFor="reg-name">Nome completo</label>
        <input id="reg-name" required className="input" placeholder="Seu nome"
          value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="reg-phone">Telefone / WhatsApp</label>
          <input id="reg-phone" required className="input" placeholder="(11) 99999-9999"
            value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="reg-email">E-mail</label>
          <input id="reg-email" type="email" required className="input" placeholder="voce@email.com"
            value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="reg-password">Senha</label>
        <input id="reg-password" type="password" required minLength={4} className="input" placeholder="Crie uma senha"
          value={form.password} onChange={(e) => set("password", e.target.value)} />
      </div>

      <div>
        <label className="label" htmlFor="reg-street">Endereço</label>
        <input id="reg-street" required className="input" placeholder="Rua, número e complemento"
          value={form.street} onChange={(e) => set("street", e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="reg-neighborhood">Bairro</label>
          <input id="reg-neighborhood" required className="input" placeholder="Seu bairro"
            value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="reg-city">Cidade</label>
          <input id="reg-city" required className="input" placeholder="Sua cidade"
            value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
      </div>

      <div>
        <span className="label">Preferência de recebimento</span>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: "entrega", label: "Entrega", icon: Home, desc: "Receber em casa" },
            { value: "retirada", label: "Retirada", icon: Store, desc: "Buscar no local" },
          ] as const).map((opt) => {
            const Icon = opt.icon;
            const selected = form.preference === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => set("preference", opt.value)}
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition-all ${
                  selected
                    ? "border-orange-500 bg-orange-50"
                    : "border-cream-200 hover:border-orange-300"
                }`}
              >
                <Icon size={22} className={selected ? "text-orange-500" : "text-navy-400"} />
                <span className="text-sm font-bold text-navy-700">{opt.label}</span>
                <span className="text-xs text-navy-400">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button type="submit" className="btn-primary w-full">
        <UserPlus size={18} /> Criar minha conta
      </button>

      <p className="text-center text-sm text-navy-500">
        Já tem conta?{" "}
        <Link to="/login" className="link-underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
