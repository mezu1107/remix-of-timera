ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS meta_pixel_id text,
  ADD COLUMN IF NOT EXISTS google_tag_id text,
  ADD COLUMN IF NOT EXISTS google_ads_purchase_label text,
  ADD COLUMN IF NOT EXISTS tracking_enabled boolean NOT NULL DEFAULT false;