-- 1. Private schema for internal security helpers (not exposed to the API)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

-- 2. Rewrite every policy to use private.has_role instead of public.has_role
DO $do$
DECLARE
  p record;
  v_qual text;
  v_check text;
  v_sql text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (coalesce(qual,'') LIKE '%has_role(%' OR coalesce(with_check,'') LIKE '%has_role(%')
  LOOP
    v_qual := replace(coalesce(p.qual, ''), 'has_role(', 'private.has_role(');
    v_check := replace(coalesce(p.with_check, ''), 'has_role(', 'private.has_role(');
    v_qual := replace(v_qual, 'private.private.has_role(', 'private.has_role(');
    v_check := replace(v_check, 'private.private.has_role(', 'private.has_role(');

    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);

    v_sql := format('CREATE POLICY %I ON %I.%I FOR %s TO %s',
      p.policyname, p.schemaname, p.tablename,
      CASE p.cmd WHEN 'ALL' THEN 'ALL' ELSE p.cmd END,
      array_to_string(p.roles, ', '));

    IF coalesce(p.qual, '') <> '' THEN
      v_sql := v_sql || format(' USING (%s)', v_qual);
    END IF;
    IF coalesce(p.with_check, '') <> '' THEN
      v_sql := v_sql || format(' WITH CHECK (%s)', v_check);
    END IF;

    EXECUTE v_sql;
  END LOOP;
END
$do$;

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 3. claim_admin: no longer callable from the client
DROP FUNCTION IF EXISTS public.claim_admin();

CREATE OR REPLACE FUNCTION private.claim_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count int;
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';

  IF admin_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN true;
  END IF;

  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
END;
$$;

REVOKE ALL ON FUNCTION private.claim_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.claim_admin(uuid) TO service_role;

-- 4. Orders: no spoofed ownership
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Place own or guest order" ON public.orders
FOR INSERT TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR (auth.uid() IS NULL AND user_id IS NULL)
);

-- 5. Payment settings: hide account numbers from the public
DROP POLICY IF EXISTS "payment_settings public read" ON public.payment_settings;
CREATE POLICY "payment_settings authenticated read" ON public.payment_settings
FOR SELECT TO authenticated
USING (true);

REVOKE SELECT ON public.payment_settings FROM anon;

CREATE OR REPLACE VIEW public.payment_settings_public
WITH (security_invoker = off) AS
SELECT
  id,
  currency,
  currency_symbol,
  cod_enabled,
  cod_charge,
  delivery_charge,
  free_delivery_above,
  easypaisa_enabled,
  jazzcash_enabled,
  bank_enabled,
  warranty_months,
  warranty_note,
  payment_note,
  created_at
FROM public.payment_settings;

GRANT SELECT ON public.payment_settings_public TO anon, authenticated;

-- 6. Reviews: require sign-in to submit
DROP POLICY IF EXISTS "reviews public submit" ON public.reviews;
CREATE POLICY "reviews authenticated submit" ON public.reviews
FOR INSERT TO authenticated
WITH CHECK (approved = false);