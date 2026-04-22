import { useEffect, useMemo, useState } from "react";
import { Users, CheckCircle2, Clock, AlertTriangle, TrendingUp, ArrowUpDown, Play } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useData, type StatusGeral } from "@/data/DataContext";
import { AppLayout } from "@/components/AppLayout";
import { KpiCard } from "@/components/KpiCard";
import { StatusBadge } from "@/components/StatusBadge";
import PresentationMode from "@/components/PresentationMode";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  "Concluído": "#22c55e",
  "Atrasado": "#ef4444",
  "Em andamento": "#3b82f6",
  "Revisão": "#f97316",
  "Pendente": "#eab308",
};

type SortKey = "cliente" | "responsavel" | "tipoConteudo" | "totalContratado" | "entregues" | "status";

export default function ApresentacaoPage() {
  const { summaries, rows } = useData();
  const [isPresentationMode, setIsPresentationMode] = useState(true);
  const [visibleSection, setVisibleSection] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterCliente, setFilterCliente] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("cliente");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Apresentação progressiva: revela uma seção por vez
  useEffect(() => {
    setVisibleSection(0);
    const timers = [
      setTimeout(() => setVisibleSection(1), 200),
      setTimeout(() => setVisibleSection(2), 900),
      setTimeout(() => setVisibleSection(3), 1600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // ---------- Seção 1: Visão Geral ----------
  const totalClientes = summaries.length;
  const totalContratado = summaries.reduce((s, c) => s + c.totalItems, 0);
  const totalEntregues = summaries.reduce((s, c) => s + c.totalEntregues, 0);
  const totalPendentes = totalContratado - totalEntregues;
  const atrasados = summaries.filter(c => c.status === "Atrasado").length;
  const emDia = summaries.filter(c => c.status !== "Atrasado").length;

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    summaries.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [summaries]);

  // ---------- Seção 2: Por Responsável ----------
  const porResponsavel = useMemo(() => {
    const map = new Map<string, { responsavel: string; clientes: Set<string>; contratado: number; entregue: number; pendentes: number; atrasados: number }>();
    summaries.forEach(c => {
      const key = c.responsavel || "Sem responsável";
      if (!map.has(key)) {
        map.set(key, { responsavel: key, clientes: new Set(), contratado: 0, entregue: 0, pendentes: 0, atrasados: 0 });
      }
      const r = map.get(key)!;
      r.clientes.add(c.cliente);
      r.contratado += c.totalItems;
      r.entregue += c.totalEntregues;
      r.pendentes += (c.totalItems - c.totalEntregues);
      if (c.status === "Atrasado") r.atrasados += 1;
    });
    return Array.from(map.values())
      .map(r => ({ ...r, totalClientes: r.clientes.size }))
      .sort((a, b) => b.totalClientes - a.totalClientes);
  }, [summaries]);

  const respChartData = useMemo(() => porResponsavel.map(r => ({
    name: r.responsavel,
    Contratado: r.contratado,
    Entregue: r.entregue,
  })), [porResponsavel]);

  // ---------- Seção 3: Por Cliente ----------
  const clienteRows = useMemo(() => {
    // Agrupa por cliente + tipo (Stories/Reels e demais)
    const grouped = new Map<string, {
      cliente: string;
      responsavel: string;
      tipoConteudo: string;
      totalContratado: number;
      entregues: number;
      previsao: string;
      status: StatusGeral;
    }>();

    rows.forEach(r => {
      const key = `${r.cliente}__${r.tipoConteudo}`;
      const qtd = parseInt(r.quantidadeContratada) || 1;
      const entregue = (r.statusGeral === "Concluído") ? qtd : 0;
      if (!grouped.has(key)) {
        grouped.set(key, {
          cliente: r.cliente,
          responsavel: r.responsavel || "—",
          tipoConteudo: r.tipoConteudo,
          totalContratado: qtd,
          entregues: entregue,
          previsao: r.dataEntregaPrevista || r.prazoFinal || "—",
          status: r.statusGeral,
        });
      } else {
        const g = grouped.get(key)!;
        g.totalContratado += qtd;
        g.entregues += entregue;
      }
    });

    let arr = Array.from(grouped.values());

    if (filterCliente) {
      arr = arr.filter(c => c.cliente.toLowerCase().includes(filterCliente.toLowerCase()));
    }
    if (filterStatus) {
      arr = arr.filter(c => c.status === filterStatus);
    }

    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), "pt-BR") * dir;
    });

    return arr;
  }, [rows, filterCliente, filterStatus, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const formatPrevisao = (s: string) => {
    if (!s || s === "—") return "—";
    try {
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
    } catch { /* ignore */ }
    return s;
  };

  if (isPresentationMode) {
    return <PresentationMode onExit={() => setIsPresentationMode(false)} />;
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 opacity-0 animate-fade-in" style={{ animationDelay: "0ms", animationFillMode: "forwards" }}>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">Apresentação</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Resumo executivo dos contratos e entregas</p>
          </div>
          <Button onClick={() => setIsPresentationMode(true)} className="gap-2 min-h-[44px] w-full sm:w-auto">
            <Play className="w-4 h-4" />
            Iniciar Modo TV
          </Button>
        </div>

        {/* Seção 1 - Visão Geral */}
        {visibleSection >= 1 && (
          <section className="mb-10 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-8 bg-primary rounded-full" />
              <h2 className="text-xl font-serif font-semibold text-foreground">Visão Geral</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
              <KpiCard title="Clientes" value={totalClientes} icon={Users} color="text-primary" bgColor="bg-primary/10" delay={0} />
              <KpiCard title="Contratados" value={totalContratado} icon={TrendingUp} color="text-primary" bgColor="bg-primary/10" delay={80} />
              <KpiCard title="Entregues" value={totalEntregues} icon={CheckCircle2} color="text-status-delivered" bgColor="bg-status-delivered-bg" delay={160} />
              <KpiCard title="Pendentes" value={totalPendentes} icon={Clock} color="text-status-pending" bgColor="bg-status-pending-bg" delay={240} />
              <KpiCard title="Atrasados" value={atrasados} icon={AlertTriangle} color="text-status-late" bgColor="bg-status-late-bg" delay={320} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
                <h3 className="text-sm font-semibold text-card-foreground mb-4">Status Geral</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                      {statusData.map(entry => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
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

              <div className="bg-card rounded-xl p-5 border border-border shadow-sm flex flex-col justify-center">
                <h3 className="text-sm font-semibold text-card-foreground mb-4">Saúde dos Contratos</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-status-delivered-bg/40">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-status-delivered" />
                      <span className="text-sm font-medium text-foreground">Em dia</span>
                    </div>
                    <span className="text-2xl font-bold text-status-delivered">{emDia}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-status-late-bg/40">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-status-late" />
                      <span className="text-sm font-medium text-foreground">Atrasados</span>
                    </div>
                    <span className="text-2xl font-bold text-status-late">{atrasados}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">Taxa de entrega</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      {totalContratado > 0 ? Math.round((totalEntregues / totalContratado) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Seção 2 - Por Responsável */}
        {visibleSection >= 2 && (
          <section className="mb-10 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-8 bg-primary rounded-full" />
              <h2 className="text-xl font-serif font-semibold text-foreground">Por Responsável</h2>
            </div>

            <div className="bg-card rounded-xl p-5 border border-border shadow-sm mb-6">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Contratado vs Entregue</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={respChartData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Contratado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Entregue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {porResponsavel.map((r, idx) => {
                const taxa = r.contratado > 0 ? Math.round((r.entregue / r.contratado) * 100) : 0;
                const hasAlert = r.atrasados > 0 || r.pendentes > 0;
                return (
                  <div
                    key={r.responsavel}
                    className={`rounded-xl p-5 border shadow-sm bg-card opacity-0 animate-fade-in ${
                      r.atrasados > 0 ? "border-status-late/40" : "border-border"
                    }`}
                    style={{ animationDelay: `${idx * 100}ms`, animationFillMode: "forwards" }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-base font-semibold text-card-foreground">{r.responsavel}</h4>
                        <p className="text-xs text-muted-foreground">{r.totalClientes} cliente{r.totalClientes !== 1 ? "s" : ""}</p>
                      </div>
                      {hasAlert ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-late-bg text-status-late">
                          <AlertTriangle className="w-3 h-3" /> {r.atrasados + r.pendentes}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-delivered-bg text-status-delivered">
                          <CheckCircle2 className="w-3 h-3" /> Em dia
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-2 rounded-lg bg-muted/40">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Contratado</p>
                        <p className="text-lg font-bold text-foreground">{r.contratado}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-status-delivered-bg/40">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Entregue</p>
                        <p className="text-lg font-bold text-status-delivered">{r.entregue}</p>
                      </div>
                      <div className={`text-center p-2 rounded-lg ${r.pendentes > 0 ? "bg-status-pending-bg/40" : "bg-muted/40"}`}>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pendentes</p>
                        <p className={`text-lg font-bold ${r.pendentes > 0 ? "text-status-pending" : "text-foreground"}`}>{r.pendentes}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${taxa === 100 ? "bg-status-delivered" : taxa >= 50 ? "bg-status-pending" : "bg-status-late"}`}
                          style={{ width: `${taxa}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground w-10 text-right">{taxa}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Seção 3 - Por Cliente */}
        {visibleSection >= 3 && (
          <section className="mb-10 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-8 bg-primary rounded-full" />
              <h2 className="text-xl font-serif font-semibold text-foreground">Por Cliente</h2>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 mb-4">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={filterCliente}
                onChange={e => setFilterCliente(e.target.value)}
                className="px-3 py-2.5 min-h-[44px] text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-52"
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 min-h-[44px] text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-auto"
              >
                <option value="">Todos os status</option>
                {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr>
                      {([
                        ["cliente", "Cliente"],
                        ["responsavel", "Responsável"],
                        ["tipoConteudo", "Tipo"],
                        ["totalContratado", "Contratado"],
                        ["entregues", "Entregues"],
                      ] as [SortKey, string][]).map(([key, label]) => (
                        <th
                          key={key}
                          onClick={() => toggleSort(key)}
                          className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
                        >
                          <span className="inline-flex items-center gap-1">
                            {label}
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          </span>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Previsão</th>
                      <th
                        onClick={() => toggleSort("status")}
                        className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
                      >
                        <span className="inline-flex items-center gap-1">
                          Status
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {clienteRows.map((c, idx) => {
                      const isAtrasado = c.status === "Atrasado";
                      const isPendente = c.status === "Pendente";
                      return (
                        <tr
                          key={`${c.cliente}-${c.tipoConteudo}-${idx}`}
                          className={`hover:bg-accent/40 transition-colors ${
                            isAtrasado ? "bg-status-late-bg/20" : isPendente ? "bg-status-pending-bg/20" : ""
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-card-foreground">{c.cliente}</td>
                          <td className="px-4 py-3 text-muted-foreground">{c.responsavel}</td>
                          <td className="px-4 py-3 text-muted-foreground">{c.tipoConteudo}</td>
                          <td className="px-4 py-3 text-foreground font-semibold">{c.totalContratado}</td>
                          <td className="px-4 py-3">
                            <span className={c.entregues >= c.totalContratado ? "text-status-delivered font-semibold" : "text-foreground"}>
                              {c.entregues}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{formatPrevisao(c.previsao)}</td>
                          <td className="px-4 py-3"><StatusBadge status={c.status} size="sm" /></td>
                        </tr>
                      );
                    })}
                    {clienteRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          Nenhum cliente encontrado com os filtros aplicados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
