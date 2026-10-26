# Arquitetura

## Visão geral

```
Navegador (React SPA + PWA)
 ├─ páginas públicas ──► hooks (TanStack Query) ──► MenuRepository ─┬─ MockMenuRepository (modo demo)
 │                                                                  └─ SupabaseMenuRepository ─► PostgREST (RLS) / Storage público
 ├─ ARProductViewer ──► <model-viewer> ──► WebGL (3D) | WebXR · Scene Viewer · Quick Look (AR do aparelho)
 ├─ métricas ──► MenuRepository.trackEvent ──► Edge Function track-event ──► analytics_events
 └─ /admin (sessão Supabase Auth) ──► AdminRepository ──► PostgREST + Storage (RLS por papel)
```

## Pastas

| Pasta                                           | Responsabilidade                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/app`                                       | Roteador (rotas com code splitting), provedores (Query, Auth, Tema)                  |
| `src/pages/public`, `src/pages/admin`           | Telas. Só orquestram; regras ficam em `features`/`lib`                               |
| `src/components/ui`                             | Primitivos visuais (Button, Badge, Notice, Skeleton, Price, estados)                 |
| `src/components/{layout,menu,product,ar,admin}` | Componentes de domínio                                                               |
| `src/features/augmented-reality`                | Máquina de estados do visualizador (pura e testada)                                  |
| `src/features/analytics`                        | Envio de eventos sem dados pessoais                                                  |
| `src/features/authentication`                   | Sessão, papel no restaurante, guarda das rotas `/admin`                              |
| `src/features/administration`                   | Validação de formulários (zod) e hooks do painel                                     |
| `src/repositories`                              | Acesso a dados: interfaces, implementação demo e Supabase, mapeadores                |
| `src/lib`                                       | Utilidades puras: formatação BRL, busca, detecção de aparelho, validação de arquivos |
| `src/data/demo.ts`                              | Dados fictícios do modo demonstrativo                                                |
| `supabase/`                                     | Migrações, seed, Edge Function e testes de banco                                     |
| `scripts/`                                      | Geração/validação de modelos, posters, ícones e teste de banco                       |

## Decisões técnicas

- **`<model-viewer>` em vez de Three.js direto:** já resolve 3D, sombras, poster, progresso e os três caminhos
  oficiais de AR com detecção de capacidade. Three.js entra só como dependência dele.
- **AR só por ação explícita**, na página `/experiencia/:slug`, depois que o modelo carregou e o
  `<model-viewer>` confirmou `canActivateAR`. A página do produto mostra foto por padrão e 3D sob demanda (aba).
- **Carregamento sob demanda:** o pacote do `<model-viewer>` (~300 KB gzip) é importado dinamicamente apenas
  quando um visualizador é montado. Cards nunca carregam GLB.
- **Repositórios trocáveis:** `MenuRepository`/`AdminRepository` isolam a fonte de dados. O código do Supabase
  também é importado dinamicamente, então o modo demo não baixa o SDK.
- **Segurança no banco, não na interface:** o papel do usuário (owner/manager/editor) só ajusta a UI; quem
  bloqueia é a RLS + triggers (ver DATABASE.md). O painel não usa service role.
- **Preço em centavos** (`price_cents`), formatado com `Intl.NumberFormat('pt-BR', { currency: 'BRL' })`.
- **Cache consciente (PWA):** pré-cache só do app (sem `model-viewer`, sem GLB). Dados do cardápio em
  `NetworkFirst` com cache curto apenas para leitura offline; GLB em `CacheFirst` limitado a 8 arquivos após abertos.
  TanStack Query considera preços “frescos” por 30 s e revalida ao voltar para a aba.
- **Fontes self-hosted** (`@fontsource`): funcionam offline e não enviam o IP do cliente a terceiros.

## Fluxo da experiência AR

1. `ARProductViewer` verifica modelo aprovado e WebGL → importa `<model-viewer>` → carrega o GLB (progresso visível;
   aviso de rede lenta após 10 s).
2. `load` → estado `ready`; `canActivateAR` define se o botão “Ver na minha mesa” fica ativo.
3. Toque → `activateAR()` (gesto do usuário). O `<model-viewer>` escolhe WebXR, Scene Viewer ou Quick Look.
4. Eventos `ar-status` (WebXR) e `visibilitychange` (apps nativos) detectam início, falha e retorno.
5. Se nada acontecer em 12 s, o estado vira “falha” e o botão volta a funcionar com uma explicação.
6. Erro de arquivo é classificado (inexistente × inválido × download interrompido) e nunca bloqueia o cardápio.

## Orçamento de performance (inicial)

| Item                                 | Meta                      | Medido no build atual           |
| ------------------------------------ | ------------------------- | ------------------------------- |
| JS inicial (gzip)                    | ≤ 150 KB                  | ~122 KB (index + react + query) |
| CSS (gzip)                           | ≤ 15 KB                   | ~7 KB                           |
| `<model-viewer>` (gzip, sob demanda) | —                         | ~297 KB                         |
| GLB principal                        | ≤ ~5 MB (aviso no upload) | demos: 0,6–1,2 MB               |
| Poster                               | ≤ 100 KB                  | demos: 15–45 KB                 |
