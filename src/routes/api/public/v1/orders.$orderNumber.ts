import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, getUser, handle, json, preflight, searchParams } from "@/lib/api.server";

/** Track a single order. Signed-in customers get their own orders; guests pass ?email=. */
export const Route = createFileRoute("/api/public/v1/orders/$orderNumber")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async ({ request, params }) => {
        const email = searchParams(request).get("email")?.trim().toLowerCase();
        const user = await getUser(request);
        const client = user?.client ?? anonClient();

        let query = client
          .from("orders")
          .select(
            "order_number,customer_name,customer_phone,shipping_address,items,subtotal,discount,shipping,total,status,status_history,tracking_number,courier,estimated_delivery,created_at,updated_at",
          )
          .eq("order_number", params.orderNumber.trim().toUpperCase());

        if (user) query = query.eq("user_id", user.id);
        else if (email) query = query.eq("customer_email", email);
        else return apiError("Add ?email= your order email, or sign in.", 400);

        const { data, error } = await query.maybeSingle();
        if (error) return apiError(error.message, 500);
        if (!data) return apiError("Order not found", 404);
        return json({ ok: true, currency: "PKR", order: data });
      }),
    },
  },
});
