import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, getUser, handle, json, preflight, searchParams } from "@/lib/api.server";

const ORDER_FIELDS =
  "order_number,customer_name,customer_phone,shipping_address,items,subtotal,discount,shipping,total,status,status_history,tracking_number,courier,estimated_delivery,created_at,updated_at";

/**
 * Track a single order.
 *
 * Signed-in customers:  look up by order_number + their own user_id (RLS enforced).
 * Guests:               look up by order_number + exact customer_email.
 *
 * No SUPABASE_SERVICE_ROLE_KEY required.
 * RLS policy "orders_select_guest_lookup" allows anon SELECT on rows where
 * user_id IS NULL. The server filters further by order_number + customer_email
 * so a guest can only see their own order.
 */
export const Route = createFileRoute("/api/public/v1/orders/$orderNumber")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async ({ request, params }) => {
        const orderNumber = params.orderNumber.trim().toUpperCase();
        const email = searchParams(request).get("email")?.trim().toLowerCase() ?? "";
        const user = await getUser(request);

        // ── Signed-in customer ──────────────────────────────────────
        if (user) {
          const { data, error } = await user.client
            .from("orders")
            .select(ORDER_FIELDS)
            .eq("order_number", orderNumber)
            .eq("user_id", user.id)
            .maybeSingle();
          if (error) return apiError(error.message, 500);
          if (!data) return apiError("Order not found", 404);
          return json({ ok: true, currency: "PKR", order: data });
        }

        // ── Guest ───────────────────────────────────────────────────
        if (!email) {
          return apiError(
            "Add ?email= (the email you used when ordering) or sign in to track your order.",
            400,
          );
        }

        // The database function checks both credentials and returns only the
        // matching order; anonymous users never receive table-wide order access.
        const { data, error } = await (anonClient() as any).rpc("lookup_order_by_email", {
          p_order_number: orderNumber,
          p_customer_email: email,
        });

        if (error) return apiError(error.message, 500);
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) return apiError("Order not found", 404);
        const order = Object.fromEntries(
          ORDER_FIELDS.split(",").map((field) => [field, row[field]]),
        );
        return json({ ok: true, currency: "PKR", order });
      }),
    },
  },
});
