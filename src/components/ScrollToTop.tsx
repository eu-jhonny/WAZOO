import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Rola a página para o topo a cada mudança de rota. */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}
