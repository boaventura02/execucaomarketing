import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { initialDataRows } from "./initialRows";
import { fetchSheetRows, SHEET_URL } from "@/lib/googleSheetsSync";

export type StatusGeral = "Concluído" | "Atrasado" | "Em andamento" | "Revisão" | "Pendente" | "Não definido";

export interface ClientRow {
  id: string;
  cliente: string;
  dataFechamento: string;
  vencimentoContrato: string;
  responsavel: string;
  tipoConteudo: string;
  quantidadeContratada: string;
  statusEntrega: string;
  statusGeral: StatusGeral;
  dataGravacao: string;
  statusGravacao: string;
  dataEntregaPrevista: string;
  autorizadoPor: string;
  prazoFinal: string;
  observacoes: string;
  /** Valores das colunas customizadas, indexados por columnId */
  custom: Record<string, string>;
}

export interface ClientSummary {
  cliente: string;
  responsavel: string;
  dataFechamento: string;
  vencimentoContrato: string;
  items: {
    rowId: string;
    tipo: string;
    quantidade: string;
    statusEntrega: string;
    statusGeral: StatusGeral;
  }[];
  totalItems: number;
  totalEntregues: number;
  progresso: number;
  status: StatusGeral;
}

export type ColumnKind = "base" | "custom";
export type ColumnType = "text" | "date" | "select";

export interface ColumnDef {
  /** Identificador estável (não muda ao renomear). Para base = chave original do ClientRow. Para custom = id gerado. */
  id: string;
  kind: ColumnKind;
  /** Label exibido (editável pelo usuário) */
  label: string;
  type: ColumnType;
  /** Largura sugerida (px) */
  width?: string;
}

// Finance types
export type TransactionType = "entrada" | "saida";
export type PaymentMethod = "Pix" | "Boleto" | "Cartão" | "Dinheiro" | "Outro";
export type PaymentType = "Normal" | "Permuta" | "Outro";
export type TransactionStatus = "Pago" | "Pendente";

export interface Transaction {
  id: string;
  type: TransactionType;
  value: number;
  date: string;
  category: string;
  clientId?: string;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  description: string;
  status: TransactionStatus;
}

export interface FinanceCategory {
  id: string;
  name: string;
  type: TransactionType;
}

let nextId = 1;
function genId() { return String(nextId++); }
let nextColId = 1;
function genColId() { return `c${nextColId++}`; }

const initialFinanceCategories: FinanceCategory[] = [
  { id: "1", name: "Clientes", type: "entrada" },
  { id: "2", name: "Tráfego Pago", type: "saida" },
  { id: "3", name: "Ferramentas", type: "saida" },
  { id: "4", name: "Salários", type: "saida" },
  { id: "5", name: "Freelancers", type: "saida" },
  { id: "6", name: "Outros", type: "saida" },
];

const initialData: Omit<ClientRow, "id" | "custom">[] = initialDataRows.length > 0 ? (initialDataRows as Omit<ClientRow, "id" | "custom">[]) : [
...
];

/** Definição inicial das colunas (base = sempre presentes; podem ser renomeadas). */
const initialColumns: ColumnDef[] = [
...
];

export type SyncStatus = "idle" | "syncing" | "success" | "error";

interface DataContextType {
  rows: ClientRow[];
  columns: ColumnDef[];
  setRows: React.Dispatch<React.SetStateAction<ClientRow[]>>;
  updateRow: (id: string, updates: Partial<ClientRow>) => void;
  updateRowCustom: (id: string, columnId: string, value: string) => void;
  addRow: () => void;
  deleteRow: (id: string) => void;
  renameColumn: (columnId: string, newLabel: string) => void;
  addCustomColumn: (label: string, type?: ColumnType) => void;
  deleteCustomColumn: (columnId: string) => void;
  summaries: ClientSummary[];
  allResponsaveis: string[];
  allStatuses: StatusGeral[];
  /** Helper: lê o valor de uma coluna (base ou custom) de uma row. */
  getCellValue: (row: ClientRow, col: ColumnDef) => string;
  /** Sincronização com Google Sheets */
  syncStatus: SyncStatus;
  lastSync: Date | null;
  syncError: string | null;
  syncNow: () => Promise<void>;
  sheetUrl: string;
  
  // Finance module
  transactions: Transaction[];
  categories: FinanceCategory[];
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (name: string, type: TransactionType) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);


export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

function computeSummaries(rows: ClientRow[]): ClientSummary[] {
  const grouped = new Map<string, ClientRow[]>();
  rows.forEach(row => {
    if (!row.cliente) return;
    const existing = grouped.get(row.cliente) || [];
    existing.push(row);
    grouped.set(row.cliente, existing);
  });

  return Array.from(grouped.entries()).map(([cliente, cRows]) => {
    const first = cRows[0];
    const totalItems = cRows.length;
    // Pesos por status: Concluído = 100%, Revisão = 75%, Em andamento = 50%, Pendente = 25%, Atrasado = 0%
    const STATUS_WEIGHT: Record<StatusGeral, number> = {
      "Concluído": 1,
      "Revisão": 0.75,
      "Em andamento": 0.5,
      "Pendente": 0.25,
      "Atrasado": 0,
      "Não definido": 0,
    };
    const weightedSum = cRows.reduce((acc, r) => acc + (STATUS_WEIGHT[r.statusGeral] ?? 0), 0);
    const totalEntregues = Math.round(weightedSum * 10) / 10; // exibido nos gráficos (com 1 casa)
    const progresso = totalItems > 0 ? Math.round((weightedSum / totalItems) * 100) : 0;

    let status: StatusGeral;
    if (progresso === 100) {
      status = "Concluído";
    } else if (cRows.some(r => r.statusGeral === "Atrasado")) {
      status = "Atrasado";
    } else if (cRows.some(r => r.statusGeral === "Revisão")) {
      status = "Revisão";
    } else if (cRows.some(r => r.statusGeral === "Em andamento")) {
      status = "Em andamento";
    } else {
      status = "Pendente";
    }

    return {
      cliente,
      responsavel: first.responsavel,
      dataFechamento: first.dataFechamento,
      vencimentoContrato: first.vencimentoContrato,
      items: cRows.map(r => ({
        rowId: r.id,
        tipo: r.tipoConteudo,
        quantidade: r.quantidadeContratada,
        statusEntrega: r.statusEntrega,
        statusGeral: r.statusGeral,
      })),
      totalItems,
      totalEntregues,
      progresso,
      status,
    };
  });
}

const STORAGE_KEY = "execucao-marketing-data-v5";

interface PersistedState {
  rows: ClientRow[];
  columns: ColumnDef[];
  nextId: number;
  nextColId: number;
}

function loadPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed.rows || !parsed.columns) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const persisted = typeof window !== "undefined" ? loadPersisted() : null;

  const [rows, setRows] = useState<ClientRow[]>(() => {
    if (persisted) {
      nextId = persisted.nextId;
      return persisted.rows;
    }
    return initialData.map(d => ({ ...d, id: genId(), custom: {} }));
  });
  const [columns, setColumns] = useState<ColumnDef[]>(() => {
    if (persisted) {
      nextColId = persisted.nextColId;
      return persisted.columns;
    }
    return initialColumns;
  });

  // Sincronização com Google Sheets
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Persiste mudanças no localStorage
  React.useEffect(() => {
    try {
      const state: PersistedState = { rows, columns, nextId, nextColId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Falha ao salvar no localStorage:", e);
    }
  }, [rows, columns]);

  const syncNow = useCallback(async () => {
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      const fetched = await fetchSheetRows();
      if (!isMountedRef.current) return;
      if (fetched.length === 0) {
        throw new Error("A planilha foi lida mas está vazia.");
      }
      // Google Sheets é a fonte da verdade para a maioria dos campos,
      // MAS preservamos `observacoes` e `custom` editados localmente,
      // indexando por (cliente | tipoConteudo | quantidadeContratada).
      setRows(prev => {
        const localByKey = new Map<string, ClientRow>();
        prev.forEach(r => {
          const key = `${r.cliente}||${r.tipoConteudo}||${r.quantidadeContratada}`;
          localByKey.set(key, r);
        });
        return fetched.map((d, i) => {
          const key = `${d.cliente}||${d.tipoConteudo}||${d.quantidadeContratada}`;
          const local = localByKey.get(key);
          return {
            ...d,
            // Observações são SEMPRE preservadas localmente (a planilha não as gerencia).
            observacoes: local?.observacoes || d.observacoes || "",
            id: genId(),
            custom: local?.custom ?? prev[i]?.custom ?? {},
          };
        });
      });
      setLastSync(new Date());
      setSyncStatus("success");
    } catch (e) {
      if (!isMountedRef.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Erro ao sincronizar com Google Sheets:", msg);
      setSyncError(msg);
      setSyncStatus("error");
    }
  }, []);

  // Polling: roda imediatamente e depois a cada 30s
  useEffect(() => {
    isMountedRef.current = true;
    syncNow();
    const interval = setInterval(syncNow, 10_000);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [syncNow]);

  const updateRow = useCallback((id: string, updates: Partial<ClientRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const updateRowCustom = useCallback((id: string, columnId: string, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, custom: { ...r.custom, [columnId]: value } } : r));
  }, []);

  const addRow = useCallback(() => {
    setRows(prev => [...prev, {
      id: genId(),
      cliente: "", dataFechamento: "", vencimentoContrato: "", responsavel: "",
      tipoConteudo: "", quantidadeContratada: "", statusEntrega: "", statusGeral: "Pendente",
      dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "",
      prazoFinal: "", observacoes: "", custom: {},
    }]);
  }, []);

  const deleteRow = useCallback((id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  }, []);

  const renameColumn = useCallback((columnId: string, newLabel: string) => {
    setColumns(prev => prev.map(c => c.id === columnId ? { ...c, label: newLabel } : c));
  }, []);

  const addCustomColumn = useCallback((label: string, type: ColumnType = "text") => {
    const id = genColId();
    setColumns(prev => [...prev, { id, kind: "custom", label, type, width: "140px" }]);
  }, []);

  const deleteCustomColumn = useCallback((columnId: string) => {
    setColumns(prev => prev.filter(c => !(c.id === columnId && c.kind === "custom")));
    setRows(prev => prev.map(r => {
      if (!(columnId in r.custom)) return r;
      const next = { ...r.custom };
      delete next[columnId];
      return { ...r, custom: next };
    }));
  }, []);

  const getCellValue = useCallback((row: ClientRow, col: ColumnDef): string => {
    if (col.kind === "custom") return row.custom[col.id] ?? "";
    return (row[col.id as keyof ClientRow] as string) ?? "";
  }, []);

  const summaries = useMemo(() => computeSummaries(rows), [rows]);
  const allResponsaveis = useMemo(() => {
    const set = new Set(rows.map(r => r.responsavel).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);
  const allStatuses: StatusGeral[] = ["Concluído", "Em andamento", "Revisão", "Pendente", "Atrasado", "Não definido"];

  return (
    <DataContext.Provider value={{
      rows, columns, setRows,
      updateRow, updateRowCustom, addRow, deleteRow,
      renameColumn, addCustomColumn, deleteCustomColumn,
      summaries, allResponsaveis, allStatuses, getCellValue,
      syncStatus, lastSync, syncError, syncNow, sheetUrl: SHEET_URL,
    }}>
      {children}
    </DataContext.Provider>
  );
}
