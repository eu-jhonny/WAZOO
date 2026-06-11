import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase opcional.
 *
 * Só é criado se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estiverem
 * configuradas. Sem elas, `isCloudEnabled` é false e o app funciona
 * 100% no localStorage (modo offline / por dispositivo), como antes.
 *
 * Quando ativado, é usado apenas para sincronizar o PERFIL do cliente
 * entre aparelhos (ver lib/cloudProfile.ts).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isCloudEnabled = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isCloudEnabled
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
