
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
