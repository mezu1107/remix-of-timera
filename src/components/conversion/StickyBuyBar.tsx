import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { effectivePrice } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/tracking";

/**
 * STICKY BUY BAR — glass action bar that appears once the main CTA scrolls away.
 * Keeps "Add to bag" one thumb-tap away on mobile at all times.
 */
export function StickyBuyBar({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 620);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const price = effectivePrice(product);
  const hasSale = product.salePrice != null && product.salePrice < product.price;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[60] border-t border-border/60 bg-background/80 px-4 py-3 backdrop-blur-2xl transition-transform duration-300 lg:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <img src={product.image} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{product.name}</p>
          <p className="flex items-baseline gap-2 text-sm font-semibold">
            {formatPrice(price)}
            {hasSale && <span className="text-xs font-normal text-muted-foreground line-through">{formatPrice(product.price)}</span>}
          </p>
        </div>
        <Button
          className="h-11 shrink-0 px-5 text-xs uppercase tracking-[0.18em]"
          disabled={product.stock <= 0}
          onClick={() => {
            void trackEvent("sticky_buy_click", { productId: product.id, productSlug: product.slug, productName: product.name, value: price });
            onAdd();
          }}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          {product.stock > 0 ? "Add" : "Sold out"}
        </Button>
      </div>
    </div>
  );
}
