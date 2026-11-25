/**
 * TIKTOK PIXEL MODULE — Official TikTok Pixel Integration (ttq)
 * Supports base script loading, PII SHA-256 hashing, ttq.identify(),
 * dynamic event parameters, event_id deduplication, and purchase duplication prevention.
 */

export const DEFAULT_TIKTOK_PIXEL_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_TIKTOK_PIXEL_ID) ||
  "DALT99BC77UC60IQCHSG";

type Ttq = ((...args: unknown[]) => void) & {
  methods?: string[];
  setAndDefer?: (t: any, e: string) => void;
  instance?: (id: string) => unknown;
  load?: (id: string, opts?: Record<string, unknown>) => void;
  page?: (...a: unknown[]) => void;
  track?: (...a: unknown[]) => void;
  identify?: (...a: unknown[]) => void;
  push?: (...a: unknown[]) => void;
  _i?: Record<string, unknown>;
  _t?: Record<string, unknown>;
  _o?: Record<string, unknown>;
};

type TtWindow = Window & { TiktokAnalyticsObject?: string; ttq?: Ttq };

const w = () => (typeof window !== "undefined" ? (window as unknown as TtWindow) : ({} as TtWindow));
const clean = (v: unknown) => String(v ?? "").trim();
const active = new Set<string>();
const trackedPurchaseOrders = new Set<string>();

/** Creates the ttq stub exactly as the official TikTok snippet does. */
function ensureStub(): Ttq | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  const win = w();
  if (win.ttq) return win.ttq;

  win.TiktokAnalyticsObject = "ttq";
  const ttq: Ttq = [] as unknown as Ttq;
  win.ttq = ttq;

  ttq.methods = [
    "page",
    "track",
    "identify",
    "instances",
    "debug",
    "on",
    "off",
    "once",
    "ready",
    "alias",
    "group",
    "enableCookie",
    "disableCookie",
    "holdConsent",
    "revokeConsent",
    "grantConsent",
  ];
  ttq.setAndDefer = function (t: any, e: string) {
    t[e] = function (...args: unknown[]) {
      t.push([e as unknown, ...args]);
    };
  };
  for (const m of ttq.methods) ttq.setAndDefer(ttq, m);
  ttq.instance = function (id: string) {
    const e = (ttq._i?.[id] ?? []) as any[];
    for (const m of ttq.methods!) ttq.setAndDefer!(e, m);
    return e;
  };
  ttq.load = function (id: string, opts?: Record<string, unknown>) {
    const url = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = ttq._i ?? {};
    (ttq._i as any)[id] = [];
    (ttq._i as any)[id]._u = url;
    ttq._t = ttq._t ?? {};
    (ttq._t as any)[id] = +new Date();
    ttq._o = ttq._o ?? {};
    (ttq._o as any)[id] = opts ?? {};
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = `${url}?sdkid=${encodeURIComponent(id)}&lib=ttq`;
    const first = document.getElementsByTagName("script")[0];
    if (first?.parentNode) first.parentNode.insertBefore(script, first);
    else document.head.appendChild(script);
  };
  return ttq;
}

/** Boots the TikTok pixel. Safe to call repeatedly. */
export function initTiktokPixel(pixelId?: string | null) {
  if (typeof window === "undefined") return null;
  const envId = typeof import.meta !== "undefined" ? import.meta.env?.VITE_TIKTOK_PIXEL_ID : undefined;
  const id = clean(pixelId) || clean(envId) || DEFAULT_TIKTOK_PIXEL_ID;
  const win = w();

  // If already active in memory or already initialized in window.ttq by index.html, skip ttq.load()
  if (active.has(id) || (win.ttq?._i && win.ttq._i[id])) {
    active.add(id);
    return id;
  }

  const ttq = ensureStub();
  if (!ttq) return null;

  active.add(id);
  try {
    ttq.load?.(id);
    ttq.page?.();
  } catch (e) {
    console.warn("[TikTok Pixel] Initialization warning:", e);
  }
  return id;
}

export const isTiktokPixelReady = () => active.size > 0;
export const tiktokPixelIds = () => [...active];

export function tiktokPage() {
  if (typeof window === "undefined") return;
  if (!active.size) initTiktokPixel();
  try {
    w().ttq?.page?.();
  } catch (e) {
    console.warn("[TikTok Pixel] Page track warning:", e);
  }
}

/** Synchronous / Asynchronous SHA-256 hash algorithm for client-side PII. */
export async function sha256(message: string): Promise<string> {
  const str = String(message ?? "").trim();
  if (!str) return "";

  if (typeof crypto !== "undefined" && crypto.subtle && crypto.subtle.digest) {
    try {
      const msgUint8 = new TextEncoder().encode(str);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      // fallback
    }
  }
  return jsSha256(str);
}

let sha256HCache: number[];
let sha256KCache: number[];

function jsSha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i: number, j: number;
  let result = "";

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash = (sha256HCache = sha256HCache || []);
  let k = (sha256KCache = sha256KCache || []);
  let primeCounter = k.length;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  hash = hash.slice(0);
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return "";
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words.length] = 0x80 << ((3 - (ascii.length % 4)) * 8);
  words[(((ascii.length + 8) >> 6) << 4) + 15] = asciiBitLength;

  for (j = 0; j < words.length; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);

      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

/**
 * Sends hashed PII to ttq.identify() before event dispatch.
 * Hashes email, phone_number, and external_id with SHA-256.
 */
export async function tiktokIdentify(data: {
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
}) {
  if (typeof window === "undefined") return;
  const win = w();
  if (!win.ttq?.identify) return;

  const identifyObj: Record<string, string> = {};

  if (data.email) {
    const cleanEmail = String(data.email).trim().toLowerCase();
    if (cleanEmail && !cleanEmail.endsWith("@timera.noemail")) {
      identifyObj.email = await sha256(cleanEmail);
    }
  }

  if (data.phone) {
    const cleanPhone = String(data.phone).replace(/\D/g, "");
    if (cleanPhone) {
      identifyObj.phone_number = await sha256(cleanPhone);
    }
  }

  if (data.externalId) {
    const cleanExtId = String(data.externalId).trim();
    if (cleanExtId) {
      identifyObj.external_id = await sha256(cleanExtId);
    }
  }

  if (Object.keys(identifyObj).length > 0) {
    try {
      win.ttq.identify(identifyObj);
    } catch (err) {
      console.warn("[TikTok Pixel] Identify warning:", err);
    }
  }
}

/** Generates a unique event_id for deduplication. */
export function generateEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
}

/**
 * Tracks standard or custom TikTok events via ttq.track().
 * Constructs contents array, value, currency, search_string, and event_id options.
 */
export function tiktokTrack(
  event: string,
  params: Record<string, unknown> = {},
  options?: { event_id?: string }
) {
  if (typeof window === "undefined") return;
  if (!active.size) initTiktokPixel();

  const win = w();
  if (!win.ttq?.track) return;

  const orderId = String(
    params.order_id || params.orderNumber || params.order_number || ""
  ).trim();

  const eventId =
    options?.event_id ||
    (typeof params.event_id === "string" && params.event_id
      ? params.event_id
      : orderId
      ? `tt_${event.toLowerCase()}_${orderId}`
      : generateEventId());

  // Prevent duplicate Purchase events
  if (event === "Purchase") {
    const dedupId = orderId || eventId;
    const storageKey = `tt_purchase_tracked_${dedupId}`;
    if (
      trackedPurchaseOrders.has(dedupId) ||
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem(storageKey))
    ) {
      console.log(`[TikTok Pixel] Purchase event for ${dedupId} already tracked. Skipping duplicate.`);
      return;
    }
    trackedPurchaseOrders.add(dedupId);
    try {
      sessionStorage.setItem(storageKey, "true");
    } catch {
      /* ignore */
    }
  }

  // Format contents array
  let contents: Array<{ content_id: string; content_type: string; content_name: string }> = [];

  if (Array.isArray(params.contents) && params.contents.length > 0) {
    contents = (params.contents as any[])
      .map((item) => ({
        content_id: String(item.content_id || item.item_id || item.id || item.product_id || ""),
        content_type: String(item.content_type || "product"),
        content_name: String(
          item.content_name || item.item_name || item.name || item.product_name || ""
        ),
      }))
      .filter((c) => Boolean(c.content_id || c.content_name));
  } else if (
    params.content_id ||
    params.productId ||
    params.content_name ||
    params.productName
  ) {
    contents = [
      {
        content_id: String(params.content_id || params.productId || ""),
        content_type: String(params.content_type || "product"),
        content_name: String(params.content_name || params.productName || ""),
      },
    ];
  }

  const numValue =
    typeof params.value === "number" ? params.value : (Number(params.value) || 0);
  const currencyStr = String(params.currency || "PKR");

  const payload: Record<string, unknown> = {
    value: numValue,
    currency: currencyStr,
  };

  if (contents.length > 0) {
    payload.contents = contents;
  }

  const searchStr =
    params.search_string || params.query || (params.metadata as any)?.query;
  if (searchStr) {
    payload.search_string = String(searchStr);
  }

  try {
    win.ttq.track(event, payload, { event_id: eventId });
  } catch (err) {
    console.warn(`[TikTok Pixel] Error tracking event ${event}:`, err);
  }
}
