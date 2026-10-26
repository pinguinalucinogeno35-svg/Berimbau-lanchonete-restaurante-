# ONE AR Menu

Cardápio gastronômico com visualização 3D e realidade aumentada (WebAR), desenvolvido pela **ONE Studio Digital**.
Web app responsivo + PWA, em português do Brasil, preços em reais (BRL).

> **Estado atual: MVP técnico em modo demonstrativo.** Itens, preços e modelos 3D são fictícios e marcados como tal.
> A realidade aumentada foi implementada com as APIs oficiais do `<model-viewer>`, mas **ainda não foi testada em
> aparelhos físicos**. Veja [docs/PENDENCIAS.md](docs/PENDENCIAS.md).

## O que existe

| Área                                                                                             | Situação                                                          |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Cardápio público (início, cardápio, produto, experiência 3D/AR, sobre, QR `/q/:código`)          | Implementado                                                      |
| Visualizador 3D (`<model-viewer>`) com estados de carregamento, erro, rede lenta e WebGL ausente | Implementado e testado em Chromium                                |
| Realidade aumentada (WebXR, Scene Viewer, Quick Look)                                            | Implementada; **pendente de teste em aparelho físico**            |
| Modelos 3D                                                                                       | **Demonstrativos** (procedurais); não representam alimentos reais |
| Banco (PostgreSQL/Supabase): migrações, RLS, Storage, seed                                       | Implementado e testado num PostgreSQL local                       |
| Painel administrativo (produtos, categorias, modelos 3D, QR codes, configurações, métricas)      | Implementado; **não testado contra um projeto Supabase real**     |
| Edge Function de métricas com limite de frequência                                               | Implementada; **não executada** (exige Supabase)                  |
| PWA (manifest, ícones, service worker, aviso de atualização)                                     | Implementado                                                      |

## Requisitos

- Node.js 20.19+ (testado com 22)
- npm 10+
- Para o backend: um projeto Supabase (plano gratuito basta para começar) e, opcionalmente, a Supabase CLI

## Instalação e comandos

```bash
cd one-ar-menu
npm ci
cp .env.example .env.local     # modo demonstrativo funciona sem editar nada
npm run dev                    # http://localhost:5173
```

| Comando                                                         | O que faz                                                                                       |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `npm run dev`                                                   | Servidor de desenvolvimento                                                                     |
| `npm run build`                                                 | Checagem de tipos + build de produção em `dist/`                                                |
| `npm run preview`                                               | Serve o build (necessário para testar o service worker)                                         |
| `npm run lint` / `npm run format`                               | ESLint / Prettier                                                                               |
| `npm test`                                                      | Testes unitários e de integração (Vitest + Testing Library)                                     |
| `npm run test:e2e`                                              | Testes ponta a ponta (Playwright; sobe o build sozinho)                                         |
| `npm run models:demo`                                           | Regera os GLB demonstrativos em `public/demo/models`                                            |
| `node scripts/prepare-model.mjs in.glb out.glb --largura-cm 20` | Prepara um GLB recebido: descompacta, simplifica, escala em cm, base na mesa e texturas menores |
| `node scripts/validate-models.mjs`                              | Valida GLBs com o validador oficial do Khronos                                                  |
| `node scripts/render-posters.mjs`                               | Renderiza os posters WebP dos modelos com o próprio `<model-viewer>`                            |
| `npm run icons`                                                 | Gera os ícones provisórios do PWA                                                               |
| `scripts/test-db.sh`                                            | Testa migrações, seed e RLS num PostgreSQL local (ver docs/DATABASE.md)                         |

Para o Playwright usar um Chromium já instalado: `PLAYWRIGHT_CHROMIUM_PATH=/caminho/do/chrome npm run test:e2e`.
Sem isso, rode `npx playwright install chromium` antes.

## Modo demonstrativo × Supabase

- `VITE_DATA_SOURCE=demo` (padrão): dados de `src/data/demo.ts`, nada é salvo, faixa “Modo demonstrativo” no topo.
  O painel `/admin` fica bloqueado e explica que precisa do backend.
- `VITE_DATA_SOURCE=supabase` + `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`: usa o banco real.
  Se faltar URL ou chave, o app volta sozinho para o modo demonstrativo.

A troca acontece em `src/repositories/index.ts` (`MockMenuRepository` × `SupabaseMenuRepository`).
Configuração completa: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Testar AR no celular

A AR exige **HTTPS**. Em desenvolvimento, publique um preview (Netlify/Vercel) ou use um túnel HTTPS e abra no celular:

- **Android:** Chrome atualizado + “Google Play Services para RA”. Abra `/experiencia/coxinha-demonstrativa`, toque em
  “Ver na minha mesa”.
- **iPhone:** Safari. Sem USDZ cadastrado, o `<model-viewer>` gera o USDZ na hora (não equivale a um asset validado).

Roteiro completo e matriz de aparelhos: [docs/HOMOLOGACAO.md](docs/HOMOLOGACAO.md). Diferenças por plataforma: [docs/WEBAR.md](docs/WEBAR.md).

## Documentação

- [ARCHITECTURE.md](docs/ARCHITECTURE.md): componentes, fluxo de dados e decisões técnicas
- [DATABASE.md](docs/DATABASE.md): entidades, migrações, RLS, Storage e primeiro administrador
- [WEBAR.md](docs/WEBAR.md): Android, iPhone, desktop e PWA
- [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md): tokens, fontes, componentes e personalização
- [3D_ASSET_PIPELINE.md](docs/3D_ASSET_PIPELINE.md): da foto do prato ao modelo publicado
- [DEPLOYMENT.md](docs/DEPLOYMENT.md): Netlify/Vercel, Supabase e HTTPS
- [HOMOLOGACAO.md](docs/HOMOLOGACAO.md): checklist de homologação no restaurante
- [PENDENCIAS.md](docs/PENDENCIAS.md): relatório de pendências e limitações

## Limitações conhecidas

- Nenhum teste de AR em aparelho físico foi feito até agora.
- Os modelos 3D são procedurais e servem só para provar o fluxo técnico.
- Escala “tamanho real” só deve ser marcada como verificada depois de medição presencial.
- Navegadores internos (Instagram, Facebook etc.) costumam bloquear AR: o app orienta a abrir no Safari/Chrome.
- Métricas são agregadas no cliente (adequado ao volume de um restaurante; trocar por view/RPC se crescer).
