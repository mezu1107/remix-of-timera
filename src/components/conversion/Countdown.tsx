import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

const pad = (n: number) => String(n).padStart(2, "0");

/** Counts down to a date. Falls back to a rolling daily deadline when none is given. */
export function Countdown({
  endsAt,
  label = "Offer ends in",
  className = "",
}: {
  endsAt?: string | Date | null;
  label?: string;
  className?: string;
}) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const target = endsAt
      ? new Date(endsAt).getTime()
      : (() => {
          const d = new Date();
          d.setHours(23, 59, 59, 999);
          return d.getTime();
        })();
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (left === null || left <= 0) return null;

  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs backdrop-blur-xl ${className}`}>
      <Timer className="h-3.5 w-3.5 text-primary" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold tabular-nums text-foreground">
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    </div>
  );
}
