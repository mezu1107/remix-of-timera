CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active FAQs are public" ON public.faqs FOR SELECT TO anon, authenticated
  USING (active = true OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage FAQs" ON public.faqs FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.faqs_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.faqs_touch_updated_at();

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS slug text;
UPDATE public.deals SET slug = regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g') WHERE slug IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS deals_slug_key ON public.deals (slug);

ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contact_hours text;

INSERT INTO public.faqs (question, answer, category, sort_order) VALUES
('Do you deliver across Pakistan?', 'Yes. We deliver to every city in Pakistan with trusted couriers. Orders are dispatched within 24 hours and usually arrive in 2-4 working days.', 'Shipping', 1),
('Is cash on delivery available?', 'Yes, cash on delivery is available nationwide. You can also pay by bank transfer or JazzCash/EasyPaisa.', 'Payment', 2),
('What warranty do I get?', 'Every Timera timepiece includes an international warranty covering the movement against manufacturing defects.', 'Warranty', 3),
('Can I return or exchange my watch?', 'Yes. You have 7 days from delivery to request an exchange or return, provided the watch is unworn and in its original box.', 'Returns', 4),
('Are the watches original?', 'Every piece is quality-checked before dispatch and shipped with its authenticity card and branded packaging.', 'Product', 5),
('How can I track my order?', 'Use the Track Order page with your order number and email to see live status, courier and tracking number.', 'Shipping', 6)
ON CONFLICT DO NOTHING;