
-- 1) Payment settings: restrict full-row reads to admins
DROP POLICY IF EXISTS "payment_settings public safe read" ON public.payment_settings;
DROP POLICY IF EXISTS "payment_settings authenticated read" ON public.payment_settings;

REVOKE SELECT ON public.payment_settings FROM anon;

CREATE POLICY "payment_settings admin read"
ON public.payment_settings
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

-- Ensure the safe public view stays readable by anon (security_invoker=on)
GRANT SELECT ON public.payment_settings_public TO anon, authenticated;

-- 2) Orders: tighten guest INSERT with data validation
DROP POLICY IF EXISTS "Place own or guest order" ON public.orders;

CREATE POLICY "Place own or guest order"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND user_id IS NULL)
  )
  AND status = 'pending'
  AND char_length(customer_name) BETWEEN 2 AND 120
  AND char_length(customer_email) BETWEEN 5 AND 200
  AND customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (customer_phone IS NULL OR char_length(customer_phone) BETWEEN 5 AND 40)
  AND (shipping_address IS NULL OR char_length(shipping_address) <= 500)
  AND (notes IS NULL OR char_length(notes) <= 1000)
  AND (coupon_code IS NULL OR char_length(coupon_code) <= 40)
  AND jsonb_typeof(items) = 'array'
  AND jsonb_array_length(items) BETWEEN 1 AND 50
  AND subtotal >= 0 AND subtotal <= 100000000
  AND total >= 0 AND total <= 100000000
  AND discount >= 0
  AND shipping >= 0
);
