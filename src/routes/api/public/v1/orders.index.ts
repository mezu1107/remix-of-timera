import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, getUser, handle, json, preflight, readJson, requireUser } from "@/lib/api.server";

type CartItem = {
  product_id?: string;
  slug?: string;
  quantity: number;
  color?: string;
  size?: string;
};

export const Route = createFileRoute("/api/public/v1/orders/")({
  server: {
    handlers: {
      OPTIONS: preflight,

      /** Signed-in customer's own order history. */
      GET: handle(async ({ request }) => {
        const user = await requireUser(request);
        const { data, error } = await user.client
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) return apiError(error.message, 500);
        return json({ ok: true, currency: "PKR", orders: data ?? [] });
      }),

      /**
       * Place an order — works for signed-in customers AND guests.
       *
       * Uses ONLY the normal Supabase publishable key (anonClient / user client).
       * No SUPABASE_SERVICE_ROLE_KEY required.
       *
       * The RLS migration (20260906000000_orders_rls_no_service_role.sql) grants
       * INSERT to both the `anon` and `authenticated` roles, so this insert
       * succeeds without any service-role bypass.
       *
       * Security guarantees preserved:
       *  - All prices re-fetched from the database server-side (never trusted from client)
       *  - Coupon validated server-side
       *  - Shipping calculated server-side
       *  - Idempotency key prevents duplicate orders on retry/double-click
       */
      POST: handle(async ({ request }) => {
        const body = await readJson<{
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          shipping_address?: string;
          notes?: string;
          coupon_code?: string;
          idempotency_key?: string;
          items?: CartItem[];
          fbp?: string;
          fbc?: string;
          fbclid?: string;
          utm_source?: string;
          utm_medium?: string;
          utm_campaign?: string;
          utm_content?: string;
          utm_term?: string;
          first_landing_page?: string;
          attribution?: Record<string, unknown>;
        }>(request);

        // ── Input validation ────────────────────────────────────────
        const name = body.customer_name?.trim() ?? "";
        const email = body.customer_email?.trim() ?? "";
        if (name.length < 2 || name.length > 120)
          return apiError("customer_name must be 2–120 characters");
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200)
          return apiError("customer_email is invalid");
        if (body.customer_phone && body.customer_phone.length > 40)
          return apiError("customer_phone is too long");
        if (body.shipping_address && body.shipping_address.length > 500)
          return apiError("shipping_address is too long");
        if (body.notes && body.notes.length > 1000)
          return apiError("notes is too long");
        if (!Array.isArray(body.items) || body.items.length === 0)
          return apiError("items must contain at least one product");
        if (body.items.length > 50)
          return apiError("Too many items in a single order");

        const idempotencyKey =
          typeof body.idempotency_key === "string" && body.idempotency_key.trim()
            ? body.idempotency_key.trim().slice(0, 80)
            : null;

        // ── Resolve user (null = guest) ─────────────────────────────
        const user = await getUser(request);

        // The write client:
        //   - signed-in → user.client  (carries JWT, authenticated role)
        //   - guest     → anonClient() (anon role, INSERT allowed by RLS)
        const writeClient = user?.client ?? anonClient();

        // ── Idempotency check ───────────────────────────────────────
        if (idempotencyKey) {
          // Authenticated users can read their own rows; guests cannot read
          // back by idempotency_key under our RLS (anon sees user_id IS NULL
          // rows, not filtered by idempotency_key). We only attempt this for
          // signed-in users to avoid a select that would fail for guests.
          if (user) {
            const { data: existing } = await writeClient
              .from("orders")
              .select("id, order_number, total, status, created_at")
              .eq("idempotency_key", idempotencyKey)
              .eq("user_id", user.id)
              .maybeSingle();
            if (existing) {
              return json(
                {
                  ok: true,
                  currency: "PKR",
                  duplicate: true,
                  event_id: `purchase_${existing.id}`,
                  order: {
                    order_number: existing.order_number,
                    total: existing.total,
                    status: existing.status,
                    created_at: existing.created_at,
                  },
                },
                200,
              );
            }
          }
        }

        // ── Validate cart items, re-fetch prices from DB ────────────
        const rawItems = body.items.map((i) => ({
          product_id: typeof i.product_id === "string" ? i.product_id : null,
          slug: typeof i.slug === "string" ? i.slug : null,
          quantity: Math.max(1, Math.min(999, Math.round(Number(i.quantity) || 1))),
          color: typeof i.color === "string" ? i.color.slice(0, 60) : null,
          size: typeof i.size === "string" ? i.size.slice(0, 60) : null,
        }));

        const ids = Array.from(
          new Set(rawItems.map((i) => i.product_id).filter((x): x is string => !!x)),
        );
        const slugs = Array.from(
          new Set(rawItems.map((i) => i.slug).filter((x): x is string => !!x)),
        );
        if (ids.length === 0 && slugs.length === 0)
          return apiError("Each item requires product_id or slug");

        // Products are publicly readable — anon client is fine here
        const catalog = anonClient();

        const [byId, bySlug] = await Promise.all([
          ids.length
            ? catalog
                .from("products")
                .select("id, slug, name, price, sale_price, active, image_url, brand")
                .in("id", ids)
            : Promise.resolve({ data: [], error: null } as any),
          slugs.length
            ? catalog
                .from("products")
                .select("id, slug, name, price, sale_price, active, image_url, brand")
                .in("slug", slugs)
            : Promise.resolve({ data: [], error: null } as any),
        ]);
        if (byId.error) return apiError(byId.error.message, 500);
        if (bySlug.error) return apiError(bySlug.error.message, 500);

        const products = new Map<string, any>();
        const productsBySlug = new Map<string, any>();
        for (const p of [...(byId.data ?? []), ...(bySlug.data ?? [])]) {
          products.set(p.id, p);
          if (p.slug) productsBySlug.set(p.slug, p);
        }

        type OrderItem = {
          product_id: string | null;
          slug: string | null;
          name: string;
          image_url: string | null;
          brand: string | null;
          price: number;
          quantity: number;
          color: string | null;
          size: string | null;
        };

        const items: OrderItem[] = [];
        for (const it of rawItems) {
          const p =
            (it.product_id && products.get(it.product_id)) ||
            (it.slug && productsBySlug.get(it.slug));
          if (!p || p.active === false)
            return apiError("One or more products are unavailable");
          const price = Number(p.sale_price ?? p.price) || 0;
          if (price <= 0) return apiError(`Invalid price for ${p.name}`);
          items.push({
            product_id: p.id,
            slug: p.slug ?? null,
            name: String(p.name ?? "").slice(0, 160),
            image_url: p.image_url ?? null,
            brand: p.brand ?? null,
            price,
            quantity: it.quantity,
            color: it.color,
            size: it.size,
          });
        }

        const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

        // ── Coupon validation (server-side) ─────────────────────────
        let discount = 0;
        let couponCode: string | null = null;
        if (body.coupon_code?.trim()) {
          const code = body.coupon_code.trim().toUpperCase().slice(0, 40);
          const { data: coupon, error: couponErr } = await catalog
            .from("coupons")
            .select(
              "code, discount_type, discount_value, min_order, usage_limit, used_count, expires_at, active",
            )
            .eq("code", code)
            .eq("active", true)
            .maybeSingle();
          if (couponErr) return apiError(couponErr.message, 500);
          if (!coupon) return apiError("Coupon code is not valid");
          if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now())
            return apiError("Coupon has expired");
          if (
            coupon.usage_limit != null &&
            Number(coupon.used_count) >= Number(coupon.usage_limit)
          )
            return apiError("Coupon usage limit reached");
          if (Number(coupon.min_order) > subtotal)
            return apiError(
              `Coupon requires a minimum order of ${coupon.min_order}`,
            );
          const v = Number(coupon.discount_value) || 0;
          discount =
            coupon.discount_type === "percent"
              ? Math.round((subtotal * v) / 100)
              : v;
          discount = Math.max(0, Math.min(discount, subtotal));
          couponCode = coupon.code;
        }

        // ── Shipping calculation (server-side) ──────────────────────
        let shipping = 0;
        const { data: pay } = await catalog
          .from("payment_settings_public" as any)
          .select("delivery_charge, free_delivery_above")
          .limit(1)
          .maybeSingle();
        if (pay) {
          const free = Number((pay as any).free_delivery_above) || 0;
          const fee = Number((pay as any).delivery_charge) || 0;
          shipping = free > 0 && subtotal >= free ? 0 : fee;
        }

        const total = Math.max(0, subtotal - discount + shipping);
        const orderNumber = `TM-${Date.now().toString(36).toUpperCase()}`;

        // ── Insert via RLS-allowed client ───────────────────────────
        // RLS policy "orders_insert_anon" grants INSERT to anon + authenticated.
        // No service-role key required.
        const payload: Record<string, unknown> = {
          order_number: orderNumber,
          user_id: user?.id ?? null,
          customer_name: name,
          customer_email: email,
          customer_phone: body.customer_phone?.trim() ?? null,
          shipping_address: body.shipping_address?.trim() ?? null,
          notes: body.notes?.trim() ?? null,
          coupon_code: couponCode,
          items,
          subtotal,
          discount,
          shipping,
          total,
          status: "pending",
          ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
          fbp: body.fbp ?? null,
          fbc: body.fbc ?? null,
          fbclid: body.fbclid ?? null,
          utm_source: body.utm_source ?? null,
          utm_medium: body.utm_medium ?? null,
          utm_campaign: body.utm_campaign ?? null,
          utm_content: body.utm_content ?? null,
          utm_term: body.utm_term ?? null,
          first_landing_page: body.first_landing_page ?? null,
          attribution: body.attribution ?? null,
        };

        const { data: inserted, error: insertError } = await writeClient
          .from("orders")
          .insert(payload)
          .select("id, order_number, total, status, created_at")
          .maybeSingle();

        if (insertError) return apiError(insertError.message, 400);
        if (!inserted)
          return apiError("Order could not be created. Please try again.", 500);

        const eventId = `purchase_${inserted.id}`;

        return json(
          {
            ok: true,
            currency: "PKR",
            event_id: eventId,
            order: {
              order_number: inserted.order_number,
              total: inserted.total,
              status: inserted.status,
              created_at: inserted.created_at,
            },
          },
          201,
        );
      }),
    },
  },
});
