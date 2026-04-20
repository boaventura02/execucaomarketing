// Sincronização com Google Sheets via export CSV público.
// A planilha precisa estar com permissão "Qualquer pessoa com o link pode ver".

import type { ClientRow, StatusGeral } from "@/data/DataContext";

const SHEET_ID = "1QsDonM2vL-6lE7D2mQJnBPSUZAoxJyYd5jYndPEE63g";
const GID = "0";
export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
export const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

/** Parser CSV simples e robusto (suporta aspas, vírgulas escapadas, quebras de linha em campos). */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cur.push(field); field = "";
      } else if (ch === "\n") {
        cur.push(field); field = "";
        rows.push(cur); cur = [];
      } else if (ch === "\r") {
        // ignora
      } else {
        field += ch;
      }
    }
  }
  // último campo
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter(r => r.some(c => c.trim() !== ""));
}

/** Converte data BR (dd/MM/yyyy) para ISO (yyyy-MM-dd), ou retorna como veio se já estiver no formato. */
function normalizeDate(s: string): string {
  if (!s) return "";
  const trimmed = s.trim();
  // já está em ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  // dd/MM/yyyy
  const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    let yyyy = m[3];
    if (yyyy.length === 2) yyyy = "20" + yyyy;
    return `${yyyy}-${mm}-${dd}`;
  }
  return trimmed;
}

/** Normaliza string de status para o tipo StatusGeral. */
function normalizeStatusGeral(s: string): StatusGeral {
  const v = (s || "").trim().toLowerCase();
  if (!v) return "Pendente";
  if (v.includes("conclu") || v.includes("entreg")) return "Concluído";
  if (v.includes("atras")) return "Atrasado";
  if (v.includes("revis")) return "Revisão";
  if (v.includes("andam") || v.includes("produc") || v.includes("edi")) return "Em andamento";
  return "Pendente";
}

/** Mapeia o array bruto de células (headers + linhas) para ClientRow[]. */
export function mapSheetToRows(matrix: string[][]): Omit<ClientRow, "id" | "custom">[] {
  if (matrix.length < 2) return [];

  // Encontra a linha do header (procura uma linha que contenha "Cliente").
  let headerIdx = matrix.findIndex(row =>
    row.some(c => c.trim().toLowerCase() === "cliente")
  );
  if (headerIdx === -1) headerIdx = 0;

  const headers = matrix[headerIdx].map(h => h.trim().toLowerCase());
  const dataRows = matrix.slice(headerIdx + 1);

  // Função pra encontrar índice da coluna por palavras-chave.
  const findCol = (...keywords: string[]): number => {
    for (const kw of keywords) {
      const idx = headers.findIndex(h => h.includes(kw));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const colCliente = findCol("cliente");
  const colFechamento = findCol("fechamento");
  const colVencimento = findCol("vencimento");
  const colResp = findCol("respons");
  const colTipo = findCol("tipo");
  const colQtd = findCol("quantidade", "qtd");
  const colDataGrav = findCol("data da grav", "data grav");
  const colStatusGrav = findCol("status grav");
  const colEntregaPrev = findCol("entrega prev", "data entrega");
  const colAutorizado = findCol("autorizado");
  const colStatusEntrega = findCol("status entrega");
  const colPrazoFinal = findCol("prazo final", "prazo");
  const colStatusGeral = findCol("status geral");
  const colObs = findCol("observ");

  const cell = (row: string[], idx: number) => idx >= 0 && idx < row.length ? (row[idx] || "").trim() : "";

  const out: Omit<ClientRow, "id" | "custom">[] = [];
  for (const row of dataRows) {
    const cliente = cell(row, colCliente);
    if (!cliente) continue; // pula linhas vazias
    out.push({
      cliente,
      dataFechamento: normalizeDate(cell(row, colFechamento)),
      vencimentoContrato: normalizeDate(cell(row, colVencimento)),
      responsavel: cell(row, colResp),
      tipoConteudo: cell(row, colTipo),
      quantidadeContratada: cell(row, colQtd),
      dataGravacao: normalizeDate(cell(row, colDataGrav)),
      statusGravacao: cell(row, colStatusGrav),
      dataEntregaPrevista: normalizeDate(cell(row, colEntregaPrev)),
      autorizadoPor: cell(row, colAutorizado),
      statusEntrega: cell(row, colStatusEntrega),
      prazoFinal: normalizeDate(cell(row, colPrazoFinal)),
      statusGeral: normalizeStatusGeral(cell(row, colStatusGeral)),
      observacoes: cell(row, colObs),
    });
  }
  return out;
}

/** Faz fetch da planilha pública e retorna as linhas mapeadas. */
export async function fetchSheetRows(): Promise<Omit<ClientRow, "id" | "custom">[]> {
  // cache-bust pra garantir dados frescos
  const url = `${CSV_URL}&_=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Falha ao baixar planilha (HTTP ${res.status}). Verifique se ela está pública.`);
  }
  const text = await res.text();
  const matrix = parseCSV(text);
  return mapSheetToRows(matrix);
}
