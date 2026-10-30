# Deploy

> Nenhum deploy de produção foi feito. Os passos abaixo exigem autorização e contas do cliente/ONE.

## 1. Supabase

1. Crie um projeto (região São Paulo recomendada).
2. Aplique as migrações, por uma destas formas:
   - Supabase CLI: `supabase link --project-ref <ref>` e `supabase db push` (dentro de `one-ar-menu/`);
   - ou cole os arquivos de `supabase/migrations/` em ordem no **SQL Editor**.
3. Opcional (homologação): rode `supabase/seed.sql` para ter os itens demonstrativos.
4. Cadastre o restaurante real (`insert into restaurants …`) e o primeiro owner (docs/DATABASE.md).
5. Edge Function de métricas:
   ```bash
   supabase functions deploy track-event
   supabase secrets set ANALYTICS_SALT="<texto-aleatório-longo>" ALLOWED_ORIGINS="https://cardapio.seudominio.com.br"
   ```
   `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem nas funções; **nunca** coloque a service role no frontend.
6. Authentication → URL Configuration: defina a Site URL do app. Desative cadastro público (Sign-ups) se o
   painel for só por convite.

## 2. Variáveis do frontend

| Variável                 | Exemplo                              | Observação                       |
| ------------------------ | ------------------------------------ | -------------------------------- |
| `VITE_DATA_SOURCE`       | `supabase`                           | `demo` para o modo demonstrativo |
| `VITE_SUPABASE_URL`      | `https://xyz.supabase.co`            | Pública                          |
| `VITE_SUPABASE_ANON_KEY` | `eyJ…`                               | Pública, protegida por RLS       |
| `VITE_RESTAURANT_SLUG`   | `nome-do-restaurante`                | Slug em `restaurants`            |
| `VITE_PUBLIC_APP_URL`    | `https://cardapio.seudominio.com.br` | Base dos QR codes                |

## 3. Netlify

O repositório atual também hospeda outro site na raiz. Para este app, crie um **projeto Netlify separado** com:

- Base directory: `one-ar-menu`
- Build command: `npm ci && npm run build`
- Publish directory: `one-ar-menu/dist`
- Variáveis do item 2 em Site configuration → Environment variables

`one-ar-menu/netlify.toml` já define o fallback de SPA, cabeçalhos de cache, tipos MIME de GLB/USDZ e
`Permissions-Policy` (câmera/XR só para o próprio site).

## 4. Vercel

- Root Directory: `one-ar-menu`; framework Vite (o `vercel.json` já define build, saída, rewrites e cabeçalhos).
- Variáveis do item 2 em Project Settings → Environment Variables.
- O build da Vercel usa `VITE_BRAND=berimbau` (no `buildCommand` do `vercel.json`).

**Publicação atual (30/10/2026):** https://berimbau-cardapio-ar.vercel.app — projeto `berimbau-cardapio-ar`, plano
Hobby, deploy automático a cada push na branch padrão. A Netlify (`one-ar-menu.netlify.app`) ficou parada na versão
de 26/10 porque a equipe esgotou os créditos do ciclo; QR codes de teste devem apontar para o endereço da Vercel.

## 5. HTTPS e domínio

- Netlify/Vercel emitem certificado automaticamente; a AR e o service worker **exigem HTTPS**.
- Domínio próprio: crie o CNAME indicado pelo provedor; aguarde o certificado antes de imprimir QR codes.
- Gere os QR codes no painel só depois de definir `VITE_PUBLIC_APP_URL` com o domínio final.

## 6. Checklist pós-deploy

- [ ] `/` abre sem a faixa “Modo demonstrativo” (fonte = Supabase)
- [ ] Produto não publicado não aparece; modelo em revisão não aparece
- [ ] `/admin` exige login; editor não consegue aprovar/publicar
- [ ] GLB publicado abre em 3D; AR testada (docs/HOMOLOGACAO.md)
- [ ] Evento aparece em `/admin/analytics` depois de abrir um produto
- [ ] Lighthouse mobile (PWA, acessibilidade, performance) registrado
