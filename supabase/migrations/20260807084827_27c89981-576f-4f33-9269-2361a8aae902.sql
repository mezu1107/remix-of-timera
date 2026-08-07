-- Orders: Data API grants (policies already scope row access)
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

-- Public payment settings view used by cart/checkout
GRANT SELECT ON public.payment_settings_public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;