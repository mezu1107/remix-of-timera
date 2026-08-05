import { useQuery } from "@tanstack/react-query";
import { siteSettingsQuery } from "@/lib/site-settings";
import { trackEvent } from "@/lib/tracking";

/** Big always-on WhatsApp button — the fastest path from browsing to a sale. */
export function FloatingWhatsApp() {
  const { data: settings } = useQuery(siteSettingsQuery);
  const raw = settings?.whatsappNumber ?? settings?.contactPhone ?? "";
  const number = String(raw).replace(/[^0-9]/g, "");

  // No number configured yet? Still show the button — it opens the contact page
  // so a ready-to-buy visitor never hits a dead end.
  const href = number
    ? `https://wa.me/${number}?text=${encodeURIComponent("Hi Timera! I'd like help choosing a watch.")}`
    : "/contact";

  return (
    <a
      href={href}
      {...(number ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() => void trackEvent("whatsapp_click", { metadata: { channel: "whatsapp", configured: Boolean(number) } })}
      aria-label="Chat with Timera on WhatsApp"
      className="fixed bottom-24 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/40" aria-hidden />
      <svg viewBox="0 0 32 32" className="relative h-8 w-8 fill-current" aria-hidden>
        <path d="M16.02 3C9.4 3 4.04 8.36 4.04 14.98c0 2.36.69 4.56 1.88 6.41L4 29l7.79-2.04a11.9 11.9 0 0 0 4.23.78h.01c6.61 0 11.98-5.36 11.98-11.98C28.01 8.36 22.64 3 16.02 3Zm0 21.72h-.01c-1.3 0-2.57-.35-3.68-1l-.26-.16-4.62 1.21 1.23-4.5-.17-.28a9.72 9.72 0 0 1-1.49-5.19c0-5.37 4.37-9.73 9.74-9.73 2.6 0 5.05 1.01 6.89 2.85a9.66 9.66 0 0 1 2.85 6.89c0 5.37-4.37 9.91-9.74 9.91Zm5.34-7.28c-.29-.15-1.73-.85-2-.95-.27-.1-.46-.15-.66.15-.19.29-.75.94-.92 1.14-.17.19-.34.22-.63.07-.29-.15-1.24-.46-2.35-1.46-.87-.77-1.46-1.73-1.63-2.02-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.66-1.6-.9-2.19-.24-.57-.48-.5-.66-.51h-.56c-.19 0-.51.07-.77.36-.27.29-1.01.99-1.01 2.42s1.04 2.8 1.19 3c.15.19 2.05 3.13 4.97 4.39.69.3 1.24.48 1.66.61.7.22 1.33.19 1.83.12.56-.08 1.73-.71 1.97-1.39.24-.68.24-1.27.17-1.39-.07-.12-.26-.19-.55-.34Z" />
      </svg>
    </a>
  );
}
