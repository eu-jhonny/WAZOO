import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

function formatPhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{4})$/, "$1-$2");
}

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const { register } = useAuth();
  const { showToast } = useToast();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        name: form.name.trim(),
        phone: form.phone,
        email: form.email.trim(),
        password: form.password,
        preference: "entrega",
      });

      if (result.ok) {
        showToast("Conta criada com sucesso! 🎉", "success");
        onSuccess?.();
      } else {
        const message = result.error ?? "Não foi possível concluir o cadastro.";
        setError(message);
        showToast(message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <div>
        <label className="label" htmlFor="reg-name">Nome completo</label>
        <input
          id="reg-name"
          required
          autoComplete="name"
          className="input"
          placeholder="Seu nome"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="reg-phone">Telefone / WhatsApp</label>
          <input
            id="reg-phone"
            required
            inputMode="tel"
            autoComplete="tel"
            className="input"
            placeholder="(11) 99999-9999"
            value={form.phone}
            onChange={(e) => set("phone", formatPhone(e.target.value))}
          />
        </div>
        <div>
          <label className="label" htmlFor="reg-email">E-mail</label>
          <input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            className="input"
            placeholder="voce@email.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="reg-password">Senha</label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              className="input pr-11"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="reg-password-confirm">Confirmar senha</label>
          <input
            id="reg-password-confirm"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            className="input"
            placeholder="Repita sua senha"
            value={form.passwordConfirm}
            onChange={(e) => set("passwordConfirm", e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-2xl bg-cream-50 p-3 text-xs text-navy-500">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-teal-600" />
        <span>
          Seu endereço não é obrigatório no cadastro. Você pode informar ou salvar durante a primeira compra.
        </span>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
        <UserPlus size={18} /> {loading ? "Criando conta..." : "Criar minha conta"}
      </button>

      <p className="text-center text-sm text-navy-500">
        Já tem conta?{" "}
        <Link to="/login" className="link-underline">Entrar</Link>
      </p>
    </form>
  );
}
