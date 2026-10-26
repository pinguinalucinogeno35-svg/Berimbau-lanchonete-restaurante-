# Banco de dados (Supabase / PostgreSQL)

Migrações em `supabase/migrations/` (aplicar em ordem):

| Arquivo                      | Conteúdo                                                |
| ---------------------------- | ------------------------------------------------------- |
| `20261026000100_schema.sql`  | Tipos, tabelas, constraints, índices, triggers, funções |
| `20261026000200_rls.sql`     | Row Level Security de todas as tabelas                  |
| `20261026000300_storage.sql` | Buckets e políticas do Storage                          |

`supabase/seed.sql` contém **somente dados demonstrativos**; não rode em produção com dados reais.

## Entidades

```
restaurants 1─* restaurant_members *─1 auth.users
restaurants 1─* categories 1─* products 1─* product_media
                                     └──* product_ar_models (versões)
restaurants 1─* qr_codes
restaurants 1─* analytics_events *─0..1 products / qr_codes
analytics_rate_limits (interna da Edge Function)
```

- Todas as entidades de negócio têm `restaurant_id`.
- `products(category_id, restaurant_id)` referencia `categories(id, restaurant_id)`: **a categoria precisa ser do
  mesmo restaurante** (o mesmo vale para mídias e modelos em relação ao produto).
- Slugs únicos por restaurante; `price_cents >= 0`; medidas `> 0`; cores `#RRGGBB`; `updated_at` automático.
- Exclusões: restaurante apaga em cascata; categoria com produtos é **bloqueada** (`on delete restrict`);
  produto apagado remove mídias/modelos; eventos mantêm o histórico com `product_id = null`.
- `restaurants.public_info` (JSONB) guarda textos públicos editáveis (hero, sobre, contatos, links, textos da AR);
  `theme_settings` guarda cores e fontes.

### Modelos 3D (`product_ar_models`)

- Estados: `draft`, `processing`, `ready_for_review`, `approved`, `rejected`.
- Caminhos no formato `bucket/chave` (ex.: `published-3d/<rid>/<pid>/v2/model.glb`) ou caminho do app (`/demo/...`).
- Regras garantidas no banco:
  - publicado ⇒ aprovado (`check`);
  - no máximo **um modelo publicado por produto** (índice único parcial);
  - escala verificada ⇒ medidas cadastradas;
  - upload novo **não pode** entrar aprovado/publicado (trigger);
  - aprovar, rejeitar e publicar exigem **manager ou owner** (trigger, além da RLS);
  - trocar arquivo de modelo publicado exige **nova versão**.
- `publish_ar_model(...)` publica uma versão aprovada e despublica a anterior numa única transação.

## Papéis

| Ação                                                                       | editor | manager | owner |
| -------------------------------------------------------------------------- | ------ | ------- | ----- |
| Editar categorias, produtos, fotos; enviar modelos para revisão            | ✔      | ✔       | ✔     |
| Aprovar/rejeitar/publicar modelos; QR codes; ler métricas; apagar conteúdo |        | ✔       | ✔     |
| Editar dados e tema do restaurante; enviar branding                        |        | ✔       | ✔     |
| Alterar slug/ativação do restaurante; gerenciar membros                    |        |         | ✔     |

O último owner não pode ser removido nem rebaixado (trigger).

## RLS (resumo)

- **Anônimo:** lê restaurante ativo, categorias ativas, produtos publicados, mídias publicadas e modelos
  aprovados+publicados. QR codes só via `resolve_qr_code(código)` (não dá para listar). Não escreve em nada;
  eventos só pela Edge Function.
- **Autenticado sem vínculo:** igual ao anônimo (não consegue se adicionar como membro).
- **Membros:** veem tudo do próprio restaurante; escrevem conforme a tabela de papéis.
- Funções com `SECURITY DEFINER` usam `search_path = ''`.

## Storage

| Bucket              | Público | Conteúdo                                            | Escrita                               |
| ------------------- | ------- | --------------------------------------------------- | ------------------------------------- |
| `restaurant-assets` | sim     | `<rid>/branding/…`, `<rid>/products/<pid>/images/…` | editor (produtos), manager (branding) |
| `staging-3d`        | **não** | `<rid>/<pid>/vN/model.glb, model.usdz, poster.*`    | editor                                |
| `published-3d`      | sim     | cópia dos arquivos aprovados                        | manager                               |

A primeira pasta do caminho precisa ser o UUID do restaurante do usuário; caminhos malformados são negados.
Tamanho e tipos permitidos também são impostos pelo bucket (além da validação por assinatura no painel).

## Testes do banco

`scripts/test-db.sh` cria um banco temporário num PostgreSQL comum, simula o mínimo do Supabase
(`supabase/tests/00_supabase_stub.sql`: papéis `anon`/`authenticated`/`service_role`, `auth.uid()`, `storage`),
aplica migrações + seed e roda `supabase/tests/10_rls_test.sql` (29 verificações: leitura pública, isolamento entre
restaurantes, escalonamento de privilégio, aprovação/publicação, Storage, limite de frequência, QR sem redirecionamento aberto).

```bash
PGHOST=/var/run/postgresql PGUSER=postgres scripts/test-db.sh
```

Isto valida SQL e políticas, mas **não substitui** um teste no Supabase real (Auth, Storage e PostgREST de verdade).

## Primeiro administrador (procedimento seguro)

1. No Supabase: **Authentication → Users → Add user** (e-mail + senha forte, ou convite por e-mail).
2. No **SQL Editor** (roda como service role), vincule o usuário ao restaurante como owner:

```sql
insert into public.restaurant_members (restaurant_id, user_id, role)
select r.id, u.id, 'owner'
from public.restaurants r, auth.users u
where r.slug = 'restaurante-demonstrativo'   -- troque pelo slug real
  and u.email = 'pessoa@restaurante.com.br'; -- troque pelo e-mail
```

3. Depois disso, o owner adiciona outros membros. Nunca coloque senhas no código ou em migrações.
