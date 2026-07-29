import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { PromoPopup } from "@/components/PromoPopup";
import { AiAssistant } from "@/components/AiAssistant";
import { TrackingPixels } from "@/components/TrackingPixels";
import { AutoTracker } from "@/components/AutoTracker";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  const router = useRouter();

  // Never leave a visitor on a dead end: any unknown or outdated URL quietly
  // returns to the home page instead of showing a 404 screen.
  useEffect(() => {
    router.navigate({ to: "/", replace: true });
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h2 className="font-serif text-2xl">Taking you home…</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          That page has moved. Redirecting you to the Timera home page.
        </p>
        <a
          href="/"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium uppercase tracking-widest text-primary-foreground transition hover:bg-primary/90"
        >
          Return home
        </a>
      </div>
    </div>
  );
}


function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or return home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="h-10 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="h-10 rounded-md border border-border px-6 text-sm font-medium inline-flex items-center">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Timera — Luxury Swiss Watches Online | timera.store" },
      { name: "description", content: "Shop Timera luxury watches: Swiss automatic, chronograph, dress and dive timepieces. Free insured worldwide shipping, 5-year warranty, 30-day returns." },
      { name: "keywords", content: "Timera, timera.store, luxury watches, Swiss watches, automatic watch, mechanical watch, chronograph, dive watch, dress watch, men's luxury watches, women's luxury watches, buy watches online" },
      { name: "author", content: "Timera" },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Timera — Luxury Swiss Watches Online | timera.store" },
      { property: "og:description", content: "Shop Timera luxury watches: Swiss automatic, chronograph, dress and dive timepieces. Free insured worldwide shipping, 5-year warranty, 30-day returns." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Timera" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@timera" },
      { name: "theme-color", content: "#faf8f5" },
      { name: "twitter:title", content: "Timera — Luxury Swiss Watches Online | timera.store" },
      { name: "twitter:description", content: "Shop Timera luxury watches: Swiss automatic, chronograph, dress and dive timepieces. Free insured worldwide shipping, 5-year warranty, 30-day returns." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/36ae3d18-a66d-4d2c-8e58-ed76dda341c9" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/36ae3d18-a66d-4d2c-8e58-ed76dda341c9" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Timera",
          url: "https://timera.store/",
          description: "Swiss luxury watchmaking maison.",
          sameAs: ["https://instagram.com/timera", "https://twitter.com/timera"],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar />
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <CartDrawer />
        <PromoPopup />
        <TrackingPixels />
        <AutoTracker />
        <AiAssistant />


        <Toaster position="bottom-right" theme="light" />
      </div>
    </QueryClientProvider>
  );
}
