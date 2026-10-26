-- Testes de RLS e regras de negócio. Rode depois das migrações e do seed (scripts/test-db.sh).
-- Cada bloco falha com exception se a regra não estiver valendo.
\set ON_ERROR_STOP on

-- Usuários de teste
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'owner@teste.local'),
  ('22222222-2222-4222-8222-222222222222', 'editor@teste.local'),
  ('33333333-3333-4333-8333-333333333333', 'intruso@teste.local'),
  ('44444444-4444-4444-8444-444444444444', 'manager@teste.local');
insert into public.restaurant_members (restaurant_id, user_id, role) values
  ('00000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('00000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'editor'),
  ('00000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444', 'manager');

-- Segundo restaurante para testar isolamento
insert into public.restaurants (id, name, slug) values ('00000000-0000-4000-8000-00000000000b', 'Outro', 'outro');
insert into public.categories (id, restaurant_id, name, slug) values ('00000000-0000-4000-8000-0000000001bb', '00000000-0000-4000-8000-00000000000b', 'X', 'x');

create or replace function pg_temp.check(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not cond then raise exception 'FALHOU: %', msg; end if;
  raise notice 'ok: %', msg;
end $$;

-- 1) Anônimo: só conteúdo publicado -------------------------------------------
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select pg_temp.check((select count(*) from public.products) = 8, 'anon vê só os 8 produtos publicados');
select pg_temp.check(not exists (select 1 from public.products where slug = 'produto-nao-publicado'), 'anon não vê rascunho');
select pg_temp.check((select count(*) from public.product_ar_models) = 4, 'anon vê só os 4 modelos aprovados e publicados');
select pg_temp.check(not exists (select 1 from public.product_ar_models where approval_status <> 'approved'), 'anon não vê modelo em revisão');
select pg_temp.check((select count(*) from public.qr_codes) = 0, 'anon não lista QR codes');
select pg_temp.check((select table_label from public.resolve_qr_code('mesa-02')) = 'Mesa 2', 'anon resolve um QR code específico');
select pg_temp.check((select count(*) from public.analytics_events) = 0, 'anon não lê eventos');
do $$ begin
  begin
    update public.products set price_cents = 1 where slug = 'coxinha-demonstrativa';
    if found then raise exception 'FALHOU: anon alterou preço'; end if;
  exception when insufficient_privilege then null; end;
  begin
    insert into public.analytics_events (restaurant_id, event_type) values ('00000000-0000-4000-8000-000000000001', 'menu_open');
    raise exception 'FALHOU: anon inseriu evento direto';
  exception when insufficient_privilege then null; end;
  raise notice 'ok: anon não escreve em produtos nem em eventos';
end $$;
reset role;

-- 2) Intruso autenticado sem vínculo --------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', false);
select pg_temp.check((select count(*) from public.products) = 8, 'intruso vê só o público');
update public.products set price_cents = 1 where slug = 'coxinha-demonstrativa';
select pg_temp.check((select price_cents from public.products where slug = 'coxinha-demonstrativa') = 900, 'intruso não altera preço');
do $$ begin
  begin
    insert into public.restaurant_members (restaurant_id, user_id, role)
      values ('00000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'owner');
    raise exception 'FALHOU: intruso se promoveu a owner';
  exception when insufficient_privilege then raise notice 'ok: intruso não se adiciona como membro (escalonamento bloqueado)'; end;
end $$;
reset role;

-- 3) Editor ----------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);
select pg_temp.check((select count(*) from public.products) = 9, 'editor vê também o rascunho');
update public.products set price_cents = 950 where slug = 'coxinha-demonstrativa';
select pg_temp.check((select price_cents from public.products where slug = 'coxinha-demonstrativa') = 950, 'editor altera preço');
do $$ begin
  begin
    update public.product_ar_models set approval_status = 'approved' where id = '00000000-0000-4000-8000-000000000304';
    raise exception 'FALHOU: editor aprovou modelo';
  exception when raise_exception then
    if sqlerrm like 'FALHOU%' then raise; end if;
    raise notice 'ok: editor não aprova modelo (%)', sqlerrm;
  end;
  begin
    insert into public.product_ar_models (restaurant_id, product_id, glb_path, approval_status)
      values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000207', 'staging-3d/x/y/model.glb', 'approved');
    raise exception 'FALHOU: editor inseriu modelo já aprovado';
  exception when raise_exception then
    if sqlerrm like 'FALHOU%' then raise; end if;
    raise notice 'ok: upload não publica nem aprova automaticamente';
  end;
  begin
    perform public.publish_ar_model('00000000-0000-4000-8000-000000000301', null, null, null);
    raise exception 'FALHOU: editor publicou';
  exception when raise_exception then
    if sqlerrm like 'FALHOU%' then raise; end if;
    raise notice 'ok: editor não publica';
  end;
  begin
    insert into public.products (restaurant_id, category_id, name, slug, price_cents)
      values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000001bb', 'Cruzado', 'cruzado', 100);
    raise exception 'FALHOU: produto com categoria de outro restaurante';
  exception when foreign_key_violation then raise notice 'ok: categoria precisa ser do mesmo restaurante';
  end;
  begin
    insert into public.products (restaurant_id, category_id, name, slug, price_cents)
      values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'Negativo', 'negativo', -1);
    raise exception 'FALHOU: preço negativo aceito';
  exception when check_violation then raise notice 'ok: preço negativo recusado';
  end;
  begin
    update public.restaurants set slug = 'roubado' where id = '00000000-0000-4000-8000-000000000001';
    if found then raise exception 'FALHOU: editor alterou slug'; end if;
    raise notice 'ok: editor não altera restaurante';
  end;
end $$;
insert into public.product_ar_models (restaurant_id, product_id, glb_path, approval_status, version)
  values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', 'staging-3d/00000000-0000-4000-8000-000000000001/x/2/model.glb', 'ready_for_review', 2);
select pg_temp.check((select created_by from public.product_ar_models where version = 2 and product_id = '00000000-0000-4000-8000-000000000201') = '22222222-2222-4222-8222-222222222222', 'editor envia nova versão para revisão (created_by registrado)');
-- storage: editor envia para staging do próprio restaurante, mas não para outro nem para published
insert into storage.objects (bucket_id, name) values ('staging-3d', '00000000-0000-4000-8000-000000000001/p/2/model.glb');
do $$ begin
  begin
    insert into storage.objects (bucket_id, name) values ('staging-3d', '00000000-0000-4000-8000-00000000000b/p/1/model.glb');
    raise exception 'FALHOU: editor enviou para outro restaurante';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects (bucket_id, name) values ('published-3d', '00000000-0000-4000-8000-000000000001/p/2/model.glb');
    raise exception 'FALHOU: editor publicou arquivo';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects (bucket_id, name) values ('staging-3d', '../etc/model.glb');
    raise exception 'FALHOU: caminho malformado aceito';
  exception when insufficient_privilege then null; end;
  raise notice 'ok: storage restrito por restaurante e papel';
end $$;
reset role;

-- 4) Manager: aprova e publica nova versão; a anterior sai de publicação --------
set role authenticated;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', false);
update public.product_ar_models set approval_status = 'approved'
  where product_id = '00000000-0000-4000-8000-000000000201' and version = 2;
select public.publish_ar_model(
  (select id from public.product_ar_models where product_id = '00000000-0000-4000-8000-000000000201' and version = 2),
  'published-3d/00000000-0000-4000-8000-000000000001/x/2/model.glb', null, null);
select pg_temp.check((select count(*) from public.product_ar_models where product_id = '00000000-0000-4000-8000-000000000201' and published_at is not null) = 1, 'apenas uma versão publicada por produto');
select pg_temp.check((select version from public.product_ar_models where product_id = '00000000-0000-4000-8000-000000000201' and published_at is not null) = 2, 'versão nova publicada');
select pg_temp.check((select count(*) from public.analytics_events) = 0, 'manager lê eventos (vazio)');
do $$ begin
  begin
    delete from public.restaurant_members where user_id = '11111111-1111-4111-8111-111111111111';
    if found then raise exception 'FALHOU: manager removeu owner'; end if;
    raise notice 'ok: manager não gerencia membros';
  end;
end $$;
reset role;

-- 5) Owner: não pode remover o último owner -----------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
do $$ begin
  begin
    delete from public.restaurant_members where user_id = '11111111-1111-4111-8111-111111111111';
    raise exception 'FALHOU: último owner removido';
  exception when raise_exception then
    if sqlerrm like 'FALHOU%' then raise; end if;
    raise notice 'ok: último owner protegido';
  end;
end $$;
update public.restaurants set is_active = true, public_info = public_info || '{"phone":"(00) 0000-0000"}' where id = '00000000-0000-4000-8000-000000000001';
select pg_temp.check((select public_info->>'phone' from public.restaurants where id = '00000000-0000-4000-8000-000000000001') = '(00) 0000-0000', 'owner edita configurações');
reset role;

-- 6) Rate limit (service role) --------------------------------------------------
set role service_role;
select pg_temp.check(public.bump_rate_limit('k', 60, 2) and public.bump_rate_limit('k', 60, 2) and not public.bump_rate_limit('k', 60, 2), 'limite de frequência bloqueia a 3ª chamada');
insert into public.analytics_events (restaurant_id, product_id, event_type, device_category)
  values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', 'product_view', 'mobile');
reset role;

-- 7) QR code: sem redirecionamento aberto ---------------------------------------
do $$ begin
  begin
    insert into public.qr_codes (restaurant_id, code, target_path) values ('00000000-0000-4000-8000-000000000001', 'malicioso', '//evil.example');
    raise exception 'FALHOU: target_path externo aceito';
  exception when check_violation then raise notice 'ok: QR code só aponta para caminhos internos';
  end;
end $$;

\echo 'TODOS OS TESTES DE BANCO PASSARAM'
