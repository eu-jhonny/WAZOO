import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Package,
  PackageX,
  Plus,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatBRL, formatDate } from "@/lib/format";
import { statusStyle } from "@/lib/orderStatus";

const WAITING = ["Solicitação enviada", "Verificando disponibilidade"];

interface StatProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  trend?: string;
}

function Stat({ label, value, icon: Icon, color, bg, trend }: StatProps) {
  return (
    <div className="card p-5 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy-500">{label}</p>
        <p className={`mt-1.5 font-display text-2xl font-bold ${color}`}>{value}</p>
        {trend && (
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-green-600">
            <TrendingUp size={12} /> {trend}
          </p>
        )}
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon size={22} className={color} />
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { orders, products, reviews } = useStore();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const waiting  = orders.filter((o) => WAITING.includes(o.status)).length;
    const finished = orders.filter((o) => o.status === "Finalizado").length;
    const estimated = orders
      .filter((o) => o.status !== "Cancelado")
      .reduce((s, o) => s + o.total, 0);
    return {
      total: orders.length,
      waiting,
      active:   products.filter((p) => p.active).length,
      inactive: products.filter((p) => !p.active).length,
      finished,
      estimated,
      pendingReviews: reviews.filter((r) => !r.approved).length,
    };
  }, [orders, products, reviews]);

  const recent = useMemo(
    () => [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8),
    [orders]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-800">Dashboard</h1>
          <p className="mt-0.5 text-sm text-navy-500">Visão geral da Wazoo Pet Express</p>
        </div>
        <Link to="/admin/produtos" className="btn-primary btn-sm">
          <Plus size={15} /> Novo produto
        </Link>
      </div>

      {/* Alerta avaliações pendentes */}
      {stats.pendingReviews > 0 && (
        <Link
          to="/admin/avaliacoes"
          className="flex items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 transition-colors hover:bg-orange-100"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-orange-700">
            <Star size={16} className="text-orange-500" />
            {stats.pendingReviews} avaliação{stats.pendingReviews !== 1 ? "ões" : ""} aguardando aprovação
          </span>
          <ArrowRight size={16} className="text-orange-500" />
        </Link>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat
          label="Receita estimada"
          value={formatBRL(stats.estimated)}
          icon={Wallet}
          color="text-green-600"
          bg="bg-green-100"
          trend="Total em pedidos ativos"
        />
        <Stat
          label="Total de pedidos"
          value={stats.total}
          icon={ClipboardList}
          color="text-navy-700"
          bg="bg-navy-100"
        />
        <Stat
          label="Aguardando"
          value={stats.waiting}
          icon={Clock}
          color="text-orange-600"
          bg="bg-orange-100"
          trend={stats.waiting > 0 ? "Requer atenção" : undefined}
        />
        <Stat
          label="Produtos ativos"
          value={stats.active}
          icon={Package}
          color="text-brand-teal"
          bg="bg-cyan-100"
        />
        <Stat
          label="Produtos inativos"
          value={stats.inactive}
          icon={PackageX}
          color="text-navy-500"
          bg="bg-cream-100"
        />
        <Stat
          label="Pedidos finalizados"
          value={stats.finished}
          icon={CheckCircle2}
          color="text-green-600"
          bg="bg-green-100"
        />
      </div>

      {/* Pedidos recentes */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-cream-100 px-5 py-4">
          <h2 className="font-display font-bold text-navy-800">Pedidos recentes</h2>
          <Link to="/admin/pedidos" className="flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700">
            Ver todos <ArrowUpRight size={15} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <ClipboardList size={32} className="text-navy-300" />
            <p className="font-semibold text-navy-500">Nenhum pedido ainda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-100 bg-cream-50 text-left">
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-navy-500">Pedido</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-navy-500">Cliente</th>
                  <th className="hidden px-5 py-3 text-xs font-bold uppercase tracking-wide text-navy-500 sm:table-cell">Data</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-navy-500">Total</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-navy-500">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {recent.map((order) => (
                  <tr
                    key={order.id}
                    className="group cursor-pointer transition-colors hover:bg-cream-50"
                    onClick={() => navigate("/admin/pedidos")}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-navy-700">
                      {order.id.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-navy-700">
                      {order.customerName}
                    </td>
                    <td className="hidden px-5 py-3.5 text-navy-500 sm:table-cell">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-orange-600">
                      {formatBRL(order.total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${statusStyle[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <ArrowRight size={15} className="text-navy-300 opacity-0 transition-opacity group-hover:opacity-100" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
