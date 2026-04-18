import { useState } from "react";
import { Plus, Trash2, Save, Pencil, Check, X, Columns3 } from "lucide-react";
import { useData, type StatusGeral, type ColumnDef, type ClientRow, type ColumnType } from "@/data/DataContext";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "@/hooks/use-toast";

const STATUS_OPTIONS: StatusGeral[] = ["Concluído", "Em andamento", "Revisão", "Pendente", "Atrasado"];

function CellInput({
  row,
  col,
  value,
  onUpdate,
}: {
  row: ClientRow;
  col: ColumnDef;
  value: string;
  onUpdate: (val: string) => void;
}) {
  if (col.type === "select" && col.id === "statusGeral") {
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

function ColumnHeader({
  col,
  onRename,
  onDelete,
}: {
  col: ColumnDef;
  onRename: (label: string) => void;
  onDelete?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(col.label);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== col.label) onRename(trimmed);
    else setValue(col.label);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setValue(col.label); setEditing(false); }
          }}
          className="px-1.5 py-0.5 text-[10px] bg-background border border-input rounded w-full focus:outline-none focus:ring-1 focus:ring-ring uppercase"
        />
        <button onClick={commit} className="p-0.5 text-status-delivered hover:bg-status-delivered-bg rounded">
          <Check className="w-3 h-3" />
        </button>
        <button onClick={() => { setValue(col.label); setEditing(false); }} className="p-0.5 text-muted-foreground hover:bg-accent rounded">
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1">
      <span className="truncate">{col.label}</span>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground transition-opacity"
        title="Renomear"
      >
        <Pencil className="w-3 h-3" />
      </button>
      {onDelete && (
        <button
          onClick={() => {
            if (confirm(`Excluir a coluna "${col.label}"? Os dados nela serão perdidos.`)) onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-opacity"
          title="Excluir coluna"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function NewColumnDialog({ onCreate, onClose }: { onCreate: (label: string, type: ColumnType) => void; onClose: () => void }) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<ColumnType>("text");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-foreground mb-1">Nova coluna</h3>
        <p className="text-xs text-muted-foreground mb-4">Adicione um campo personalizado para todas as linhas.</p>
        <label className="block text-xs font-medium text-foreground mb-1">Nome da coluna</label>
        <input
          autoFocus
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Ex: Link do Drive"
          className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-3"
        />
        <label className="block text-xs font-medium text-foreground mb-1">Tipo</label>
        <select
          value={type}
          onChange={e => setType(e.target.value as ColumnType)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-5"
        >
          <option value="text">Texto</option>
          <option value="date">Data</option>
        </select>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-accent transition-colors">Cancelar</button>
          <button
            onClick={() => {
              const trimmed = label.trim();
              if (!trimmed) return;
              onCreate(trimmed, type);
              onClose();
            }}
            disabled={!label.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PlanilhaPage() {
  const { rows, columns, updateRow, updateRowCustom, addRow, deleteRow, renameColumn, addCustomColumn, deleteCustomColumn, getCellValue } = useData();
  const [showNewCol, setShowNewCol] = useState(false);

  const handleSave = () => {
    toast({ title: "Dados salvos!", description: "As alterações foram aplicadas ao dashboard." });
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white">Planilha</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Edite os dados — passe o mouse no cabeçalho para renomear ou excluir colunas. As mudanças refletem no dashboard em tempo real.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowNewCol(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-accent transition-colors"
            >
              <Columns3 className="w-4 h-4" /> Nova Coluna
            </button>
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
          <div className="overflow-auto max-h-[calc(100vh-220px)]">
            <table className="text-sm" style={{ minWidth: "1800px" }}>
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-secondary">
                  <th className="px-2 py-2.5 text-center text-[10px] font-semibold text-muted-foreground uppercase w-10 bg-secondary">#</th>
                  {columns.map(col => (
                    <th
                      key={col.id}
                      className="px-2 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-secondary"
                      style={{ minWidth: col.width }}
                    >
                      <ColumnHeader
                        col={col}
                        onRename={(label) => renameColumn(col.id, label)}
                        onDelete={col.kind === "custom" ? () => deleteCustomColumn(col.id) : undefined}
                      />
                    </th>
                  ))}
                  <th className="px-2 py-2.5 w-10 bg-secondary"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, idx) => (
                  <tr key={row.id} className={`hover:bg-accent/30 transition-colors ${getRowBg(row.statusGeral)}`}>
                    <td className="px-2 py-1 text-center text-[10px] text-muted-foreground">{idx + 1}</td>
                    {columns.map(col => (
                      <td key={col.id} className="px-1 py-0.5">
                        <CellInput
                          row={row}
                          col={col}
                          value={getCellValue(row, col)}
                          onUpdate={(val) => {
                            if (col.kind === "custom") updateRowCustom(row.id, col.id, val);
                            else updateRow(row.id, { [col.id]: val } as Partial<ClientRow>);
                          }}
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
            {rows.length} registros • {columns.length} colunas ({columns.filter(c => c.kind === "custom").length} customizadas)
          </div>
        </div>
      </div>

      {showNewCol && (
        <NewColumnDialog
          onCreate={(label, type) => {
            addCustomColumn(label, type);
            toast({ title: "Coluna adicionada", description: `"${label}" foi criada e está disponível em todas as abas.` });
          }}
          onClose={() => setShowNewCol(false)}
        />
      )}
    </AppLayout>
  );
}
