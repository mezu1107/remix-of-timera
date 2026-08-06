import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { X, ShoppingBag } from "lucide-react";
import { productsQuery, effectivePrice, type Product } from "@/lib/catalog";

/**
 * LIVE SALES PROOF — glassy "Ali from Lahore just ordered …" cards.
 * Uses real catalogue products so every card links to a page that exists.
 */
const BUYERS = [
  "Ali", "Hamza", "Bilal", "Usman", "Ahsan", "Zain", "Faizan", "Umair",
  "Ayesha", "Hira", "Sana", "Maryam", "Fatima", "Areeba", "Noor", "Iqra",
];
const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Sialkot", "Gujranwala", "Quetta"];
const AGO = ["2 minutes ago", "6 minutes ago", "11 minutes ago", "18 minutes ago", "27 minutes ago", "42 minutes ago"];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

type Sale = { name: string; city: string; ago: string; product: Product };

export function LiveSalesToast() {
  const { data: products } = useQuery(productsQuery);
  const [sale, setSale] = useState<Sale | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed || !products?.length) return;
    let visible = false;
    const show = () => {
      const product = pick(products);
      if (!product) return;
      setSale({ name: pick(BUYERS)!, city: pick(CITIES)!, ago: pick(AGO)!, product });
      visible = true;
      window.setTimeout(() => {
        if (visible) setSale(null);
        visible = false;
      }, 6500);
    };
    const first = window.setTimeout(show, 9000);
    const loop = window.setInterval(show, 26000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
    };
  }, [products, dismissed]);

  if (!sale || dismissed) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 left-4 z-40 hidden max-w-[22rem] sm:block">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border/60 bg-background/70 p-3 pr-9 shadow-xl backdrop-blur-xl">
        <Link
          to="/product/$slug"
          params={{ slug: sale.product.slug }}
          className="flex items-center gap-3"
        >
          <img
            src={sale.product.image}
            alt={sale.product.name}
            loading="lazy"
            className="h-14 w-14 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-primary">
              <ShoppingBag className="h-3 w-3" /> Just ordered
            </p>
            <p className="truncate font-serif text-sm">{sale.product.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {sale.name} from {sale.city} · Rs {effectivePrice(sale.product).toLocaleString()} · {sale.ago}
            </p>
          </div>
        </Link>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
