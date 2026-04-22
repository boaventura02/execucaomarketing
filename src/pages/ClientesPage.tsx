import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Calendar, User, Layers, Info } from "lucide-react";
import { useData, type StatusGeral, type ClientRow } from "@/data/DataContext";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

function rowAccent(status: StatusGeral) {
  if (status === "Atrasado") return "border-l-status-late bg-status-late-bg/20";
  if (status === "Revisão") return "border-l-status-review bg-status-review-bg/20";
  if (status === "Em andamento") return "border-l-status-inprogress bg-status-inprogress-bg/20";
  if (status === "Concluído") return "border-l-status-delivered bg-status-delivered-bg/10";
  return "border-l-status-pending bg-status-pending-bg/20";
}

const STATUS_ENTREGA_OPTIONS = [
  "Pendente",
  "Em produção",
  "Em edição",
  "Revisão",
  "Aguardando aprovação",
  "Entregue",
  "Atrasado",
];

const STATUS_GERAL_OPTIONS: StatusGeral[] = [
  "Pendente",
  "Em andamento",
  "Revisão",
  "Concluído",
  "Atrasado",
];

export default function ClientesPage() {
  const { summaries, allResponsaveis, allStatuses, rows, editRowLocal } = useData();
  const [filterResp, setFilterResp] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCliente, setFilterCliente] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Clique em um cliente para ver e editar os itens contratados
          </p>
        </div>

        <div className="mb-6 flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
          <p>
            As alterações são salvas automaticamente neste dispositivo e permanecem mesmo após a sincronização
            com a planilha. <strong>Importante:</strong> a sincronização com o Google Sheets é apenas de leitura,
            portanto suas edições aparecem aqui no painel mas não são gravadas de volta na planilha original.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={filterCliente}
            onChange={e => setFilterCliente(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-52"
          />
          <select
            value={filterResp}
            onChange={e => setFilterResp(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos os responsáveis</option>
            {allResponsaveis.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos os status</option>
            {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          {filtered.map(c => {
            const isOpen = !!expanded[c.cliente];
            return (
              <div
                key={c.cliente}
                className={`bg-card rounded-xl border border-border shadow-sm overflow-hidden border-l-4 ${rowAccent(c.status)}`}
              >
                <button
                  onClick={() => toggle(c.cliente)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/40 transition-colors text-left"
                >
                  <div className="flex-shrink-0 text-muted-foreground">
                    {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-card-foreground">{c.cliente}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{c.responsavel}</span>
                      <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{c.totalEntregues}/{c.totalItems} itens</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Vence {formatDate(c.vencimentoContrato)}</span>
                    </div>
                  </div>
                  <div className="hidden md:block w-44">
                    <ProgressBar value={c.progresso} />
                  </div>
                  <StatusBadge status={c.status} />
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-secondary/30 px-5 py-4">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Itens contratados ({c.items.length})
                    </h4>
                    <div className="grid gap-3">
                      {c.items.map(item => {
                        const fullRow = rows.find(r => r.id === item.rowId);
                        if (!fullRow) return null;
                        return (
                          <ItemEditor
                            key={item.rowId}
                            row={fullRow}
                            onChange={(updates) => editRowLocal(fullRow.id, updates)}
                          />
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

interface ItemEditorProps {
  row: ClientRow;
  onChange: (updates: Partial<Pick<ClientRow, "statusEntrega" | "statusGeral" | "autorizadoPor" | "observacoes">>) => void;
}

function ItemEditor({ row, onChange }: ItemEditorProps) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4 border-l-4 ${rowAccent(row.statusGeral)}`}>
      {/* Cabeçalho: Tipo + Quantidade */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">
            {row.tipoConteudo || "Sem tipo"}
          </span>
          <div className="text-sm">
            <span className="text-muted-foreground">Quantidade:</span>{" "}
            <span className="font-medium text-card-foreground">{row.quantidadeContratada || "—"}</span>
          </div>
        </div>
        <StatusBadge status={row.statusGeral} size="sm" />
      </div>

      {/* Campos editáveis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Status de Entrega
          </Label>
          <Select
            value={row.statusGeral}
            onValueChange={(v) => onChange({ statusGeral: v as StatusGeral })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_GERAL_OPTIONS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Detalhe da Entrega
          </Label>
          <Select
            value={row.statusEntrega || "—"}
            onValueChange={(v) => onChange({ statusEntrega: v === "—" ? "" : v })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="—">—</SelectItem>
              {STATUS_ENTREGA_OPTIONS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Autorizado por
          </Label>
          <Input
            value={row.autorizadoPor}
            onChange={(e) => onChange({ autorizadoPor: e.target.value })}
            placeholder="Nome do responsável"
            className="h-9 text-sm"
            maxLength={100}
          />
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          Observações
        </Label>
        <Textarea
          value={row.observacoes}
          onChange={(e) => onChange({ observacoes: e.target.value })}
          placeholder="Adicione observações sobre este item..."
          className="min-h-[70px] text-sm resize-y"
          maxLength={1000}
        />
      </div>
    </div>
  );
}
