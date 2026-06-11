import { supabase } from "./supabase";
import type { Address, Fulfillment, Pet } from "@/types";

/**
 * Sincronização do perfil do cliente na nuvem (Supabase), de forma segura.
 *
 * O app NUNCA acessa a tabela direto: usa funções RPC `SECURITY DEFINER`
 * (wazoo_register / wazoo_login / wazoo_save) que verificam o "segredo"
 * (senha do cliente, ou o googleId no login com Google) no servidor.
 * Assim o perfil segue o cliente em qualquer aparelho, sem expor dados.
 *
 * Todas as funções degradam em silêncio se a nuvem não estiver ativa.
 */
export interface CloudProfileData {
  name?: string;
  phone?: string;
  avatar?: string;
  googleId?: string;
  address?: Address;
  preference?: Fulfillment;
  pets?: Pet[];
  createdAt?: number;
}

const norm = (email: string) => email.trim().toLowerCase();

/** Cria o perfil na nuvem. `exists` indica e-mail já cadastrado. */
export async function cloudRegister(
  email: string,
  secret: string,
  data: CloudProfileData,
): Promise<{ ok: boolean; exists?: boolean }> {
  if (!supabase) return { ok: false };
  const { error } = await supabase.rpc("wazoo_register", {
    p_email: norm(email),
    p_secret: secret,
    p_data: data,
  });
  if (error) {
    if ((error.message || "").includes("EMAIL_EXISTS")) return { ok: false, exists: true };
    return { ok: false };
  }
  return { ok: true };
}

/** Retorna o perfil se o segredo conferir; senão null. */
export async function cloudLogin(
  email: string,
  secret: string,
): Promise<CloudProfileData | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("wazoo_login", {
    p_email: norm(email),
    p_secret: secret,
  });
  if (error || !data) return null;
  return data as CloudProfileData;
}

/** Salva (upsert) o perfil; só atualiza se o segredo conferir. */
export async function cloudSave(
  email: string,
  secret: string,
  data: CloudProfileData,
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.rpc("wazoo_save", {
    p_email: norm(email),
    p_secret: secret,
    p_data: data,
  });
  return !error;
}
