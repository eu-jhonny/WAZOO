import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Package,
  PackageX,
  Plus,
  Star,
  Wallet,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatBRL } from "@/lib/format";
import { StatCard } from "@/components/admin/StatCard";
import { OrderTable } from "@/components/admin/OrderTable";

const WAITING = ["Solicitação enviada", "Verificando disponibilidade"];

export function AdminDashboard() {
  const { orders, products, reviews } = useStore();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const waiting = orders.filter((o) => WAITING.includes(o.status)).length;
    return {
      total: orders.length,
      waiting,
      active: products.filter((p) => p.active).length,
      inactive: products.filter((p) => !p.active).length,
      finished: orders.filter((o) => o.status === "Finalizado").length,
      estimated: orders.filter((o) => o.status !== "Cancelado").reduce((s, o) => s + o.total, 0),
      pendingReviews: reviews.filter((r) => !r.approved).length,
    };
  }, [orders, products, reviews]);

  const recent = useMemo(
    () => [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
    [orders]
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-700">Dashboard</h1>
          <p className="mt-1 text-navy-500">Visão geral da Wazoo Pet Express.</p>
        </div>
        <Link to="/admin/produtos" className="btn-primary btn-sm">
          <Plus size={16} /> Cadastrar produto
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total de pedidos" value={stats.total} icon={ClipboardList} accent="bg-navy-50 text-navy-700" />
        <StatCard label="Aguardando confirmação" value={stats.waiting} icon={Clock} accent="bg-orange-100 text-orange-600" hint="Solicitação enviada ou em verificação" />
        <StatCard label="Valor estimado em pedidos" value={formatBRL(stats.estimated)} icon={Wallet} accent="bg-green-100 text-green-600" />
        <StatCard label="Produtos ativos" value={stats.active} icon={Package} accent="bg-green-100 text-green-600" />
        <StatCard label="Produtos inativos" value={stats.inactive} icon={PackageX} accent="bg-amber-100 text-amber-700" />
        <StatCard label="Pedidos finalizados" value={stats.finished} icon={CheckCircle2} accent="bg-green-100 text-green-600" />
      </div>

      {/* Avaliações pendentes */}
      {stats.pendingReviews > 0 && (
        <Link
          to="/admin/avaliacoes"
          className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 transition-colors hover:bg-orange-100"
        >
          <span className="flex items-center gap-2 font-semibold text-navy-700">
            <Star size={20} className="text-orange-500" />
            {stats.pendingReviews} {stats.pendingReviews === 1 ? "avaliação aguarda" : "avaliações aguardam"} aprovação
          </span>
          <ArrowRight size={18} className="text-orange-500" />
        </Link>
      )}

      {/* Pedidos recentes */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-navy-700">Pedidos recentes</h2>
          <Link to="/admin/pedidos" className="btn-ghost btn-sm">
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-4">
          <OrderTable orders={recent} onView={() => navigate("/admin/pedidos")} />
        </div>
      </div>
    </div>
  );
}
