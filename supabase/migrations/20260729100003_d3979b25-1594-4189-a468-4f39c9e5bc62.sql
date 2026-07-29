DROP POLICY IF EXISTS "Visitors can add analytics events" ON public.analytics_events;

CREATE POLICY "Visitors can add analytics events"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_name IN (
    'page_view',
    'view_item',
    'add_to_cart',
    'begin_checkout',
    'purchase',
    'search',
    'view_cart'
  )
  AND length(event_name) <= 64
  AND (session_id IS NULL OR length(session_id) <= 128)
  AND (page_path IS NULL OR length(page_path) <= 512)
  AND (referrer IS NULL OR length(referrer) <= 1024)
  AND (product_slug IS NULL OR length(product_slug) <= 256)
  AND (product_name IS NULL OR length(product_name) <= 256)
  AND (order_number IS NULL OR length(order_number) <= 80)
  AND currency IN ('PKR', 'USD')
  AND (value IS NULL OR value >= 0)
);