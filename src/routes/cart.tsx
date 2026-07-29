import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/store/shop";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Timera" },
      { name: "description", content: "Review your Timera cart and proceed to secure checkout." },
      { property: "og:title", content: "Your Cart — Timera" },
      { property: "og:description", content: "Review your Timera cart." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, updateQty, remove } = useCart();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<number>(0);

  const subtotal = items.reduce((a, i) => a + i.product.price * i.quantity, 0);
  const shipping = subtotal >= 500 || subtotal === 0 ? 0 : 45;
  const total = Math.max(0, subtotal + shipping - applied);

  if (items.length === 0) {
    return (
      <div className="container-luxe py-24 text-center">
        <div className="mx-auto h-20 w-20 rounded-full glass flex items-center justify-center mb-6">
          <ShoppingBag className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-serif text-4xl">Your cart awaits</h1>
        <p className="mt-3 text-muted-foreground">Begin your collection with a piece from our maison.</p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/shop">Discover Timepieces <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-luxe py-12">
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Cart</p>
      <h1 className="mt-3 font-serif text-5xl">Your Selection</h1>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-6 pb-4 border-b border-border/60 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Product</span>
            <span className="w-32 text-center">Quantity</span>
            <span className="w-28 text-right">Price</span>
            <span className="w-8" />
          </div>
          {items.map((item) => (
            <div key={item.id} className="grid md:grid-cols-[1fr_auto_auto_auto] gap-6 py-6 border-b border-border/40 items-center">
              <div className="flex gap-4">
                <Link to="/product/$slug" params={{ slug: item.product.slug }} className="h-28 w-24 shrink-0 overflow-hidden rounded-md bg-card">
                  <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                </Link>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.product.brand}</p>
                  <Link to="/product/$slug" params={{ slug: item.product.slug }} className="font-serif text-lg hover:text-primary transition">
                    {item.product.name}
                  </Link>
                  {(item.color || item.size) && (
                    <p className="mt-1 text-xs text-muted-foreground">{[item.color, item.size].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center rounded-md border border-border md:w-32 justify-center">
                <button onClick={() => updateQty(item.id, item.quantity - 1)} className="p-2 hover:text-primary"><Minus className="h-3.5 w-3.5" /></button>
                <span className="w-10 text-center text-sm">{item.quantity}</span>
                <button onClick={() => updateQty(item.id, item.quantity + 1)} className="p-2 hover:text-primary"><Plus className="h-3.5 w-3.5" /></button>
              </div>
              <p className="font-medium md:w-28 md:text-right">{formatPrice(item.product.price * item.quantity)}</p>
              <button onClick={() => remove(item.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>

        <aside className="glass rounded-xl p-6 h-fit lg:sticky lg:top-32">
          <h2 className="font-serif text-2xl">Order summary</h2>

          <div className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Promo code" value={coupon} onChange={(e) => setCoupon(e.target.value)} className="pl-9 h-11" />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (coupon.toUpperCase() === "AUREUM10") { setApplied(subtotal * 0.1); toast.success("10% discount applied"); }
                else toast.error("Invalid code");
              }}
              className="h-11"
            >Apply</Button>
          </div>

          <div className="mt-6 space-y-2.5 text-sm border-t border-border/40 pt-6">
            <Row label="Subtotal" value={formatPrice(subtotal)} />
            <Row label="Shipping" value={shipping === 0 ? "Complimentary" : formatPrice(shipping)} />
            {applied > 0 && <Row label="Discount" value={`- ${formatPrice(applied)}`} />}
            <div className="border-t border-border/40 pt-4 mt-4 flex justify-between font-serif text-xl">
              <span>Total</span>
              <span className="gold-text">{formatPrice(total)}</span>
            </div>
          </div>

          <Button asChild size="lg" className="w-full h-12 mt-6">
            <Link to="/checkout">Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Complimentary shipping on orders over Rs 5,000
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
