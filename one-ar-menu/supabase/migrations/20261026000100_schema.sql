-- ONE AR Menu — esquema principal
-- Entidades de negócio têm restaurant_id para permitir reutilizar a plataforma em outros restaurantes.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.member_role as enum ('owner', 'manager', 'editor');
create type public.model_approval_status as enum ('draft', 'processing', 'ready_for_review', 'approved', 'rejected');
create type public.media_type as enum ('image', 'poster', 'video');
create type public.analytics_event_type as enum (
  'menu_open', 'product_view', 'model_3d_open', 'ar_launch_attempt', 'ar_launch_error', 'ar_return'
);
create type public.device_category as enum ('mobile', 'tablet', 'desktop');

-- ---------------------------------------------------------------------------
-- Utilitários
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- restaurants
-- ---------------------------------------------------------------------------
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 2000),
  logo_path text,
  cover_path text,
  primary_color text check (primary_color is null or primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color text check (secondary_color is null or secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  theme_settings jsonb not null default '{}'::jsonb check (jsonb_typeof(theme_settings) = 'object'),
  public_info jsonb not null default '{}'::jsonb check (jsonb_typeof(public_info) = 'object'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.restaurants.public_info is
  'Dados públicos editáveis: tagline, textos do hero, sobre, contatos, links e textos da experiência AR.';

create trigger restaurants_updated_at before update on public.restaurants
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- restaurant_members
-- ---------------------------------------------------------------------------
create table public.restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'editor',
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);
create index restaurant_members_user_idx on public.restaurant_members (user_id);

-- Hierarquia: owner (3) > manager (2) > editor (1)
create or replace function public.role_rank(r public.member_role)
returns int
language sql
immutable
set search_path = ''
as $$
  select case r when 'owner' then 3 when 'manager' then 2 when 'editor' then 1 end;
$$;

-- O usuário atual tem pelo menos o papel `min_role` no restaurante?
-- SECURITY DEFINER para poder ser usada dentro das políticas de restaurant_members sem recursão.
create or replace function public.has_restaurant_role(rid uuid, min_role public.member_role default 'editor')
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.restaurant_members m
    where m.restaurant_id = rid
      and m.user_id = auth.uid()
      and public.role_rank(m.role) >= public.role_rank(min_role)
  );
$$;
revoke all on function public.has_restaurant_role(uuid, public.member_role) from public;
grant execute on function public.has_restaurant_role(uuid, public.member_role) to authenticated, anon;

-- Impede que o restaurante fique sem nenhum owner.
create or replace function public.protect_last_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rid uuid := coalesce(old.restaurant_id, new.restaurant_id);
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    if (select count(*) from public.restaurant_members where restaurant_id = rid and role = 'owner') <= 1 then
      raise exception 'O restaurante precisa manter pelo menos um owner.';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;
create trigger restaurant_members_last_owner before update or delete on public.restaurant_members
  for each row execute function public.protect_last_owner();

-- Só owners alteram slug e ativação do restaurante (configurações críticas).
create or replace function public.protect_restaurant_critical_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.slug is distinct from old.slug or new.is_active is distinct from old.is_active)
     and auth.uid() is not null
     and not public.has_restaurant_role(old.id, 'owner') then
    raise exception 'Somente owners podem alterar slug ou ativação do restaurante.';
  end if;
  return new;
end;
$$;
create trigger restaurants_critical_fields before update on public.restaurants
  for each row execute function public.protect_restaurant_critical_fields();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 500),
  image_path text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, slug),
  unique (id, restaurant_id)
);
create index categories_restaurant_order_idx on public.categories (restaurant_id, sort_order);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id uuid not null,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 2000),
  ingredients text[] not null default '{}',
  allergens text[] not null default '{}',
  price_cents integer not null check (price_cents >= 0 and price_cents <= 10000000),
  portion_description text not null default '' check (char_length(portion_description) <= 200),
  is_available boolean not null default true,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, slug),
  unique (id, restaurant_id),
  -- Garante que a categoria pertence ao MESMO restaurante do produto.
  foreign key (category_id, restaurant_id) references public.categories (id, restaurant_id) on delete restrict
);
create index products_menu_idx on public.products (restaurant_id, is_published, category_id, sort_order);
create index products_featured_idx on public.products (restaurant_id) where is_featured and is_published;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- product_media
-- ---------------------------------------------------------------------------
create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  product_id uuid not null,
  media_type public.media_type not null default 'image',
  storage_path text not null check (char_length(storage_path) between 1 and 500),
  alt_text text not null default '' check (char_length(alt_text) <= 300),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (product_id, restaurant_id) references public.products (id, restaurant_id) on delete cascade
);
create index product_media_product_idx on public.product_media (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- product_ar_models
-- Caminhos no formato "<bucket>/<chave>" (ex.: "published-3d/<rid>/<pid>/2/model.glb")
-- ou caminho absoluto do app iniciado por "/" (assets demonstrativos em /demo/...).
-- ---------------------------------------------------------------------------
create table public.product_ar_models (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  product_id uuid not null,
  glb_path text not null check (glb_path ~ '\.glb$'),
  usdz_path text check (usdz_path is null or usdz_path ~ '\.usdz$'),
  poster_path text,
  width_cm numeric(6, 2) check (width_cm is null or width_cm > 0),
  height_cm numeric(6, 2) check (height_cm is null or height_cm > 0),
  depth_cm numeric(6, 2) check (depth_cm is null or depth_cm > 0),
  scale_verified boolean not null default false,
  scale_locked boolean not null default true,
  approval_status public.model_approval_status not null default 'draft',
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  version integer not null default 1 check (version >= 1),
  review_notes text check (review_notes is null or char_length(review_notes) <= 1000),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  foreign key (product_id, restaurant_id) references public.products (id, restaurant_id) on delete cascade,
  unique (product_id, version),
  -- Só modelos aprovados podem estar publicados.
  check (published_at is null or approval_status = 'approved'),
  -- Escala verificada exige medidas cadastradas.
  check (not scale_verified or (width_cm is not null and height_cm is not null and depth_cm is not null))
);
-- No máximo um modelo publicado por produto.
create unique index product_ar_models_one_published_idx on public.product_ar_models (product_id) where published_at is not null;
create index product_ar_models_review_idx on public.product_ar_models (restaurant_id, approval_status);
create trigger product_ar_models_updated_at before update on public.product_ar_models
  for each row execute function public.set_updated_at();

-- Aprovar, rejeitar e publicar exigem papel manager ou superior (não basta esconder botões).
create or replace function public.guard_ar_model_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new; -- service role / migrações
  end if;
  if tg_op = 'INSERT' then
    if new.approval_status in ('approved', 'rejected') or new.published_at is not null then
      raise exception 'Modelos novos entram como rascunho ou para revisão; aprovação é uma etapa separada.';
    end if;
    new.created_by := auth.uid();
    return new;
  end if;
  if (new.approval_status is distinct from old.approval_status and new.approval_status in ('approved', 'rejected'))
     or new.published_at is distinct from old.published_at
     or (old.approval_status = 'approved' and new.glb_path is distinct from old.glb_path) then
    if not public.has_restaurant_role(new.restaurant_id, 'manager') then
      raise exception 'Somente manager ou owner podem aprovar, rejeitar ou publicar modelos 3D.';
    end if;
  end if;
  -- Trocar o arquivo de um modelo aprovado/publicado exige nova versão.
  if old.published_at is not null and (new.glb_path is distinct from old.glb_path or new.usdz_path is distinct from old.usdz_path)
     and new.published_at is not null then
    raise exception 'Para substituir os arquivos de um modelo publicado, envie uma nova versão.';
  end if;
  return new;
end;
$$;
create trigger product_ar_models_review before insert or update on public.product_ar_models
  for each row execute function public.guard_ar_model_review();

-- Publica uma versão aprovada e despublica as anteriores do mesmo produto, numa transação.
create or replace function public.publish_ar_model(model_id uuid, published_glb_path text, published_usdz_path text, published_poster_path text)
returns void
language plpgsql
set search_path = ''
as $$
declare
  m public.product_ar_models;
begin
  select * into m from public.product_ar_models where id = model_id for update;
  if not found then
    raise exception 'Modelo não encontrado.';
  end if;
  if m.approval_status <> 'approved' then
    raise exception 'Somente modelos aprovados podem ser publicados.';
  end if;
  if not public.has_restaurant_role(m.restaurant_id, 'manager') then
    raise exception 'Somente manager ou owner podem publicar modelos 3D.';
  end if;
  update public.product_ar_models set published_at = null where product_id = m.product_id and published_at is not null and id <> m.id;
  update public.product_ar_models
     set published_at = now(),
         glb_path = coalesce(published_glb_path, glb_path),
         usdz_path = coalesce(published_usdz_path, usdz_path),
         poster_path = coalesce(published_poster_path, poster_path)
   where id = m.id;
end;
$$;
revoke all on function public.publish_ar_model(uuid, text, text, text) from public, anon;
grant execute on function public.publish_ar_model(uuid, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- qr_codes
-- ---------------------------------------------------------------------------
create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9-]{4,40}$'),
  table_label text check (table_label is null or char_length(table_label) <= 40),
  -- Somente caminhos internos do app (evita redirecionamento aberto).
  target_path text not null default '/cardapio' check (target_path ~ '^/[A-Za-z0-9/_-]*$' and target_path !~ '//'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index qr_codes_restaurant_idx on public.qr_codes (restaurant_id);

-- Resolve um QR code público sem permitir listar todos os códigos.
create or replace function public.resolve_qr_code(qr_code text)
returns table (id uuid, restaurant_id uuid, code text, table_label text, target_path text)
language sql
stable
security definer
set search_path = ''
as $$
  select q.id, q.restaurant_id, q.code, q.table_label, q.target_path
  from public.qr_codes q
  join public.restaurants r on r.id = q.restaurant_id and r.is_active
  where q.code = qr_code and q.is_active
  limit 1;
$$;
revoke all on function public.resolve_qr_code(text) from public;
grant execute on function public.resolve_qr_code(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- analytics_events (sem dados pessoais: nada de IP, user agent, localização ou usuário)
-- ---------------------------------------------------------------------------
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  qr_code_id uuid references public.qr_codes (id) on delete set null,
  event_type public.analytics_event_type not null,
  device_category public.device_category,
  created_at timestamptz not null default now()
);
create index analytics_events_restaurant_time_idx on public.analytics_events (restaurant_id, created_at desc);
create index analytics_events_product_idx on public.analytics_events (product_id, event_type) where product_id is not null;

-- Limite de frequência do endpoint de eventos (usado só pela Edge Function com service role).
create table public.analytics_rate_limits (
  bucket_key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket_key, window_start)
);

create or replace function public.bump_rate_limit(p_key text, p_window_seconds int, p_limit int)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  total int;
begin
  insert into public.analytics_rate_limits as l (bucket_key, window_start, hits)
  values (p_key, w, 1)
  on conflict (bucket_key, window_start) do update set hits = l.hits + 1
  returning hits into total;
  -- limpeza oportunista de janelas antigas
  if random() < 0.01 then
    delete from public.analytics_rate_limits where window_start < now() - interval '2 days';
  end if;
  return total <= p_limit;
end;
$$;
revoke all on function public.bump_rate_limit(text, int, int) from public, anon, authenticated;
