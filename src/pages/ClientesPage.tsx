import { useMemo, useState } from "react";
import { useData } from "@/data/DataContext";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";

export default function ClientesPage() {
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

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Detalhamento completo dos contratos e entregas</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <input type="text" placeholder="Buscar cliente..." value={filterCliente} onChange={e => setFilterCliente(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-52" />
          <select value={filterResp} onChange={e => setFilterResp(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Todos os responsáveis</option>
            {allResponsaveis.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Todos os status</option>
            {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Cliente</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Responsável</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Itens</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground w-48">Progresso</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Vencimento</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(c => (
                  <tr key={c.cliente} className={`hover:bg-accent/50 transition-colors ${c.status === "Atrasado" ? "bg-status-late-bg/30" : ""}`}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-card-foreground">{c.cliente}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.items.map((item, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{item.tipo}: {item.quantidade}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{c.responsavel}</td>
                    <td className="px-5 py-4"><span className="font-semibold text-card-foreground">{c.totalEntregues}</span><span className="text-muted-foreground"> / {c.totalItems}</span></td>
                    <td className="px-5 py-4"><ProgressBar value={c.progresso} /></td>
                    <td className="px-5 py-4 text-muted-foreground text-xs">{c.vencimentoContrato ? new Date(c.vencimentoContrato + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</div>}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
