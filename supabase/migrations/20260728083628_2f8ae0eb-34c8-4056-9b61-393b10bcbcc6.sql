ALTER VIEW public.payment_settings_public SET (security_invoker = on);

CREATE POLICY "payment_settings public safe read" ON public.payment_settings
FOR SELECT TO anon
USING (true);

GRANT SELECT (
  id, currency, currency_symbol, cod_enabled, cod_charge, delivery_charge,
  free_delivery_above, easypaisa_enabled, jazzcash_enabled, bank_enabled,
  warranty_months, warranty_note, payment_note, created_at
) ON public.payment_settings TO anon;