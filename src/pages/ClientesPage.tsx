import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Calendar, User, Layers, Save } from "lucide-react";
import { useData, type StatusGeral } from "@/data/DataContext";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

function rowAccent(status: StatusGeral) {
  if (status === "Atrasado") return "border-l-status-late bg-status-late-bg/20";
  if (status === "Revisão") return "border-l-status-review bg-status-review-bg/20";
  if (status === "Em andamento") return "border-l-status-inprogress bg-status-inprogress-bg/20";
  if (status === "Concluído") return "border-l-status-delivered bg-status-delivered-bg/10";
  if (status === "Não definido") return "border-l-border bg-background";
  return "border-l-status-pending bg-status-pending-bg/20";
}

export default function ClientesPage() {
  const { summaries, allResponsaveis, allStatuses, rows, updateRow } = useData();
  const [filterResp, setFilterResp] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCliente, setFilterCliente] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [obsDrafts, setObsDrafts] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    return summaries.filter(c => {
      if (filterResp && c.responsavel !== filterResp) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      if (filterCliente && !c.cliente.toLowerCase().includes(filterCliente.toLowerCase())) return false;
      return true;
    });
  }, [summaries, filterResp, filterStatus, filterCliente]);

  const toggle = (cliente: string) => setExpanded(p => ({ ...p, [cliente]: !p[cliente] }));

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">Clientes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Toque em um cliente para ver o detalhamento de cada item contratado</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 mb-6">
          <input type="text" placeholder="Buscar cliente..." value={filterCliente} onChange={e => setFilterCliente(e.target.value)} className="px-3 py-2.5 min-h-[44px] text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-52" />
          <select value={filterResp} onChange={e => setFilterResp(e.target.value)} className="px-3 py-2.5 min-h-[44px] text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-auto">
            <option value="">Todos os responsáveis</option>
            {allResponsaveis.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 min-h-[44px] text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-auto">
            <option value="">Todos os status</option>
            {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          {filtered.map(c => {
            const isOpen = !!expanded[c.cliente];
            return (
              <div key={c.cliente} className={`bg-card rounded-xl border border-border shadow-sm overflow-hidden border-l-4 ${rowAccent(c.status)}`}>
                <button
                  onClick={() => toggle(c.cliente)}
                  className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 hover:bg-accent/40 transition-colors text-left min-h-[60px]"
                >
                  <div className="flex-shrink-0 text-muted-foreground">
                    {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-card-foreground truncate">{c.cliente}</p>
                    <div className="flex items-center gap-2 sm:gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{c.responsavel}</span>
                      <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{c.totalEntregues}/{c.totalItems}</span>
                      <span className="hidden sm:flex items-center gap-1"><Calendar className="w-3 h-3" />Vence {formatDate(c.vencimentoContrato)}</span>
                    </div>
                  </div>
                  <div className="hidden md:block w-44">
                    <ProgressBar value={c.progresso} />
                  </div>
                  <StatusBadge status={c.status} size="sm" />
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-secondary/30 px-4 sm:px-5 py-4">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Itens contratados ({c.items.length})
                    </h4>
                    <div className="grid gap-3">
                      {c.items.map(item => {
                        const fullRow = rows.find(r => r.id === item.rowId);
                        const draft = obsDrafts[item.rowId];
                        const currentObs = fullRow?.observacoes || "";
                        const value = draft !== undefined ? draft : currentObs;
                        const isDirty = draft !== undefined && draft !== currentObs;
                        return (
                          <div
                            key={item.rowId}
                            className={`rounded-lg border border-border bg-card p-4 border-l-4 ${rowAccent(item.statusGeral)}`}
                          >
                            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                              <div className="flex items-center gap-3 min-w-0 flex-wrap">
                                <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">
                                  {item.tipo || "—"}
                                </span>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Qtd:</span>{" "}
                                  <span className="font-medium text-card-foreground">{item.quantidade || "—"}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Status Entrega:</span>{" "}
                                  <span className="font-medium text-card-foreground">{fullRow?.statusEntrega || "—"}</span>
                                </div>
                              </div>
                              <StatusBadge status={item.statusGeral} size="sm" />
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                                Observações
                              </label>
                              <Textarea
                                value={value}
                                onChange={e => setObsDrafts(p => ({ ...p, [item.rowId]: e.target.value }))}
                                placeholder="Adicione observações sobre este item…"
                                className="text-sm bg-background min-h-[70px]"
                              />
                              {isDirty && (
                                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-2">
                                  <button
                                    onClick={() => setObsDrafts(p => { const n = { ...p }; delete n[item.rowId]; return n; })}
                                    className="px-3 py-2 min-h-[40px] text-xs rounded-md border border-border hover:bg-accent transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => {
                                      updateRow(item.rowId, { observacoes: draft! });
                                      setObsDrafts(p => { const n = { ...p }; delete n[item.rowId]; return n; });
                                      toast({ title: "Observação salva", description: `${item.tipo || "Item"} atualizado.` });
                                    }}
                                    className="px-3 py-2 min-h-[40px] text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 font-medium"
                                  >
                                    <Save className="w-3 h-3" />
                                    Salvar
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
              Nenhum cliente encontrado.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
