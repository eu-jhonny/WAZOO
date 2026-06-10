import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { site } from "@/config/site";

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const result = login(email, password);
    if (result.ok) {
      showToast("Login realizado com sucesso! 🐾", "success");
      onSuccess?.();
    } else {
      setError(result.error ?? "Não foi possível entrar.");
      showToast(result.error ?? "E-mail ou senha inválidos.", "error");
    }
  };

  const fillDemo = () => {
    setEmail(site.demoClient.email);
    setPassword(site.demoClient.password);
    setError("");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <div>
        <label className="label" htmlFor="login-email">E-mail</label>
        <input
          id="login-email"
          type="email"
          required
          className="input"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="login-password">Senha</label>
        <input
          id="login-password"
          type="password"
          required
          className="input"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button type="submit" className="btn-primary w-full">
        <LogIn size={18} /> Entrar
      </button>

      <div className="rounded-2xl bg-cream-100 p-3 text-center text-xs text-navy-500">
        <p>
          Conta de teste: <strong>{site.demoClient.email}</strong> · senha{" "}
          <strong>{site.demoClient.password}</strong>
        </p>
        <button type="button" onClick={fillDemo} className="mt-1 link-underline">
          Preencher automaticamente
        </button>
      </div>

      <p className="text-center text-sm text-navy-500">
        Ainda não tem conta?{" "}
        <Link to="/cadastro" className="link-underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
