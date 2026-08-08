ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS tiktok_pixel_id text,
  ADD COLUMN IF NOT EXISTS linkedin_partner_id text,
  ADD COLUMN IF NOT EXISTS snapchat_pixel_id text,
  ADD COLUMN IF NOT EXISTS pinterest_tag_id text,
  ADD COLUMN IF NOT EXISTS bing_uet_tag_id text,
  ADD COLUMN IF NOT EXISTS bing_site_verification text,
  ADD COLUMN IF NOT EXISTS google_site_verification text,
  ADD COLUMN IF NOT EXISTS pinterest_site_verification text;

UPDATE public.site_settings SET tiktok_pixel_id = COALESCE(NULLIF(tiktok_pixel_id,''), 'D7IA94BC77U8DEPHHKSG');