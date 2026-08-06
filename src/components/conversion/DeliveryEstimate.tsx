import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";

const fmt = (d: Date) => d.toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" });

/** Delivery estimate + dispatch cut-off — removes the biggest "when will it arrive?" objection. */
export function DeliveryEstimate({ className = "" }: { className?: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() + 2);
    const to = new Date(now);
    to.setDate(now.getDate() + 4);
    const cutoff = new Date(now);
    cutoff.setHours(18, 0, 0, 0);
    const hoursLeft = Math.max(0, Math.round((cutoff.getTime() - now.getTime()) / 3_600_000));
    setText(
      `${fmt(from)} – ${fmt(to)}${hoursLeft > 0 ? ` · order within ${hoursLeft}h for today's dispatch` : ""}`,
    );
  }, []);

  if (!text) return null;
  return (
    <p className={`inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted-foreground backdrop-blur-xl ${className}`}>
      <CalendarClock className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span>
        Estimated delivery <strong className="font-medium text-foreground">{text}</strong>
      </span>
    </p>
  );
}
