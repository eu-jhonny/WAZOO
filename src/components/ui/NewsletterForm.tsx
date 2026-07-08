import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { emails } from "@/lib/email";

const NL_KEY = "wazoo:newsletter:v1";
const NL_COUPON = "WAZOO10";

/**
 * Formulário de inscrição na newsletter.
 * Ao inscrever, dispara o e-mail de boas-vindas (com cupom) e guarda
 * localmente os e-mails já inscritos para não duplicar.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/.+@.+\..+/.test(value)) return;
    setState("loading");

    // Guarda o inscrito (evita reenvio na mesma origem).
    try {
      const raw = localStorage.getItem(NL_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(value)) {
        list.push(value);
        localStorage.setItem(NL_KEY, JSON.stringify(list));
      }
    } catch {
      /* ignore */
    }

    await emails.newsletterWelcome(value, NL_COUPON);
    setState("done");
  }

  if (state === "done") {
    return (
      <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-5 text-center animate-pop">
        <CheckCircle2 className="mx-auto mb-2 text-green-300" size={28} />
        <p className="font-bold text-white">Inscrição confirmada! 💌</p>
        <p className="mt-1 text-sm text-cream-300">
          Enviamos um e-mail de boas-vindas com o cupom{" "}
          <strong className="text-white">{NL_COUPON}</strong> para você.
        </p>
      </div>
    );
  }

  return (
    <>
      <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={subscribe}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="input flex-1 bg-white/10 border-white/20 text-white placeholder:text-cream-400 focus:border-orange-400"
        />
        <button type="submit" disabled={state === "loading"} className="btn-primary shrink-0 disabled:opacity-60">
          {state === "loading" ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : "Quero receber!"}
        </button>
      </form>
      <p className="mt-2 text-xs text-cream-400">Sem spam. Cancele quando quiser.</p>
    </>
  );
}
