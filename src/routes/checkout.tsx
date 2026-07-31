import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/store/shop";
import { formatPrice } from "@/lib/utils";
import { couponsQuery, paymentSettingsQuery } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Lock, Loader2, Truck, ShieldCheck, Gift } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/tracking";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Timera Pakistan" },
      { name: "description", content: "Complete your Timera order — Cash on Delivery, Easypaisa, JazzCash and bank transfer across Pakistan." },
      { property: "og:title", content: "Checkout — Timera Pakistan" },
      { property: "og:description", content: "Cash on Delivery, Easypaisa, JazzCash and bank transfer — delivered across Pakistan." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type PayMethod = "cod" | "easypaisa" | "jazzcash" | "bank";

function CheckoutPage() {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const { data: coupons = [] } = useQuery(couponsQuery);
  const { data: settings } = useQuery(paymentSettingsQuery);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<PayMethod>("cod");
  const [placed, setPlaced] = useState<{ orderNumber: string; email: string } | null>(null);
  const checkoutTracked = useRef(false);

  const subtotal = items.reduce((a, i) => a + (i.product.salePrice ?? i.product.price) * i.quantity, 0);

  const coupon = useMemo(
    () => coupons.find((c) => c.code.toLowerCase() === (appliedCode ?? "").toLowerCase()) ?? null,
    [coupons, appliedCode],
  );
  const discount = useMemo(() => {
    if (!coupon || subtotal < coupon.minOrder) return 0;
    const value = coupon.discountType === "percent" ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
    return Math.min(Math.round(value * 100) / 100, subtotal);
  }, [coupon, subtotal]);

  const deliveryBase = settings?.deliveryCharge ?? 250;
  const freeAbove = settings?.freeDeliveryAbove ?? 5000;
  const shipping = subtotal - discount >= freeAbove ? 0 : deliveryBase;
  const codExtra = payMethod === "cod" ? Number(settings?.codCharge ?? 0) : 0;
  const total = Math.max(0, subtotal - discount + shipping + codExtra);

  useEffect(() => {
    if (checkoutTracked.current || items.length === 0) return;
    checkoutTracked.current = true;
    void trackEvent("begin_checkout", {
      value: total,
      metadata: {
        items: items.map((i) => ({ item_id: i.product.id, item_name: i.product.name, quantity: i.quantity, price: i.product.salePrice ?? i.product.price })),
      },
    });
  }, [items, total]);

  const methods: { id: PayMethod; label: string; sub?: string }[] = [];
  if (settings?.codEnabled ?? true) methods.push({ id: "cod", label: "Cash on Delivery", sub: codExtra ? `+ ${formatPrice(codExtra)} handling` : "Pay in cash when your order arrives" });
  if (settings?.easypaisaEnabled) methods.push({ id: "easypaisa", label: "Easypaisa", sub: settings?.easypaisaNumber ? `Send to ${settings.easypaisaNumber}` : undefined });
  if (settings?.jazzcashEnabled) methods.push({ id: "jazzcash", label: "JazzCash", sub: settings?.jazzcashNumber ? `Send to ${settings.jazzcashNumber}` : undefined });
  if (settings?.bankEnabled) methods.push({ id: "bank", label: "Bank Transfer", sub: settings?.bankName ?? undefined });
  if (methods.length && !methods.some((m) => m.id === payMethod)) {
    // fallback if selected method got disabled while user was on page
    setTimeout(() => setPayMethod(methods[0].id), 0);
  }

  const applyCoupon = () => {
    const code = couponInput.trim();
    const found = coupons.find((c) => c.code.toLowerCase() === code.toLowerCase());
    if (!found) return toast.error("That code isn't valid.");
    if (subtotal < found.minOrder) return toast.error(`This code needs a minimum order of ${formatPrice(found.minOrder)}.`);
    setAppliedCode(found.code);
    toast.success(`Code ${found.code} applied.`);
  };

  const placeOrder = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      const fd = new FormData(form);
      const get = (k: string) => String(fd.get(k) ?? "").trim();
      const address = [get("address"), get("city"), get("zip"), get("country")].filter(Boolean).join(", ");

      const methodLabel = methods.find((m) => m.id === payMethod)?.label ?? "Cash on Delivery";
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      // Server recomputes prices, discount and shipping from the database.
      const res = await fetch("/api/public/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customer_name: `${get("first")} ${get("last")}`.trim(),
          customer_email: get("email"),
          customer_phone: get("phone") || null,
          shipping_address: address,
          notes: [get("notes"), `Payment: ${methodLabel}`].filter(Boolean).join(" — "),
          coupon_code: appliedCode,
          items: items.map((i) => ({
            product_id: i.product.id,
            slug: i.product.slug,
            quantity: i.quantity,
            color: i.color ?? null,
            size: i.size ?? null,
          })),
        }),
      });

      const out = await res.json().catch(() => ({}) as any);
      if (!res.ok || !out?.ok) throw new Error(out?.error ?? "We couldn't save your order. Please try again.");
      return { orderNumber: out.order?.order_number as string, email: get("email") };
    },

    onSuccess: (r) => {
      void trackEvent("purchase", {
        orderNumber: r.orderNumber,
        value: total,
        metadata: {
          coupon: appliedCode,
          payment_method: payMethod,
          items: items.map((i) => ({ item_id: i.product.id, item_name: i.product.name, quantity: i.quantity, price: i.product.salePrice ?? i.product.price })),
        },
      });
      setPlaced(r);
      clear();
      toast.success("Order placed — hamari team jald rabta kare gi.");
    },
    onError: (e: any) => toast.error(e?.message ?? "We couldn't save your order. Please try again."),
  });

  if (placed) {
    return (
      <div className="container-luxe mx-auto max-w-xl py-16 text-center sm:py-24">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-6 font-serif text-3xl sm:text-4xl">Order confirmed</h1>
        <p className="mt-3 text-muted-foreground">
          Shukriya! Aap ka order <span className="text-primary">{placed.orderNumber}</span> receive ho gaya hai.
          {settings?.paymentNote ? ` ${settings.paymentNote}` : " Hamari team jald WhatsApp/Call par rabta kare gi."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild><Link to="/track">Track this order</Link></Button>
          <Button asChild variant="outline"><Link to="/">Continue shopping</Link></Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-luxe mx-auto max-w-xl py-16 text-center sm:py-24">
        <h1 className="font-serif text-3xl sm:text-4xl">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">Add a timepiece to continue to checkout.</p>
        <Button asChild className="mt-8"><Link to="/shop">Browse the collection</Link></Button>
      </div>
    );
  }

  return (
    <div className="container-luxe py-8 sm:py-12">
      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl">Checkout</h1>
      <p className="mt-2 text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-primary" /> Delivery all over Pakistan</span>
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> {settings?.warrantyMonths ?? 12}-month warranty</span>
        <span className="inline-flex items-center gap-1.5"><Gift className="h-4 w-4 text-primary" /> Premium gift box & warranty card</span>
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); placeOrder.mutate(e.currentTarget); }}
        className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[1.4fr_1fr] lg:gap-10"
      >
        <div className="min-w-0 space-y-8 lg:space-y-10">
          <Section title="Contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="email" name="email" label="Email address" type="email" required />
              <Field id="phone" name="phone" label="Phone (WhatsApp preferred)" required />
            </div>
          </Section>

          <Section title="Shipping address">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="first" name="first" label="First name" required />
              <Field id="last" name="last" label="Last name" required />
              <div className="sm:col-span-2"><Field id="address" name="address" label="Street address (House, Street, Area)" required /></div>
              <Field id="city" name="city" label="City" required defaultValue="Lahore" />
              <Field id="zip" name="zip" label="Postal code" />
              <div className="sm:col-span-2"><Field id="country" name="country" label="Country" defaultValue="Pakistan" required /></div>
            </div>
          </Section>

          <Section title="Payment method">
            {methods.length === 0 ? (
              <p className="rounded-md border border-border p-4 text-sm text-muted-foreground">No payment methods enabled — please contact the store.</p>
            ) : (
              <RadioGroup value={payMethod} onValueChange={(v) => setPayMethod(v as PayMethod)} className="space-y-3">
                {methods.map((m) => (
                  <label key={m.id} className="flex cursor-pointer items-start justify-between gap-3 rounded-md border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <div className="flex min-w-0 items-start gap-3">
                      <RadioGroupItem value={m.id} id={`pay-${m.id}`} className="mt-1" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{m.label}</p>
                        {m.sub && <p className="mt-0.5 text-xs text-muted-foreground break-words">{m.sub}</p>}
                      </div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            )}

            {payMethod === "easypaisa" && settings?.easypaisaEnabled && (
              <PayDetails
                lines={[
                  ["Easypaisa number", settings.easypaisaNumber ?? "—"],
                  ["Account title", settings.easypaisaAccountName ?? "—"],
                ]}
                hint="Send the total amount and share the screenshot on WhatsApp after placing the order."
              />
            )}
            {payMethod === "jazzcash" && settings?.jazzcashEnabled && (
              <PayDetails
                lines={[
                  ["JazzCash number", settings.jazzcashNumber ?? "—"],
                  ["Account title", settings.jazzcashAccountName ?? "—"],
                ]}
                hint="Send the total amount and share the screenshot on WhatsApp after placing the order."
              />
            )}
            {payMethod === "bank" && settings?.bankEnabled && (
              <PayDetails
                lines={[
                  ["Bank", settings.bankName ?? "—"],
                  ["Account title", settings.bankAccountTitle ?? "—"],
                  ["Account number", settings.bankAccountNumber ?? "—"],
                  ["IBAN", settings.bankIban ?? "—"],
                ]}
                hint="Transfer the total and share the deposit slip on WhatsApp after placing the order."
              />
            )}
          </Section>

          <Section title="Order notes">
            <Textarea name="notes" rows={3} placeholder="Delivery instructions, engraving requests…" />
          </Section>
        </div>

        <aside className="glass h-fit rounded-xl p-4 sm:p-6 lg:sticky lg:top-32">
          <h2 className="font-serif text-xl sm:text-2xl">Order</h2>
          <div className="mt-6 max-h-72 space-y-4 overflow-y-auto border-t border-border/40 pt-6">
            {items.map((i) => (
              <div key={i.id} className="flex gap-3">
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-md bg-card">
                  <img src={i.product.image} alt={i.product.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{i.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty {i.quantity}{i.color ? ` · ${i.color}` : ""}{i.size ? ` · ${i.size}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm">{formatPrice((i.product.salePrice ?? i.product.price) * i.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-border/40 pt-6">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Discount code</Label>
            <div className="mt-1.5 flex gap-2">
              <Input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Enter code" className="h-11 min-w-0 flex-1" />
              <Button type="button" variant="outline" className="h-11 shrink-0" onClick={applyCoupon}>Apply</Button>
            </div>
            {appliedCode && discount > 0 && (
              <p className="mt-2 text-xs text-primary">Code {appliedCode} saves you {formatPrice(discount)}.</p>
            )}
          </div>

          <div className="mt-6 space-y-2 border-t border-border/40 pt-6 text-sm">
            <Line label="Subtotal" value={formatPrice(subtotal)} muted />
            {discount > 0 && <Line label="Discount" value={`− ${formatPrice(discount)}`} accent />}
            <Line label="Delivery" value={shipping === 0 ? "Free" : formatPrice(shipping)} muted />
            {codExtra > 0 && <Line label="COD handling" value={formatPrice(codExtra)} muted />}
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/40 pt-4 font-serif text-lg sm:text-xl">
              <span>Total</span>
              <span className="gold-text">{formatPrice(total)}</span>
            </div>
          </div>

          <Button type="submit" size="lg" className="mt-6 h-12 w-full" disabled={placeOrder.isPending || methods.length === 0}>
            {placeOrder.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            {placeOrder.isPending ? "Placing order…" : "Place Order"}
          </Button>
          {settings?.warrantyNote && (
            <p className="mt-3 text-center text-xs text-muted-foreground">{settings.warrantyNote}</p>
          )}
        </aside>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 font-serif text-xl sm:mb-6 sm:text-2xl">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  id, name, label, type = "text", required, defaultValue,
}: { id: string; name: string; label: string; type?: string; required?: boolean; defaultValue?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input id={id} name={name} type={type} required={required} defaultValue={defaultValue} className="h-11" />
    </div>
  );
}

function PayDetails({ lines, hint }: { lines: [string, string][]; hint: string }) {
  return (
    <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-4 text-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        {lines.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{k}</p>
            <p className="mt-0.5 break-all font-medium">{v}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Line({ label, value, muted, accent }: { label: string; value: string; muted?: boolean; accent?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${muted ? "text-muted-foreground" : ""} ${accent ? "text-primary" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
