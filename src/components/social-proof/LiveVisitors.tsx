import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

/**
 * LIVE VISITORS BADGE — glassy urgency chip: "23 people are viewing this now".
 * Drifts gently so it feels alive without ever looking fake-jumpy.
 */
export function LiveVisitors({ label = "people are viewing this right now", className = "" }: { label?: string; className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(12 + Math.floor(Math.random() * 26));
    const id = window.setInterval(() => {
      setCount((c) => Math.min(48, Math.max(9, c + (Math.random() > 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2)))));
    }, 7000);
    return () => window.clearInterval(id);
  }, []);

  if (!count) return null;

  return (
    <p
      className={`inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-xl ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      <Eye className="h-3.5 w-3.5" />
      <strong className="font-medium text-foreground">{count}</strong> {label}
    </p>
  );
}
