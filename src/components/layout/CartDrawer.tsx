import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/store/shop";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const { items, isOpen, setOpen, updateQty, remove } = useCart();
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const freeShip = 500;
  const progress = Math.min(100, (subtotal / freeShip) * 100);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col bg-background border-l border-border">
        <SheetHeader className="border-b border-border/60 pb-4">
          <SheetTitle className="font-serif text-2xl gold-text">Your Cart</SheetTitle>
          {subtotal > 0 && subtotal < freeShip && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Add <span className="text-primary font-medium">{formatPrice(freeShip - subtotal)}</span> more for complimentary express shipping.
              </p>
              <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
                <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--grad-gold)" }} />
              </div>
            </div>
          )}
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="h-16 w-16 rounded-full glass flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-serif text-xl">Your cart is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">Begin your collection with a piece from our maison.</p>
            </div>
            <Button asChild onClick={() => setOpen(false)}>
              <Link to="/shop">Discover Timepieces</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-border/40">
                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-md bg-card">
                    <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.product.brand}</p>
                        <p className="font-serif text-base leading-tight">{item.product.name}</p>
                        {(item.color || item.size) && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {[item.color, item.size].filter(Boolean).join(" • ")}
                          </p>
                        )}
                      </div>
                      <button onClick={() => remove(item.id)} className="text-muted-foreground hover:text-destructive transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full border border-border">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)} className="p-1.5 hover:text-primary transition">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)} className="p-1.5 hover:text-primary transition">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="font-medium">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/60 pt-4 space-y-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{subtotal >= freeShip ? "Complimentary" : "Calculated at checkout"}</span>
                </div>
                <div className="flex justify-between font-serif text-lg pt-2 border-t border-border/40">
                  <span>Total</span>
                  <span className="gold-text">{formatPrice(subtotal)}</span>
                </div>
              </div>
              <Button asChild className="w-full h-12" onClick={() => setOpen(false)}>
                <Link to="/checkout">
                  Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" onClick={() => setOpen(false)}>
                <Link to="/cart">View Full Cart</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
