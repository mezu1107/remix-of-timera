import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { colorSlug, mapProduct, productsQuery, type Product } from "@/lib/catalog";
import { useCart, useWishlist } from "@/store/shop";
import { Button } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";
import {
  Heart, Minus, Plus, ShoppingBag, Star, ShieldCheck, Truck, RotateCcw, Award,
  Check, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewSummary } from "@/components/product/ReviewSummary";
import { ProductCard } from "@/components/product/ProductCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { trackEvent } from "@/lib/tracking";

export const Route = createFileRoute("/product/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    color: typeof search.color === "string" && search.color ? search.color : undefined,
  }),
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", params.slug)
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { product: mapProduct(data) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Not found — Timera" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData.product;
    return {
      meta: [
        { title: `${p.name} — ${p.brand} Watch | Timera` },
        { name: "description", content: p.description.slice(0, 155) },
        { name: "keywords", content: `${p.name}, ${p.brand}, ${p.collection} watch, ${p.movement}, ${p.case} watch, luxury watch, Timera` },
        { property: "og:title", content: `${p.name} — Timera` },
        { property: "og:description", content: p.description.slice(0, 155) },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `https://timera.store/product/${p.slug}` },
        { property: "og:image", content: p.image },
        { name: "twitter:image", content: p.image },
      ],
      links: [{ rel: "canonical", href: `https://timera.store/product/${p.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            image: p.image,
            description: p.description,
            brand: { "@type": "Brand", name: p.brand },
            aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews },
            offers: {
              "@type": "Offer",
              url: `https://timera.store/product/${p.slug}`,
              priceCurrency: "PKR",
              price: p.price,
              availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
          }),
        },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: Product };
  const { color: colorParam } = Route.useSearch();
  const navigate = useNavigate();
  // A colour can be opened directly, e.g. /product/nocturne?color=midnight-blue
  const initialColor =
    product.colors.find((c) => colorSlug(c.name) === colorParam) ?? product.colors[0];
  const add = useCart((s) => s.add);
  const wish = useWishlist();
  const inWish = wish.ids.includes(product.id);

  const [selectedImg, setSelectedImg] = useState(0);
  const [color, setColor] = useState(initialColor.name);
  // When a colour has its own photo, that photo replaces the gallery shot.
  const [colorImage, setColorImage] = useState<string | null>(initialColor.image ?? null);
  const [size, setSize] = useState(product.sizes[0]);
  const [qty, setQty] = useState(1);

  const mainImage = colorImage ?? product.gallery[selectedImg];

  const { data: allProducts = [] } = useQuery(productsQuery);
  const related = allProducts.filter((p) => p.id !== product.id && p.collection === product.collection).slice(0, 4);

  useEffect(() => {
    void trackEvent("view_item", {
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      value: product.salePrice ?? product.price,
      metadata: { collection: product.collection, category: product.category },
    });
  }, [product.id, product.slug, product.name, product.price, product.salePrice, product.collection, product.category]);

  return (
    <div className="container-luxe py-8 md:py-12">
      <nav className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-8">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/shop" className="hover:text-primary">Shop</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex gap-4 lg:sticky lg:top-32 lg:self-start">
          <div className="hidden md:flex flex-col gap-3">
            {product.gallery.map((img, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedImg(i);
                  setColorImage(null);
                }}
                className={cn(
                  "h-20 w-20 rounded-md overflow-hidden border-2 transition",
                  !colorImage && selectedImg === i ? "border-primary" : "border-transparent hover:border-border",
                )}
              >
                <img src={img} alt="" width={80} height={80} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <div className="relative flex-1 aspect-square rounded-2xl overflow-hidden bg-card shadow-luxe">
            <img
              key={mainImage}
              src={mainImage}
              alt={`${product.name} in ${color}`}
              width={800}
              height={800}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover animate-in fade-in duration-300"
            />

            {product.badge && (
              <span className="absolute top-6 left-6 px-3 py-1.5 rounded-sm bg-primary text-primary-foreground text-[10px] uppercase tracking-widest font-medium">
                {product.badge}
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary">{product.brand} · {product.collection}</p>
          <h1 className="mt-3 font-serif text-4xl md:text-5xl leading-tight">{product.name}</h1>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1 text-primary">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("h-4 w-4", i < Math.round(product.rating) ? "fill-current" : "opacity-30")} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{product.rating.toFixed(1)} · {product.reviews} reviews</span>
          </div>

          <div className="mt-6 flex items-baseline gap-4">
            <span className="font-serif text-4xl gold-text">{formatPrice(product.price)}</span>
            {product.compareAt && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(product.compareAt)}</span>
            )}
          </div>

          <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>

          {/* Color */}
          <div className="mt-8">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Color: <span className="text-foreground">{color}</span>
            </p>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  onMouseEnter={() => {
                    // Warm the browser cache so the swap is instant on click.
                    if (c.image) new Image().src = c.image;
                  }}
                  onClick={() => {
                    setColor(c.name);
                    setColorImage(c.image ?? null);
                    navigate({
                      to: "/product/$slug",
                      params: { slug: product.slug },
                      search: { color: colorSlug(c.name) },
                      replace: true,
                    });
                  }}
                  title={c.name}
                  className={cn(
                    "h-10 w-10 rounded-full ring-offset-2 ring-offset-background transition overflow-hidden",
                    color === c.name ? "ring-2 ring-primary" : "ring-1 ring-border hover:ring-primary/50",
                  )}
                  style={{ backgroundColor: c.hex }}
                  aria-label={c.name}
                  aria-pressed={color === c.name}
                >
                  {c.image && (
                    <img src={c.image} alt="" width={40} height={40} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  )}
                </button>
              ))}
            </div>

          </div>

          {/* Size */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Case Size: <span className="text-foreground">{size}</span>
              </p>
              <button className="text-xs text-primary hover:underline">Size guide</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSize(sz)}
                  className={cn(
                    "min-w-[64px] px-4 h-11 rounded-md border text-sm font-medium transition",
                    size === sz ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Stock */}
          <div className="mt-6 flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-muted-foreground">
              Only <span className="text-foreground font-medium">{product.stock}</span> in stock — ships within 24 hours
            </span>
          </div>

          {/* Quantity + Actions */}
          <div className="mt-8 flex gap-3">
            <div className="flex items-center rounded-md border border-border">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3 hover:text-primary transition">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-3 hover:text-primary transition">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              size="lg"
              className="flex-1 h-14 text-xs uppercase tracking-[0.25em]"
              onClick={() => {
                add(product, { color, size, quantity: qty });
                toast.success(`${product.name} added to cart`);
              }}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Add to cart
            </Button>
            <Button
              size="lg"
              variant="outline"
              className={cn("h-14 w-14 p-0", inWish && "text-primary border-primary")}
              onClick={() => {
                wish.toggle(product.id);
                toast.success(inWish ? "Removed from wishlist" : "Added to wishlist");
              }}
            >
              <Heart className={cn("h-5 w-5", inWish && "fill-current")} />
            </Button>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="mt-3 w-full h-12 border-primary/40"
            onClick={() => {
              add(product, { color, size, quantity: qty });
              navigate({ to: "/checkout" });
            }}
          >
            Buy now with express checkout
          </Button>

          {/* Trust */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { icon: Truck, text: "Complimentary insured shipping" },
              { icon: RotateCcw, text: "30-day returns" },
              { icon: ShieldCheck, text: "5-year warranty" },
              { icon: Award, text: "Authenticity guaranteed" },
            ].map((t) => (
              <div key={t.text} className="flex items-center gap-3 text-sm">
                <t.icon className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{t.text}</span>
              </div>
            ))}
          </div>

          {/* Accordion */}
          <Accordion type="single" collapsible className="mt-10">
            <AccordionItem value="specs">
              <AccordionTrigger className="text-xs uppercase tracking-widest">Specifications</AccordionTrigger>
              <AccordionContent>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Movement", product.movement],
                    ["Case", product.case],
                    ["Strap", product.strap],
                    ["Water Resistance", product.waterResistance],
                    ["Collection", product.collection],
                    ["Brand", product.brand],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-muted-foreground text-xs uppercase tracking-widest">{k}</dt>
                      <dd className="mt-1">{v}</dd>
                    </div>
                  ))}
                </dl>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="features">
              <AccordionTrigger className="text-xs uppercase tracking-widest">Features</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger className="text-xs uppercase tracking-widest">Shipping & Returns</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Complimentary express shipping worldwide with insurance and signature on delivery. Orders placed before 2pm CET ship the same day.
                Enjoy 30-day returns for a full refund — we cover the reverse logistics.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Reviews & Description */}
      <div className="mt-24">
        <Tabs defaultValue="description">
          <TabsList className="w-full justify-start border-b border-border/60 bg-transparent rounded-none h-auto p-0">
            <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 text-xs uppercase tracking-widest">
              Description
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 text-xs uppercase tracking-widest">
              Reviews ({product.reviews})
            </TabsTrigger>
            <TabsTrigger value="care" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 text-xs uppercase tracking-widest">
              Care
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="pt-10">
            <div className="prose prose-invert max-w-3xl">
              <p className="text-base leading-relaxed text-muted-foreground">{product.description}</p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                From the polished bevels of the lugs to the applied indices on the dial, every surface reveals the deliberate hand of a master finisher. The movement, visible through a sapphire caseback, is regulated in five positions to chronometer standards.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="pt-10">
            <div className="mb-10 max-w-3xl">
              <ReviewSummary productId={product.id} />
            </div>
            <div className="grid gap-10 md:grid-cols-[300px_1fr]">
              <div>
                <div className="font-serif text-6xl gold-text">{product.rating.toFixed(1)}</div>
                <div className="mt-2 flex text-primary">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("h-4 w-4", i < Math.round(product.rating) && "fill-current")} />)}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Based on {product.reviews} reviews</p>
              </div>
              <div className="space-y-6">
                {[
                  { name: "Marcus D.", date: "2 weeks ago", rating: 5, text: "The finish is exquisite. I've owned pieces at 3x the price with less soul." },
                  { name: "Elena V.", date: "1 month ago", rating: 5, text: "Wore it for a black-tie event and got three compliments in one hour." },
                  { name: "Thomas R.", date: "2 months ago", rating: 4, text: "Beautiful movement. The strap softens up nicely after a few weeks of wear." },
                ].map((r) => (
                  <div key={r.name} className="pb-6 border-b border-border/40">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <div className="flex text-primary mt-1">
                          {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("h-3 w-3", i < r.rating && "fill-current")} />)}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{r.date}</span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{r.text}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-primary">
                      <Check className="h-3 w-3" /> Verified purchase
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="care" className="pt-10">
            <ul className="max-w-2xl space-y-3 text-sm text-muted-foreground">
              <li>• Rinse with fresh water after exposure to salt or chlorine.</li>
              <li>• Avoid magnetic fields and sudden shocks.</li>
              <li>• Service every 4–5 years at an authorized atelier.</li>
              <li>• Wipe the case and bracelet with a soft microfiber cloth weekly.</li>
            </ul>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-24">
          <h2 className="font-serif text-3xl md:text-4xl">You may also love</h2>
          <div className="mt-10 grid gap-x-6 gap-y-12 grid-cols-2 lg:grid-cols-4">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
