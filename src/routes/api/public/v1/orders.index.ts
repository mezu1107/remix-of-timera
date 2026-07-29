import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, getUser, handle, json, preflight, readJson, requireUser } from "@/lib/api.server";

type CartItem = { product_id?: string; slug?: string; name: string; price: number; quantity: number; color?: string; size?: string };

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
          shipping?: number;
          discount?: number;
        }>(request);

        if (!body.customer_name?.trim()) return apiError("customer_name is required");
        if (!body.customer_email?.trim()) return apiError("customer_email is required");
        if (!Array.isArray(body.items) || body.items.length === 0) return apiError("items must contain at least one product");

        const items = body.items.map((i) => ({
          product_id: i.product_id ?? null,
          slug: i.slug ?? null,
          name: String(i.name ?? "").slice(0, 160),
          price: Number(i.price) || 0,
          quantity: Math.max(1, Math.round(Number(i.quantity) || 1)),
          color: i.color ?? null,
          size: i.size ?? null,
        }));

        const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const discount = Math.max(0, Math.min(Number(body.discount ?? 0) || 0, subtotal));
        const shipping = Math.max(0, Number(body.shipping ?? 0) || 0);
        const total = subtotal - discount + shipping;

        const user = await getUser(request);
        const client = user?.client ?? anonClient();
        const orderNumber = `TM-${Date.now().toString(36).toUpperCase()}`;

        const { data, error } = await (client.from("orders") as any)
          .insert({
            order_number: orderNumber,
            user_id: user?.id ?? null,
            customer_name: body.customer_name.trim(),
            customer_email: body.customer_email.trim(),
            customer_phone: body.customer_phone?.trim() ?? null,
            shipping_address: body.shipping_address?.trim() ?? null,
            notes: body.notes?.trim() ?? null,
            coupon_code: body.coupon_code?.trim().toUpperCase() ?? null,
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
