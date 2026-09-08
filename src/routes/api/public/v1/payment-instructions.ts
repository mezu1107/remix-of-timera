import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, handle, json, preflight } from "@/lib/api.server";

/**
 * Returns the enabled payment method details for the checkout page.
 *
 * Uses the normal anon/publishable key — no SUPABASE_SERVICE_ROLE_KEY needed.
 * The RLS migration grants SELECT on payment_settings to authenticated.
 * The anon key on the server (publishable key) maps to the `anon` role in
 * Supabase, which we also grant SELECT to below the security boundary:
 * only enabled payment methods are returned; secret credentials (e.g. full
 * bank account numbers) are returned as-is since they are shown on checkout
 * to customers who need them for bank transfer — this matches the original
 * behaviour and is intentional.
 */
export const Route = createFileRoute("/api/public/v1/payment-instructions")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async () => {
        const { data, error } = await anonClient()
          .from("payment_settings")
          .select(
            "easypaisa_enabled,easypaisa_number,easypaisa_account_name," +
            "jazzcash_enabled,jazzcash_number,jazzcash_account_name," +
            "bank_enabled,bank_name,bank_account_title,bank_account_number,bank_iban",
          )
          .order("created_at" as any, { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) return apiError(error.message, 500);

        const r: any = data ?? {};
        return json({
          ok: true,
          easypaisa: r.easypaisa_enabled
            ? { number: r.easypaisa_number ?? null, accountName: r.easypaisa_account_name ?? null }
            : null,
          jazzcash: r.jazzcash_enabled
            ? { number: r.jazzcash_number ?? null, accountName: r.jazzcash_account_name ?? null }
            : null,
          bank: r.bank_enabled
            ? {
                bankName: r.bank_name ?? null,
                accountTitle: r.bank_account_title ?? null,
                accountNumber: r.bank_account_number ?? null,
                iban: r.bank_iban ?? null,
              }
            : null,
        });
      }),
    },
  },
});
