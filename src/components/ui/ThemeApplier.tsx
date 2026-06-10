import { useEffect } from "react";
import { getAdminDisplayConfig } from "@/lib/adminConfig";

/**
 * Aplica o atributo data-accent no <html> baseado na cor escolhida pelo admin.
 * Escuta "storage" (outra aba) e o evento customizado "wazoo:config-updated"
 * (mesma aba, disparado pelo AdminSettings ao salvar).
 */
export function ThemeApplier() {
  useEffect(() => {
    const apply = () => {
      const cfg = getAdminDisplayConfig();
      document.documentElement.setAttribute(
        "data-accent",
        cfg.accentColor || "orange",
      );
    };

    apply(); // aplica imediatamente no mount

    window.addEventListener("wazoo:config-updated", apply);
    window.addEventListener("storage", apply); // mudança em outra aba
    return () => {
      window.removeEventListener("wazoo:config-updated", apply);
      window.removeEventListener("storage", apply);
    };
  }, []);

  return null; // componente sem UI
}
