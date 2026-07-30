import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, getUser, handle, json, preflight, readJson, requireUser } from "@/lib/api.server";

type CartItem = {
  product_id?: string;
  slug?: string;
  name?: string;
  price?: number;
  quantity: number;
  color?: string;
  size?: string;
};

export const Route = createFileRoute("/api/public/v1/orders/")({
  server: {
    handlers: {
      OPTIONS: preflight,

      /** The signed-in customer's own orders. */
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

      /** Place an order. Works for guests and for signed-in customers. */
      POST: handle(async ({ request }) => {
        const body = await readJson<{
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          shipping_address?: string;
          notes?: string;
          coupon_code?: string;
          items?: CartItem[];
        }>(request);

        const name = body.customer_name?.trim() ?? "";
        const email = body.customer_email?.trim() ?? "";
        if (name.length < 2 || name.length > 120) return apiError("customer_name must be 2-120 characters");
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) return apiError("customer_email is invalid");
        if (body.customer_phone && body.customer_phone.length > 40) return apiError("customer_phone is too long");
        if (body.shipping_address && body.shipping_address.length > 500) return apiError("shipping_address is too long");
        if (body.notes && body.notes.length > 1000) return apiError("notes is too long");
        if (!Array.isArray(body.items) || body.items.length === 0) return apiError("items must contain at least one product");
        if (body.items.length > 50) return apiError("Too many items in a single order");

        // Normalize + validate input items (identity only; NEVER trust client price)
        const rawItems = body.items.map((i) => ({
          product_id: typeof i.product_id === "string" ? i.product_id : null,
          slug: typeof i.slug === "string" ? i.slug : null,
          quantity: Math.max(1, Math.min(999, Math.round(Number(i.quantity) || 1))),
          color: typeof i.color === "string" ? i.color.slice(0, 60) : null,
          size: typeof i.size === "string" ? i.size.slice(0, 60) : null,
        }));

        const ids = Array.from(new Set(rawItems.map((i) => i.product_id).filter((x): x is string => !!x)));
        const slugs = Array.from(new Set(rawItems.map((i) => i.slug).filter((x): x is string => !!x)));
        if (ids.length === 0 && slugs.length === 0) return apiError("Each item requires product_id or slug");

        // Load authoritative product data via public (RLS anon-readable) client
        const catalog = anonClient();
        const productQuery = catalog
          .from("products")
          .select("id, slug, name, price, sale_price, active, image_url, brand");

        const [byId, bySlug] = await Promise.all([
          ids.length ? productQuery.in("id", ids) : Promise.resolve({ data: [], error: null } as any),
          slugs.length ? catalog.from("products").select("id, slug, name, price, sale_price, active, image_url, brand").in("slug", slugs) : Promise.resolve({ data: [], error: null } as any),
        ]);
        if (byId.error) return apiError(byId.error.message, 500);
        if (bySlug.error) return apiError(bySlug.error.message, 500);

        const products = new Map<string, any>();
        const productsBySlug = new Map<string, any>();
        for (const p of [...(byId.data ?? []), ...(bySlug.data ?? [])]) {
          products.set(p.id, p);
          if (p.slug) productsBySlug.set(p.slug, p);
        }

        const items: Array<{
          product_id: string | null;
          slug: string | null;
          name: string;
          image_url: string | null;
          brand: string | null;
          price: number;
          quantity: number;
          color: string | null;
          size: string | null;
        }> = [];

        for (const it of rawItems) {
          const p = (it.product_id && products.get(it.product_id)) || (it.slug && productsBySlug.get(it.slug));
          if (!p || p.active === false) return apiError("One or more products are unavailable");
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

        const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

        // Validate coupon server-side
        let discount = 0;
        let couponCode: string | null = null;
        if (body.coupon_code && body.coupon_code.trim()) {
          const code = body.coupon_code.trim().toUpperCase().slice(0, 40);
          const { data: coupon, error: couponErr } = await catalog
            .from("coupons")
            .select("code, discount_type, discount_value, min_order, usage_limit, used_count, expires_at, active")
            .eq("code", code)
            .eq("active", true)
            .maybeSingle();
          if (couponErr) return apiError(couponErr.message, 500);
          if (!coupon) return apiError("Coupon code is not valid");
          if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) return apiError("Coupon has expired");
          if (coupon.usage_limit != null && Number(coupon.used_count) >= Number(coupon.usage_limit)) return apiError("Coupon usage limit reached");
          if (Number(coupon.min_order) > subtotal) return apiError(`Coupon requires a minimum order of ${coupon.min_order}`);
          const value = Number(coupon.discount_value) || 0;
          discount = coupon.discount_type === "percent"
            ? Math.round((subtotal * value) / 100)
            : value;
          discount = Math.max(0, Math.min(discount, subtotal));
          couponCode = coupon.code;
        }

        // Compute shipping server-side from payment_settings_public
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

        const user = await getUser(request);
        const client = user?.client ?? anonClient();
        const orderNumber = `TM-${Date.now().toString(36).toUpperCase()}`;

        const { data, error } = await (client.from("orders") as any)
          .insert({
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
          })
          .select("id,order_number,total,status,created_at")
          .maybeSingle();
        if (error) return apiError(error.message, 400);

        return json({ ok: true, currency: "PKR", order: data }, 201);
      }),
    },
  },
});
