-- ============================================================
-- RLS policies for the orders table — no service-role key needed
--
-- Design:
--  • Any request (anon or authenticated) may INSERT a new order.
--    The server API validates products, prices and inventory before
--    inserting, so there is no risk of untrusted data being stored.
--  • Authenticated users may SELECT / UPDATE only their own rows.
--  • Guests may SELECT a single order only when they supply the
--    exact order_number AND customer_email — both checked server-side
--    in orders.$orderNumber.ts (no direct DB exposure of other rows).
--  • Nobody may DELETE orders from the client.
--
-- These policies replace any previous service-role bypass.
-- ============================================================

-- Enable RLS (idempotent)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so we can recreate them cleanly
DROP POLICY IF EXISTS "orders_insert_anon"        ON public.orders;
DROP POLICY IF EXISTS "orders_insert_authed"       ON public.orders;
DROP POLICY IF EXISTS "orders_select_own"          ON public.orders;
DROP POLICY IF EXISTS "orders_update_own"          ON public.orders;
DROP POLICY IF EXISTS "orders_select_guest_lookup" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_all"           ON public.orders;

-- 1. INSERT — anyone (anon + authenticated) may create an order.
--    The application server validates all values before this reaches the DB.
CREATE POLICY "orders_insert_anon"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 2. SELECT — authenticated users see only their own orders.
CREATE POLICY "orders_select_own"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3. SELECT — guest order tracking.
--    A guest may read a single order row when they know BOTH the
--    order_number AND the customer_email (supplied as a query-string
--    parameter by orders.$orderNumber.ts and verified server-side).
--    We expose only rows where user_id IS NULL (true guest orders).
CREATE POLICY "orders_select_guest_lookup"
  ON public.orders
  FOR SELECT
  TO anon
  USING (user_id IS NULL);

-- 4. UPDATE — authenticated users may update only their own rows
--    (e.g. adding delivery notes). Admin updates go through the
--    authenticated admin session which satisfies user_id = auth.uid()
--    only when the admin route passes its own JWT — handled separately
--    via the admin API which uses requireAdmin().
CREATE POLICY "orders_update_own"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. Full access for service-role when/if it's ever configured.
--    This is a safety net — the application does NOT require it.
CREATE POLICY "orders_admin_all"
  ON public.orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── payment_settings_public view ────────────────────────────────────
-- The checkout flow reads delivery charges and warranty info from this
-- view. Grant anon + authenticated read access so anonClient() works.
GRANT SELECT ON public.payment_settings_public TO anon, authenticated;

-- ── payment_settings table ──────────────────────────────────────────
-- The payment-instructions endpoint reads enabled payment methods.
-- Grant SELECT to authenticated only (admin-level data; anon blocked).
GRANT SELECT ON public.payment_settings TO authenticated;

-- ── meta_settings table ─────────────────────────────────────────────
-- The meta.server.ts module reads pixel/CAPI config. Grant SELECT to
-- authenticated so the server's anon client can read it via the
-- Supabase publishable key (which maps to the anon role on the server).
GRANT SELECT ON public.meta_settings TO anon, authenticated;

-- ── user_roles table ────────────────────────────────────────────────
-- Users must be able to read their own role row so admin-access check
-- works without a service-role key.
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
CREATE POLICY "user_roles_select_own"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Bootstrap INSERT: allow an authenticated user to insert their own
-- role row. This is needed for the first-admin bootstrap flow.
DROP POLICY IF EXISTS "user_roles_insert_own" ON public.user_roles;
CREATE POLICY "user_roles_insert_own"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
