import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import type { Product } from "@/lib/products";
import { useCart, useWishlist } from "@/store/shop";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export function ProductCard({
  product,
  index = 0,
  priority = false,
}: {
  product: Product;
  index?: number;
  /** Set on above-the-fold cards so their image is fetched immediately. */
  priority?: boolean;
}) {
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const colorImage = product.colors.find((c) => c.name === activeColor)?.image;
  const add = useCart((s) => s.add);
  const toggleWish = useWishlist((s) => s.toggle);
  const inWish = useWishlist((s) => s.ids.includes(product.id));

  return (
    <div
      className="group relative flex flex-col"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative overflow-hidden rounded-lg bg-card aspect-[4/5]">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="block h-full w-full"
        >
          <img
            src={colorImage ?? product.image}
            alt={product.name}
            width={480}
            height={600}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-onyx/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Link>

        {product.badge && (
          <div className="absolute top-4 left-4">
            <span
              className={cn(
                "px-2.5 py-1 text-[10px] uppercase tracking-widest font-medium rounded-sm",
                product.badge === "Sale" && "bg-destructive text-destructive-foreground",
                product.badge === "New" && "bg-foreground text-background",
                product.badge === "Bestseller" && "bg-primary text-primary-foreground",
                product.badge === "Limited" && "bg-onyx text-primary border border-primary/40",
              )}
            >
              {product.badge}
            </span>
          </div>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWish(product.id);
            toast.success(inWish ? "Removed from wishlist" : "Added to wishlist");
          }}
          className={cn(
            "absolute top-4 right-4 h-9 w-9 rounded-full glass flex items-center justify-center transition-all",
            inWish && "text-primary",
          )}
          aria-label="Wishlist"
        >
          <Heart className={cn("h-4 w-4", inWish && "fill-current")} />
        </button>

        <div className="absolute inset-x-4 bottom-4 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <button
            onClick={(e) => {
              e.preventDefault();
              add(product);
              toast.success(`${product.name} added to cart`);
            }}
            className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-xs uppercase tracking-widest font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Add
          </button>
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="h-10 w-10 rounded-md glass flex items-center justify-center hover:text-primary transition"
            aria-label="Quick view"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{product.brand}</p>
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="font-serif text-lg leading-tight hover:text-primary transition-colors block"
        >
          {product.name}
        </Link>
        {product.colors.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {product.colors.slice(0, 5).map((c) => (
              <button
                key={c.name}
                type="button"
                title={c.name}
                aria-label={c.name}
                onMouseEnter={() => c.image && setActiveColor(c.name)}
                onFocus={() => c.image && setActiveColor(c.name)}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveColor(c.name);
                }}
                className={cn(
                  "h-4 w-4 rounded-full ring-offset-1 ring-offset-background transition",
                  activeColor === c.name ? "ring-2 ring-primary" : "ring-1 ring-border",
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{formatPrice(product.price)}</span>
          {product.compareAt && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compareAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
