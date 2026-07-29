create type public.app_role as enum ('admin','staff','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create table public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  eyebrow text,
  title text not null,
  title_accent text,
  description text,
  cta_label text,
  cta_href text default '/shop',
  image_url text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.hero_slides to anon;
grant select, insert, update, delete on public.hero_slides to authenticated;
grant all on public.hero_slides to service_role;
alter table public.hero_slides enable row level security;
create policy "Public reads hero slides" on public.hero_slides for select to anon, authenticated using (true);
create policy "Admins manage hero slides" on public.hero_slides for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger t_hero before update on public.hero_slides for each row execute function public.touch_updated_at();

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  tagline text,
  image_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.collections to anon;
grant select, insert, update, delete on public.collections to authenticated;
grant all on public.collections to service_role;
alter table public.collections enable row level security;
create policy "Public reads collections" on public.collections for select to anon, authenticated using (true);
create policy "Admins manage collections" on public.collections for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger t_coll before update on public.collections for each row execute function public.touch_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text not null default 'Timera',
  collection text not null default 'Heritage',
  price numeric not null default 0,
  compare_at numeric,
  image_url text not null,
  gallery jsonb not null default '[]'::jsonb,
  movement text not null default 'Automatic',
  case_material text not null default 'Stainless Steel',
  strap text not null default 'Leather',
  water_resistance text not null default '50m',
  rating numeric not null default 5,
  reviews int not null default 0,
  badge text,
  stock int not null default 1,
  description text not null default '',
  features jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Public reads products" on public.products for select to anon, authenticated using (true);
create policy "Admins manage products" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger t_prod before update on public.products for each row execute function public.touch_updated_at();

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text,
  author text not null default 'Timera Editorial',
  category text not null default 'Journal',
  image_url text,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.blog_posts to anon;
grant select, insert, update, delete on public.blog_posts to authenticated;
grant all on public.blog_posts to service_role;
alter table public.blog_posts enable row level security;
create policy "Public reads published posts" on public.blog_posts for select to anon, authenticated using (published = true or public.has_role(auth.uid(),'admin'));
create policy "Admins manage posts" on public.blog_posts for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger t_blog before update on public.blog_posts for each row execute function public.touch_updated_at();

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant insert on public.orders to anon;
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Anyone can place an order" on public.orders for insert to anon, authenticated with check (true);
create policy "Admins manage orders" on public.orders for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger t_order before update on public.orders for each row execute function public.touch_updated_at();

revoke execute on function public.has_role(uuid, public.app_role) from anon;
revoke execute on function public.touch_updated_at() from anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  admin_count int;
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';

  IF admin_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN true;
  END IF;

  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = uid AND role = 'admin');
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.claim_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM anon, authenticated, PUBLIC;

alter table public.products
  add column if not exists sale_price numeric,
  add column if not exists category text,
  add column if not exists colors jsonb not null default '[]'::jsonb,
  add column if not exists sizes jsonb not null default '[]'::jsonb,
  add column if not exists deal_id uuid,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_keywords text;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories public read" on public.categories for select using (active = true or public.has_role(auth.uid(),'admin'));
create policy "categories admin write" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger categories_touch before update on public.categories for each row execute function public.touch_updated_at();

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text,
  badge text,
  discount_percent integer not null default 0,
  code text,
  image_url text,
  cta_label text,
  cta_href text,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.deals to anon;
grant select, insert, update, delete on public.deals to authenticated;
grant all on public.deals to service_role;
alter table public.deals enable row level security;
create policy "deals public read" on public.deals for select using (active = true or public.has_role(auth.uid(),'admin'));
create policy "deals admin write" on public.deals for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger deals_touch before update on public.deals for each row execute function public.touch_updated_at();

create table if not exists public.popups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text,
  image_url text,
  badge text,
  cta_label text,
  cta_href text,
  coupon_code text,
  delay_seconds integer not null default 6,
  trigger_type text not null default 'delay',
  frequency text not null default 'session',
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.popups to anon;
grant select, insert, update, delete on public.popups to authenticated;
grant all on public.popups to service_role;
alter table public.popups enable row level security;
create policy "popups public read" on public.popups for select using (active = true or public.has_role(auth.uid(),'admin'));
create policy "popups admin write" on public.popups for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger popups_touch before update on public.popups for each row execute function public.touch_updated_at();

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null default 'percent',
  discount_value numeric not null default 0,
  min_order numeric not null default 0,
  usage_limit integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.coupons to anon;
grant select, insert, update, delete on public.coupons to authenticated;
grant all on public.coupons to service_role;
alter table public.coupons enable row level security;
create policy "coupons public read" on public.coupons for select using (active = true or public.has_role(auth.uid(),'admin'));
create policy "coupons admin write" on public.coupons for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger coupons_touch before update on public.coupons for each row execute function public.touch_updated_at();

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  customer_name text not null,
  rating integer not null default 5,
  title text,
  body text,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "reviews public read" on public.reviews for select using (approved = true or public.has_role(auth.uid(),'admin'));
create policy "reviews public submit" on public.reviews for insert with check (approved = false);
create policy "reviews admin write" on public.reviews for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger reviews_touch before update on public.reviews for each row execute function public.touch_updated_at();

insert into public.categories (name, slug, description, sort_order) values
  ('Automatic','automatic','Self-winding Swiss movements.',1),
  ('Chronograph','chronograph','Precision stopwatch complications.',2),
  ('Dive','dive','Built for depth and pressure.',3),
  ('Dress','dress','Refined pieces for formal wear.',4)
on conflict (slug) do nothing;

insert into public.deals (title, subtitle, description, badge, discount_percent, code, cta_label, cta_href, sort_order)
values ('Winter Atelier Sale','Up to 25% off selected timepieces','A limited selection of Swiss automatics at atelier pricing.','Limited',25,'WINTER25','Shop the sale','/shop',1)
on conflict do nothing;

insert into public.popups (title, message, badge, cta_label, cta_href, coupon_code, delay_seconds)
values ('Winter Sale is live','Enjoy 25% off selected Timera timepieces this week only.','Offer','Shop the sale','/deals','WINTER25',6)
on conflict do nothing;

insert into public.coupons (code, description, discount_type, discount_value, min_order)
values ('WINTER25','25% off the winter selection','percent',25,0)
on conflict (code) do nothing;

drop policy if exists "reviews public submit" on public.reviews;
create policy "reviews public submit" on public.reviews for insert to anon, authenticated with check (approved = false);

INSERT INTO public.hero_slides (eyebrow, title, title_accent, description, cta_label, cta_href, image_url, sort_order, active) VALUES
('Swiss Craft','Time, worn','beautifully','Hand-finished automatic timepieces built to outlast trends.','Shop the collection','/shop','/__l5e/assets-v1/186ede67-aed7-4ea5-ac05-58c6feba16e9/hero-1.jpg',1,true),
('New Season','The Chronos','Collection','Precision chronographs for those who measure every moment.','Discover Chronos','/shop','/__l5e/assets-v1/6333cf04-886e-49e3-903c-063e6b75afc0/hero-2.jpg',2,true),
('Limited','Abyss','Diver','300m of engineered confidence, in a case you can wear to dinner.','View Abyss','/shop','/__l5e/assets-v1/e690a484-2e44-4623-934b-4394e04c12b9/hero-3.jpg',3,true);

INSERT INTO public.collections (name, slug, tagline, image_url, sort_order, active) VALUES
('Heritage','heritage','Classic dress watches, quietly confident.','/__l5e/assets-v1/f6ed43d6-2108-44f1-957a-b705d59e3920/watch-1.jpg',1,true),
('Chronos','chronos','Chronographs engineered for precision.','/__l5e/assets-v1/5dc3eb19-0e96-4ca9-9a40-caca669cd8a1/watch-2.jpg',2,true),
('Abyss','abyss','Dive-ready, boardroom-approved.','/__l5e/assets-v1/4b6e6149-409d-48a4-84f9-d2f20592eb51/watch-3.jpg',3,true);

INSERT INTO public.categories (name, slug, description, image_url, sort_order, active) VALUES
('Dress Watches','dress-watches','Slim, refined and evening-ready.','/__l5e/assets-v1/f6ed43d6-2108-44f1-957a-b705d59e3920/watch-1.jpg',1,true),
('Chronographs','chronographs','Stopwatch complications with racing heritage.','/__l5e/assets-v1/5dc3eb19-0e96-4ca9-9a40-caca669cd8a1/watch-2.jpg',2,true),
('Dive Watches','dive-watches','Built for depth and daily wear.','/__l5e/assets-v1/4b6e6149-409d-48a4-84f9-d2f20592eb51/watch-3.jpg',3,true),
('Gold Edition','gold-edition','Warm-toned cases with dress-watch proportions.','/__l5e/assets-v1/4d554f9c-a75d-42a7-b004-03e1dd31fd9c/watch-4.jpg',4,true);

INSERT INTO public.products (slug,name,brand,collection,category,price,compare_at,image_url,gallery,colors,sizes,movement,case_material,strap,water_resistance,rating,reviews,badge,stock,description,features,featured,active,sort_order) VALUES
('heritage-noir','Heritage Noir','Timera','Heritage','Dress Watches',1290,1590,'/__l5e/assets-v1/f6ed43d6-2108-44f1-957a-b705d59e3920/watch-1.jpg',
 '["/__l5e/assets-v1/f6ed43d6-2108-44f1-957a-b705d59e3920/watch-1.jpg","/__l5e/assets-v1/457c5fe2-6227-48b9-ab75-56bd177bbc05/watch-5.jpg"]'::jsonb,
 '["Black #1a1a1a | /__l5e/assets-v1/f6ed43d6-2108-44f1-957a-b705d59e3920/watch-1.jpg","Brown #6b4423 | /__l5e/assets-v1/457c5fe2-6227-48b9-ab75-56bd177bbc05/watch-5.jpg","Blue #1e3a8a | /__l5e/assets-v1/30174876-e405-4f8f-8c8d-68d600396226/watch-6.jpg"]'::jsonb,
 '["38mm","40mm","42mm"]'::jsonb,'Swiss Automatic','Stainless Steel','Italian Leather','50m',4.9,128,'Bestseller',12,
 'A quietly confident dress watch with a sunburst dial, applied indices and a hand-stitched leather strap. Slim enough for a cuff, solid enough for every day.',
 '["Sapphire crystal with anti-reflective coating","42-hour power reserve","Exhibition sapphire caseback","Hand-stitched Italian leather strap"]'::jsonb,true,true,1),
('chronos-steel','Chronos Steel','Timera','Chronos','Chronographs',2450,NULL,'/__l5e/assets-v1/5dc3eb19-0e96-4ca9-9a40-caca669cd8a1/watch-2.jpg',
 '["/__l5e/assets-v1/5dc3eb19-0e96-4ca9-9a40-caca669cd8a1/watch-2.jpg","/__l5e/assets-v1/30174876-e405-4f8f-8c8d-68d600396226/watch-6.jpg"]'::jsonb,
 '["Silver #c0c5cd | /__l5e/assets-v1/5dc3eb19-0e96-4ca9-9a40-caca669cd8a1/watch-2.jpg","Black #1a1a1a | /__l5e/assets-v1/f6ed43d6-2108-44f1-957a-b705d59e3920/watch-1.jpg","Green #14532d | /__l5e/assets-v1/4b6e6149-409d-48a4-84f9-d2f20592eb51/watch-3.jpg"]'::jsonb,
 '["40mm","42mm","44mm"]'::jsonb,'Automatic Chronograph','Brushed Steel','Steel Bracelet','100m',4.8,86,'New',8,
 'A racing-bred chronograph with tri-compax subdials, a tachymeter bezel and a column-wheel movement you can watch work through the caseback.',
 '["Column-wheel chronograph movement","Tachymeter bezel","Luminous applied indices","Quick-release steel bracelet"]'::jsonb,true,true,2),
('abyss-diver','Abyss Diver 300','Timera','Abyss','Dive Watches',1890,2190,'/__l5e/assets-v1/4b6e6149-409d-48a4-84f9-d2f20592eb51/watch-3.jpg',
 '["/__l5e/assets-v1/4b6e6149-409d-48a4-84f9-d2f20592eb51/watch-3.jpg","/__l5e/assets-v1/4d554f9c-a75d-42a7-b004-03e1dd31fd9c/watch-4.jpg"]'::jsonb,
 '["Green #14532d | /__l5e/assets-v1/4b6e6149-409d-48a4-84f9-d2f20592eb51/watch-3.jpg","Blue #1e3a8a | /__l5e/assets-v1/30174876-e405-4f8f-8c8d-68d600396226/watch-6.jpg","Black #1a1a1a | /__l5e/assets-v1/f6ed43d6-2108-44f1-957a-b705d59e3920/watch-1.jpg"]'::jsonb,
 '["40mm","42mm","44mm"]'::jsonb,'Swiss Automatic','316L Steel','Rubber Tropic','300m',4.9,204,'Limited',5,
 'Rated to 300 metres with a unidirectional ceramic bezel and a helium escape valve — yet slim enough to disappear under a shirt cuff.',
 '["300m water resistance","Ceramic unidirectional bezel","Helium escape valve","Super-LumiNova indices"]'::jsonb,true,true,3),
('aurum-gold','Aurum Gold','Timera','Heritage','Gold Edition',3250,NULL,'/__l5e/assets-v1/4d554f9c-a75d-42a7-b004-03e1dd31fd9c/watch-4.jpg',
 '["/__l5e/assets-v1/4d554f9c-a75d-42a7-b004-03e1dd31fd9c/watch-4.jpg","/__l5e/assets-v1/457c5fe2-6227-48b9-ab75-56bd177bbc05/watch-5.jpg"]'::jsonb,
 '["Gold #c9a86a | /__l5e/assets-v1/4d554f9c-a75d-42a7-b004-03e1dd31fd9c/watch-4.jpg","Brown #6b4423 | /__l5e/assets-v1/457c5fe2-6227-48b9-ab75-56bd177bbc05/watch-5.jpg"]'::jsonb,
 '["38mm","40mm"]'::jsonb,'Swiss Automatic','18k Gold Plated','Alligator Leather','30m',4.7,42,NULL,4,
 'Warm-toned and unmistakably formal. A gold-plated case, champagne dial and alligator strap for occasions that deserve the effort.',
 '["18k gold-plated case","Champagne sunburst dial","Alligator leather strap","72-hour power reserve"]'::jsonb,false,true,4),
('terra-bronze','Terra Bronze','Timera','Heritage','Dress Watches',1450,NULL,'/__l5e/assets-v1/457c5fe2-6227-48b9-ab75-56bd177bbc05/watch-5.jpg',
 '["/__l5e/assets-v1/457c5fe2-6227-48b9-ab75-56bd177bbc05/watch-5.jpg","/__l5e/assets-v1/f6ed43d6-2108-44f1-957a-b705d59e3920/watch-1.jpg"]'::jsonb,
 '["Brown #6b4423 | /__l5e/assets-v1/457c5fe2-6227-48b9-ab75-56bd177bbc05/watch-5.jpg","Black #1a1a1a | /__l5e/assets-v1/f6ed43d6-2108-44f1-957a-b705d59e3920/watch-1.jpg","Gold #c9a86a | /__l5e/assets-v1/4d554f9c-a75d-42a7-b004-03e1dd31fd9c/watch-4.jpg"]'::jsonb,
 '["40mm","42mm"]'::jsonb,'Automatic','Bronze','Suede Leather','50m',4.6,57,NULL,9,
 'A bronze case that develops its own patina with wear, paired with a warm suede strap. No two will age the same way.',
 '["Living bronze patina","Domed sapphire crystal","Vintage-tone lume","Suede leather strap"]'::jsonb,false,true,5),
('azure-classic','Azure Classic','Timera','Chronos','Chronographs',1690,1990,'/__l5e/assets-v1/30174876-e405-4f8f-8c8d-68d600396226/watch-6.jpg',
 '["/__l5e/assets-v1/30174876-e405-4f8f-8c8d-68d600396226/watch-6.jpg","/__l5e/assets-v1/5dc3eb19-0e96-4ca9-9a40-caca669cd8a1/watch-2.jpg"]'::jsonb,
 '["Blue #1e3a8a | /__l5e/assets-v1/30174876-e405-4f8f-8c8d-68d600396226/watch-6.jpg","Silver #c0c5cd | /__l5e/assets-v1/5dc3eb19-0e96-4ca9-9a40-caca669cd8a1/watch-2.jpg","Green #14532d | /__l5e/assets-v1/4b6e6149-409d-48a4-84f9-d2f20592eb51/watch-3.jpg"]'::jsonb,
 '["38mm","40mm","42mm"]'::jsonb,'Automatic Chronograph','Stainless Steel','Steel Bracelet','100m',4.8,73,'Sale',11,
 'A deep-blue sunray dial under a box sapphire crystal, with a bracelet that tapers properly. Everyday chronograph, dressed up.',
 '["Box sapphire crystal","Sunray blue dial","Screw-down crown","Tapered steel bracelet"]'::jsonb,true,true,6);

INSERT INTO public.blog_posts (slug,title,excerpt,content,author,category,image_url,published) VALUES
('welcome-to-timera','Welcome to Timera','How we think about movements, materials and the watches worth keeping.',
'Every Timera watch starts with a movement we would be happy to wear ourselves. From there we obsess over the parts most brands hide: the finishing on the bridges, the taper of a bracelet, the way a strap softens after a month.

This journal is where we document those decisions — the ones that never make it onto a spec sheet but define how a watch feels on the wrist.',
'Timera Editorial','Journal','/__l5e/assets-v1/a5804e45-3f2e-4eb0-851a-52f9f8923b85/atelier.jpg',true);

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

CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency text NOT NULL DEFAULT 'PKR',
  currency_symbol text NOT NULL DEFAULT 'Rs',
  cod_enabled boolean NOT NULL DEFAULT true,
  cod_charge numeric NOT NULL DEFAULT 0,
  delivery_charge numeric NOT NULL DEFAULT 250,
  free_delivery_above numeric NOT NULL DEFAULT 5000,
  easypaisa_enabled boolean NOT NULL DEFAULT true,
  easypaisa_number text,
  easypaisa_account_name text,
  jazzcash_enabled boolean NOT NULL DEFAULT true,
  jazzcash_number text,
  jazzcash_account_name text,
  bank_enabled boolean NOT NULL DEFAULT true,
  bank_name text,
  bank_account_title text,
  bank_account_number text,
  bank_iban text,
  warranty_months integer NOT NULL DEFAULT 12,
  warranty_note text NOT NULL DEFAULT '1 year warranty, premium gift box & warranty card included with every timepiece.',
  payment_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_settings public read" ON public.payment_settings FOR SELECT USING (true);
CREATE POLICY "payment_settings admin insert" ON public.payment_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "payment_settings admin update" ON public.payment_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "payment_settings admin delete" ON public.payment_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_payment_settings_updated BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.payment_settings (
  currency, currency_symbol, cod_enabled, cod_charge, delivery_charge, free_delivery_above,
  easypaisa_enabled, easypaisa_number, easypaisa_account_name,
  jazzcash_enabled, jazzcash_number, jazzcash_account_name,
  bank_enabled, bank_name, bank_account_title, bank_account_number, bank_iban,
  warranty_months, warranty_note, payment_note
) VALUES (
  'PKR', 'Rs', true, 0, 250, 5000,
  true, '0300-1234567', 'Timera Store',
  true, '0300-1234567', 'Timera Store',
  true, 'Meezan Bank', 'Timera Store', '01234567890123', 'PK00MEZN0001234567890123',
  12,
  '1 saal ki warranty, premium gift box aur warranty card har watch ke saath.',
  'Order confirm hone ke baad hamari team WhatsApp/Call par payment aur delivery confirm karegi.'
);

DELETE FROM public.categories a USING public.categories b
WHERE a.slug = b.slug AND a.ctid > b.ctid;

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

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE POLICY "customers read own orders" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_role text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

INSERT INTO public.reviews (customer_name, customer_role, rating, title, body, approved, featured) VALUES
('Alexandra Chen','Collector, Singapore',5,'Unmistakably luxurious','The finishing rivals houses ten times the price. Unmistakably luxurious.',true,true),
('James Whitmore','Client since 2019',5,'Concierge-level service','Concierge-level service and a watch that turns heads at every board meeting.',true,true),
('Sofia Marchetti','Milan, Italy',5,'Elegance without effort','Elegance without effort. My Eclipse Noir is a daily obsession.',true,true),
('Rajesh Kapoor','Dubai',5,'A serious maison','The packaging alone told me I was buying from a serious maison.',true,true);

REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

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

DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Place own or guest order" ON public.orders
FOR INSERT TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR (auth.uid() IS NULL AND user_id IS NULL)
);

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

DROP POLICY IF EXISTS "reviews public submit" ON public.reviews;
CREATE POLICY "reviews authenticated submit" ON public.reviews
FOR INSERT TO authenticated
WITH CHECK (approved = false);

ALTER VIEW public.payment_settings_public SET (security_invoker = on);

CREATE POLICY "payment_settings public safe read" ON public.payment_settings
FOR SELECT TO anon
USING (true);

GRANT SELECT (
  id, currency, currency_symbol, cod_enabled, cod_charge, delivery_charge,
  free_delivery_above, easypaisa_enabled, jazzcash_enabled, bank_enabled,
  warranty_months, warranty_note, payment_note, created_at
) ON public.payment_settings TO anon;