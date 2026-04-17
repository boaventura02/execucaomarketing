import type { StatusGeral } from "@/data/DataContext";

const statusConfig: Record<StatusGeral, { label: string; className: string }> = {
  "Concluído": { label: "Entregue", className: "bg-status-delivered-bg text-status-delivered" },
  "Atrasado": { label: "Atrasado", className: "bg-status-late-bg text-status-late" },
  "Em andamento": { label: "Em andamento", className: "bg-status-inprogress-bg text-status-inprogress" },
  "Revisão": { label: "Revisão", className: "bg-status-review-bg text-status-review" },
  "Pendente": { label: "Pendente", className: "bg-status-pending-bg text-status-pending" },
};

export function StatusBadge({ status, size = "md" }: { status: StatusGeral; size?: "sm" | "md" }) {
  const config = statusConfig[status];
  const sizeCls = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs";
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${sizeCls} ${config.className}`}>
      {config.label}
    </span>
  );
}
