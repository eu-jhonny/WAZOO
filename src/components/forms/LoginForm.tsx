import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

/* ── Ícones SVG de provedores ─────────────────────────────── */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
function MetaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════ */
export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 300)); // micro-delay realista
    const result = login(email, password);
    if (result.ok) {
      showToast("Bem-vindo de volta! 🐾", "success");
      onSuccess?.();
    } else {
      setError(result.error ?? "E-mail ou senha inválidos.");
    }
    setLoading(false);
  };

  const socialLogin = (provider: string) => {
    showToast(`Login com ${provider} em breve! Aguarde as novidades. 🐾`, "info");
  };

  return (
    <div className="space-y-5">
      {/* Social login */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => socialLogin("Google")}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-cream-200 px-3 py-2.5 font-bold text-navy-700 transition-all hover:border-orange-300 hover:bg-orange-50 hover:shadow-sm"
        >
          <GoogleIcon />
          <span className="hidden text-xs sm:inline">Google</span>
        </button>
        <button
          type="button"
          onClick={() => socialLogin("Meta")}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-cream-200 px-3 py-2.5 font-bold text-navy-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
        >
          <MetaIcon />
          <span className="hidden text-xs sm:inline">Facebook</span>
        </button>
        <button
          type="button"
          onClick={() => socialLogin("Apple")}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-cream-200 px-3 py-2.5 font-bold text-navy-700 transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm"
        >
          <AppleIcon />
          <span className="hidden text-xs sm:inline">Apple</span>
        </button>
      </div>

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-cream-200" />
        <span className="text-xs font-semibold text-navy-400">ou entre com e-mail</span>
        <div className="h-px flex-1 bg-cream-200" />
      </div>

      {/* Formulário */}
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <span className="text-base leading-none">⚠️</span>
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label className="label" htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            className="input"
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0" htmlFor="login-password">Senha</label>
            <button
              type="button"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
              onClick={() => showToast("Recuperação de senha em breve!", "info")}
            >
              Esqueci minha senha
            </button>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPwd ? "text" : "password"}
              required
              autoComplete="current-password"
              className="input pr-11"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700"
              tabIndex={-1}
              aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-70"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Entrando…
            </span>
          ) : (
            <><LogIn size={18} /> Entrar</>
          )}
        </button>

        <p className="text-center text-sm text-navy-500">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="font-bold text-orange-600 hover:underline">
            Criar conta grátis →
          </Link>
        </p>
      </form>
    </div>
  );
}
