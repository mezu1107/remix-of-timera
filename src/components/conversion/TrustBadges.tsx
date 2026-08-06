import { ShieldCheck, Truck, RotateCcw, BadgeCheck, Lock } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, label: "1-Year Warranty" },
  { icon: Truck, label: "Fast Nationwide Delivery" },
  { icon: RotateCcw, label: "7-Day Easy Returns" },
  { icon: BadgeCheck, label: "Cash on Delivery" },
  { icon: Lock, label: "Secure Checkout" },
];

/** Glassy trust strip — reused on product, cart and checkout. */
export function TrustBadges({ className = "" }: { className?: string }) {
  return (
    <ul className={`grid grid-cols-2 gap-2 sm:grid-cols-5 ${className}`}>
      {ITEMS.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-[11px] leading-tight text-muted-foreground backdrop-blur-xl transition hover:border-primary/30 hover:text-foreground"
        >
          <Icon className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0">{label}</span>
        </li>
      ))}
    </ul>
  );
}
