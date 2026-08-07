ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
REVOKE SELECT ON public.orders FROM anon;
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;