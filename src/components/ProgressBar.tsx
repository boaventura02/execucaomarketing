export function ProgressBar({ value }: { value: number }) {
  const color =
    value === 100 ? "bg-status-delivered" :
    value >= 50 ? "bg-status-pending" :
    "bg-status-late";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-muted-foreground w-10 text-right">{value}%</span>
    </div>
  );
}
