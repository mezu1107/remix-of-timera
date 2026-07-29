-- 1. remove duplicate categories created by re-seeding
DELETE FROM public.categories a USING public.categories b
WHERE a.slug = b.slug AND a.ctid > b.ctid;

-- 2. SITE SETTINGS (singleton, admin-controlled)
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL DEFAULT 'TIMERA',
  brand_suffix text DEFAULT 'Timepieces',
  logo_url text,
  brand_tagline text DEFAULT 'Luxury timepieces, delivered across Pakistan.',
  marquee_enabled boolean NOT NULL DEFAULT true,
  marquee_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  featured_in jsonb NOT NULL DEFAULT '[]'::jsonb,
  warranty_years integer NOT NULL DEFAULT 1,
  nav_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  footer_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  contact_email text,
  contact_phone text,
  whatsapp_number text,
  address text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  youtube_url text,
  feature_enabled boolean NOT NULL DEFAULT true,
  feature_eyebrow text DEFAULT 'Limited Edition Release',
  feature_title text DEFAULT 'The Nocturne',
  feature_title_accent text DEFAULT 'Phantom',
  feature_description text,
  feature_cta_label text DEFAULT 'Reserve Now',
  feature_cta_href text DEFAULT '/shop',
  feature_image_url text,
  feature_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site settings public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site settings admin write" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_settings_touch BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_settings (
  brand_name, brand_suffix, brand_tagline, marquee_items, featured_in, warranty_years,
  contact_email, contact_phone, whatsapp_number, address,
  feature_eyebrow, feature_title, feature_title_accent, feature_description,
  feature_cta_label, feature_cta_href, feature_image_url, feature_ends_at
) VALUES (
  'TIMERA', 'Timepieces', 'Luxury timepieces, delivered across Pakistan.',
  '["1 year international warranty on every timepiece","Cash on delivery available nationwide","Free delivery on orders above Rs 5,000","7-day easy exchange on unworn pieces","Featured in: GQ","Featured in: MONOCLE","Featured in: WALLPAPER*","Featured in: HODINKEE","Featured in: ROBB REPORT","Featured in: FINANCIAL TIMES"]'::jsonb,
  '["GQ","MONOCLE","WALLPAPER*","HODINKEE","ROBB REPORT","FINANCIAL TIMES"]'::jsonb,
  1,
  'care@timera.store', '0300-1234567', '923001234567', 'Lahore, Pakistan',
  'Limited Edition Release', 'The Nocturne', 'Phantom',
  'Only 250 pieces worldwide. Skeleton dial, black-DLC titanium case. Reserve yours before the countdown closes.',
  'Reserve Now', '/shop',
  '/__l5e/assets-v1/e690a484-2e44-4623-934b-4394e04c12b9/hero-3.jpg',
  now() + interval '3 days'
);

-- 3. CUSTOMER PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  email text,
  phone text,
  address text,
  city text,
  postal_code text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 4. ORDERS BELONG TO CUSTOMERS
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE POLICY "customers read own orders" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 5. TESTIMONIALS VIA REVIEWS
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_role text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

INSERT INTO public.reviews (customer_name, customer_role, rating, title, body, approved, featured) VALUES
('Alexandra Chen','Collector, Singapore',5,'Unmistakably luxurious','The finishing rivals houses ten times the price. Unmistakably luxurious.',true,true),
('James Whitmore','Client since 2019',5,'Concierge-level service','Concierge-level service and a watch that turns heads at every board meeting.',true,true),
('Sofia Marchetti','Milan, Italy',5,'Elegance without effort','Elegance without effort. My Eclipse Noir is a daily obsession.',true,true),
('Rajesh Kapoor','Dubai',5,'A serious maison','The packaging alone told me I was buying from a serious maison.',true,true);