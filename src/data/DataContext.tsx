import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

export type StatusGeral = "Concluído" | "Atrasado" | "Em andamento" | "Revisão" | "Pendente";

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
}

export interface ClientSummary {
  cliente: string;
  responsavel: string;
  dataFechamento: string;
  vencimentoContrato: string;
  items: {
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

let nextId = 1;
function genId() { return String(nextId++); }

const initialData: Omit<ClientRow, "id">[] = [
  { cliente: "La Barca Gastronomia", dataFechamento: "2026-04-14", vencimentoContrato: "2026-07-14", responsavel: "Ketlyn", tipoConteudo: "Reels", quantidadeContratada: "8", statusEntrega: "Revisão", statusGeral: "Revisão", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "La Barca Gastronomia", dataFechamento: "2026-04-14", vencimentoContrato: "2026-07-14", responsavel: "Ketlyn", tipoConteudo: "Gravação Presencial", quantidadeContratada: "10 fotos", statusEntrega: "Em edição", statusGeral: "Em andamento", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Aires Contabilidade", dataFechamento: "", vencimentoContrato: "", responsavel: "Sem responsável", tipoConteudo: "Feed", quantidadeContratada: "6", statusEntrega: "Em edição", statusGeral: "Em andamento", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Aires Contabilidade", dataFechamento: "", vencimentoContrato: "", responsavel: "Sem responsável", tipoConteudo: "Reels", quantidadeContratada: "4", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Aires Contabilidade", dataFechamento: "", vencimentoContrato: "", responsavel: "Sem responsável", tipoConteudo: "Gravação Presencial", quantidadeContratada: "1 Mês", statusEntrega: "Atrasado", statusGeral: "Atrasado", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Amis Store", dataFechamento: "2026-04-27", vencimentoContrato: "2026-08-27", responsavel: "Ketlyn", tipoConteudo: "Feed", quantidadeContratada: "4", statusEntrega: "Atrasado", statusGeral: "Atrasado", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Amis Store", dataFechamento: "2026-04-27", vencimentoContrato: "2026-08-27", responsavel: "Ketlyn", tipoConteudo: "Reels", quantidadeContratada: "8", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Amis Store", dataFechamento: "2026-04-27", vencimentoContrato: "2026-08-27", responsavel: "Ketlyn", tipoConteudo: "Gravação Presencial", quantidadeContratada: "1/semana", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Mayra Ferreira Torquato", dataFechamento: "2026-04-10", vencimentoContrato: "2026-07-10", responsavel: "Maria Fernanda", tipoConteudo: "Feed", quantidadeContratada: "8", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Mayra Ferreira Torquato", dataFechamento: "2026-04-10", vencimentoContrato: "2026-07-10", responsavel: "Maria Fernanda", tipoConteudo: "Storys", quantidadeContratada: "2/semana", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Mayra Ferreira Torquato", dataFechamento: "2026-04-10", vencimentoContrato: "2026-07-10", responsavel: "Maria Fernanda", tipoConteudo: "Reels", quantidadeContratada: "4", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Mayra Ferreira Torquato", dataFechamento: "2026-04-10", vencimentoContrato: "2026-07-10", responsavel: "Maria Fernanda", tipoConteudo: "Gravação Presencial", quantidadeContratada: "10 fotos", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Expo Catalão - Sindicato Rural", dataFechamento: "2026-01-10", vencimentoContrato: "2026-06-10", responsavel: "Bruna", tipoConteudo: "Storys", quantidadeContratada: "2/semana", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Expo Catalão - Sindicato Rural", dataFechamento: "2026-01-10", vencimentoContrato: "2026-06-10", responsavel: "Bruna", tipoConteudo: "Reels", quantidadeContratada: "8", statusEntrega: "Pendente", statusGeral: "Pendente", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Expo Catalão - Sindicato Rural", dataFechamento: "2026-01-10", vencimentoContrato: "2026-06-10", responsavel: "Bruna", tipoConteudo: "Tráfego", quantidadeContratada: "1", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Expo Catalão - Sindicato Rural", dataFechamento: "2026-01-10", vencimentoContrato: "2026-06-10", responsavel: "Bruna", tipoConteudo: "Gravação Presencial", quantidadeContratada: "1", statusEntrega: "Pendente", statusGeral: "Pendente", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Espaço Crer e Desenvolver", dataFechamento: "2026-02-02", vencimentoContrato: "2026-05-02", responsavel: "Ketlyn", tipoConteudo: "Feed", quantidadeContratada: "9", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Dra. Monica Marinho", dataFechamento: "2026-04-01", vencimentoContrato: "2026-07-01", responsavel: "Ketlyn", tipoConteudo: "Feed", quantidadeContratada: "8", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Dra. Monica Marinho", dataFechamento: "2026-04-01", vencimentoContrato: "2026-07-01", responsavel: "Ketlyn", tipoConteudo: "Storys", quantidadeContratada: "2/semana", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Dra. Monica Marinho", dataFechamento: "2026-04-01", vencimentoContrato: "2026-07-01", responsavel: "Ketlyn", tipoConteudo: "Reels", quantidadeContratada: "4", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Janayne Louza", dataFechamento: "2026-03-25", vencimentoContrato: "2026-09-25", responsavel: "Maria Fernanda", tipoConteudo: "Feed", quantidadeContratada: "6", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Janayne Louza", dataFechamento: "2026-03-25", vencimentoContrato: "2026-09-25", responsavel: "Maria Fernanda", tipoConteudo: "Reels", quantidadeContratada: "4", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Janayne Louza", dataFechamento: "2026-03-25", vencimentoContrato: "2026-09-25", responsavel: "Maria Fernanda", tipoConteudo: "Gravação Presencial", quantidadeContratada: "1", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "TEK Telecom", dataFechamento: "2026-01-15", vencimentoContrato: "2026-06-15", responsavel: "Sarah", tipoConteudo: "Reels", quantidadeContratada: "6", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "TEK Telecom", dataFechamento: "2026-01-15", vencimentoContrato: "2026-06-15", responsavel: "Sarah", tipoConteudo: "Tráfego", quantidadeContratada: "1", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "R2 - Ricardo Borges", dataFechamento: "2026-02-01", vencimentoContrato: "2026-06-01", responsavel: "Maria Fernanda", tipoConteudo: "Feed", quantidadeContratada: "15", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "R2 - Ricardo Borges", dataFechamento: "2026-02-01", vencimentoContrato: "2026-06-01", responsavel: "Maria Fernanda", tipoConteudo: "Storys", quantidadeContratada: "2/dia", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "R2 - Ricardo Borges", dataFechamento: "2026-02-01", vencimentoContrato: "2026-06-01", responsavel: "Maria Fernanda", tipoConteudo: "Reels", quantidadeContratada: "8", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Alana Rodrigues", dataFechamento: "2025-11-11", vencimentoContrato: "2026-04-10", responsavel: "Maria Fernanda", tipoConteudo: "Feed", quantidadeContratada: "6", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Alana Rodrigues", dataFechamento: "2025-11-11", vencimentoContrato: "2026-04-10", responsavel: "Maria Fernanda", tipoConteudo: "Storys", quantidadeContratada: "2/semana", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Alana Rodrigues", dataFechamento: "2025-11-11", vencimentoContrato: "2026-04-10", responsavel: "Maria Fernanda", tipoConteudo: "Reels", quantidadeContratada: "4", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Alana Rodrigues", dataFechamento: "2025-11-11", vencimentoContrato: "2026-04-10", responsavel: "Maria Fernanda", tipoConteudo: "Gravação Presencial", quantidadeContratada: "1", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Alana Rodrigues", dataFechamento: "2025-11-11", vencimentoContrato: "2026-04-10", responsavel: "Maria Fernanda", tipoConteudo: "Tráfego", quantidadeContratada: "1", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Danielle Cardoso - Center Clínica", dataFechamento: "2025-05-07", vencimentoContrato: "2025-11-07", responsavel: "Ketlyn", tipoConteudo: "Tráfego", quantidadeContratada: "1", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Danielle Cardoso - Center Clínica", dataFechamento: "2025-05-07", vencimentoContrato: "2025-11-07", responsavel: "Ketlyn", tipoConteudo: "Reels", quantidadeContratada: "4", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Uzze Multimarcas - Aniely", dataFechamento: "2026-04-14", vencimentoContrato: "2026-10-14", responsavel: "Ketlyn", tipoConteudo: "Gravação Presencial", quantidadeContratada: "1/semana", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Uzze Multimarcas - Aniely", dataFechamento: "2026-04-14", vencimentoContrato: "2026-10-14", responsavel: "Ketlyn", tipoConteudo: "Reels", quantidadeContratada: "2/semana", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Uzze Multimarcas - Aniely", dataFechamento: "2026-04-14", vencimentoContrato: "2026-10-14", responsavel: "Ketlyn", tipoConteudo: "Feed", quantidadeContratada: "6/semana", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Agromec Catalão", dataFechamento: "2026-01-05", vencimentoContrato: "2026-04-05", responsavel: "Maria Fernanda", tipoConteudo: "Reels", quantidadeContratada: "4", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Agromec Catalão", dataFechamento: "2026-01-05", vencimentoContrato: "2026-04-05", responsavel: "Maria Fernanda", tipoConteudo: "Feed", quantidadeContratada: "8", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Geovana Rodrigues", dataFechamento: "2026-01-06", vencimentoContrato: "2026-03-06", responsavel: "Sem responsável", tipoConteudo: "Reels", quantidadeContratada: "8", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
  { cliente: "Geovana Rodrigues", dataFechamento: "2026-01-06", vencimentoContrato: "2026-03-06", responsavel: "Sem responsável", tipoConteudo: "Tráfego", quantidadeContratada: "1", statusEntrega: "Entregue", statusGeral: "Concluído", dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "", prazoFinal: "", observacoes: "" },
];

interface DataContextType {
  rows: ClientRow[];
  setRows: React.Dispatch<React.SetStateAction<ClientRow[]>>;
  updateRow: (id: string, updates: Partial<ClientRow>) => void;
  addRow: () => void;
  deleteRow: (id: string) => void;
  summaries: ClientSummary[];
  allResponsaveis: string[];
  allStatuses: StatusGeral[];
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
    const totalEntregues = cRows.filter(r => r.statusGeral === "Concluído").length;
    const progresso = Math.round((totalEntregues / totalItems) * 100);

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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [rows, setRows] = useState<ClientRow[]>(() =>
    initialData.map(d => ({ ...d, id: genId() }))
  );

  const updateRow = useCallback((id: string, updates: Partial<ClientRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const addRow = useCallback(() => {
    setRows(prev => [...prev, {
      id: genId(),
      cliente: "", dataFechamento: "", vencimentoContrato: "", responsavel: "",
      tipoConteudo: "", quantidadeContratada: "", statusEntrega: "", statusGeral: "Pendente",
      dataGravacao: "", statusGravacao: "", dataEntregaPrevista: "", autorizadoPor: "",
      prazoFinal: "", observacoes: "",
    }]);
  }, []);

  const deleteRow = useCallback((id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  }, []);

  const summaries = useMemo(() => computeSummaries(rows), [rows]);
  const allResponsaveis = useMemo(() => {
    const set = new Set(rows.map(r => r.responsavel).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);
  const allStatuses: StatusGeral[] = ["Concluído", "Em andamento", "Revisão", "Pendente", "Atrasado"];

  return (
    <DataContext.Provider value={{ rows, setRows, updateRow, addRow, deleteRow, summaries, allResponsaveis, allStatuses }}>
      {children}
    </DataContext.Provider>
  );
}
