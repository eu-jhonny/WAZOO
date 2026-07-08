import { useMemo } from "react";
import { TrendingUp, TrendingDown, Receipt, Trophy, CalendarDays } from "lucide-react";
import type { Order } from "@/types";
import { formatBRL } from "@/lib/format";

const DAY = 24 * 60 * 60 * 1000;

/** Relatório de vendas para o dashboard do admin. */
export function SalesReport({ orders }: { orders: Order[] }) {
  const valid = useMemo(() => orders.filter((o) => o.status !== "Cancelado"), [orders]);

  /* Faturamento por dia (últimos 14 dias). */
  const daily = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = today.getTime() - 13 * DAY;
    const buckets: { label: string; day: string; total: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(start + i * DAY);
      buckets.push({
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        day: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        total: 0,
      });
    }
    valid.forEach((o) => {
      const idx = Math.floor((o.createdAt - start) / DAY);
      if (idx >= 0 && idx < 14) buckets[idx].total += o.total;
    });
    return buckets;
  }, [valid]);

  const maxDaily = Math.max(1, ...daily.map((d) => d.total));

  /* Semana atual vs anterior. */
  const { thisWeek, lastWeek, change } = useMemo(() => {
    const now = Date.now();
    const t = valid.filter((o) => o.createdAt >= now - 7 * DAY).reduce((s, o) => s + o.total, 0);
    const l = valid.filter((o) => o.createdAt >= now - 14 * DAY && o.createdAt < now - 7 * DAY).reduce((s, o) => s + o.total, 0);
    const c = l > 0 ? Math.round(((t - l) / l) * 100) : t > 0 ? 100 : 0;
    return { thisWeek: t, lastWeek: l, change: c };
  }, [valid]);

  const avgTicket = valid.length ? valid.reduce((s, o) => s + o.total, 0) / valid.length : 0;

  /* Produtos mais vendidos (por quantidade). */
  const topProducts = useMemo(() => {
    const map = new Map<string, { qty: number; revenue: number }>();
    valid.forEach((o) =>
      o.items.forEach((it) => {
        const cur = map.get(it.name) ?? { qty: 0, revenue: 0 };
        cur.qty += it.quantity;
        cur.revenue += it.price * it.quantity;
        map.set(it.name, cur);
      }),
    );
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [valid]);
  const maxQty = Math.max(1, ...topProducts.map((p) => p.qty));

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-cream-100 bg-navy-800 px-5 py-4">
        <h2 className="flex items-center gap-2 font-display font-bold text-white">
          <TrendingUp size={16} className="text-orange-400" /> Relatório de vendas
        </h2>
        <span className="text-xs font-semibold text-slate-300">Últimos 14 dias</span>
      </div>

      <div className="p-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="rounded-2xl bg-cream-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-navy-400">
              <CalendarDays size={13} /> 7 dias
            </p>
            <p className="mt-1 font-display text-xl font-bold text-navy-800">{formatBRL(thisWeek)}</p>
            <p className={`mt-0.5 flex items-center gap-1 text-xs font-semibold ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
              {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {change >= 0 ? "+" : ""}{change}% vs semana anterior
            </p>
          </div>
          <div className="rounded-2xl bg-cream-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-navy-400">
              <Receipt size={13} /> Ticket médio
            </p>
            <p className="mt-1 font-display text-xl font-bold text-navy-800">{formatBRL(avgTicket)}</p>
            <p className="mt-0.5 text-xs text-navy-400">{valid.length} pedidos válidos</p>
          </div>
          <div className="col-span-2 rounded-2xl bg-cream-50 p-4 lg:col-span-1">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-navy-400">
              <TrendingUp size={13} /> Semana anterior
            </p>
            <p className="mt-1 font-display text-xl font-bold text-navy-800">{formatBRL(lastWeek)}</p>
            <p className="mt-0.5 text-xs text-navy-400">para comparação</p>
          </div>
        </div>

        {/* Gráfico de barras diário */}
        <div className="mt-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-navy-400">Faturamento por dia</p>
          <div className="flex h-40 items-end gap-1.5">
            {daily.map((d, i) => {
              const h = Math.round((d.total / maxDaily) * 100);
              return (
                <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-orange-500 to-orange-400 transition-all duration-500 group-hover:from-orange-600 group-hover:to-orange-500"
                      style={{ height: `${Math.max(2, h)}%` }}
                      title={`${d.label}: ${formatBRL(d.total)}`}
                    />
                    {d.total > 0 && (
                      <span className="pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-navy-800 px-1.5 py-0.5 text-[10px] font-bold text-white group-hover:block">
                        {formatBRL(d.total)}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-semibold text-navy-400">{d.label.slice(0, 5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top produtos */}
        <div className="mt-6">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-navy-400">
            <Trophy size={13} className="text-amber-500" /> Produtos mais vendidos
          </p>
          {topProducts.length === 0 ? (
            <p className="text-sm text-navy-400">Sem vendas registradas ainda.</p>
          ) : (
            <div className="space-y-2.5">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-cream-100 text-navy-500"}`}>
                    {i + 1}
                  </span>
                  <span className="w-40 shrink-0 truncate text-sm font-semibold text-navy-700">{p.name}</span>
                  <div className="h-2 flex-1 rounded-full bg-cream-100">
                    <div className="h-2 rounded-full bg-teal-400 transition-all duration-500" style={{ width: `${Math.round((p.qty / maxQty) * 100)}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs font-bold text-navy-700">{p.qty}×</span>
                  <span className="hidden w-20 text-right text-xs font-semibold text-green-600 sm:block">{formatBRL(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
