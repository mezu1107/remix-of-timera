import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Award, Gem, Globe2, Shield, ShieldCheck, Sparkles, Star, Truck, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import atelierImage from "@/assets/atelier.jpg";
import { productsQuery, collectionsQuery, blogPostsQuery, heroSlidesQuery, testimonialsQuery } from "@/lib/catalog";
import { useQuery } from "@tanstack/react-query";
import { siteSettingsQuery } from "@/lib/site-settings";

import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Timera — Luxury Swiss Watches Online | timera.store" },
      { name: "description", content: "Shop Timera luxury watches: Swiss automatic, chronograph, dress and dive timepieces. Free insured worldwide shipping, 5-year warranty, 30-day returns." },
      { name: "keywords", content: "Timera, luxury watches, Swiss watches, automatic watches, chronograph, men's watches, women's watches, buy watches online, timera.store" },
      { property: "og:title", content: "Timera — Luxury Swiss Watches Online | timera.store" },
      { property: "og:description", content: "Shop Timera luxury watches: Swiss automatic, chronograph, dress and dive timepieces. Free insured worldwide shipping, 5-year warranty, 30-day returns." },
      { property: "og:url", content: "https://timera.store/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://timera.store/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Timera",
          url: "https://timera.store/",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://timera.store/shop?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  component: HomePage,
});

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff / 3600000) % 24),
    m: Math.floor((diff / 60000) % 60),
    s: Math.floor((diff / 1000) % 60),
  };
}

function HeroSlider() {
  const { data: slides = [] } = useQuery(heroSlidesQuery);
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const next = useCallback(() => setIndex((i) => (count ? (i + 1) % count : 0)), [count]);
  const prev = useCallback(() => setIndex((i) => (count ? (i - 1 + count) % count : 0)), [count]);

  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(next, 6500);
    return () => clearInterval(t);
  }, [count, next]);

  if (!count) {
    return <div className="h-[62vh] min-h-[460px] bg-muted animate-pulse" />;
  }

  const slide = slides[Math.min(index, count - 1)];

  return (
    <section className="relative h-[78vh] min-h-[520px] max-h-[860px] overflow-hidden bg-muted">
      <AnimatePresence mode="sync">
        <motion.img
          key={slide.id}
          src={slide.image}
          alt={slide.title}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/50 to-transparent" />

      <div className="container-luxe relative h-full flex items-center">
        <motion.div
          key={`copy-${slide.id}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          {slide.eyebrow && (
            <div className="inline-flex items-center gap-2 rounded-full bg-card/80 backdrop-blur px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-primary border border-border">
              <Sparkles className="h-3 w-3" /> {slide.eyebrow}
            </div>
          )}
          <h1 className="mt-6 font-serif text-5xl leading-[1.03] sm:text-6xl lg:text-7xl">
            {slide.title}{" "}
            {slide.titleAccent && <span className="gold-text italic">{slide.titleAccent}</span>}
          </h1>
          {slide.description && (
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">{slide.description}</p>
          )}
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="h-12 px-8 text-xs uppercase tracking-[0.25em]">
              <Link to={(slide.ctaHref as any) || "/shop"}>
                {slide.ctaLabel || "Shop Now"} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-xs uppercase tracking-[0.25em]">
              <Link to="/about">Our Story</Link>
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> 5-Year Warranty</div>
            <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Free Insured Shipping</div>
            <div className="flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Swiss Made</div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-6 left-0 right-0">
        <div className="container-luxe flex items-center justify-between">
          <div className="flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1 rounded-full transition-all duration-500 ${i === index ? "w-10 bg-primary" : "w-4 bg-foreground/25"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prev} aria-label="Previous slide" className="h-10 w-10 rounded-full bg-card/80 backdrop-blur border border-border flex items-center justify-center hover:text-primary transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={next} aria-label="Next slide" className="h-10 w-10 rounded-full bg-card/80 backdrop-blur border border-border flex items-center justify-center hover:text-primary transition">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function LimitedEditionBanner() {
  const { data: settings } = useQuery(siteSettingsQuery);
  const endsAt = settings?.featureEndsAt ? new Date(settings.featureEndsAt) : null;
  const { d, h, m, s } = useCountdown(endsAt ?? new Date());

  if (!settings?.featureEnabled) return null;

  const title = settings.featureTitle ?? "";
  const accent = settings.featureTitleAccent;

  return (
    <section className="container-luxe">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-onyx p-6 sm:p-10 md:p-16">
        {settings.featureImageUrl && (
          <>
            <img
              src={settings.featureImageUrl}
              alt={[title, accent].filter(Boolean).join(" ")}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-onyx via-onyx/85 to-onyx/40" />
          </>
        )}
        <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
          <div className="min-w-0">
            {settings.featureEyebrow && (
              <p className="text-[11px] uppercase tracking-[0.3em] text-primary">{settings.featureEyebrow}</p>
            )}
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl">
              {title} {accent && <span className="italic gold-text">{accent}</span>}
            </h2>
            {settings.featureDescription && (
              <p className="mt-4 max-w-md text-sm text-muted-foreground sm:text-base">{settings.featureDescription}</p>
            )}
            {settings.featureCtaLabel && (
              <Button asChild size="lg" className="mt-6 h-12 px-8 sm:mt-8">
                <Link to={(settings.featureCtaHref || "/shop") as any}>{settings.featureCtaLabel}</Link>
              </Button>
            )}
          </div>
          {endsAt && (
            <div className="grid grid-cols-4 gap-2 sm:gap-3 md:justify-end">
              {[
                { label: "Days", value: d },
                { label: "Hours", value: h },
                { label: "Minutes", value: m },
                { label: "Seconds", value: s },
              ].map((c) => (
                <div key={c.label} className="rounded-lg border border-border bg-card p-3 text-center sm:p-4 md:p-6">
                  <div className="font-serif text-2xl gold-text tabular-nums sm:text-3xl md:text-5xl">
                    {String(c.value).padStart(2, "0")}
                  </div>
                  <div className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground sm:text-[10px]">
                    {c.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HomePage() {
  const { data: products = [] } = useQuery(productsQuery);
  const { data: collectionsList = [] } = useQuery(collectionsQuery);
  const { data: blogPosts = [] } = useQuery(blogPostsQuery);
  const { data: testimonials = [] } = useQuery(testimonialsQuery);

  const featured = products.filter((p) => p.featured).slice(0, 8);
  const grid = featured.length ? featured : products.slice(0, 8);
  const bestsellers = products.filter((p) => p.badge === "Bestseller").slice(0, 4);
  const newArrivals = products.filter((p) => p.badge === "New").slice(0, 4);


  return (
    <>
      <HeroSlider />

      {/* COLLECTIONS */}
      <section className="container-luxe py-16 sm:py-24">
        <SectionHeading eyebrow="Curated" title="Signature Collections" href="/collections" />
        <div className="mt-10 grid gap-4 sm:mt-14 md:grid-cols-2 lg:grid-cols-3">
          {collectionsList.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
            >
              <Link to="/collections/$slug" params={{ slug: c.slug }} className="group relative block aspect-[4/5] overflow-hidden rounded-lg bg-card">
                {c.image && (
                  <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1500ms] group-hover:scale-110" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-background sm:p-6">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-background/80">{c.tagline}</p>
                  <h3 className="mt-2 font-serif text-2xl sm:text-3xl">{c.name}</h3>
                  <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-widest opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                    Explore <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* LIMITED EDITION — fully admin-controlled */}
      <LimitedEditionBanner />


      {/* FEATURED PRODUCTS */}
      <section className="container-luxe py-24">
        <SectionHeading eyebrow="Trending" title="This Season's Finest" href="/shop" />
        <div className="mt-14 grid gap-x-6 gap-y-12 grid-cols-2 lg:grid-cols-4">
          {grid.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} priority={i < 4} />
          ))}
        </div>
      </section>

      {/* ATELIER STORY */}
      <section className="container-luxe py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[5/6] overflow-hidden rounded-2xl">
            <img src={atelierImage} alt="The Timera atelier" loading="lazy" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Our Maison</p>
            <h2 className="mt-3 font-serif text-4xl md:text-6xl leading-[1.05]">
              Three generations,<br />
              <span className="italic gold-text">one obsession.</span>
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed max-w-lg">
              Since 1963, the Timera atelier has resisted the seduction of scale. We remain a maison of fourteen
              watchmakers, each of whom signs the movement they assemble. Every dial is finished with a technique
              our founder learned from his grandfather.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-6">
              {[
                { n: "62", l: "Years of craft" },
                { n: "14", l: "Master watchmakers" },
                { n: "82", l: "Countries served" },
              ].map((st) => (
                <div key={st.l}>
                  <div className="font-serif text-4xl gold-text">{st.n}</div>
                  <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{st.l}</div>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" size="lg" className="mt-10 h-12 px-8">
              <Link to="/about">Read Our Story <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* TRUST GRID */}
      <section className="container-luxe py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Gem, title: "Swiss-Made", desc: "Assembled by hand in Neuchâtel" },
            { icon: Shield, title: "5-Year Warranty", desc: "International movement guarantee" },
            { icon: Globe2, title: "Insured Shipping", desc: "Signature-required, worldwide" },
            { icon: Sparkles, title: "White-Glove Returns", desc: "30 days, complimentary" },
          ].map((f) => (
            <div key={f.title} className="group rounded-xl border border-border bg-card p-8 hover:border-primary/50 hover:shadow-luxe transition-all">
              <f.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-6 font-serif text-2xl">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BEST SELLERS */}
      {bestsellers.length > 0 && (
        <section className="container-luxe py-24">
          <SectionHeading eyebrow="Loved by collectors" title="Bestsellers" href="/shop" />
          <div className="mt-14 grid gap-x-6 gap-y-12 grid-cols-2 lg:grid-cols-4">
            {bestsellers.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* TESTIMONIALS — two rows, opposite directions */}
      {testimonials.length > 0 && (
      <section className="bg-onyx py-16 sm:py-24 overflow-hidden">
        <div className="container-luxe">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Voices</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">
              The word from <span className="italic gold-text">our clients</span>
            </h2>
          </div>
        </div>
        {(() => {
          const half = Math.ceil(testimonials.length / 2);
          const rowA = testimonials.slice(0, half);
          const rowB = testimonials.slice(half).length ? testimonials.slice(half) : testimonials.slice(0, half);
          const Card = ({ t }: { t: typeof testimonials[number] }) => (
            <div className="mx-3 w-[300px] sm:w-[360px] shrink-0 rounded-xl border border-border bg-card p-6">
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: Math.max(1, Math.min(5, t.rating)) }).map((_, k) => (
                  <Star key={k} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <p className="mt-4 font-serif text-lg leading-snug line-clamp-4">"{t.quote}"</p>
              <div className="mt-6 border-t border-border pt-4">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          );
          const Row = ({ items, reverse }: { items: typeof testimonials; reverse?: boolean }) => (
            <div
              className="group relative mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
            >
              <div className={`flex w-max ${reverse ? "marquee-reverse" : "marquee-slow"} group-hover:[animation-play-state:paused]`}>
                {[...items, ...items].map((t, i) => <Card key={`${t.id}-${i}`} t={t} />)}
              </div>
            </div>
          );
          return (
            <>
              <Row items={rowA} />
              <Row items={rowB} reverse />
            </>
          );
        })()}
      </section>
      )}


      {/* NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="container-luxe py-24">
          <SectionHeading eyebrow="Just landed" title="New Arrivals" href="/shop" />
          <div className="mt-14 grid gap-x-6 gap-y-12 grid-cols-2 lg:grid-cols-4">
            {newArrivals.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* JOURNAL */}
      {blogPosts.length > 0 && (
        <section className="container-luxe py-24">
          <SectionHeading eyebrow="The Journal" title="Notes from the atelier" href="/blog" />
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {blogPosts.slice(0, 4).map((post) => (
              <Link key={post.id} to="/blog" className="group block">
                <div className="aspect-[4/5] overflow-hidden rounded-lg bg-card">
                  {post.image && (
                    <img src={post.image} alt={post.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-widest text-primary">{post.category} · {post.date}</p>
                  <h3 className="mt-2 font-serif text-xl leading-tight group-hover:text-primary transition">{post.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* NEWSLETTER */}
      <section className="container-luxe pb-24">
        <div className="relative overflow-hidden rounded-2xl bg-onyx p-12 md:p-20 text-center border border-border">
          <div className="relative max-w-2xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Le Cercle</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">
              Join the <span className="italic gold-text">inner circle</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Private previews, limited releases, and stories from the atelier. Delivered monthly.
            </p>
            <form className="mt-8 flex max-w-md mx-auto gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 h-12 px-4 rounded-md bg-card border border-border text-sm focus:outline-none focus:border-primary transition"
              />
              <Button type="submit" size="lg" className="h-12 px-6">Subscribe</Button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ eyebrow, title, href }: { eyebrow: string; title: string; href?: string }) {
  return (
    <div className="flex items-end justify-between gap-8 flex-wrap">
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
        <h2 className="mt-3 font-serif text-4xl md:text-5xl">{title}</h2>
      </div>
      {href && (
        <Link to={href as any} className="group flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-primary transition">
          View all <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
        </Link>
      )}
    </div>
  );
}
