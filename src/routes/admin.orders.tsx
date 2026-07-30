import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Package, Loader2, Mail, Phone, MapPin, Truck } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({ component: OrdersAdmin });

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

type OrderItem = {
  name?: string;
  brand?: string | null;
  slug?: string | null;
  image_url?: string | null;
  price?: number;
  quantity?: number;
  color?: string | null;
  size?: string | null;
};

const fmt = (v?: string | null) =>
  v ? new Date(v).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const toLocalInput = (v?: string | null) => {
  if (!v) return "";
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function OrdersAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const list = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Record<string, any>[];
    },
    refetchInterval: 30_000,
  });

  const rows = useMemo(() => {
    const t = search.trim().toLowerCase();
    const all = list.data ?? [];
    if (!t) return all;
    return all.filter((r) => Object.values(r).some((v) => typeof v === "string" && v.toLowerCase().includes(t)));
  }, [list.data, search]);

  const open = (row: Record<string, any>) => {
    setActive(row);
    setForm({
      status: row.status ?? "pending",
      courier: row.courier ?? "",
      tracking_number: row.tracking_number ?? "",
      estimated_delivery: toLocalInput(row.estimated_delivery),
      notes: row.notes ?? "",
    });
  };

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from("orders") as any)
        .update({
          status: form.status,
          courier: form.courier || null,
          tracking_number: form.tracking_number || null,
          estimated_delivery: form.estimated_delivery ? new Date(form.estimated_delivery).toISOString() : null,
          notes: form.notes || null,
        })
        .eq("id", active!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order updated — customer tracking is live");
      setActive(null);
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update the order"),
  });

  const items: OrderItem[] = Array.isArray(active?.items) ? (active!.items as OrderItem[]) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every order with the exact products, images and customer details. Update status, courier and tracking number —
          the customer's tracking page updates instantly.
        </p>
      </div>

      <Input placeholder="Search order, customer, email…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {list.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading orders…
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-border/70 p-8 text-center text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const rowItems: OrderItem[] = Array.isArray(row.items) ? row.items : [];
            return (
              <button
                key={row.id}
                onClick={() => open(row)}
                className="w-full rounded-2xl border border-border/70 p-4 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {rowItems.slice(0, 3).map((it, i) =>
                        it.image_url ? (
                          <img
                            key={i}
                            src={it.image_url}
                            alt={it.name ?? "Product"}
                            loading="lazy"
                            className="h-11 w-11 rounded-lg border-2 border-background object-cover"
                          />
                        ) : (
                          <div key={i} className="h-11 w-11 rounded-lg border-2 border-background bg-muted flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ),
                      )}
                      {rowItems.length > 3 && (
                        <div className="h-11 w-11 rounded-lg border-2 border-background bg-muted text-xs flex items-center justify-center">
                          +{rowItems.length - 3}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{row.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.customer_name} · {rowItems.length} item{rowItems.length === 1 ? "" : "s"} · {fmt(row.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-widest text-primary">
                      {row.status}
                    </span>
                    <span className="font-medium">{formatPrice(Number(row.total))}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl sm:text-2xl">Order {active?.order_number}</DialogTitle>
          </DialogHeader>

          {active && (
            <div className="space-y-6">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p className="flex gap-2"><Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />{active.customer_email}</p>
                <p className="flex gap-2"><Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />{active.customer_phone ?? "—"}</p>
                <p className="flex gap-2 sm:col-span-2"><MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />{active.shipping_address ?? "—"}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Products ordered</p>
                <div className="mt-3 divide-y divide-border/60">
                  {items.map((it, i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                      {it.image_url ? (
                        <img src={it.image_url} alt={it.name ?? "Product"} loading="lazy" className="h-16 w-16 rounded-lg border border-border/60 object-cover" />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{it.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[it.brand, it.slug, it.color, it.size].filter(Boolean).join(" · ") || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(Number(it.price ?? 0))} × {it.quantity ?? 1}
                        </p>
                      </div>
                      <p className="text-sm">{formatPrice(Number(it.price ?? 0) * Number(it.quantity ?? 1))}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatPrice(Number(active.subtotal))}</span></div>
                  {Number(active.discount) > 0 && (
                    <div className="flex justify-between text-primary"><span>Discount {active.coupon_code ? `(${active.coupon_code})` : ""}</span><span>−{formatPrice(Number(active.discount))}</span></div>
                  )}
                  <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>{Number(active.shipping) > 0 ? formatPrice(Number(active.shipping)) : "Free"}</span></div>
                  <div className="flex justify-between pt-1 font-medium"><span>Total</span><span>{formatPrice(Number(active.total))}</span></div>
                </div>
              </div>

              {Array.isArray(active.status_history) && active.status_history.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Status history</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {(active.status_history as { status: string; at: string }[]).map((h, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="capitalize">{h.status}</span>
                        <span className="text-muted-foreground">{fmt(h.at)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Courier</Label>
                  <Input className="mt-1" placeholder="TCS / Leopards / M&P" value={form.courier} onChange={(e) => setForm((f) => ({ ...f, courier: e.target.value }))} />
                </div>
                <div>
                  <Label>Tracking number</Label>
                  <Input className="mt-1" value={form.tracking_number} onChange={(e) => setForm((f) => ({ ...f, tracking_number: e.target.value }))} />
                </div>
                <div>
                  <Label>Estimated delivery</Label>
                  <Input className="mt-1" type="datetime-local" value={form.estimated_delivery} onChange={(e) => setForm((f) => ({ ...f, estimated_delivery: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Internal notes</Label>
                  <Textarea className="mt-1" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setActive(null)}>Cancel</Button>
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Truck className="mr-2 h-4 w-4" />Save & update tracking</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
