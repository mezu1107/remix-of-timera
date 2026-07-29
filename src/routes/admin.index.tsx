import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

function useCount(table: "products" | "hero_slides" | "collections" | "blog_posts" | "orders") {
  return useQuery({
    queryKey: ["admin", "count", table],
    queryFn: async () => {
      const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

function AdminOverview() {
  const products = useCount("products");
  const slides = useCount("hero_slides");
  const collections = useCount("collections");
  const posts = useCount("blog_posts");
  const orders = useCount("orders");

  const revenue = useQuery({
    queryKey: ["admin", "revenue"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("total");
      if (error) throw error;
      return (data ?? []).reduce((a, o) => a + Number(o.total ?? 0), 0);
    },
  });

  const cards = [
    { label: "Products", value: products.data ?? 0, to: "/admin/products" },
    { label: "Hero Slides", value: slides.data ?? 0, to: "/admin/hero" },
    { label: "Collections", value: collections.data ?? 0, to: "/admin/collections" },
    { label: "Journal Posts", value: posts.data ?? 0, to: "/admin/blog" },
    { label: "Orders", value: orders.data ?? 0, to: "/admin/orders" },
    { label: "Revenue", value: formatPrice(revenue.data ?? 0), to: "/admin/orders" },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl md:text-4xl">Overview</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Every change you make here appears on the public storefront immediately.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to as any} className="rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.label}</p>
            <p className="mt-3 font-serif text-4xl gold-text">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
