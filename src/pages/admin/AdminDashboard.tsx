import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, Bell, CheckCircle2, ClipboardList,
  Clock, Package, PackageX, Plus, ShoppingBag, Star, TrendingUp,
  Wallet, AlertTriangle, Users, BarChart3,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatBRL, formatDate } from "@/lib/format";
import { statusStyle } from "@/lib/orderStatus";
import { SalesReport } from "@/components/admin/SalesReport";

const WAITING   = ["Solicitação enviada", "Verificando disponibilidade"];
const STATUS_ICON: Record<string, string> = {
  "Solicitação enviada":         "🕐",
  "Verificando disponibilidade": "🔍",
  "Confirmado pelo fornecedor":  "✅",
  "Em preparação":               "📦",
  "Pronto para retirada":        "🏪",
  "Em rota de entrega":          "🚚",
  "Finalizado":                  "🎉",
  "Cancelado":                   "❌",
};

interface StatProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  trend?: string;
  link?: string;
}

function Stat({ label, value, icon: Icon, color, bg, border, trend, link }: StatProps) {
  const inner = (
    <div className={`card group relative overflow-hidden border-l-4 ${border} p-5 flex items-start justify-between gap-4 transition-all hover:shadow-md`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-navy-400">{label}</p>
        <p className={`mt-2 font-display text-3xl font-bold ${color}`}>{value}</p>
        {trend && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-navy-400">
            <TrendingUp size={11} className="text-green-500" /> {trend}
          </p>
        )}
      </div>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg}`}>
        <Icon size={22} className={color} />
      </div>
    </div>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
}

/* ── Mini gráfico de barras ─────────────────────────── */
function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 truncate text-xs font-semibold text-navy-600">{label}</span>
      <div className="flex-1 rounded-full bg-cream-100 h-2">
        <div className={`h-2 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-xs font-bold text-navy-700">{value}</span>
    </div>
  );
}

export function AdminDashboard() {
  const { orders, products, reviews } = useStore();
  const navigate = useNavigate();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  const stats = useMemo(() => {
    const waiting   = orders.filter((o) => WAITING.includes(o.status)).length;
    const finished  = orders.filter((o) => o.status === "Finalizado").length;
    const cancelled = orders.filter((o) => o.status === "Cancelado").length;
    const estimated = orders
      .filter((o) => o.status !== "Cancelado")
      .reduce((s, o) => s + o.total, 0);
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayOrders = orders.filter((o) => o.createdAt >= todayStart.getTime()).length;
    const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});
    return {
      total: orders.length,
      waiting,
      active:   products.filter((p) => p.active).length,
      inactive: products.filter((p) => !p.active).length,
      finished,
      cancelled,
      estimated,
      pendingReviews: reviews.filter((r) => !r.approved).length,
      todayOrders,
      statusCounts,
    };
  }, [orders, products, reviews]);

  const recent = useMemo(
    () => [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8),
    [orders]
  );

  const topStatusEntries = Object.entries(stats.statusCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxStatusCount = topStatusEntries[0]?.[1] ?? 1;

  const STATUS_COLORS: Record<string, string> = {
    "Solicitação enviada":         "bg-slate-400",
    "Verificando disponibilidade": "bg-amber-400",
    "Confirmado pelo fornecedor":  "bg-blue-400",
    "Em preparação":               "bg-indigo-400",
    "Pronto para retirada":        "bg-teal-400",
    "Em rota de entrega":          "bg-cyan-400",
    "Finalizado":                  "bg-green-500",
    "Cancelado":                   "bg-red-400",
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-navy-400">{greeting} 👋</p>
          <h1 className="font-display text-2xl font-bold text-navy-800">Dashboard</h1>
          <p className="mt-0.5 text-sm text-navy-500">
            {stats.todayOrders > 0
              ? `🔥 ${stats.todayOrders} pedido${stats.todayOrders !== 1 ? "s" : ""} hoje`
              : "Nenhum pedido hoje ainda"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/pedidos" className="btn-ghost btn-sm border border-cream-200">
            <ClipboardList size={15} /> Pedidos
          </Link>
          <Link to="/admin/produtos" className="btn-primary btn-sm">
            <Plus size={15} /> Novo produto
          </Link>
        </div>
      </div>

      {/* Alertas */}
      <div className="space-y-2">
        {stats.waiting > 0 && (
          <Link to="/admin/pedidos" className="flex items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 transition-colors hover:bg-orange-100">
            <span className="flex items-center gap-2 text-sm font-bold text-orange-700">
              <AlertTriangle size={16} className="text-orange-500" />
              {stats.waiting} pedido{stats.waiting !== 1 ? "s" : ""} aguardando confirmação
            </span>
            <ArrowRight size={15} className="text-orange-500" />
          </Link>
        )}
        {stats.pendingReviews > 0 && (
          <Link to="/admin/avaliacoes" className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 transition-colors hover:bg-amber-100">
            <span className="flex items-center gap-2 text-sm font-bold text-amber-700">
              <Star size={16} className="text-amber-500" />
              {stats.pendingReviews} avaliação{stats.pendingReviews !== 1 ? "ões" : ""} para aprovar
            </span>
            <ArrowRight size={15} className="text-amber-500" />
          </Link>
        )}
        {stats.inactive > 0 && (
          <Link to="/admin/produtos" className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <PackageX size={16} className="text-slate-400" />
              {stats.inactive} produto{stats.inactive !== 1 ? "s" : ""} inativo{stats.inactive !== 1 ? "s" : ""}
            </span>
            <ArrowRight size={15} className="text-slate-400" />
          </Link>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Receita estimada"   value={formatBRL(stats.estimated)} icon={Wallet}       color="text-green-600"  bg="bg-green-100"   border="border-green-500"  trend="Pedidos não cancelados" link="/admin/pedidos" />
        <Stat label="Total de pedidos"   value={stats.total}                 icon={ClipboardList} color="text-navy-700"  bg="bg-navy-100"    border="border-navy-400"   link="/admin/pedidos" />
        <Stat label="Aguardando ação"    value={stats.waiting}               icon={Clock}         color="text-orange-600" bg="bg-orange-100" border="border-orange-500" trend={stats.waiting > 0 ? "Precisa de atenção!" : "Tudo em dia ✓"} link="/admin/pedidos" />
        <Stat label="Produtos no ar"     value={stats.active}                icon={Package}       color="text-teal-600"  bg="bg-teal-100"    border="border-teal-400"   link="/admin/produtos" />
        <Stat label="Finalizados"        value={stats.finished}              icon={CheckCircle2}  color="text-green-600"  bg="bg-green-100"  border="border-green-400"  link="/admin/pedidos" />
        <Stat label="Cancelados"         value={stats.cancelled}             icon={PackageX}      color="text-red-500"    bg="bg-red-100"    border="border-red-400"    link="/admin/pedidos" />
      </div>

      {/* Relatório de vendas */}
      <SalesReport orders={orders} />

      {/* Grid inferior: Pedidos recentes + Status breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Pedidos recentes — 2/3 */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between border-b border-cream-100 bg-navy-800 px-5 py-4">
            <h2 className="font-display font-bold text-white flex items-center gap-2">
              <Bell size={16} className="text-orange-400" /> Pedidos recentes
            </h2>
            <Link to="/admin/pedidos" className="flex items-center gap-1 text-sm font-bold text-orange-400 hover:text-orange-300">
              Ver todos <ArrowUpRight size={15} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <ShoppingBag size={32} className="text-navy-300" />
              <p className="font-semibold text-navy-500">Nenhum pedido ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-100 bg-cream-50 text-left">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-navy-400">Pedido</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-navy-400">Cliente</th>
                    <th className="hidden px-4 py-3 text-xs font-bold uppercase tracking-wide text-navy-400 sm:table-cell">Data</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-navy-400">Total</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-navy-400">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-50">
                  {recent.map((order) => (
                    <tr
                      key={order.id}
                      className="group cursor-pointer transition-colors hover:bg-orange-50"
                      onClick={() => navigate("/admin/pedidos")}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-bold text-navy-600">
                        <span className="mr-1">{STATUS_ICON[order.status] ?? "📋"}</span>
                        #{order.id.slice(0, 6)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-navy-700 max-w-[120px] truncate">
                        {order.customerName}
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-navy-400 sm:table-cell">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-bold text-green-600">
                        {formatBRL(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${statusStyle[order.status]}`}>
                          {order.status.split(" ")[0]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ArrowRight size={14} className="text-orange-300 opacity-0 transition-opacity group-hover:opacity-100" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status breakdown + ações rápidas — 1/3 */}
        <div className="space-y-4">

          {/* Distribuição de status */}
          <div className="card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-display font-bold text-navy-800 text-sm">
              <BarChart3 size={16} className="text-orange-500" /> Pedidos por status
            </h3>
            {topStatusEntries.length === 0 ? (
              <p className="text-sm text-navy-400">Sem pedidos ainda</p>
            ) : (
              <div className="space-y-3">
                {topStatusEntries.map(([status, count]) => (
                  <MiniBar
                    key={status}
                    label={status}
                    value={count}
                    max={maxStatusCount}
                    color={STATUS_COLORS[status] ?? "bg-navy-400"}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Ações rápidas */}
          <div className="card p-5">
            <h3 className="mb-3 font-display font-bold text-navy-800 text-sm">⚡ Ações rápidas</h3>
            <div className="space-y-2">
              <Link to="/admin/produtos" className="flex items-center gap-3 rounded-xl border border-cream-200 px-3 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700">
                <Plus size={15} className="text-orange-500" /> Adicionar produto
              </Link>
              <Link to="/admin/pedidos" className="flex items-center gap-3 rounded-xl border border-cream-200 px-3 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700">
                <ClipboardList size={15} className="text-orange-500" /> Ver todos os pedidos
              </Link>
              <Link to="/admin/avaliacoes" className="flex items-center gap-3 rounded-xl border border-cream-200 px-3 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700">
                <Star size={15} className="text-orange-500" /> Gerenciar avaliações
              </Link>
              <Link to="/admin/configuracoes" className="flex items-center gap-3 rounded-xl border border-cream-200 px-3 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700">
                <Users size={15} className="text-orange-500" /> Configurações
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
