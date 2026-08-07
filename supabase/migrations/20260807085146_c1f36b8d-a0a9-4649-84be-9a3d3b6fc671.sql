ALTER VIEW public.payment_settings_public SET (security_invoker = off);
GRANT SELECT ON public.payment_settings_public TO anon, authenticated;