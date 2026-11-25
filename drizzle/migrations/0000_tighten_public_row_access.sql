ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

DROP POLICY IF EXISTS "Public reads collections" ON public.collections;
CREATE POLICY "Public reads collections"
  ON public.collections FOR SELECT TO anon, authenticated
  USING (active = true);

DROP POLICY IF EXISTS "Public reads hero slides" ON public.hero_slides;
CREATE POLICY "Public reads hero slides"
  ON public.hero_slides FOR SELECT TO anon, authenticated
  USING (active = true);

DROP POLICY IF EXISTS "Public reads products" ON public.products;
CREATE POLICY "Public reads products"
  ON public.products FOR SELECT TO anon, authenticated
  USING (active = true);

DROP POLICY IF EXISTS "Anyone can create a cart lead" ON public.cart_leads;
DROP POLICY IF EXISTS "Anyone can update their cart lead" ON public.cart_leads;
REVOKE INSERT, UPDATE ON public.cart_leads FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.upsert_cart_lead(p_lead jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_session_id text;
  v_stage text;
  v_items jsonb;
  v_item jsonb;
  v_name text;
  v_email text;
  v_phone text;
  v_address text;
  v_city text;
  v_order_number text;
  v_page_path text;
  v_referrer text;
  v_user_agent text;
  v_input_cart_value numeric;
  v_cart_value numeric := 0;
  v_item_count integer := 0;
  v_quantity integer;
  v_price numeric;
  v_existing public.cart_leads%ROWTYPE;
  v_stage_rank integer;
  v_existing_stage_rank integer;
BEGIN
  IF pg_catalog.jsonb_typeof(p_lead) IS DISTINCT FROM 'object'
     OR pg_catalog.octet_length(p_lead::text) > 100000 THEN
    RAISE EXCEPTION 'Invalid cart lead payload' USING ERRCODE = '22023';
  END IF;

  v_session_id := p_lead->>'session_id';
  IF v_session_id IS NULL OR v_session_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid cart lead session' USING ERRCODE = '22023';
  END IF;

  v_stage := p_lead->>'stage';
  IF v_stage NOT IN ('add_to_cart', 'checkout_started', 'checkout_details', 'purchased') THEN
    RAISE EXCEPTION 'Invalid cart lead stage' USING ERRCODE = '22023';
  END IF;

  v_items := COALESCE(p_lead->'items', '[]'::jsonb);
  IF pg_catalog.jsonb_typeof(v_items) IS DISTINCT FROM 'array'
     OR pg_catalog.jsonb_array_length(v_items) > 50 THEN
    RAISE EXCEPTION 'Invalid cart lead items' USING ERRCODE = '22023';
  END IF;

  IF COALESCE(p_lead->>'cart_value', '') <> '' THEN
    IF (p_lead->>'cart_value') !~ '^[0-9]{1,9}(\.[0-9]{1,2})?$' THEN
      RAISE EXCEPTION 'Invalid cart lead value' USING ERRCODE = '22023';
    END IF;
    v_input_cart_value := (p_lead->>'cart_value')::numeric;
    IF v_input_cart_value > 100000000 THEN
      RAISE EXCEPTION 'Cart lead value is too large' USING ERRCODE = '22023';
    END IF;
  END IF;

  FOR v_item IN SELECT e.value FROM pg_catalog.jsonb_array_elements(v_items) AS e(value)
  LOOP
    IF pg_catalog.jsonb_typeof(v_item) IS DISTINCT FROM 'object'
       OR pg_catalog.length(COALESCE(v_item->>'name', '')) NOT BETWEEN 1 AND 160
       OR COALESCE(v_item->>'quantity', '') !~ '^[1-9][0-9]{0,3}$'
       OR COALESCE(v_item->>'price', '') !~ '^[0-9]{1,9}(\.[0-9]{1,2})?$' THEN
      RAISE EXCEPTION 'Invalid cart lead item' USING ERRCODE = '22023';
    END IF;
    v_quantity := (v_item->>'quantity')::integer;
    v_price := (v_item->>'price')::numeric;
    IF v_price > 100000000 THEN
      RAISE EXCEPTION 'Cart lead item price is too large' USING ERRCODE = '22023';
    END IF;
    v_item_count := v_item_count + v_quantity;
    v_cart_value := v_cart_value + (v_price * v_quantity);
  END LOOP;

  IF v_item_count > 10000 OR v_cart_value > 100000000 THEN
    RAISE EXCEPTION 'Cart lead totals are too large' USING ERRCODE = '22023';
  END IF;
  IF v_item_count = 0 THEN
    v_cart_value := COALESCE(v_input_cart_value, 0);
  END IF;

  v_name := NULLIF(pg_catalog.btrim(p_lead->>'name'), '');
  v_email := NULLIF(pg_catalog.btrim(p_lead->>'email'), '');
  v_phone := NULLIF(pg_catalog.btrim(p_lead->>'phone'), '');
  v_address := NULLIF(pg_catalog.btrim(p_lead->>'address'), '');
  v_city := NULLIF(pg_catalog.btrim(p_lead->>'city'), '');
  v_order_number := NULLIF(pg_catalog.btrim(p_lead->>'order_number'), '');
  v_page_path := NULLIF(p_lead->>'page_path', '');
  v_referrer := NULLIF(p_lead->>'referrer', '');
  v_user_agent := NULLIF(p_lead->>'user_agent', '');

  IF v_email IS NOT NULL AND (
    pg_catalog.length(v_email) > 200
    OR v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ) THEN
    RAISE EXCEPTION 'Invalid cart lead email' USING ERRCODE = '22023';
  END IF;
  IF pg_catalog.length(COALESCE(v_name, '')) > 120
     OR pg_catalog.length(COALESCE(v_phone, '')) > 40
     OR pg_catalog.length(COALESCE(v_address, '')) > 500
     OR pg_catalog.length(COALESCE(v_city, '')) > 100
     OR pg_catalog.length(COALESCE(v_order_number, '')) > 100
     OR pg_catalog.length(COALESCE(v_page_path, '')) > 1000
     OR pg_catalog.length(COALESCE(v_referrer, '')) > 2000
     OR pg_catalog.length(COALESCE(v_user_agent, '')) > 1000 THEN
    RAISE EXCEPTION 'Cart lead field is too long' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_session_id, 0));
  SELECT * INTO v_existing
  FROM public.cart_leads AS cl
  WHERE cl.session_id = v_session_id
  FOR UPDATE;

  v_stage_rank := CASE v_stage
    WHEN 'add_to_cart' THEN 1
    WHEN 'checkout_started' THEN 2
    WHEN 'checkout_details' THEN 3
    ELSE 4
  END;

  IF FOUND THEN
    IF v_existing.user_id IS NOT NULL AND v_existing.user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Cart lead session is not available' USING ERRCODE = '42501';
    END IF;

    v_existing_stage_rank := CASE v_existing.stage
      WHEN 'add_to_cart' THEN 1
      WHEN 'checkout_started' THEN 2
      WHEN 'checkout_details' THEN 3
      WHEN 'purchased' THEN 4
      ELSE 0
    END;
    IF v_existing_stage_rank > v_stage_rank THEN
      v_stage := v_existing.stage;
    END IF;

    UPDATE public.cart_leads AS cl
    SET user_id = COALESCE(cl.user_id, auth.uid()),
        stage = v_stage,
        items = CASE WHEN v_item_count > 0 THEN v_items ELSE cl.items END,
        item_count = CASE WHEN v_item_count > 0 THEN v_item_count ELSE cl.item_count END,
        cart_value = CASE
          WHEN v_item_count > 0 THEN v_cart_value
          WHEN v_input_cart_value IS NOT NULL THEN v_input_cart_value
          ELSE cl.cart_value
        END,
        currency = 'PKR',
        name = COALESCE(v_name, cl.name),
        email = COALESCE(v_email, cl.email),
        phone = COALESCE(v_phone, cl.phone),
        address = COALESCE(v_address, cl.address),
        city = COALESCE(v_city, cl.city),
        order_number = COALESCE(v_order_number, cl.order_number),
        page_path = COALESCE(v_page_path, cl.page_path),
        referrer = COALESCE(v_referrer, cl.referrer),
        user_agent = COALESCE(v_user_agent, cl.user_agent)
    WHERE cl.id = v_existing.id;
  ELSE
    INSERT INTO public.cart_leads (
      session_id, user_id, name, email, phone, address, city, stage,
      items, item_count, cart_value, currency, order_number,
      page_path, referrer, user_agent
    ) VALUES (
      v_session_id, auth.uid(), v_name, v_email, v_phone, v_address, v_city, v_stage,
      v_items, v_item_count, v_cart_value, 'PKR', v_order_number,
      v_page_path, v_referrer, v_user_agent
    );
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.upsert_cart_lead(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_cart_lead(jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.lookup_order_by_email(p_order_number text, p_customer_email text)
RETURNS TABLE (
  id uuid,
  order_number text,
  customer_name text,
  customer_email text,
  customer_phone text,
  shipping_address text,
  items jsonb,
  subtotal numeric,
  discount numeric,
  shipping numeric,
  total numeric,
  status text,
  status_history jsonb,
  tracking_number text,
  courier text,
  estimated_delivery timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  fbp text,
  fbc text,
  user_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
  SELECT o.id, o.order_number, o.customer_name, o.customer_email, o.customer_phone,
         o.shipping_address, o.items, o.subtotal, o.discount, o.shipping, o.total,
         o.status, o.status_history, o.tracking_number, o.courier,
         o.estimated_delivery, o.created_at, o.updated_at, o.fbp, o.fbc, o.user_id
  FROM public.orders AS o
  WHERE p_order_number IS NOT NULL
    AND pg_catalog.length(pg_catalog.btrim(p_order_number)) BETWEEN 1 AND 80
    AND p_customer_email IS NOT NULL
    AND pg_catalog.length(pg_catalog.btrim(p_customer_email)) BETWEEN 5 AND 200
    AND pg_catalog.lower(pg_catalog.btrim(o.order_number)) = pg_catalog.lower(pg_catalog.btrim(p_order_number))
    AND pg_catalog.lower(pg_catalog.btrim(o.customer_email)) = pg_catalog.lower(pg_catalog.btrim(p_customer_email))
  ORDER BY o.created_at DESC
  LIMIT 1
$function$;

REVOKE ALL ON FUNCTION public.lookup_order_by_email(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order_by_email(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.mark_order_purchase_event(p_order_number text, p_customer_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_event_id text;
BEGIN
  UPDATE public.orders AS o
  SET purchase_event_id = COALESCE(o.purchase_event_id, 'purchase_' || o.id::text)
  WHERE o.id = (
    SELECT matched.id
    FROM public.orders AS matched
    WHERE pg_catalog.length(pg_catalog.btrim(p_order_number)) BETWEEN 1 AND 80
      AND pg_catalog.length(pg_catalog.btrim(p_customer_email)) BETWEEN 5 AND 200
      AND pg_catalog.lower(pg_catalog.btrim(matched.order_number)) = pg_catalog.lower(pg_catalog.btrim(p_order_number))
      AND pg_catalog.lower(pg_catalog.btrim(matched.customer_email)) = pg_catalog.lower(pg_catalog.btrim(p_customer_email))
      AND matched.status NOT IN ('cancelled', 'failed', 'refunded')
    ORDER BY matched.created_at DESC
    LIMIT 1
  )
  RETURNING o.purchase_event_id INTO v_event_id;

  RETURN v_event_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.mark_order_purchase_event(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_order_purchase_event(text, text) TO anon, authenticated;