-- ONE AR Menu — Row Level Security
-- Regra geral: leitura pública só de restaurante ativo e conteúdo publicado;
-- escrita só por membros autenticados com o papel adequado.

alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_media enable row level security;
alter table public.product_ar_models enable row level security;
alter table public.qr_codes enable row level security;
alter table public.analytics_events enable row level security;
alter table public.analytics_rate_limits enable row level security;

-- Tabela interna: ninguém além do service role acessa.
revoke all on public.analytics_rate_limits from anon, authenticated;

-- Eventos não são gravados direto pelo navegador (só pela Edge Function com validação e limite).
revoke insert, update, delete on public.analytics_events from anon, authenticated;

-- restaurants ---------------------------------------------------------------
create policy restaurants_public_read on public.restaurants
  for select to anon, authenticated
  using (is_active or public.has_restaurant_role(id, 'editor'));

create policy restaurants_manager_update on public.restaurants
  for update to authenticated
  using (public.has_restaurant_role(id, 'manager'))
  with check (public.has_restaurant_role(id, 'manager'));
-- Criação/exclusão de restaurantes: apenas service role (fora do app).

-- restaurant_members --------------------------------------------------------
create policy members_read_own_restaurant on public.restaurant_members
  for select to authenticated
  using (user_id = auth.uid() or public.has_restaurant_role(restaurant_id, 'manager'));

create policy members_owner_insert on public.restaurant_members
  for insert to authenticated
  with check (public.has_restaurant_role(restaurant_id, 'owner'));

create policy members_owner_update on public.restaurant_members
  for update to authenticated
  using (public.has_restaurant_role(restaurant_id, 'owner'))
  with check (public.has_restaurant_role(restaurant_id, 'owner'));

create policy members_owner_delete on public.restaurant_members
  for delete to authenticated
  using (public.has_restaurant_role(restaurant_id, 'owner'));

-- categories ----------------------------------------------------------------
create policy categories_public_read on public.categories
  for select to anon, authenticated
  using (
    (is_active and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.is_active))
    or public.has_restaurant_role(restaurant_id, 'editor')
  );

create policy categories_editor_insert on public.categories
  for insert to authenticated with check (public.has_restaurant_role(restaurant_id, 'editor'));
create policy categories_editor_update on public.categories
  for update to authenticated
  using (public.has_restaurant_role(restaurant_id, 'editor'))
  with check (public.has_restaurant_role(restaurant_id, 'editor'));
create policy categories_manager_delete on public.categories
  for delete to authenticated using (public.has_restaurant_role(restaurant_id, 'manager'));

-- products ------------------------------------------------------------------
create policy products_public_read on public.products
  for select to anon, authenticated
  using (
    (
      is_published
      and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.is_active)
      and exists (select 1 from public.categories c where c.id = category_id and c.is_active)
    )
    or public.has_restaurant_role(restaurant_id, 'editor')
  );

create policy products_editor_insert on public.products
  for insert to authenticated with check (public.has_restaurant_role(restaurant_id, 'editor'));
create policy products_editor_update on public.products
  for update to authenticated
  using (public.has_restaurant_role(restaurant_id, 'editor'))
  with check (public.has_restaurant_role(restaurant_id, 'editor'));
create policy products_manager_delete on public.products
  for delete to authenticated using (public.has_restaurant_role(restaurant_id, 'manager'));

-- product_media -------------------------------------------------------------
create policy media_public_read on public.product_media
  for select to anon, authenticated
  using (
    (is_published and exists (select 1 from public.products p where p.id = product_id and p.is_published))
    or public.has_restaurant_role(restaurant_id, 'editor')
  );
create policy media_editor_write on public.product_media
  for all to authenticated
  using (public.has_restaurant_role(restaurant_id, 'editor'))
  with check (public.has_restaurant_role(restaurant_id, 'editor'));

-- product_ar_models ---------------------------------------------------------
-- Público vê apenas o modelo aprovado E publicado de produto publicado.
create policy ar_models_public_read on public.product_ar_models
  for select to anon, authenticated
  using (
    (
      approval_status = 'approved'
      and published_at is not null
      and exists (select 1 from public.products p where p.id = product_id and p.is_published)
    )
    or public.has_restaurant_role(restaurant_id, 'editor')
  );
create policy ar_models_editor_insert on public.product_ar_models
  for insert to authenticated with check (public.has_restaurant_role(restaurant_id, 'editor'));
create policy ar_models_editor_update on public.product_ar_models
  for update to authenticated
  using (public.has_restaurant_role(restaurant_id, 'editor'))
  with check (public.has_restaurant_role(restaurant_id, 'editor'));
create policy ar_models_manager_delete on public.product_ar_models
  for delete to authenticated using (public.has_restaurant_role(restaurant_id, 'manager'));

-- qr_codes (leitura pública só via resolve_qr_code) ------------------------
create policy qr_codes_member_read on public.qr_codes
  for select to authenticated using (public.has_restaurant_role(restaurant_id, 'editor'));
create policy qr_codes_manager_write on public.qr_codes
  for all to authenticated
  using (public.has_restaurant_role(restaurant_id, 'manager'))
  with check (public.has_restaurant_role(restaurant_id, 'manager'));

-- analytics_events: só leitura agregada pela equipe -------------------------
create policy analytics_manager_read on public.analytics_events
  for select to authenticated using (public.has_restaurant_role(restaurant_id, 'manager'));
