import { supabase } from "@/integrations/supabase/client";

export type TrackingEventName =
  | "page_view"
  | "view_item"
  | "view_item_list"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "add_payment_info"
  | "purchase"
  | "search"
  | "view_cart"
  | "add_to_wishlist"
  | "share"
  | "sign_up"
  | "login"
  | "contact"
  | "whatsapp_click"
  | "scroll_depth"
  | "time_on_page"
  | "outbound_click"
  | "video_play"
  | "newsletter_signup"
  | "coupon_applied"
  | "quick_view"
  | "filter_apply"
  | "sort_change";

type GtagFn = (...args: unknown[]) => void;
type FbqFn = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
    fbq?: FbqFn;
    _fbq?: FbqFn;
    __timeraTracking?: { googleTagId?: string; googleAdsPurchaseLabel?: string };
  }
}

export type TrackingPayload = {
  pagePath?: string;
  referrer?: string;
  productId?: string;
  productSlug?: string;
  productName?: string;
  orderNumber?: string;
  value?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
};

const metaEventName: Record<TrackingEventName, string> = {
  page_view: "PageView",
  view_item: "ViewContent",
  view_item_list: "ViewContent",
  add_to_cart: "AddToCart",
  remove_from_cart: "CustomEvent",
  begin_checkout: "InitiateCheckout",
  add_payment_info: "AddPaymentInfo",
  purchase: "Purchase",
  search: "Search",
  view_cart: "ViewContent",
  add_to_wishlist: "AddToWishlist",
  share: "CustomEvent",
  sign_up: "CompleteRegistration",
  login: "CustomEvent",
  contact: "Contact",
  whatsapp_click: "Contact",
  scroll_depth: "CustomEvent",
  time_on_page: "CustomEvent",
  outbound_click: "CustomEvent",
  video_play: "CustomEvent",
  newsletter_signup: "Subscribe",
  coupon_applied: "CustomEvent",
  quick_view: "ViewContent",
  filter_apply: "CustomEvent",
  sort_change: "CustomEvent",
};

const googleEventName: Record<TrackingEventName, string> = {
  page_view: "page_view",
  view_item: "view_item",
  view_item_list: "view_item_list",
  add_to_cart: "add_to_cart",
  remove_from_cart: "remove_from_cart",
  begin_checkout: "begin_checkout",
  add_payment_info: "add_payment_info",
  purchase: "purchase",
  search: "search",
  view_cart: "view_cart",
  add_to_wishlist: "add_to_wishlist",
  share: "share",
  sign_up: "sign_up",
  login: "login",
  contact: "generate_lead",
  whatsapp_click: "whatsapp_click",
  scroll_depth: "scroll",
  time_on_page: "user_engagement",
  outbound_click: "click",
  video_play: "video_start",
  newsletter_signup: "sign_up",
  coupon_applied: "select_promotion",
  quick_view: "view_item",
  filter_apply: "filter",
  sort_change: "sort",
};

const initializedMeta = new Set<string>();
const initializedGoogle = new Set<string>();

function cleanId(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function loadScript(id: string, src: string) {
  if (typeof document === "undefined" || document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

export function initMetaPixel(pixelId: string | null | undefined) {
  if (typeof window === "undefined") return;
  const id = cleanId(pixelId);
  if (!id || initializedMeta.has(id)) return;
  if (!window.fbq) {
    const fbq: FbqFn = (...args: unknown[]) => fbq.queue?.push(args);
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    window._fbq = fbq;
  }
  window.fbq("init", id);
  initializedMeta.add(id);
  loadScript("timera-meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
}

export function initGoogleTag(tagId: string | null | undefined, purchaseLabel?: string | null) {
  if (typeof window === "undefined") return;
  const id = cleanId(tagId);
  if (!id) return;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? ((...args: unknown[]) => window.dataLayer?.push(args));
  window.__timeraTracking = { googleTagId: id, googleAdsPurchaseLabel: cleanId(purchaseLabel) };
  if (initializedGoogle.has(id)) return;
  loadScript("timera-google-tag", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
  window.gtag("js", new Date());
  window.gtag("config", id, { send_page_view: false });
  initializedGoogle.add(id);
}

function getSessionId() {
  const key = "timera-analytics-session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const random = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(key, random);
  return random;
}

function fireBrowserPixels(name: TrackingEventName, payload: TrackingPayload) {
  const value = Number(payload.value ?? 0) || undefined;
  const currency = payload.currency ?? "PKR";
  window.fbq?.("track", metaEventName[name], {
    content_ids: payload.productId ? [payload.productId] : undefined,
    content_name: payload.productName,
    content_type: payload.productId ? "product" : undefined,
    value,
    currency,
  });
  window.gtag?.("event", googleEventName[name], {
    page_path: payload.pagePath ?? window.location.pathname,
    currency,
    value,
    transaction_id: payload.orderNumber,
    items: payload.metadata?.items,
    item_id: payload.productId,
    item_name: payload.productName,
  });
  const cfg = window.__timeraTracking;
  if (name === "purchase" && cfg?.googleTagId && cfg.googleAdsPurchaseLabel) {
    window.gtag?.("event", "conversion", {
      send_to: `${cfg.googleTagId}/${cfg.googleAdsPurchaseLabel}`,
      value,
      currency,
      transaction_id: payload.orderNumber,
    });
  }
}

export async function trackEvent(name: TrackingEventName, payload: TrackingPayload = {}) {
  if (typeof window === "undefined") return;
  fireBrowserPixels(name, payload);
  const pagePath = payload.pagePath ?? `${window.location.pathname}${window.location.search}`;
  const { error } = await (supabase.from("analytics_events" as any) as any).insert({
    event_name: name,
    session_id: getSessionId(),
    page_path: pagePath,
    referrer: payload.referrer ?? document.referrer ?? null,
    product_id: payload.productId ?? null,
    product_slug: payload.productSlug ?? null,
    product_name: payload.productName ?? null,
    order_number: payload.orderNumber ?? null,
    value: payload.value ?? null,
    currency: payload.currency ?? "PKR",
    metadata: payload.metadata ?? {},
    user_agent: navigator.userAgent,
  });
  if (error) console.warn("Tracking event was not saved", error.message);
}