import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { site } from "@/config/site";

export function AdminLogin() {
  const { isAdmin, adminLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isAdmin) return <Navigate to="/admin" replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const result = adminLogin(email, password);
    if (result.ok) {
      showToast("Bem-vindo ao painel do gestor! 🛠️", "success");
      navigate("/admin", { replace: true });
    } else {
      setError(result.error ?? "Credenciais inválidas.");
      showToast(result.error ?? "Credenciais inválidas.", "error");
    }
  };

  const fillDemo = () => {
    setEmail(site.admin.email);
    setPassword(site.admin.password);
    setError("");
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-grad px-4 py-12">
      <div className="absolute inset-0 bg-paw-light opacity-50" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-cream-100/80 hover:text-orange-300">
          <ArrowLeft size={16} /> Voltar ao site
        </Link>

        <div className="card p-7 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-100 text-orange-600">
              <ShieldCheck size={32} />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-navy-700">Área do Gestor</h1>
            <p className="mt-1 text-sm text-navy-500">
              Acesso restrito à administração da loja.
            </p>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {error && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>
            )}
            <div>
              <label className="label" htmlFor="admin-email">E-mail</label>
              <input id="admin-email" type="email" required className="input" placeholder="admin@wazoo.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="admin-password">Senha</label>
              <input id="admin-password" type="password" required className="input" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary w-full">
              <Lock size={18} /> Entrar no painel
            </button>
          </form>

          <div className="mt-5 rounded-2xl bg-cream-100 p-3 text-center text-xs text-navy-500">
            <p>Acesso de teste: <strong>{site.admin.email}</strong> · <strong>{site.admin.password}</strong></p>
            <button onClick={fillDemo} className="mt-1 link-underline">Preencher automaticamente</button>
          </div>
        </div>
      </div>
    </section>
  );
}
