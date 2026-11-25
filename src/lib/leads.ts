import { supabase } from "@/integrations/supabase/client";

/**
 * LEADS — captures every shopper who adds to cart or reaches checkout,
 * so the store can reach out to people who never completed the order.
 * One row per browser session, upserted as the shopper moves forward.
 */

export type LeadStage = "add_to_cart" | "checkout_started" | "checkout_details" | "purchased";

const STORAGE_KEY = "timera-lead-session";
const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let memorySessionId: string | null = null;

export function leadSessionId() {
  if (typeof window === "undefined") return "";
  const createId = () => window.crypto?.randomUUID?.() ?? "";
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && SESSION_ID_PATTERN.test(existing)) return existing;
    const id = createId();
    if (!id) return "";
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    memorySessionId ??= createId() || null;
    return memorySessionId ?? "";
  }
}

export type LeadItem = { name: string; slug?: string; quantity: number; price: number };

export type LeadInput = {
  stage: LeadStage;
  items?: LeadItem[];
  cartValue?: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  orderNumber?: string | null;
};

/** Stage ranking so a later stage never gets overwritten by an earlier one. */
const RANK: Record<LeadStage, number> = {
  add_to_cart: 1,
  checkout_started: 2,
  checkout_details: 3,
  purchased: 4,
};

let lastStage: LeadStage | null = null;

export async function captureLead(input: LeadInput) {
  if (typeof window === "undefined") return;
  const session_id = leadSessionId();
  if (!session_id) return;

  const stage = lastStage && RANK[lastStage] > RANK[input.stage] ? lastStage : input.stage;
  lastStage = stage;

  const items = input.items ?? [];
  const row: Record<string, unknown> = {
    session_id,
    stage,
    items,
    item_count: items.reduce((a, i) => a + (i.quantity || 0), 0),
    cart_value: Math.round((input.cartValue ?? items.reduce((a, i) => a + i.price * i.quantity, 0)) * 100) / 100,
    currency: "PKR",
    page_path: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
  };
  if (input.name) row.name = input.name;
  if (input.email) row.email = input.email;
  if (input.phone) row.phone = input.phone;
  if (input.address) row.address = input.address;
  if (input.city) row.city = input.city;
  if (input.orderNumber) row.order_number = input.orderNumber;

  const { error } = await (supabase as any).rpc("upsert_cart_lead", { p_lead: row });
  if (error) console.warn("Lead was not captured", error.message);
}
