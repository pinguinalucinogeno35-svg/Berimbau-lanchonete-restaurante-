-- SEED DEMONSTRATIVO — dados fictícios. NÃO execute em produção com dados reais do restaurante.
-- Os modelos apontam para arquivos do próprio app (/demo/models/...), servidos junto com o frontend.

insert into public.restaurants (id, name, slug, description, primary_color, secondary_color, public_info)
values (
  '00000000-0000-4000-8000-000000000001',
  'Restaurante Demonstrativo',
  'restaurante-demonstrativo',
  'Ambiente de demonstração do ONE AR Menu. A identidade oficial do restaurante será aplicada depois.',
  '#111514',
  '#C2A77B',
  jsonb_build_object(
    'tagline', 'Cozinha tradicional · Experiência digital',
    'heroTitle', 'Tradição que se vê antes de provar.',
    'heroSubtitle', 'Explore o cardápio e veja alguns pratos em 3D. Em celulares compatíveis, coloque o prato virtualmente sobre a sua mesa.',
    'about', 'Este é um texto demonstrativo. Aqui entra a história do restaurante, enviada e aprovada pelo cliente.',
    'experienceTitle', 'Veja na sua mesa',
    'experienceText', 'Toque em “Ver na minha mesa”, aponte o celular para a mesa e posicione o prato.'
  )
)
on conflict (id) do nothing;

insert into public.categories (id, restaurant_id, name, slug, description, sort_order) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'Salgados', 'salgados', 'Salgados demonstrativos', 1),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'Pratos principais', 'pratos-principais', 'Pratos demonstrativos', 2),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'Hambúrgueres', 'hamburgueres', 'Hambúrgueres demonstrativos', 3),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000001', 'Sobremesas', 'sobremesas', 'Sobremesas demonstrativas', 4),
  ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000001', 'Bebidas', 'bebidas', 'Bebidas demonstrativas', 5)
on conflict (id) do nothing;

insert into public.products
  (id, restaurant_id, category_id, name, slug, description, ingredients, allergens, price_cents, portion_description, is_available, is_published, is_featured, sort_order)
values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101',
   'Coxinha demonstrativa', 'coxinha-demonstrativa', 'Item fictício usado para demonstrar 3D e AR. O modelo é procedural e não representa o salgado real.',
   '{Ingredientes demonstrativos}', '{glúten,leite}', 900, '1 unidade (medidas do modelo: aprox. 6,6 × 8,6 cm)', true, true, true, 0),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101',
   'Empada demonstrativa', 'empada-demonstrativa', 'Item fictício sem modelo 3D publicado.',
   '{Ingredientes demonstrativos}', '{glúten,ovo}', 1000, '1 unidade', true, true, false, 1),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102',
   'Prato principal demonstrativo', 'prato-principal-demonstrativo', 'Item fictício de prato principal.',
   '{"Proteína demonstrativa","Acompanhamentos demonstrativos"}', '{}', 5800, 'Serve 1 pessoa', true, true, true, 2),
  ('00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102',
   'Risoto demonstrativo', 'risoto-demonstrativo', 'Item fictício indisponível.',
   '{Arroz,"Ingredientes demonstrativos"}', '{leite}', 6200, 'Serve 1 pessoa', false, true, false, 3),
  ('00000000-0000-4000-8000-000000000205', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103',
   'Hambúrguer demonstrativo', 'hamburguer-demonstrativo', 'Item fictício com modelo 3D procedural.',
   '{Pão,Carne,Queijo,Folhas}', '{glúten,leite,gergelim}', 4200, '1 unidade (medidas do modelo: aprox. 11,6 × 7,9 cm)', true, true, true, 4),
  ('00000000-0000-4000-8000-000000000206', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104',
   'Sobremesa demonstrativa', 'sobremesa-demonstrativa', 'Item fictício com modelo 3D procedural.',
   '{"Ingredientes demonstrativos"}', '{glúten,leite,ovo}', 2600, '1 unidade (medidas do modelo: aprox. 6,8 × 7,8 cm)', true, true, false, 5),
  ('00000000-0000-4000-8000-000000000207', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000105',
   'Bebida demonstrativa', 'bebida-demonstrativa', 'Item fictício de bebida.',
   '{"Ingredientes demonstrativos"}', '{}', 1200, '300 ml', true, true, false, 6),
  ('00000000-0000-4000-8000-000000000209', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103',
   'Cheeseburger cheddar demonstrativo', 'cheeseburger-cheddar-demonstrativo',
   'Hambúrguer triplo com cheddar derretido, servido no prato. Modelo 3D gerado por IA e otimizado para celular: é ilustrativo e não representa o produto real do restaurante.',
   '{Pão,Carne,"Queijo cheddar"}', '{glúten,leite}', 3800, '1 unidade (modelo com prato de 20 cm; hambúrguer de aprox. 11,5 cm)', true, true, true, 5),
  ('00000000-0000-4000-8000-000000000208', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000105',
   'Produto não publicado', 'produto-nao-publicado', 'Rascunho: não deve aparecer no cardápio público.',
   '{}', '{}', 100, '', true, false, false, 7)
on conflict (id) do nothing;

insert into public.product_media (restaurant_id, product_id, media_type, storage_path, alt_text) values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', 'image', '/demo/posters/coxinha-demonstrativa.webp', 'Imagem gerada do modelo 3D demonstrativo da coxinha'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000205', 'image', '/demo/posters/hamburguer-demonstrativo.webp', 'Imagem gerada do modelo 3D demonstrativo do hambúrguer'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000206', 'image', '/demo/posters/sobremesa-demonstrativa.webp', 'Imagem gerada do modelo 3D demonstrativo da sobremesa'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000209', 'image', '/demo/posters/cheeseburger-cheddar.webp', 'Imagem gerada do modelo 3D ilustrativo do cheeseburger');

-- Modelos já aprovados e publicados (o seed roda como service role, sem passar pelo trigger de revisão).
insert into public.product_ar_models
  (id, restaurant_id, product_id, glb_path, poster_path, width_cm, height_cm, depth_cm, scale_verified, scale_locked, approval_status, version, published_at)
values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201',
   '/demo/models/coxinha-demonstrativa.glb', '/demo/posters/coxinha-demonstrativa.webp', 6.6, 8.6, 6.6, false, true, 'approved', 1, now()),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000205',
   '/demo/models/hamburguer-demonstrativo.glb', '/demo/posters/hamburguer-demonstrativo.webp', 11.6, 7.9, 11.6, false, true, 'approved', 1, now()),
  ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000206',
   '/demo/models/sobremesa-demonstrativa.glb', '/demo/posters/sobremesa-demonstrativa.webp', 6.8, 7.8, 6.8, false, true, 'approved', 1, now()),
  ('00000000-0000-4000-8000-000000000305', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000209',
   '/demo/models/cheeseburger-cheddar.glb', '/demo/posters/cheeseburger-cheddar.webp', 20, 11.9, 20, false, true, 'approved', 1, now()),
  -- Versão em revisão: NÃO pode aparecer no cardápio público.
  ('00000000-0000-4000-8000-000000000304', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000202',
   '/demo/models/coxinha-demonstrativa.glb', null, 6.0, 4.0, 6.0, false, true, 'ready_for_review', 1, null)
on conflict (id) do nothing;

insert into public.qr_codes (restaurant_id, code, table_label, target_path) values
  ('00000000-0000-4000-8000-000000000001', 'mesa-01', 'Mesa 1', '/cardapio'),
  ('00000000-0000-4000-8000-000000000001', 'mesa-02', 'Mesa 2', '/cardapio'),
  ('00000000-0000-4000-8000-000000000001', 'mesa-03', 'Mesa 3', '/cardapio')
on conflict (code) do nothing;
