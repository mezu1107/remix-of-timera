import { useMemo } from "react";
import { ShoppingBag, Truck } from "lucide-react";

const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Sialkot", "Gujranwala", "Quetta"];

/** Deterministic pseudo-random from a string so numbers stay stable per product. */
function seeded(seed: string, min: number, max: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return min + (h % Math.max(1, max - min + 1));
}

/** "34 sold in the last 7 days" + shipping-city proof. Stable per product, no jitter. */
export function RecentlyBought({ slug, className = "" }: { slug: string; className?: string }) {
  const { sold, city } = useMemo(
    () => ({
      sold: seeded(slug, 14, 68),
      city: CITIES[seeded(`${slug}-city`, 0, CITIES.length - 1)],
    }),
    [slug],
  );

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground ${className}`}>
      <span className="inline-flex items-center gap-1.5">
        <ShoppingBag className="h-3.5 w-3.5 text-primary" />
        <strong className="font-medium text-foreground">{sold}</strong> sold in the last 7 days
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Truck className="h-3.5 w-3.5 text-primary" />
        Last shipped to {city}
      </span>
    </div>
  );
}
