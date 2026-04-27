import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronRight, Calendar, User, Layers, Check, Plus } from "lucide-react";
import { useData, type StatusGeral, type LocalObservation } from "@/data/DataContext";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatDateTime(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR");
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
  const [searchParams] = useSearchParams();
  const initialCliente = searchParams.get("cliente") || "";
  
  const { summaries, allResponsaveis, allStatuses, rows, updateRow } = useData();
  const [filterResp, setFilterResp] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCliente, setFilterCliente] = useState(initialCliente);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  

  useEffect(() => {
    if (initialCliente) {
      setExpanded(p => ({ ...p, [initialCliente]: true }));
    }
  }, [initialCliente]);

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
                      {c.aprovadoPor && (
                        <span className="flex items-center gap-1"><Check className="w-3 h-3" />{c.aprovadoPor}</span>
                      )}
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
                                {fullRow?.autorizadoPor && (
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Aprovado por:</span>{" "}
                                    <span className="font-medium text-card-foreground">{fullRow.autorizadoPor}</span>
                                  </div>
                                )}
                              </div>
                              <StatusBadge status={item.statusGeral} size="sm" />
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                                  Observações (Planilha)
                                </label>
                                <div className="p-3 rounded-md bg-secondary/50 text-sm text-card-foreground border border-border min-h-[40px] whitespace-pre-wrap">
                                  {fullRow?.observacoes || <span className="text-muted-foreground italic">Sem observações na planilha.</span>}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1 italic">
                                  * Este campo é preenchido apenas pelo Google Sheets.
                                </p>
                              </div>

                              {fullRow?.localObservacoes && fullRow.localObservacoes.length > 0 && (
                                <div>
                                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                                    Histórico de Observações Locais
                                  </label>
                                  <div className="space-y-2">
                                    {fullRow.localObservacoes.map((obs, idx) => (
                                      <div key={idx} className="p-3 rounded-md bg-background border border-border text-sm">
                                        <div className="flex justify-between items-center mb-1 text-[10px] font-medium text-muted-foreground uppercase">
                                          <span>{obs.author}</span>
                                          <span>{formatDateTime(obs.timestamp)}</span>
                                        </div>
                                        <p className="text-card-foreground whitespace-pre-wrap">{obs.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <ObservationDialog 
                                rowId={item.rowId} 
                                currentObservations={fullRow?.localObservacoes || []} 
                                onUpdate={(newObs) => updateRow(item.rowId, { localObservacoes: newObs })}
                              />
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

function ObservationDialog({ 
  rowId, 
  currentObservations, 
  onUpdate 
}: { 
  rowId: string, 
  currentObservations: LocalObservation[],
  onUpdate: (obs: LocalObservation[]) => void
}) {
  const { setIsEditing } = useData();
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setIsEditing(open);
  }, [open, setIsEditing]);

  const handleAdd = () => {
    if (!author.trim() || !text.trim()) {
      toast({ title: "Erro", description: "Preencha o autor e a mensagem.", variant: "destructive" });
      return;
    }

    const newObs: LocalObservation = {
      author,
      text,
      timestamp: new Date().toISOString()
    };

    onUpdate([...currentObservations, newObs]);
    
    setAuthor("");
    setText("");
    setOpen(false);
    
    toast({ title: "Sucesso", description: "Observação adicionada com sucesso." });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto flex gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Observação Local
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Observação</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Seu nome (Autor)</label>
            <Input 
              placeholder="Digite seu nome..." 
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Observação</label>
            <Textarea 
              placeholder="Descreva a observação..." 
              className="min-h-[100px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
