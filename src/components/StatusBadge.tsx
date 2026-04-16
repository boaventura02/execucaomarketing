import type { StatusGeral } from "@/data/clients";

const statusConfig: Record<StatusGeral, { label: string; className: string }> = {
  "Concluído": { label: "Entregue", className: "bg-status-delivered-bg text-status-delivered" },
  "Atrasado": { label: "Atrasado", className: "bg-status-late-bg text-status-late" },
  "Em andamento": { label: "Em andamento", className: "bg-status-inprogress-bg text-status-inprogress" },
  "Revisão": { label: "Revisão", className: "bg-status-review-bg text-status-review" },
  "Pendente": { label: "Pendente", className: "bg-status-pending-bg text-status-pending" },
};

export function StatusBadge({ status }: { status: StatusGeral }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}
