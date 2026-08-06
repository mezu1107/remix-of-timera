import { Flame } from "lucide-react";

/** Stock urgency bar — real stock number from the database, framed for urgency. */
export function StockUrgency({ stock, className = "" }: { stock: number; className?: string }) {
  if (!Number.isFinite(stock) || stock <= 0 || stock > 12) return null;
  const pct = Math.max(8, Math.min(100, (stock / 12) * 100));
  return (
    <div className={`rounded-xl border border-destructive/25 bg-destructive/5 p-3 backdrop-blur-xl ${className}`}>
      <p className="flex items-center gap-2 text-xs">
        <Flame className="h-3.5 w-3.5 text-destructive" />
        <span className="text-muted-foreground">
          Only <strong className="font-semibold text-destructive">{stock}</strong> left in stock — selling fast
        </span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-destructive/70 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
