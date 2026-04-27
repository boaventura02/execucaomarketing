import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { initialDataRows } from "./initialRows";
import { fetchSheetRows, SHEET_URL } from "@/lib/googleSheetsSync";

export type StatusGeral = "Concluído" | "Atrasado" | "Em andamento" | "Revisão" | "Pendente" | "Não definido";

export interface LocalObservation {
  text: string;
  author: string;
  timestamp: string;
}

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
  localObservacoes: LocalObservation[];
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
  aprovadoPor: string;
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

let nextId = 1;
function genId() { return String(nextId++); }
let nextColId = 1;
function genColId() { return `c${nextColId++}`; }

const initialData: Omit<ClientRow, "id" | "custom">[] = [
  { cliente: "La Barca Gastronomia", dataFechamento: "2026-04-14", vencimentoContrato: "2026-07-14", responsavel: "Ketlyn", tipoConteudo: "Reels", quantidadeContratada: "8", statusEntrega: "Revisão", statusGeral: "Revisão", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "La Barca Gastronomia", dataFechamento: "2026-04-14", vencimentoContrato: "2026-07-14", responsavel: "Ketlyn", tipoConteudo: "Gravação Presencial", quantidadeContratada: "10 fotos", statusEntrega: "Em edição", statusGeral: "Em andamento", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Aires Contabilidade", dataFechamento: "", vencimentoContrato: "", responsavel: "Sem responsável", tipoConteudo: "Feed", quantidadeContratada: "6", statusEntrega: "Em edição", statusGeral: "Em andamento", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Aires Contabilidade", dataFechamento: "", vencimentoContrato: "", responsavel: "Sem responsável", tipoConteudo: "Reels", quantidadeContratada: "4", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Aires Contabilidade", dataFechamento: "", vencimentoContrato: "", responsavel: "Sem responsável", tipoConteudo: "Gravação Presencial", quantidadeContratada: "1 Mês", statusEntrega: "Atrasado", statusGeral: "Atrasado", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Amis Store", dataFechamento: "2026-04-27", vencimentoContrato: "2026-08-27", responsavel: "Ketlyn", tipoConteudo: "Feed", quantidadeContratada: "4", statusEntrega: "Atrasado", statusGeral: "Atrasado", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Amis Store", dataFechamento: "2026-04-27", vencimentoContrato: "2026-08-27", responsavel: "Ketlyn", tipoConteudo: "Reels", quantidadeContratada: "8", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Amis Store", dataFechamento: "2026-04-27", vencimentoContrato: "2026-08-27", responsavel: "Ketlyn", tipoConteudo: "Gravação Presencial", quantidadeContratada: "1/semana", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Mayra Ferreira Torquato", dataFechamento: "2026-04-10", vencimentoContrato: "2026-07-10", responsavel: "Maria Fernanda", tipoConteudo: "Feed", quantidadeContratada: "8", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Mayra Ferreira Torquato", dataFechamento: "2026-04-10", vencimentoContrato: "2026-07-10", responsavel: "Maria Fernanda", tipoConteudo: "Storys", quantidadeContratada: "2/semana", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Mayra Ferreira Torquato", dataFechamento: "2026-04-10", vencimentoContrato: "2026-07-10", responsavel: "Maria Fernanda", tipoConteudo: "Reels", quantidadeContratada: "4", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Mayra Ferreira Torquato", dataFechamento: "2026-04-10", vencimentoContrato: "2026-07-10", responsavel: "Maria Fernanda", tipoConteudo: "Gravação Presencial", quantidadeContratada: "10 fotos", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Expo Catalão - Sindicato Rural", dataFechamento: "2026-01-10", vencimentoContrato: "2026-06-10", responsavel: "Bruna", tipoConteudo: "Storys", quantidadeContratada: "2/semana", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Expo Catalão - Sindicato Rural", dataFechamento: "2026-01-10", vencimentoContrato: "2026-06-10", responsavel: "Bruna", tipoConteudo: "Reels", quantidadeContratada: "8", statusEntrega: "Pendente", statusGeral: "Pendente", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Expo Catalão - Sindicato Rural", dataFechamento: "2026-01-10", vencimentoContrato: "2026-06-10", responsavel: "Bruna", tipoConteudo: "Tráfego", quantidadeContratada: "1", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Expo Catalão - Sindicato Rural", dataFechamento: "2026-01-10", vencimentoContrato: "2026-06-10", responsavel: "Bruna", tipoConteudo: "Gravação Presencial", quantidadeContratada: "1", statusEntrega: "Pendente", statusGeral: "Pendente", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Espaço Crer e Desenvolver", dataFechamento: "2026-02-02", vencimentoContrato: "2026-05-02", responsavel: "Ketlyn", tipoConteudo: "Feed", quantidadeContratada: "9", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Dra. Monica Marinho", dataFechamento: "2026-04-01", vencimentoContrato: "2026-07-01", responsavel: "Ketlyn", tipoConteudo: "Feed", quantidadeContratada: "8", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Dra. Monica Marinho", dataFechamento: "2026-04-01", vencimentoContrato: "2026-07-01", responsavel: "Ketlyn", tipoConteudo: "Storys", quantidadeContratada: "2/semana", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Dra. Monica Marinho", dataFechamento: "2026-04-01", vencimentoContrato: "2026-07-01", responsavel: "Ketlyn", tipoConteudo: "Reels", quantidadeContratada: "4", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Janayne Louza", dataFechamento: "2026-03-25", vencimentoContrato: "2026-09-25", responsavel: "Maria Fernanda", tipoConteudo: "Feed", quantidadeContratada: "6", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Janayne Louza", dataFechamento: "2026-03-25", vencimentoContrato: "2026-09-25", responsavel: "Maria Fernanda", tipoConteudo: "Reels", quantidadeContratada: "4", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Janayne Louza", dataFechamento: "2026-03-25", vencimentoContrato: "2026-09-25", responsavel: "Maria Fernanda", tipoConteudo: "Gravação Presencial", quantidadeContratada: "1", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "TEK Telecom", dataFechamento: "2026-01-15", vencimentoContrato: "2026-06-15", responsavel: "Sarah", tipoConteudo: "Reels", quantidadeContratada: "6", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "TEK Telecom", dataFechamento: "2026-01-15", vencimentoContrato: "2026-06-15", responsavel: "Sarah", tipoConteudo: "Tráfego", quantidadeContratada: "1", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "R2 - Ricardo Borges", dataFechamento: "2026-02-01", vencimentoContrato: "2026-06-01", responsavel: "Maria Fernanda", tipoConteudo: "Feed", quantidadeContratada: "15", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "R2 - Ricardo Borges", dataFechamento: "2026-02-01", vencimentoContrato: "2026-06-01", responsavel: "Maria Fernanda", tipoConteudo: "Storys", quantidadeContratada: "2/dia", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "R2 - Ricardo Borges", dataFechamento: "2026-02-01", vencimentoContrato: "2026-06-01", responsavel: "Maria Fernanda", tipoConteudo: "Reels", quantidadeContratada: "8", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Alana Rodrigues", dataFechamento: "2025-11-11", vencimentoContrato: "2026-04-10", responsavel: "Maria Fernanda", tipoConteudo: "Feed", quantidadeContratada: "6", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Alana Rodrigues", dataFechamento: "2025-11-11", vencimentoContrato: "2026-04-10", responsavel: "Maria Fernanda", tipoConteudo: "Storys", quantidadeContratada: "2/semana", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Alana Rodrigues", dataFechamento: "2025-11-11", vencimentoContrato: "2026-04-10", responsavel: "Maria Fernanda", tipoConteudo: "Reels", quantidadeContratada: "4", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Alana Rodrigues", dataFechamento: "2025-11-11", vencimentoContrato: "2026-04-10", responsavel: "Maria Fernanda", tipoConteudo: "Gravação Presencial", quantidadeContratada: "1", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Alana Rodrigues", dataFechamento: "2025-11-11", vencimentoContrato: "2026-04-10", responsavel: "Maria Fernanda", tipoConteudo: "Tráfego", quantidadeContratada: "1", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Danielle Cardoso - Center Clínica", dataFechamento: "2025-05-07", vencimentoContrato: "2025-11-07", responsavel: "Ketlyn", tipoConteudo: "Tráfego", quantidadeContratada: "1", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Danielle Cardoso - Center Clínica", dataFechamento: "2025-05-07", vencimentoContrato: "2025-11-07", responsavel: "Ketlyn", tipoConteudo: "Reels", quantidadeContratada: "4", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Uzze Multimarcas - Aniely", dataFechamento: "2026-04-14", vencimentoContrato: "2026-10-14", responsavel: "Ketlyn", tipoConteudo: "Gravação Presencial", quantidadeContratada: "1/semana", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Uzze Multimarcas - Aniely", dataFechamento: "2026-04-14", vencimentoContrato: "2026-10-14", responsavel: "Ketlyn", tipoConteudo: "Reels", quantidadeContratada: "2/semana", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Uzze Multimarcas - Aniely", dataFechamento: "2026-04-14", vencimentoContrato: "2026-10-14", responsavel: "Ketlyn", tipoConteudo: "Feed", quantidadeContratada: "6/semana", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Agromec Catalão", dataFechamento: "2026-01-05", vencimentoContrato: "2026-04-05", responsavel: "Maria Fernanda", tipoConteudo: "Reels", quantidadeContratada: "4", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Agromec Catalão", dataFechamento: "2026-01-05", vencimentoContrato: "2026-04-05", responsavel: "Maria Fernanda", tipoConteudo: "Feed", quantidadeContratada: "8", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Geovana Rodrigues", dataFechamento: "2026-01-06", vencimentoContrato: "2026-03-06", responsavel: "Sem responsável", tipoConteudo: "Reels", quantidadeContratada: "8", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
  { cliente: "Geovana Rodrigues", dataFechamento: "2026-01-06", vencimentoContrato: "2026-03-06", responsavel: "Sem responsável", tipoConteudo: "Tráfego", quantidadeContratada: "1", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "", localObservacoes: [] },
];

/** Definição inicial das colunas (base = sempre presentes; podem ser renomeadas). */
const initialColumns: ColumnDef[] = [
  { id: "cliente", kind: "base", label: "Cliente", type: "text", width: "180px" },
  { id: "dataFechamento", kind: "base", label: "Fechamento", type: "date", width: "120px" },
  { id: "vencimentoContrato", kind: "base", label: "Vencimento", type: "date", width: "120px" },
  { id: "responsavel", kind: "base", label: "Responsável", type: "text", width: "140px" },
  { id: "tipoConteudo", kind: "base", label: "Tipo Conteúdo", type: "text", width: "140px" },
  { id: "quantidadeContratada", kind: "base", label: "Qtd. Contratada", type: "text", width: "120px" },
  { id: "dataGravacao", kind: "base", label: "Data Gravação", type: "date", width: "120px" },
  { id: "statusGravacao", kind: "base", label: "Status Gravação", type: "text", width: "130px" },
  { id: "dataEntregaPrevista", kind: "base", label: "Entrega Prevista", type: "date", width: "120px" },
  { id: "autorizadoPor", kind: "base", label: "Aprovado por:", type: "select", width: "130px" },
  { id: "statusEntrega", kind: "base", label: "Status Entrega", type: "text", width: "130px" },
  { id: "prazoFinal", kind: "base", label: "Prazo Final", type: "date", width: "120px" },
  { id: "statusGeral", kind: "base", label: "Status Geral", type: "select", width: "140px" },
  { id: "observacoes", kind: "base", label: "Observações", type: "text", width: "180px" },
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
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
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

  const summariesList = Array.from(grouped.entries()).map(([cliente, cRows]) => {
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
      aprovadoPor: first.autorizadoPor || "",
    };
  });

  const statusOrder: Record<string, number> = {
    "Atrasado": 1,
    "Pendente": 2,
    "Revisão": 3,
    "Em andamento": 4,
    "Concluído": 5,
    "Não definido": 6
  };

  return summariesList.sort((a, b) => {
    const orderA = statusOrder[a.status] || 10;
    const orderB = statusOrder[b.status] || 10;
    if (orderA !== orderB) return orderA - orderB;
    return a.cliente.localeCompare(b.cliente, "pt-BR");
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
  const [isEditing, setIsEditing] = useState(false);

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
            // A planilha é a fonte da verdade para observacoes da planilha.
            // Preservamos o histórico local que não está na planilha.
            localObservacoes: local?.localObservacoes || [],
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
    if (isEditing) return;
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
      prazoFinal: "", observacoes: "", localObservacoes: [], custom: {},
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
