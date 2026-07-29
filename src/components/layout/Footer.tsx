import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube, Twitter, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const cols = [
  {
    title: "Maison",
    links: [
      { label: "Our Story", to: "/about" },
      { label: "Craftsmanship", to: "/about" },
      { label: "Journal", to: "/blog" },
      { label: "Sustainability", to: "/about" },
    ],
  },
  {
    title: "Client Care",
    links: [
      { label: "Contact", to: "/contact" },
      { label: "FAQ", to: "/faq" },
      { label: "Shipping", to: "/policies/shipping" },
      { label: "Returns", to: "/policies/refund" },
      { label: "Warranty", to: "/policies/warranty" },
      { label: "Track Order", to: "/track" },
    ],
  },
  {
    title: "Discover",
    links: [
      { label: "Shop All", to: "/shop" },
      { label: "New Arrivals", to: "/shop" },
      { label: "Bestsellers", to: "/shop" },
      { label: "Wishlist", to: "/wishlist" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/policies/privacy" },
      { label: "Terms of Service", to: "/policies/terms" },
      { label: "Cookie Policy", to: "/policies/cookies" },
      { label: "Trust & Security", to: "/trust" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-border/60 bg-onyx">
      <div className="container-luxe py-20">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_2.6fr]">
          <div>
            <span className="font-serif text-3xl gold-text">TIMERA</span>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
              A Swiss maison crafting mechanical timepieces of extraordinary restraint. Every watch is
              assembled by hand in our Neuchâtel atelier.
            </p>
            <form className="mt-8 flex max-w-md gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Your email address"
                  className="pl-9 h-11 bg-card/50 border-border/60"
                />
              </div>
              <Button type="submit" className="h-11 px-6">Subscribe</Button>
            </form>
            <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground/60">
              Receive private previews & atelier stories
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            {cols.map((c) => (
              <div key={c.title}>
                <h4 className="mb-5 text-[11px] uppercase tracking-[0.28em] text-primary">{c.title}</h4>
                <ul className="space-y-3">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        to={l.to as any}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col-reverse items-center justify-between gap-6 border-t border-border/40 pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Timera. All rights reserved. Store built by AM Enterprises.
          </p>
          <div className="flex items-center gap-4">
            {[Instagram, Facebook, Youtube, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Social"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
