INSERT INTO public.hero_slides (eyebrow, title, title_accent, description, cta_label, cta_href, image_url, sort_order, active) VALUES
('Swiss Craft','Time, worn','beautifully','Hand-finished automatic timepieces built to outlast trends.','Shop the collection','/shop','/__l5e/assets-v1/6bbda370-c60b-452c-a453-4695254ac2c0/hero-1.jpg',1,true),
('New Season','The Chronos','Collection','Precision chronographs for those who measure every moment.','Discover Chronos','/shop',' /__l5e/assets-v1/5a1acdc5-28c2-4396-b400-0f7ce0dc114a/hero-2.jpg',2,true),
('Limited','Abyss','Diver','300m of engineered confidence, in a case you can wear to dinner.','View Abyss','/shop','/__l5e/assets-v1/b06a4888-3bf8-4f99-a408-0c0ecccfa1f0/hero-3.jpg',3,true);

INSERT INTO public.collections (name, slug, tagline, image_url, sort_order, active) VALUES
('Heritage','heritage','Classic dress watches, quietly confident.','/__l5e/assets-v1/0dac4a8a-030e-477f-a241-ee1e24fc4c45/watch-1.jpg',1,true),
('Chronos','chronos','Chronographs engineered for precision.','/__l5e/assets-v1/24d2f862-b678-4407-83fa-c6bf8f9e605d/watch-2.jpg',2,true),
('Abyss','abyss','Dive-ready, boardroom-approved.','/__l5e/assets-v1/4739589d-2bae-4a62-9637-7012230c8836/watch-3.jpg',3,true);

INSERT INTO public.categories (name, slug, description, image_url, sort_order, active) VALUES
('Dress Watches','dress-watches','Slim, refined and evening-ready.','/__l5e/assets-v1/0dac4a8a-030e-477f-a241-ee1e24fc4c45/watch-1.jpg',1,true),
('Chronographs','chronographs','Stopwatch complications with racing heritage.','/__l5e/assets-v1/24d2f862-b678-4407-83fa-c6bf8f9e605d/watch-2.jpg',2,true),
('Dive Watches','dive-watches','Built for depth and daily wear.','/__l5e/assets-v1/4739589d-2bae-4a62-9637-7012230c8836/watch-3.jpg',3,true),
('Gold Edition','gold-edition','Warm-toned cases with dress-watch proportions.','/__l5e/assets-v1/5ffc4022-1746-4100-8624-186297224855/watch-4.jpg',4,true);

INSERT INTO public.products (slug,name,brand,collection,category,price,compare_at,image_url,gallery,colors,sizes,movement,case_material,strap,water_resistance,rating,reviews,badge,stock,description,features,featured,active,sort_order) VALUES
('heritage-noir','Heritage Noir','Timera','Heritage','Dress Watches',1290,1590,'/__l5e/assets-v1/0dac4a8a-030e-477f-a241-ee1e24fc4c45/watch-1.jpg',
 '["/__l5e/assets-v1/0dac4a8a-030e-477f-a241-ee1e24fc4c45/watch-1.jpg","/__l5e/assets-v1/22a653e5-0ff0-4f57-a892-34d82f5a0af5/watch-5.jpg"]'::jsonb,
 '["Black #1a1a1a | /__l5e/assets-v1/0dac4a8a-030e-477f-a241-ee1e24fc4c45/watch-1.jpg","Brown #6b4423 | /__l5e/assets-v1/22a653e5-0ff0-4f57-a892-34d82f5a0af5/watch-5.jpg","Blue #1e3a8a | /__l5e/assets-v1/ec718b30-64c9-452c-9a9c-e03657cf7d6c/watch-6.jpg"]'::jsonb,
 '["38mm","40mm","42mm"]'::jsonb,'Swiss Automatic','Stainless Steel','Italian Leather','50m',4.9,128,'Bestseller',12,
 'A quietly confident dress watch with a sunburst dial, applied indices and a hand-stitched leather strap. Slim enough for a cuff, solid enough for every day.',
 '["Sapphire crystal with anti-reflective coating","42-hour power reserve","Exhibition sapphire caseback","Hand-stitched Italian leather strap"]'::jsonb,true,true,1),
('chronos-steel','Chronos Steel','Timera','Chronos','Chronographs',2450,NULL,'/__l5e/assets-v1/24d2f862-b678-4407-83fa-c6bf8f9e605d/watch-2.jpg',
 '["/__l5e/assets-v1/24d2f862-b678-4407-83fa-c6bf8f9e605d/watch-2.jpg","/__l5e/assets-v1/ec718b30-64c9-452c-9a9c-e03657cf7d6c/watch-6.jpg"]'::jsonb,
 '["Silver #c0c5cd | /__l5e/assets-v1/24d2f862-b678-4407-83fa-c6bf8f9e605d/watch-2.jpg","Black #1a1a1a | /__l5e/assets-v1/0dac4a8a-030e-477f-a241-ee1e24fc4c45/watch-1.jpg","Green #14532d | /__l5e/assets-v1/4739589d-2bae-4a62-9637-7012230c8836/watch-3.jpg"]'::jsonb,
 '["40mm","42mm","44mm"]'::jsonb,'Automatic Chronograph','Brushed Steel','Steel Bracelet','100m',4.8,86,'New',8,
 'A racing-bred chronograph with tri-compax subdials, a tachymeter bezel and a column-wheel movement you can watch work through the caseback.',
 '["Column-wheel chronograph movement","Tachymeter bezel","Luminous applied indices","Quick-release steel bracelet"]'::jsonb,true,true,2),
('abyss-diver','Abyss Diver 300','Timera','Abyss','Dive Watches',1890,2190,'/__l5e/assets-v1/4739589d-2bae-4a62-9637-7012230c8836/watch-3.jpg',
 '["/__l5e/assets-v1/4739589d-2bae-4a62-9637-7012230c8836/watch-3.jpg","/__l5e/assets-v1/5ffc4022-1746-4100-8624-186297224855/watch-4.jpg"]'::jsonb,
 '["Green #14532d | /__l5e/assets-v1/4739589d-2bae-4a62-9637-7012230c8836/watch-3.jpg","Blue #1e3a8a | /__l5e/assets-v1/ec718b30-64c9-452c-9a9c-e03657cf7d6c/watch-6.jpg","Black #1a1a1a | /__l5e/assets-v1/0dac4a8a-030e-477f-a241-ee1e24fc4c45/watch-1.jpg"]'::jsonb,
 '["40mm","42mm","44mm"]'::jsonb,'Swiss Automatic','316L Steel','Rubber Tropic','300m',4.9,204,'Limited',5,
 'Rated to 300 metres with a unidirectional ceramic bezel and a helium escape valve — yet slim enough to disappear under a shirt cuff.',
 '["300m water resistance","Ceramic unidirectional bezel","Helium escape valve","Super-LumiNova indices"]'::jsonb,true,true,3),
('aurum-gold','Aurum Gold','Timera','Heritage','Gold Edition',3250,NULL,'/__l5e/assets-v1/5ffc4022-1746-4100-8624-186297224855/watch-4.jpg',
 '["/__l5e/assets-v1/5ffc4022-1746-4100-8624-186297224855/watch-4.jpg","/__l5e/assets-v1/22a653e5-0ff0-4f57-a892-34d82f5a0af5/watch-5.jpg"]'::jsonb,
 '["Gold #c9a86a | /__l5e/assets-v1/5ffc4022-1746-4100-8624-186297224855/watch-4.jpg","Brown #6b4423 | /__l5e/assets-v1/22a653e5-0ff0-4f57-a892-34d82f5a0af5/watch-5.jpg"]'::jsonb,
 '["38mm","40mm"]'::jsonb,'Swiss Automatic','18k Gold Plated','Alligator Leather','30m',4.7,42,NULL,4,
 'Warm-toned and unmistakably formal. A gold-plated case, champagne dial and alligator strap for occasions that deserve the effort.',
 '["18k gold-plated case","Champagne sunburst dial","Alligator leather strap","72-hour power reserve"]'::jsonb,false,true,4),
('terra-bronze','Terra Bronze','Timera','Heritage','Dress Watches',1450,NULL,'/__l5e/assets-v1/22a653e5-0ff0-4f57-a892-34d82f5a0af5/watch-5.jpg',
 '["/__l5e/assets-v1/22a653e5-0ff0-4f57-a892-34d82f5a0af5/watch-5.jpg","/__l5e/assets-v1/0dac4a8a-030e-477f-a241-ee1e24fc4c45/watch-1.jpg"]'::jsonb,
 '["Brown #6b4423 | /__l5e/assets-v1/22a653e5-0ff0-4f57-a892-34d82f5a0af5/watch-5.jpg","Black #1a1a1a | /__l5e/assets-v1/0dac4a8a-030e-477f-a241-ee1e24fc4c45/watch-1.jpg","Gold #c9a86a | /__l5e/assets-v1/5ffc4022-1746-4100-8624-186297224855/watch-4.jpg"]'::jsonb,
 '["40mm","42mm"]'::jsonb,'Automatic','Bronze','Suede Leather','50m',4.6,57,NULL,9,
 'A bronze case that develops its own patina with wear, paired with a warm suede strap. No two will age the same way.',
 '["Living bronze patina","Domed sapphire crystal","Vintage-tone lume","Suede leather strap"]'::jsonb,false,true,5),
('azure-classic','Azure Classic','Timera','Chronos','Chronographs',1690,1990,'/__l5e/assets-v1/ec718b30-64c9-452c-9a9c-e03657cf7d6c/watch-6.jpg',
 '["/__l5e/assets-v1/ec718b30-64c9-452c-9a9c-e03657cf7d6c/watch-6.jpg","/__l5e/assets-v1/24d2f862-b678-4407-83fa-c6bf8f9e605d/watch-2.jpg"]'::jsonb,
 '["Blue #1e3a8a | /__l5e/assets-v1/ec718b30-64c9-452c-9a9c-e03657cf7d6c/watch-6.jpg","Silver #c0c5cd | /__l5e/assets-v1/24d2f862-b678-4407-83fa-c6bf8f9e605d/watch-2.jpg","Green #14532d | /__l5e/assets-v1/4739589d-2bae-4a62-9637-7012230c8836/watch-3.jpg"]'::jsonb,
 '["38mm","40mm","42mm"]'::jsonb,'Automatic Chronograph','Stainless Steel','Steel Bracelet','100m',4.8,73,'Sale',11,
 'A deep-blue sunray dial under a box sapphire crystal, with a bracelet that tapers properly. Everyday chronograph, dressed up.',
 '["Box sapphire crystal","Sunray blue dial","Screw-down crown","Tapered steel bracelet"]'::jsonb,true,true,6);

INSERT INTO public.blog_posts (slug,title,excerpt,content,author,category,image_url,published) VALUES
('welcome-to-timera','Welcome to Timera','How we think about movements, materials and the watches worth keeping.',
'Every Timera watch starts with a movement we would be happy to wear ourselves. From there we obsess over the parts most brands hide: the finishing on the bridges, the taper of a bracelet, the way a strap softens after a month.

This journal is where we document those decisions — the ones that never make it onto a spec sheet but define how a watch feels on the wrist.',
'Timera Editorial','Journal','/__l5e/assets-v1/69c9fb46-672c-452b-a4d4-d8652c2f4504/atelier.jpg',true);