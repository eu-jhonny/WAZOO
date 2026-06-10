/**
 * Lê / notifica mudanças nas configurações do painel admin.
 * Usado por ThemeApplier, Header, Home e AdminSettings.
 */

export const ADMIN_CFG_KEY = "wazoo:admin_config:v1";

export interface AdminDisplayConfig {
  accentColor: string;
  showCopa:    boolean;
  showFesta:   boolean;
  showBanner:  boolean;
}

const DEFAULTS: AdminDisplayConfig = {
  accentColor: "orange",
  showCopa:    true,
  showFesta:   true,
  showBanner:  true,
};

/** Lê o config do localStorage de forma síncrona (sem React). */
export function getAdminDisplayConfig(): AdminDisplayConfig {
  try {
    const raw = localStorage.getItem(ADMIN_CFG_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* JSON inválido */ }
  return { ...DEFAULTS };
}
