import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Check } from "lucide-react";
import { productsQuery, effectivePrice, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/shop";
import { trackEvent } from "@/lib/tracking";
import { toast } from "sonner";

/**
 * FREQUENTLY BOUGHT TOGETHER — one-tap bundle that lifts basket size.
 * Partner pieces come from the live catalog (same collection first).
 */
export function BundleUpsell({ product }: { product: Product }) {
  const { data: products = [] } = useQuery(productsQuery);
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  const partners = useMemo(() => {
    const pool = products.filter((p) => p.id !== product.id && p.stock > 0);
    const same = pool.filter((p) => p.collection === product.collection);
    return [...same, ...pool].slice(0, 2);
  }, [products, product]);

  if (partners.length < 2) return null;

  const bundle = [product, ...partners];
  const total = bundle.reduce((sum, p) => sum + effectivePrice(p), 0);
  const bundlePrice = Math.round(total * 0.92);

  return (
    <section className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      <h3 className="font-serif text-xl">Frequently bought together</h3>
      <p className="mt-1 text-xs text-muted-foreground">Save 8% when you take the full set.</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {bundle.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3">
            {i > 0 && <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />}
            <div className="w-20">
              <img src={p.image} alt={p.name} loading="lazy" className="h-20 w-20 rounded-xl object-cover" />
              <p className="mt-1 truncate text-[10px] text-muted-foreground">{p.name}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          <span className="text-muted-foreground line-through">{formatPrice(total)}</span>{" "}
          <strong className="text-base font-semibold text-primary">{formatPrice(bundlePrice)}</strong>
        </p>
        <Button
          variant="outline"
          className="h-11 text-xs uppercase tracking-[0.18em]"
          onClick={() => {
            bundle.forEach((p) => add(p));
            setAdded(true);
            void trackEvent("upsell_add", { productId: product.id, productSlug: product.slug, value: bundlePrice, metadata: { type: "bundle", count: bundle.length } });
            toast.success("Bundle added to your bag");
          }}
        >
          {added ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          Add all {bundle.length}
        </Button>
      </div>
    </section>
  );
}
