import { useMemo, useState } from "react";
import { Users, CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useData, type StatusGeral } from "@/data/DataContext";
import { AppLayout } from "@/components/AppLayout";
import { KpiCard } from "@/components/KpiCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";

const STATUS_COLORS: Record<string, string> = {
  "Concluído": "#22c55e",
  "Atrasado": "#ef4444",
  "Em andamento": "#3b82f6",
  "Revisão": "#f97316",
  "Pendente": "#eab308",
};

export default function Dashboard() {
  const { summaries, allResponsaveis, allStatuses } = useData();
  const [filterResp, setFilterResp] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCliente, setFilterCliente] = useState("");

  const filtered = useMemo(() => {
    return summaries.filter(c => {
      if (filterResp && c.responsavel !== filterResp) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      if (filterCliente && !c.cliente.toLowerCase().includes(filterCliente.toLowerCase())) return false;
      return true;
    });
  }, [summaries, filterResp, filterStatus, filterCliente]);

  const totalClientes = filtered.length;
  const entregues = filtered.filter(c => c.status === "Concluído").length;
  const atrasados = filtered.filter(c => c.status === "Atrasado").length;
  const pendentes = filtered.filter(c => c.status !== "Concluído" && c.status !== "Atrasado").length;
  const avgProgress = totalClientes > 0 ? Math.round(filtered.reduce((s, c) => s + c.progresso, 0) / totalClientes) : 0;

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const respData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(c => { counts[c.responsavel] = (counts[c.responsavel] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const deliveryData = useMemo(() => {
    return filtered.map(c => ({
      name: c.cliente.length > 15 ? c.cliente.substring(0, 15) + "…" : c.cliente,
      contratado: c.totalItems,
      entregue: c.totalEntregues,
    }));
  }, [filtered]);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral das entregas e contratos</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={filterCliente}
            onChange={e => setFilterCliente(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-52"
          />
          <select value={filterResp} onChange={e => setFilterResp(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Todos os responsáveis</option>
            {allResponsaveis.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Todos os status</option>
            {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KpiCard title="Clientes" value={totalClientes} icon={Users} color="text-primary" bgColor="bg-primary/10" delay={0} />
          <KpiCard title="Entregues" value={entregues} icon={CheckCircle2} color="text-status-delivered" bgColor="bg-status-delivered-bg" delay={80} />
          <KpiCard title="Pendentes" value={pendentes} icon={Clock} color="text-status-pending" bgColor="bg-status-pending-bg" delay={160} />
          <KpiCard title="Atrasados" value={atrasados} icon={AlertTriangle} color="text-status-late" bgColor="bg-status-late-bg" delay={240} />
          <KpiCard title="Progresso Médio" value={`${avgProgress}%`} icon={TrendingUp} color="text-primary" bgColor="bg-primary/10" delay={320} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Distribuição de Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {statusData.map(entry => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(value: number, name: string) => [`${value} clientes`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {statusData.map(s => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.name] }} />
                  {s.name} ({s.value})
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Clientes por Responsável</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={respData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} name="Clientes" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Contratado vs Entregue</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deliveryData} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="contratado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Contratado" />
                <Bar dataKey="entregue" fill="#22c55e" radius={[4, 4, 0, 0]} name="Entregue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-sm font-semibold text-card-foreground">Visão Geral dos Clientes</h3>
          </div>
          <div className="divide-y divide-border">
            {filtered.map(c => (
              <div key={c.cliente} className={`flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors ${c.status === "Atrasado" ? "bg-status-late-bg/30" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-card-foreground truncate">{c.cliente}</p>
                  <p className="text-xs text-muted-foreground">{c.responsavel}</p>
                </div>
                <div className="w-40 hidden sm:block">
                  <ProgressBar value={c.progresso} />
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhum cliente encontrado com os filtros aplicados.</div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
