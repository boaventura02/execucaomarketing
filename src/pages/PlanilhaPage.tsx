import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { useData, type StatusGeral, type ClientRow } from "@/data/DataContext";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "@/hooks/use-toast";

const STATUS_OPTIONS: StatusGeral[] = ["Concluído", "Em andamento", "Revisão", "Pendente", "Atrasado"];

const columns: { key: keyof ClientRow; label: string; width: string; type?: "select" | "date" | "text" }[] = [
  { key: "cliente", label: "Cliente", width: "180px" },
  { key: "dataFechamento", label: "Fechamento", width: "120px", type: "date" },
  { key: "vencimentoContrato", label: "Vencimento", width: "120px", type: "date" },
  { key: "responsavel", label: "Responsável", width: "140px" },
  { key: "tipoConteudo", label: "Tipo Conteúdo", width: "140px" },
  { key: "quantidadeContratada", label: "Qtd. Contratada", width: "120px" },
  { key: "dataGravacao", label: "Data Gravação", width: "120px", type: "date" },
  { key: "statusGravacao", label: "Status Gravação", width: "130px" },
  { key: "dataEntregaPrevista", label: "Entrega Prevista", width: "120px", type: "date" },
  { key: "autorizadoPor", label: "Autorizado por", width: "130px" },
  { key: "statusEntrega", label: "Status Entrega", width: "130px" },
  { key: "prazoFinal", label: "Prazo Final", width: "120px", type: "date" },
  { key: "statusGeral", label: "Status Geral", width: "140px", type: "select" },
  { key: "observacoes", label: "Observações", width: "180px" },
];

function CellInput({ row, col, onUpdate }: { row: ClientRow; col: typeof columns[number]; onUpdate: (val: string) => void }) {
  const value = row[col.key] as string;

  if (col.type === "select" && col.key === "statusGeral") {
    return (
      <select
        value={value}
        onChange={e => onUpdate(e.target.value)}
        className="w-full px-2 py-1.5 text-xs bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-ring rounded"
      >
        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    );
  }

  return (
    <input
      type={col.type === "date" ? "date" : "text"}
      value={value}
      onChange={e => onUpdate(e.target.value)}
      className="w-full px-2 py-1.5 text-xs bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-ring rounded"
    />
  );
}

function getRowBg(status: StatusGeral) {
  if (status === "Atrasado") return "bg-status-late-bg/40";
  if (status === "Revisão") return "bg-status-review-bg/40";
  if (status === "Em andamento") return "bg-status-inprogress-bg/40";
  if (status === "Concluído") return "bg-status-delivered-bg/30";
  return "";
}

export default function PlanilhaPage() {
  const { rows, updateRow, addRow, deleteRow } = useData();

  const handleSave = () => {
    toast({ title: "Dados salvos!", description: "As alterações foram aplicadas ao dashboard." });
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Planilha</h1>
            <p className="text-sm text-muted-foreground mt-1">Edite os dados diretamente — as mudanças atualizam o dashboard em tempo real</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nova Linha
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-status-delivered text-primary-foreground hover:opacity-90 transition-colors"
            >
              <Save className="w-4 h-4" /> Salvar
            </button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-sm" style={{ minWidth: "1800px" }}>
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-2 py-2.5 text-center text-[10px] font-semibold text-muted-foreground uppercase w-10">#</th>
                  {columns.map(col => (
                    <th
                      key={col.key}
                      className="px-2 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                      style={{ minWidth: col.width }}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="px-2 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, idx) => (
                  <tr key={row.id} className={`hover:bg-accent/30 transition-colors ${getRowBg(row.statusGeral)}`}>
                    <td className="px-2 py-1 text-center text-[10px] text-muted-foreground">{idx + 1}</td>
                    {columns.map(col => (
                      <td key={col.key} className="px-1 py-0.5">
                        <CellInput
                          row={row}
                          col={col}
                          onUpdate={(val) => updateRow(row.id, { [col.key]: val })}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1">
                      <button
                        onClick={() => deleteRow(row.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
            {rows.length} registros • Edite qualquer célula para atualizar o dashboard
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
