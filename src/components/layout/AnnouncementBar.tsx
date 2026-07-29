import { useQuery } from "@tanstack/react-query";
import { siteSettingsQuery, warrantyLabel } from "@/lib/site-settings";

/**
 * Single always-running line. Everything the owner adds in Admin → Settings
 * (ticker messages + "Featured in" names) scrolls here, on one line.
 */
export function AnnouncementBar() {
  const { data: settings } = useQuery(siteSettingsQuery);

  if (settings && !settings.marqueeEnabled) return null;

  const featured = settings?.featuredIn ?? [];
  const isFeaturedLine = (t: string) => /^featured in/i.test(t.trim());
  const items = settings
    ? [
        ...settings.marqueeItems.filter((t) => !isFeaturedLine(t)),
        ...featured.map((n) => `Featured in ${n}`),
      ]
    : [];


  const messages = items.length
    ? items
    : [`${warrantyLabel(settings?.warrantyYears ?? 1)} warranty on every timepiece`];

  // Repeat so the strip stays full at any viewport width.
  const loop = [...messages, ...messages, ...messages, ...messages];

  return (
    <div className="relative overflow-hidden border-b border-border/60 bg-onyx">
      <div className="flex w-max whitespace-nowrap marquee">
        {loop.map((text, i) => (
          <div
            key={i}
            className="flex shrink-0 items-center gap-3 px-5 py-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:px-8 sm:py-2.5 sm:text-[11px] sm:tracking-[0.25em]"
          >
            <span>{text}</span>
            <span className="text-primary/40">◆</span>
          </div>
        ))}
      </div>
    </div>
  );
}
