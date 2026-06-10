/** Formata um número como moeda brasileira (R$). */
export const formatBRL = (value: number): string =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

/** Gera um slug a partir de um texto (remove acentos). */
export const slugify = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Data legível em pt-BR. */
export const formatDate = (timestamp: number): string =>
  new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

/** Data + hora legível em pt-BR. */
export const formatDateTime = (timestamp: number): string =>
  new Date(timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Identificador único curto e simples. */
export const uid = (prefix = ""): string =>
  prefix +
  Math.random().toString(36).slice(2, 9) +
  Date.now().toString(36).slice(-4);
