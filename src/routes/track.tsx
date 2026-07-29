import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Package, CheckCircle2, Truck, Home } from "lucide-react";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Your Order — Timera" },
      { name: "description", content: "Track your Timera order in real time." },
      { property: "og:title", content: "Track Order — Timera" },
      { property: "og:description", content: "Track your Timera order." },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const [tracking, setTracking] = useState<string | null>(null);
  const [order, setOrder] = useState("");

  const steps = [
    { icon: CheckCircle2, label: "Order confirmed", date: "Mar 5, 10:12" },
    { icon: Package, label: "Assembled & packed", date: "Mar 6, 09:44" },
    { icon: Truck, label: "In transit", date: "Mar 7, 14:20", active: true },
    { icon: Home, label: "Delivered", date: "Est. Mar 8" },
  ];

  return (
    <div className="container-luxe py-16 max-w-2xl">
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Track Order</p>
      <h1 className="mt-3 font-serif text-5xl">Where's my watch?</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); setTracking(order || "AUR84512"); }}
        className="mt-8 flex gap-2"
      >
        <Input placeholder="Order number (e.g. AUR84512)" value={order} onChange={(e) => setOrder(e.target.value)} className="h-12" />
        <Button type="submit" size="lg" className="h-12 px-8">Track</Button>
      </form>

      {tracking && (
        <div className="mt-10 glass rounded-2xl p-8">
          <div className="flex justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Order</p>
              <p className="font-serif text-2xl">{tracking}</p>
            </div>
            <span className="rounded-full bg-primary/10 text-primary text-xs px-3 py-1 h-fit uppercase tracking-widest">In transit</span>
          </div>
          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${s.active || i < 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 pt-1.5">
                  <p className="font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
