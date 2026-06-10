import { useCallback, useEffect, useState } from "react";

/**
 * useState que persiste no localStorage.
 *
 * IMPORTANTE: salva **sincronamente** dentro do setter (não só no useEffect)
 * para garantir que o dado esteja gravado mesmo que o usuário navegue
 * imediatamente após chamar o setter.
 */
export function usePersistentState<T>(key: string, initial: T | (() => T)) {
  const [state, setStateRaw] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw) as T;
    } catch {
      /* JSON inválido — usa valor inicial */
    }
    return typeof initial === "function" ? (initial as () => T)() : initial;
  });

  /**
   * Setter com gravação síncrona: resolve qualquer corrida entre
   * navegação/unmount e o useEffect assíncrono.
   */
  const setState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStateRaw((prev) => {
        const next =
          typeof value === "function" ? (value as (p: T) => T)(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* armazenamento indisponível */
        }
        return next;
      });
    },
    [key],
  );

  /* Backup: grava também no efeito (cobre casos edge de hidratação) */
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* armazenamento indisponível */
    }
  }, [key, state]);

  return [state, setState] as const;
}
