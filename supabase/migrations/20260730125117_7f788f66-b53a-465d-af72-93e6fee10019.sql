ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS courier text,
  ADD COLUMN IF NOT EXISTS estimated_delivery timestamptz,
  ADD COLUMN IF NOT EXISTS status_history jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.orders_log_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.status_history := jsonb_build_array(
      jsonb_build_object('status', COALESCE(NEW.status, 'pending'), 'at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_history := COALESCE(OLD.status_history, '[]'::jsonb) || jsonb_build_object(
      'status', NEW.status,
      'at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_log_status_insert ON public.orders;
CREATE TRIGGER orders_log_status_insert
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_log_status();

DROP TRIGGER IF EXISTS orders_log_status_update ON public.orders;
CREATE TRIGGER orders_log_status_update
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_log_status();

UPDATE public.orders
SET status_history = jsonb_build_array(
  jsonb_build_object('status', COALESCE(status, 'pending'), 'at', to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
)
WHERE status_history = '[]'::jsonb OR status_history IS NULL;