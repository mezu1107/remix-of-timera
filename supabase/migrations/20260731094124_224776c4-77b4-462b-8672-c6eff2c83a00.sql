CREATE OR REPLACE FUNCTION public.unaccent_fallback(_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT translate(_input,
    'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÑñÇç',
    'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc')
$$;

CREATE OR REPLACE FUNCTION public.slugify(_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' from regexp_replace(lower(public.unaccent_fallback(_input)), '[^a-z0-9]+', '-', 'g'))
$$;

UPDATE public.collections
SET slug = public.slugify(name)
WHERE slug IS NULL OR slug <> public.slugify(name);

INSERT INTO public.collections (name, slug, tagline, image_url, active, sort_order)
SELECT DISTINCT ON (p.collection)
  p.collection,
  public.slugify(p.collection),
  'Timera ' || p.collection,
  p.image_url,
  true,
  100
FROM public.products p
WHERE p.collection IS NOT NULL
  AND p.collection <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.collections c WHERE public.slugify(c.name) = public.slugify(p.collection)
  )
ORDER BY p.collection, p.sort_order NULLS LAST;

CREATE UNIQUE INDEX IF NOT EXISTS collections_slug_key ON public.collections (slug);