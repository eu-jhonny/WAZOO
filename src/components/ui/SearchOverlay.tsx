import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, ArrowRight, TrendingUp } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatBRL } from "@/lib/format";
import { getCategoryName } from "@/data/categories";
import { ProductImage } from "./ProductImage";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SUGGESTIONS = ["Ração", "Petisco", "Brinquedo", "Caminha", "Shampoo", "Coleira"];

/** Busca instantânea em tela cheia com sugestões enquanto digita. */
export function SearchOverlay({ open, onClose }: Props) {
  const { products } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter((p) => p.active)
      .filter((p) =>
        p.name.toLowerCase().includes(term) ||
        p.shortDescription.toLowerCase().includes(term) ||
        getCategoryName(p.category).toLowerCase().includes(term) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(term)),
      )
      .slice(0, 6);
  }, [q, products]);

  if (!open) return null;

  const goToAll = () => {
    navigate(`/produtos${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
    onClose();
  };
  const pick = (id: string) => { navigate(`/produtos/${id}`); onClose(); };

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 animate-fade-in bg-navy-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="container-app relative pt-20 sm:pt-28">
        <div className="mx-auto max-w-2xl animate-fade-up overflow-hidden rounded-3xl bg-white shadow-soft-lg">
          {/* Campo */}
          <form
            onSubmit={(e) => { e.preventDefault(); if (results[0]) pick(results[0].id); else goToAll(); }}
            className="flex items-center gap-3 border-b border-cream-200 px-5 py-4"
          >
            <Search size={22} className="text-orange-500" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="O que seu pet precisa hoje?"
              className="flex-1 bg-transparent text-lg text-navy-800 placeholder:text-navy-300 focus:outline-none"
            />
            <button type="button" onClick={onClose} className="rounded-full p-1.5 text-navy-400 hover:bg-cream-100" aria-label="Fechar">
              <X size={20} />
            </button>
          </form>

          {/* Corpo */}
          <div className="max-h-[60vh] overflow-y-auto p-3">
            {!q.trim() ? (
              <div className="p-3">
                <p className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-navy-400">
                  <TrendingUp size={13} /> Buscas populares
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => setQ(s)} className="chip">{s}</button>
                  ))}
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-semibold text-navy-600">Nada encontrado para "{q}"</p>
                <button onClick={goToAll} className="btn-outline-orange btn-sm mt-3">Ver todo o catálogo</button>
              </div>
            ) : (
              <>
                {results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => pick(p.id)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-cream-50"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                      <ProductImage src={p.image} alt={p.name} category={p.category} iconSize={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-navy-700">{p.name}</p>
                      <p className="text-xs text-navy-400">{getCategoryName(p.category)}</p>
                    </div>
                    <span className="shrink-0 font-display font-bold text-orange-600">{formatBRL(p.price)}</span>
                  </button>
                ))}
                <button
                  onClick={goToAll}
                  className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-cream-50 px-3 py-3 text-sm font-bold text-orange-600 hover:bg-cream-100"
                >
                  Ver todos os resultados <ArrowRight size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
