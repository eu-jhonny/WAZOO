/**
 * Lê / notifica mudanças nas configurações do painel admin.
 * Usado por ThemeApplier, Header, Home e AdminSettings.
 */

export const ADMIN_CFG_KEY = "wazoo:admin_config:v1";

export interface AdminDisplayConfig {
  accentColor:   string;
  showDiaDosPais: boolean;
  showBanner:    boolean;
}

const DEFAULTS: AdminDisplayConfig = {
  accentColor:   "orange",
  showDiaDosPais: true,
  showBanner:    true,
};

/** Lê o config do localStorage de forma síncrona (sem React). */
export function getAdminDisplayConfig(): AdminDisplayConfig {
  try {
    const raw = localStorage.getItem(ADMIN_CFG_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* JSON inválido */ }
  return { ...DEFAULTS };
}

/** Configuração de pagamento definida no admin → aba Pagamento. */
export interface AdminPaymentConfig {
  payPix:      boolean;
  payCard:     boolean;
  payBoleto:   boolean;
  pixDiscount: number; // % de desconto no PIX
  maxInstall:  number; // máximo de parcelas no cartão
  pixChave:    string; // chave PIX do recebedor (gera o QR Code)
}

const PAYMENT_DEFAULTS: AdminPaymentConfig = {
  payPix:      true,
  payCard:     true,
  payBoleto:   true,
  pixDiscount: 5,
  maxInstall:  10,
  pixChave:    "",
};

/** Lê a config de pagamento do admin (mesma chave do config geral). */
export function getAdminPaymentConfig(): AdminPaymentConfig {
  try {
    const raw = localStorage.getItem(ADMIN_CFG_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      return {
        payPix:      obj.payPix      ?? PAYMENT_DEFAULTS.payPix,
        payCard:     obj.payCard     ?? PAYMENT_DEFAULTS.payCard,
        payBoleto:   obj.payBoleto   ?? PAYMENT_DEFAULTS.payBoleto,
        pixDiscount: Number(obj.pixDiscount ?? PAYMENT_DEFAULTS.pixDiscount),
        maxInstall:  Number(obj.maxInstall  ?? PAYMENT_DEFAULTS.maxInstall),
        pixChave:    String(obj.pixChave ?? PAYMENT_DEFAULTS.pixChave),
      };
    }
  } catch { /* JSON inválido */ }
  return { ...PAYMENT_DEFAULTS };
}
