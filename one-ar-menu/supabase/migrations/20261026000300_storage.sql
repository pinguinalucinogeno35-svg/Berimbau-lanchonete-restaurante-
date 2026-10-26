-- ONE AR Menu — Supabase Storage
-- Estrutura: <bucket>/<restaurant_id>/...
--   restaurant-assets (público): branding e fotos de produtos publicadas
--   staging-3d        (privado): modelos 3D enviados e em revisão
--   published-3d      (público): somente modelos aprovados e publicados

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('restaurant-assets', 'restaurant-assets', true, 5 * 1024 * 1024,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']),
  ('staging-3d', 'staging-3d', false, 30 * 1024 * 1024,
    array['model/gltf-binary', 'model/vnd.usdz+zip', 'model/usd', 'application/octet-stream', 'application/zip', 'image/webp', 'image/png', 'image/jpeg']),
  ('published-3d', 'published-3d', true, 30 * 1024 * 1024,
    array['model/gltf-binary', 'model/vnd.usdz+zip', 'model/usd', 'application/octet-stream', 'application/zip', 'image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Restaurante dono do arquivo = primeira pasta do caminho. Caminho malformado => null => nega.
create or replace function public.storage_restaurant_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  first_folder text := split_part(object_name, '/', 1);
begin
  if first_folder ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return first_folder::uuid;
  end if;
  return null;
end;
$$;

-- restaurant-assets: leitura pública pela URL do bucket; escrita por membros.
create policy "assets: editores enviam fotos de produtos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'restaurant-assets'
    and split_part(name, '/', 2) = 'products'
    and public.has_restaurant_role(public.storage_restaurant_id(name), 'editor')
  );
create policy "assets: managers enviam branding" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'restaurant-assets'
    and split_part(name, '/', 2) = 'branding'
    and public.has_restaurant_role(public.storage_restaurant_id(name), 'manager')
  );
create policy "assets: membros leem e atualizam" on storage.objects
  for select to authenticated
  using (bucket_id = 'restaurant-assets' and public.has_restaurant_role(public.storage_restaurant_id(name), 'editor'));
create policy "assets: managers removem" on storage.objects
  for delete to authenticated
  using (bucket_id = 'restaurant-assets' and public.has_restaurant_role(public.storage_restaurant_id(name), 'manager'));

-- staging-3d: privado; editores enviam e leem (pré-visualização com URL assinada).
create policy "staging: editores enviam" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'staging-3d' and public.has_restaurant_role(public.storage_restaurant_id(name), 'editor'));
create policy "staging: editores leem" on storage.objects
  for select to authenticated
  using (bucket_id = 'staging-3d' and public.has_restaurant_role(public.storage_restaurant_id(name), 'editor'));
create policy "staging: managers removem" on storage.objects
  for delete to authenticated
  using (bucket_id = 'staging-3d' and public.has_restaurant_role(public.storage_restaurant_id(name), 'manager'));

-- published-3d: público para leitura pela URL; só managers publicam (copiam) e removem.
create policy "published: managers publicam" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'published-3d' and public.has_restaurant_role(public.storage_restaurant_id(name), 'manager'));
create policy "published: membros listam" on storage.objects
  for select to authenticated
  using (bucket_id = 'published-3d' and public.has_restaurant_role(public.storage_restaurant_id(name), 'editor'));
create policy "published: managers removem" on storage.objects
  for delete to authenticated
  using (bucket_id = 'published-3d' and public.has_restaurant_role(public.storage_restaurant_id(name), 'manager'));
