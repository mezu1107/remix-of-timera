CREATE TABLE public.trust_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name text NOT NULL DEFAULT 'section',
  heading text NOT NULL,
  body text,
  bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.trust_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trust_sections TO authenticated;
GRANT ALL ON public.trust_sections TO service_role;

ALTER TABLE public.trust_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trust public read" ON public.trust_sections
  FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "trust admin write" ON public.trust_sections
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trust_sections_touch BEFORE UPDATE ON public.trust_sections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping numeric NOT NULL DEFAULT 0;

INSERT INTO public.trust_sections (group_name, heading, body, bullets, icon, sort_order) VALUES
('hero', 'Trust & Security at Timera', 'This page is maintained by the Timera team to answer common security and privacy questions about our store. It describes the controls we operate today — it is not an independent audit or certification.', '[]'::jsonb, 'shield', 0),
('commitment', 'Encrypted in transit', 'Every page and checkout request is served over HTTPS/TLS.', '[]'::jsonb, 'lock', 1),
('commitment', 'Least-privilege access', 'Store data is protected by row-level access rules; only authorised staff accounts can reach admin tools.', '[]'::jsonb, 'key', 2),
('commitment', 'No card data on our servers', 'We do not store raw card numbers in our own database.', '[]'::jsonb, 'credit-card', 3),
('section', 'What data we collect', 'We collect only what we need to fulfil your order and improve the store.', '["Contact details you enter at checkout (name, email, phone, address)","Order contents and order history","Reviews and messages you choose to submit","Basic, non-identifying usage data for site reliability"]'::jsonb, 'database', 10),
('section', 'How we use your data', 'Your information is used to run the store, not to build profiles for resale.', '["Processing, shipping and supporting your orders","Responding to enquiries you send us","Preventing fraud and abuse","We never sell your personal data"]'::jsonb, 'workflow', 20),
('section', 'Retention and deletion', 'We keep order records for as long as needed for warranty, accounting and legal obligations, then remove them.', '["Order records retained for the warranty and accounting period","Marketing contacts removed on request","Email privacy@example.com to request access, correction or deletion"]'::jsonb, 'timer', 30),
('section', 'Subprocessors and integrations', 'A small number of trusted providers help us operate the store. Update this list with your own providers.', '["Hosting and application platform","Database and authentication provider","AI provider used for on-site assistance and search","Payment and shipping partners"]'::jsonb, 'network', 40),
('section', 'AI features on this store', 'Some parts of this store use AI to help you shop. Here is exactly what that means.', '["The shopping assistant and AI search send your message and our public catalogue data to an AI provider","We do not send your payment details or account passwords to AI providers","AI answers are helpful guidance, not professional advice — product pages remain the source of truth"]'::jsonb, 'sparkles', 50),
('section', 'Reporting a security issue', 'If you believe you have found a vulnerability, we want to hear from you.', '["Email security@example.com with steps to reproduce","Please give us reasonable time to investigate before public disclosure","We will acknowledge reports and keep you updated"]'::jsonb, 'bug', 60),
('faq', 'Is this page an independent certification?', 'No. This page is app-owner maintained content describing our own practices and the capabilities of the platform we build on. It is not an audit report or a certification.', '[]'::jsonb, null, 70),
('faq', 'Do you support account sign-in?', 'Yes. Accounts use email and password or Google sign-in, handled by our authentication provider — we never see your Google password.', '[]'::jsonb, null, 80),
('faq', 'Who can access the admin dashboard?', 'Only accounts explicitly granted an admin role. Access is checked on every request by the database itself, not only in the browser.', '[]'::jsonb, null, 90);