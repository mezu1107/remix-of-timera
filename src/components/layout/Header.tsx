import { Link } from "@tanstack/react-router";
import { Heart, Search, ShoppingBag, User, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart, useWishlist } from "@/store/shop";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { siteSettingsQuery } from "@/lib/site-settings";
import { supabase } from "@/integrations/supabase/client";

const defaultNav = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Deals", href: "/deals" },
  { label: "Journal", href: "/blog" },
  { label: "Atelier", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Track Order", href: "/track" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const cartCount = useCart((s) => s.items.reduce((a, i) => a + i.quantity, 0));
  const wishCount = useWishlist((s) => s.ids.length);
  const toggleCart = useCart((s) => s.toggle);
  const { data: settings } = useQuery(siteSettingsQuery);

  const nav = settings?.navLinks?.length ? settings.navLinks : defaultNav;
  const brand = settings?.brandName || "TIMERA";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const Brand = (
    <>
      {settings?.logoUrl ? (
        <img src={settings.logoUrl} alt={brand} className="h-10 w-auto max-w-[190px] object-contain sm:h-12" />
      ) : (
        <span className="font-serif text-2xl font-semibold tracking-tight gold-text sm:text-3xl lg:text-4xl">{brand}</span>
      )}
      {settings?.brandSuffix && (
        <span className="hidden sm:inline text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          {settings.brandSuffix}
        </span>
      )}
    </>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500",
        scrolled ? "glass shadow-luxe" : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="container-luxe grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:h-20 sm:gap-4 lg:flex lg:justify-between lg:gap-6">
        <button
          className="lg:hidden shrink-0 text-foreground"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="flex min-w-0 items-baseline gap-1">
          {Brand}
        </Link>

        <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
          {nav.map((n) => (
            <Link
              key={n.label}
              to={n.href as any}
              className="relative text-[13px] uppercase tracking-[0.2em] text-foreground/80 transition-colors hover:text-primary group"
            >
              {n.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
            <Link to="/shop" aria-label="Search">
              <Search className="h-[18px] w-[18px]" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to={signedIn ? "/account" : "/auth"} aria-label={signedIn ? "My account" : "Sign in"}>
              <User className="h-[18px] w-[18px]" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link to="/wishlist" aria-label="Wishlist">
              <Heart className="h-[18px] w-[18px]" />
              {wishCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground flex items-center justify-center">
                  {wishCount}
                </span>
              )}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleCart} className="relative" aria-label="Cart">
            <ShoppingBag className="h-[18px] w-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile drawer — a side panel, not a full-screen takeover */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[80vw] max-w-xs overflow-y-auto p-0">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt={brand} className="h-7 w-auto max-w-[120px] object-contain" />
            ) : (
              <span className="font-serif text-xl gold-text">{brand}</span>
            )}
          </div>
          <nav className="flex flex-col px-2 py-3">
            {nav.map((n) => (
              <Link
                key={n.label}
                to={n.href as any}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-3 font-serif text-lg text-foreground transition-colors hover:bg-muted hover:text-primary"
              >
                {n.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            <Link
              to={signedIn ? "/account" : "/auth"}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-3 text-sm uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {signedIn ? "My account" : "Sign in / Register"}
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-3 text-sm uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Wishlist
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
