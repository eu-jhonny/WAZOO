import { useEffect, useState } from "react";

/**
 * useState que persiste automaticamente no localStorage.
 * Carrinho, login e dados da loja continuam salvos ao recarregar a página.
 */
export function usePersistentState<T>(key: string, initial: T | (() => T)) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw) as T;
    } catch {
      /* ignora JSON inválido */
    }
    return typeof initial === "function" ? (initial as () => T)() : initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* armazenamento indisponível — segue sem persistir */
    }
  }, [key, state]);

  return [state, setState] as const;
}
