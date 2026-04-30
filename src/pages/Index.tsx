import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, CheckCircle2, Clock, AlertTriangle, TrendingUp, Loader2, Eye, Snowflake, X, Video } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useData, type StatusGeral } from "@/data/DataContext";
import { useRecordings } from "@/data/RecordingContext";
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

type KpiFilter = "all" | "Concluído" | "Atrasado" | "Em andamento" | "Revisão" | "Pendente" | "Congelado";

export default function Dashboard() {
  const navigate = useNavigate();
  const { summaries, allResponsaveis, allStatuses } = useData();
  const { recordings, clientSettings, getProductionStats } = useRecordings();
  const [filterResp, setFilterResp] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCliente, setFilterCliente] = useState("");
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>("all");

  // Lista base sem congelados (a menos que o usuário escolha ver congelados)
  const baseList = useMemo(() => {
    return summaries.filter(c => {
      if (kpiFilter === "Congelado") return c.congelado;
      return !c.congelado;
    });
  }, [summaries, kpiFilter]);

  const filtered = useMemo(() => {
    return baseList.filter(c => {
      if (filterResp && c.responsavel !== filterResp) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      if (filterCliente && !c.cliente.toLowerCase().includes(filterCliente.toLowerCase())) return false;
      if (kpiFilter !== "all" && kpiFilter !== "Congelado" && c.status !== kpiFilter) return false;
      return true;
    });
  }, [baseList, filterResp, filterStatus, filterCliente, kpiFilter]);

  // KPIs sempre baseados no conjunto não-congelado (independente do kpiFilter)
  const kpiBase = useMemo(() => summaries.filter(c => !c.congelado), [summaries]);
  const totalClientes = kpiBase.length;
  const entregues = kpiBase.filter(c => c.status === "Concluído").length;
  const atrasados = kpiBase.filter(c => c.status === "Atrasado").length;
  const emAndamento = kpiBase.filter(c => c.status === "Em andamento").length;
  const emRevisao = kpiBase.filter(c => c.status === "Revisão").length;
  const pendentes = kpiBase.filter(c => c.status === "Pendente").length;
  const congelados = useMemo(() => summaries.filter(c => c.congelado).length, [summaries]);
  const avgProgress = filtered.length > 0 ? Math.round(filtered.reduce((s, c) => s + c.progresso, 0) / filtered.length) : 0;
  
  // Recording KPIs
  const recordingsToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return recordings.filter(r => r.date === today).length;
  }, [recordings]);

  const productionPending = useMemo(() => {
    return summaries.filter(s => !s.congelado && !getProductionStats(s.cliente).isFinished).length;
  }, [summaries, getProductionStats]);

  const noContentClients = useMemo(() => {
    return Object.values(clientSettings).filter(s => s.status === "Sem conteúdo").length;
  }, [clientSettings]);

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

  const handleKpiClick = (target: KpiFilter) => {
    setKpiFilter(prev => (prev === target ? "all" : target));
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Visão geral das entregas e contratos</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={filterCliente}
            onChange={e => setFilterCliente(e.target.value)}
            className="px-3 py-2.5 min-h-[44px] text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-52"
          />
          <select value={filterResp} onChange={e => setFilterResp(e.target.value)} className="px-3 py-2.5 min-h-[44px] text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-auto">
            <option value="">Todos os responsáveis</option>
            {allResponsaveis.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 min-h-[44px] text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-auto">
            <option value="">Todos os status</option>
            {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {kpiFilter !== "all" && (
            <button
              onClick={() => setKpiFilter("all")}
              className="px-3 py-2.5 min-h-[44px] text-sm rounded-lg border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Filtro: {kpiFilter}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <ClickableKpi active={kpiFilter === "all"} onClick={() => handleKpiClick("all")}>
            <KpiCard title="Clientes" value={totalClientes} icon={Users} color="text-primary" bgColor="bg-primary/10" delay={0} />
          </ClickableKpi>
          <ClickableKpi active={kpiFilter === "Concluído"} onClick={() => handleKpiClick("Concluído")}>
            <KpiCard title="Entregues" value={entregues} icon={CheckCircle2} color="text-status-delivered" bgColor="bg-status-delivered-bg" delay={60} />
          </ClickableKpi>
          <ClickableKpi active={kpiFilter === "Em andamento"} onClick={() => handleKpiClick("Em andamento")}>
            <KpiCard title="Em andamento" value={emAndamento} icon={Loader2} color="text-status-inprogress" bgColor="bg-status-inprogress-bg" delay={120} />
          </ClickableKpi>
          <ClickableKpi active={kpiFilter === "Revisão"} onClick={() => handleKpiClick("Revisão")}>
            <KpiCard title="Em revisão" value={emRevisao} icon={Eye} color="text-status-review" bgColor="bg-status-review-bg" delay={180} />
          </ClickableKpi>
          <ClickableKpi active={kpiFilter === "Pendente"} onClick={() => handleKpiClick("Pendente")}>
            <KpiCard title="Pendentes" value={pendentes} icon={Clock} color="text-status-pending" bgColor="bg-status-pending-bg" delay={240} />
          </ClickableKpi>
          <ClickableKpi active={kpiFilter === "Atrasado"} onClick={() => handleKpiClick("Atrasado")}>
            <KpiCard title="Atrasados" value={atrasados} icon={AlertTriangle} color="text-status-late" bgColor="bg-status-late-bg" delay={300} />
          </ClickableKpi>
          <ClickableKpi active={kpiFilter === "Congelado"} onClick={() => handleKpiClick("Congelado")}>
            <KpiCard title="Congelados" value={congelados} icon={Snowflake} color="text-blue-400" bgColor="bg-blue-400/10" delay={360} />
          </ClickableKpi>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-card rounded-xl p-4 sm:p-5 border border-border shadow-sm">
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

          <div className="bg-card rounded-xl p-4 sm:p-5 border border-border shadow-sm">
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

          <div className="bg-card rounded-xl p-4 sm:p-5 border border-border shadow-sm">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Contratado vs Entregue</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart 
                data={deliveryData} 
                margin={{ left: -10, right: 10 }}
                onClick={(data: any) => {
                  if (data && data.activeTooltipIndex !== undefined) {
                    const clientName = filtered[data.activeTooltipIndex].cliente;
                    navigate(`/clientes?cliente=${encodeURIComponent(clientName)}`);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
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
          <div className="p-5 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-card-foreground">
              Visão Geral dos Clientes
              {kpiFilter !== "all" && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">— filtrado por {kpiFilter}</span>
              )}
            </h3>
            <span className="text-xs text-muted-foreground">{filtered.length} cliente(s) · Progresso médio {avgProgress}%</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map(c => (
              <div 
                key={c.cliente} 
                className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 hover:bg-accent/50 transition-colors cursor-pointer ${c.status === "Atrasado" ? "bg-status-late-bg/30" : ""} ${c.congelado ? "opacity-70" : ""}`}
                onClick={() => navigate(`/clientes?cliente=${encodeURIComponent(c.cliente)}`)}
              >
                <div className="flex items-center justify-between gap-3 sm:flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-card-foreground truncate flex items-center gap-2">
                      {c.congelado && <Snowflake className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                      {c.cliente}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{c.responsavel}</p>
                  </div>
                  <div className="sm:hidden flex-shrink-0">
                    <StatusBadge status={c.status} />
                  </div>
                </div>
                <div className="w-full sm:w-40">
                  <ProgressBar value={c.progresso} />
                </div>
                <div className="hidden sm:block">
                  <StatusBadge status={c.status} />
                </div>
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

function ClickableKpi({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl transition-all hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "ring-2 ring-primary shadow-md" : ""}`}
    >
      {children}
    </button>
  );
}
