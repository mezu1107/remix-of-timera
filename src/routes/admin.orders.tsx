import { createFileRoute } from "@tanstack/react-router";
import { CrudModule } from "@/components/admin/CrudModule";
import { formatPrice } from "@/lib/utils";

export const Route = createFileRoute("/admin/orders")({ component: OrdersAdmin });

function OrdersAdmin() {
  return (
    <CrudModule
      table="orders"
      title="Orders"
      description="Customer orders placed through checkout. Update the status to keep buyers informed."
      orderBy={{ column: "created_at", ascending: false }}
      invalidate={["orders"]}
      allowCreate={false}
      columns={[
        { key: "order_number", label: "Order" },
        { key: "customer_name", label: "Customer" },
        { key: "customer_email", label: "Email" },
        { key: "total", label: "Total", render: (r) => formatPrice(Number(r.total)) },
        { key: "status", label: "Status" },
        { key: "created_at", label: "Placed", render: (r) => new Date(r.created_at).toLocaleDateString() },
      ]}
      fields={[
        { key: "order_number", label: "Order number", type: "text", required: true },
        { key: "customer_name", label: "Customer name", type: "text", required: true },
        { key: "customer_email", label: "Customer email", type: "text", required: true },
        { key: "customer_phone", label: "Phone", type: "text" },
        { key: "shipping_address", label: "Shipping address", type: "textarea" },
        { key: "status", label: "Status", type: "select", options: ["pending", "paid", "processing", "shipped", "delivered", "cancelled"] },
        { key: "subtotal", label: "Subtotal", type: "number" },
        { key: "total", label: "Total", type: "number" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
