import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, LogIn, Loader2, KeyRound, ArrowLeft } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

/* ── Ícones ──────────────────────────── */
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
    <svg viewBox="0 0 814 1000" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden>
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.3-165-39.3c-76.5 0-103.7 40.8-165.9 40.8s-105.5-57.8-155.3-127.1C43 375.2 32.4 222.4 84.5 130.7c36.5-63.1 101.2-103.2 173.3-103.2 65.2 0 107.5 43.2 163.5 43.2 54.4 0 87.8-43.2 165.9-43.2 68.1 0 128.9 35.2 166.5 90.9zm-87.9-188.2c-36.3 43.5-98 76.3-155.5 76.3-7.1 0-14.3-.6-21.5-1.9-1.1-7.7-1.5-15.5-1.5-22.6 0-60.6 31.7-120 83.9-158.2 26.2-19.7 68.1-36.5 104.6-37.5 1.1 8.3 1.5 16.6 1.5 24.2 0 59.5-29.1 119.5-11.5 119.7z"/>
    </svg>
  );
}

/* ══════════════════════════════════════════════
   BOTÃO GOOGLE REAL
   ══════════════════════════════════════════════ */
function GoogleLoginButton({ onSuccess, onError }: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const { loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!res.ok) throw new Error("Erro ao obter dados do Google.");
        const profile = await res.json();
        const result = loginWithGoogle({
          name: profile.name, email: profile.email,
          picture: profile.picture, googleId: profile.sub,
        });
        if (result.ok) {
          showToast(`Bem-vindo, ${profile.name.split(" ")[0]}! 🐾`, "success");
          onSuccess();
        } else {
          onError(result.error ?? "Erro ao entrar com Google.");
        }
      } catch (err: any) {
        onError(err.message ?? "Erro ao conectar com o Google.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => onError("Login com Google cancelado."),
  });

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      disabled={loading}
      className="flex items-center justify-center gap-2 rounded-xl border-2 border-cream-200 px-3 py-2.5 font-bold text-navy-700 transition-all hover:border-orange-300 hover:bg-orange-50 disabled:opacity-60"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <GoogleIcon />}
      <span className="hidden text-xs sm:inline">Google</span>
    </button>
  );
}

/* ══════════════════════════════════════════════
   MODAL: RECUPERAR SENHA
   ══════════════════════════════════════════════ */
type ResetStep = "email" | "newpass" | "done";

function ForgotPasswordFlow({ onClose }: { onClose: () => void }) {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const [step, setStep]     = useState<ResetStep>("email");
  const [email, setEmail]   = useState("");
  const [pwd1, setPwd1]     = useState("");
  const [pwd2, setPwd2]     = useState("");
  const [show, setShow]     = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const submitEmail = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 400));
    // Verifica se existe — resetPassword já testa isso, mas queremos avançar o step
    const test = resetPassword(email, "___TEST___");
    setLoading(false);
    if (test.ok || test.error?.includes("6 caracteres")) {
      setStep("newpass");
    } else {
      setError(test.error ?? "E-mail não encontrado.");
    }
  };

  const submitNewPass = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (pwd1.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (pwd1 !== pwd2)   { setError("As senhas não conferem."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = resetPassword(email, pwd1);
    setLoading(false);
    if (result.ok) {
      setStep("done");
    } else {
      setError(result.error ?? "Não foi possível alterar a senha.");
    }
  };

  return (
    <div className="space-y-4">
      {step === "email" && (
        <form onSubmit={submitEmail} className="space-y-4">
          <p className="text-sm text-navy-500">
            Digite o e-mail da sua conta. Se encontrarmos uma conta, você poderá criar uma nova senha.
          </p>
          {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">{error}</p>}
          <div>
            <label className="label">E-mail da conta</label>
            <input
              type="email" required autoFocus
              className="input"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 border border-cream-200">
              <ArrowLeft size={14} /> Voltar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <Loader2 size={15} className="animate-spin" /> : "Continuar →"}
            </button>
          </div>
        </form>
      )}

      {step === "newpass" && (
        <form onSubmit={submitNewPass} className="space-y-4">
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            ✅ Conta encontrada para <strong>{email}</strong>. Crie sua nova senha:
          </div>
          {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">{error}</p>}
          <div>
            <label className="label">Nova senha</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                required minLength={6}
                className="input pr-10"
                placeholder="Mínimo 6 caracteres"
                value={pwd1}
                onChange={(e) => { setPwd1(e.target.value); setError(""); }}
              />
              <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirmar nova senha</label>
            <input
              type={show ? "text" : "password"}
              required
              className={`input ${pwd2 && pwd1 !== pwd2 ? "border-red-400" : ""}`}
              placeholder="Repetir a senha"
              value={pwd2}
              onChange={(e) => { setPwd2(e.target.value); setError(""); }}
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep("email")} className="btn-ghost flex-1 border border-cream-200">
              <ArrowLeft size={14} /> Voltar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <><KeyRound size={14} /> Salvar senha</>}
            </button>
          </div>
        </form>
      )}

      {step === "done" && (
        <div className="space-y-4 text-center">
          <div className="text-5xl">🎉</div>
          <p className="font-display text-lg font-bold text-navy-800">Senha alterada!</p>
          <p className="text-sm text-navy-500">Agora você pode entrar com a nova senha.</p>
          <button onClick={onClose} className="btn-primary w-full" autoFocus>
            <LogIn size={16} /> Fazer login
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   FORMULÁRIO PRINCIPAL
   ══════════════════════════════════════════════ */
export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email,    setEmail]        = useState("");
  const [password, setPassword]     = useState("");
  const [showPwd,  setShowPwd]      = useState(false);
  const [error,    setError]        = useState("");
  const [loading,  setLoading]      = useState(false);
  const [showReset, setShowReset]   = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    await new Promise((r) => setTimeout(r, 300));
    const result = login(email, password);
    if (result.ok) {
      showToast("Bem-vindo de volta! 🐾", "success");
      onSuccess?.();
    } else {
      setError(result.error ?? "E-mail ou senha inválidos.");
    }
    setLoading(false);
  };

  const handleSocialSoon = (p: string) => showToast(`Login com ${p} em breve! 🐾`, "info");
  const handleGoogleError = (msg: string) => { setError(msg); };

  /* Modal de recuperação */
  if (showReset) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-orange-500" />
          <h3 className="font-display font-bold text-navy-800">Recuperar senha</h3>
        </div>
        <ForgotPasswordFlow onClose={() => setShowReset(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Social */}
      <div className="grid grid-cols-3 gap-2">
        {GOOGLE_CLIENT_ID ? (
          <GoogleLoginButton onSuccess={() => onSuccess?.()} onError={handleGoogleError} />
        ) : (
          <button type="button" onClick={() => handleSocialSoon("Google")}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-cream-200 px-3 py-2.5 font-bold text-navy-700 transition-all hover:border-orange-300 hover:bg-orange-50">
            <GoogleIcon /><span className="hidden text-xs sm:inline">Google</span>
          </button>
        )}
        <button type="button" onClick={() => handleSocialSoon("Facebook")}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-cream-200 px-3 py-2.5 font-bold text-navy-700 transition-all hover:border-blue-300 hover:bg-blue-50">
          <MetaIcon /><span className="hidden text-xs sm:inline">Facebook</span>
        </button>
        <button type="button" onClick={() => handleSocialSoon("Apple")}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-cream-200 px-3 py-2.5 font-bold text-navy-700 transition-all hover:border-gray-300 hover:bg-gray-50">
          <AppleIcon /><span className="hidden text-xs sm:inline">Apple</span>
        </button>
      </div>

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-cream-200" />
        <span className="text-xs font-semibold text-navy-400">ou entre com e-mail</span>
        <div className="h-px flex-1 bg-cream-200" />
      </div>

      {/* Form */}
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <span className="text-base leading-none">⚠️</span>
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label className="label" htmlFor="login-email">E-mail</label>
          <input id="login-email" type="email" required autoComplete="email"
            className="input" placeholder="voce@email.com"
            value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0" htmlFor="login-password">Senha</label>
            <button type="button"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
              onClick={() => setShowReset(true)}>
              Esqueci minha senha
            </button>
          </div>
          <div className="relative">
            <input id="login-password" type={showPwd ? "text" : "password"}
              required autoComplete="current-password"
              className="input pr-11" placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }} />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700"
              tabIndex={-1}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-70">
          {loading
            ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Entrando…</span>
            : <><LogIn size={18} /> Entrar</>}
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
