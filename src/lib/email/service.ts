/**
 * ============================================================
 *  Wazoo Pet Express — Serviço de envio de e-mails
 * ============================================================
 *
 * Camada agnóstica de provedor. Estratégia de entrega, em ordem:
 *
 *   1. EmailJS (client-side, sem backend) — se as variáveis
 *      VITE_EMAILJS_* estiverem configuradas. Envia o HTML de verdade.
 *   2. Endpoint próprio (backend) — se VITE_EMAIL_API_URL estiver setada.
 *   3. Fallback: enfileira na "caixa de saída" (localStorage) e registra
 *      no histórico, sem quebrar o app. Útil em demo/local.
 *
 * TODO e-mail — enviado, enfileirado ou de teste — vai para o histórico
 * (`wazoo:email:log`), que alimenta a central de e-mails do admin.
 *
 * Nada aqui lança exceção para o fluxo do app: enviar e-mail é sempre
 * "melhor esforço" e nunca deve travar um cadastro ou checkout.
 */
import { getAdminDisplayConfig } from "@/lib/adminConfig";
import { STORAGE_KEYS, site } from "@/config/site";
import { uid } from "@/lib/format";
import { DEFAULT_BRAND, type EmailBrand, type EmailContent } from "./templates";

/* ── Tipos ──────────────────────────────────────────────────── */
export type EmailKind =
  | "welcome"
  | "order_confirmation"
  | "order_status"
  | "payment_confirmed"
  | "review_request"
  | "abandoned_cart"
  | "newsletter_welcome"
  | "password_changed"
  | "promo"
  | "test";

export type EmailStatus = "sent" | "queued" | "failed";

export interface EmailRecord {
  id: string;
  kind: EmailKind;
  to: string;
  toName?: string;
  subject: string;
  preheader: string;
  html: string;
  text: string;
  status: EmailStatus;
  provider: "emailjs" | "api" | "outbox";
  error?: string;
  createdAt: number;
}

export const EMAIL_LOG_KEY = "wazoo:email:log:v1";
const LOG_LIMIT = 200;

/* ── Configuração do provedor (env) ─────────────────────────── */
const ENV = import.meta.env as Record<string, string | undefined>;

const EMAILJS = {
  serviceId: ENV.VITE_EMAILJS_SERVICE_ID,
  templateId: ENV.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: ENV.VITE_EMAILJS_PUBLIC_KEY,
};
const EMAIL_API_URL = ENV.VITE_EMAIL_API_URL;

export function emailProviderStatus(): {
  active: boolean;
  provider: "emailjs" | "api" | "outbox";
  label: string;
} {
  if (EMAILJS.serviceId && EMAILJS.templateId && EMAILJS.publicKey) {
    return { active: true, provider: "emailjs", label: "EmailJS (envio real)" };
  }
  if (EMAIL_API_URL) {
    return { active: true, provider: "api", label: "API própria (envio real)" };
  }
  return {
    active: false,
    provider: "outbox",
    label: "Modo demonstração (caixa de saída local)",
  };
}

/* ── Marca do e-mail (deriva das configs da loja) ───────────── */
const ACCENTS: Record<string, { accent: string; dark: string }> = {
  orange: { accent: "#F97316", dark: "#EA580C" },
  teal: { accent: "#06B6D4", dark: "#0891B2" },
  purple: { accent: "#8B5CF6", dark: "#7C3AED" },
  green: { accent: "#22C55E", dark: "#16A34A" },
  pink: { accent: "#EC4899", dark: "#DB2777" },
};

/** Monta a marca do e-mail a partir das configurações salvas. */
export function getEmailBrand(): EmailBrand {
  let storeName = DEFAULT_BRAND.storeName;
  let whatsapp = DEFAULT_BRAND.whatsapp;
  let instagram = DEFAULT_BRAND.instagram;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (raw) {
      const s = JSON.parse(raw);
      if (s.storeName) storeName = s.storeName;
      if (s.whatsapp) whatsapp = s.whatsapp;
      if (s.instagram) instagram = s.instagram;
    }
  } catch {
    /* usa defaults */
  }

  const accentName = getAdminDisplayConfig().accentColor || "orange";
  const a = ACCENTS[accentName] ?? ACCENTS.orange;

  const siteUrl =
    (typeof window !== "undefined" && window.location?.origin) ||
    DEFAULT_BRAND.siteUrl;

  return {
    storeName,
    accent: a.accent,
    accentDark: a.dark,
    siteUrl,
    whatsapp: whatsapp || DEFAULT_BRAND.whatsapp,
    instagram: instagram || DEFAULT_BRAND.instagram,
    supportEmail: site.email || DEFAULT_BRAND.supportEmail,
    address: DEFAULT_BRAND.address,
    // Logo remoto é opcional. Por padrão o cabeçalho usa "🐾 Nome da loja",
    // que renderiza em qualquer cliente sem depender de imagem hospedada.
    logoUrl: undefined,
  };
}

/* ── Histórico (localStorage) ───────────────────────────────── */
export function readEmailLog(): EmailRecord[] {
  try {
    const raw = localStorage.getItem(EMAIL_LOG_KEY);
    if (raw) return JSON.parse(raw) as EmailRecord[];
  } catch {
    /* vazio */
  }
  return [];
}

function pushLog(rec: EmailRecord) {
  const log = readEmailLog();
  log.unshift(rec);
  const trimmed = log.slice(0, LOG_LIMIT);
  try {
    localStorage.setItem(EMAIL_LOG_KEY, JSON.stringify(trimmed));
  } catch {
    /* storage cheio — ignora */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wazoo:email-sent", { detail: rec }));
  }
}

export function clearEmailLog() {
  try {
    localStorage.removeItem(EMAIL_LOG_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wazoo:email-sent"));
  }
}

/* ── Envio por provedor ─────────────────────────────────────── */
async function sendViaEmailJS(to: string, toName: string, c: EmailContent): Promise<void> {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS.serviceId,
      template_id: EMAILJS.templateId,
      user_id: EMAILJS.publicKey,
      template_params: {
        to_email: to,
        to_name: toName,
        subject: c.subject,
        html: c.html,
        text: c.text,
        preheader: c.preheader,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`EmailJS ${res.status}: ${await res.text().catch(() => "")}`);
  }
}

async function sendViaApi(to: string, toName: string, c: EmailContent): Promise<void> {
  const res = await fetch(EMAIL_API_URL as string, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, toName, ...c }),
  });
  if (!res.ok) {
    throw new Error(`Email API ${res.status}: ${await res.text().catch(() => "")}`);
  }
}

/* ── API pública de envio ───────────────────────────────────── */
export interface SendArgs {
  kind: EmailKind;
  to?: string;
  toName?: string;
  content: EmailContent;
}

/**
 * Envia (ou enfileira) um e-mail. Nunca lança — sempre registra no log
 * e devolve o registro resultante.
 */
export async function sendEmail(args: SendArgs): Promise<EmailRecord> {
  const { kind, content } = args;
  const to = (args.to || "").trim();
  const toName = args.toName;
  const status = emailProviderStatus();

  const base: Omit<EmailRecord, "status" | "provider" | "error"> = {
    id: uid("mail-"),
    kind,
    to,
    toName,
    subject: content.subject,
    preheader: content.preheader,
    html: content.html,
    text: content.text,
    createdAt: Date.now(),
  };

  // Sem destinatário válido → só registra como enfileirado.
  if (!to || !/.+@.+\..+/.test(to)) {
    const rec: EmailRecord = { ...base, status: "queued", provider: "outbox", error: to ? "E-mail inválido" : "Sem destinatário" };
    pushLog(rec);
    return rec;
  }

  // Provedor real configurado → tenta enviar.
  if (status.active) {
    try {
      if (status.provider === "emailjs") await sendViaEmailJS(to, toName || "", content);
      else await sendViaApi(to, toName || "", content);
      const rec: EmailRecord = { ...base, status: "sent", provider: status.provider };
      pushLog(rec);
      return rec;
    } catch (e) {
      const rec: EmailRecord = {
        ...base,
        status: "failed",
        provider: status.provider,
        error: e instanceof Error ? e.message : String(e),
      };
      pushLog(rec);
      return rec;
    }
  }

  // Modo demo → enfileira localmente (aparece na central do admin).
  const rec: EmailRecord = { ...base, status: "queued", provider: "outbox" };
  pushLog(rec);
  return rec;
}
