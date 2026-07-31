-- Price integrity: totals must add up
ALTER TABLE public.orders
  ADD CONSTRAINT orders_totals_consistent
  CHECK (
    discount >= 0
    AND discount <= subtotal
    AND shipping >= 0
    AND total = subtotal - discount + shipping
  ) NOT VALID;

-- Guest order rate limiting
CREATE OR REPLACE FUNCTION public.enforce_guest_order_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  per_email int;
  per_hour int;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO per_email
  FROM public.orders
  WHERE user_id IS NULL
    AND lower(customer_email) = lower(NEW.customer_email)
    AND created_at > now() - interval '1 hour';

  IF per_email >= 5 THEN
    RAISE EXCEPTION 'Too many recent orders for this email. Please try again later.';
  END IF;

  SELECT count(*) INTO per_hour
  FROM public.orders
  WHERE user_id IS NULL
    AND created_at > now() - interval '1 hour';

  IF per_hour >= 20 THEN
    RAISE EXCEPTION 'Guest checkout is temporarily busy. Please try again shortly.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guest_order_rate_limit ON public.orders;
CREATE TRIGGER trg_guest_order_rate_limit
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_guest_order_rate_limit();

CREATE INDEX IF NOT EXISTS orders_guest_recent_idx
  ON public.orders (created_at)
  WHERE user_id IS NULL;