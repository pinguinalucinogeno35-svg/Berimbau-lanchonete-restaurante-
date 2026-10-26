# Relatório de pendências e limitações (MVP 0.1.0 — 26/10/2026)

## Implementado e verificado neste ambiente

| Item                                                                              | Como foi verificado                                                          |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Cardápio público completo (rotas, busca, categorias, filtros, detalhe, sobre, QR) | Vitest + Playwright (Chromium, perfis Pixel 7 e desktop)                     |
| Visualizador 3D carregando GLB real                                               | Playwright: estado `ready` com WebGL (SwiftShader)                           |
| Erros de arquivo inexistente e corrompido                                         | Playwright com respostas simuladas (404 e bytes inválidos)                   |
| Geração do intent do Scene Viewer com escala fixa                                 | Playwright (Android emulado)                                                 |
| Proteção contra AR sem resposta (12 s)                                            | Unitário + Playwright                                                        |
| Migrações, seed, RLS, Storage, papéis, publicação de modelos                      | 29 verificações num PostgreSQL 16 local (`scripts/test-db.sh`)               |
| Modelos demonstrativos válidos                                                    | Validador Khronos: 0 erros, 0 avisos                                         |
| Tipos estritos, lint, build, auditoria de dependências                            | `tsc` sem erros, ESLint sem avisos, build ok, `npm audit` 0 vulnerabilidades |

## Implementado, ainda não verificado de ponta a ponta

| Item                                                                                 | O que falta                                                |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Realidade aumentada (WebXR, Scene Viewer, Quick Look)                                | **Teste em aparelhos físicos** (docs/HOMOLOGACAO.md)       |
| AR a partir da PWA instalada (principalmente iPhone)                                 | Teste físico                                               |
| Integração Supabase (leitura pública, Auth, painel, upload, cópia staging→published) | Projeto Supabase real + credenciais                        |
| Edge Function `track-event` (validação, limite de frequência)                        | Deploy no Supabase; o SQL de limite foi testado localmente |
| Atualização do PWA (aviso de nova versão) e uso offline                              | Teste manual com dois deploys                              |

## Demonstrativo (substituir antes de produção)

- Restaurante, categorias, produtos, preços e textos em `src/data/demo.ts` e `supabase/seed.sql`.
- Modelos 3D procedurais (`public/demo/models`) e posters gerados deles. **Não representam alimentos reais.**
- Ícones do PWA e monograma provisórios (`scripts/generate-icons.mjs`).
- Identidade visual (cores e fontes) aguardando a marca oficial.

## Pendente (não implementado)

- Gerenciamento de membros pela interface (hoje: SQL, ver DATABASE.md).
- Galeria com várias fotos por produto na página pública (o banco já suporta várias mídias; a página usa a primeira).
- Exclusão de produtos/categorias pela interface (hoje: despublicar/desativar, que é o fluxo recomendado).
- Métricas agregadas no banco (view/RPC) para volumes grandes.
- Fotografias reais, modelos reais e USDZ validados.
- Lighthouse e auditoria de acessibilidade em aparelho real.

## Dependências externas

- Projeto **Supabase** (Auth, Postgres, Storage, Edge Functions) — custo conforme plano.
- Hospedagem **Netlify ou Vercel** com HTTPS.
- Captura/modelagem 3D (ver 3D_ASSET_PIPELINE.md) e aparelhos para homologação.
- No celular do cliente: Chrome + ARCore (Android) ou Safari (iOS) para AR.

## Observações técnicas

- O `<model-viewer>` considera o Android compatível com Scene Viewer antes de saber se há ARCore; a falha só
  aparece após o toque (tratada com mensagem e fallback para 3D).
- No ambiente de testes, o Chromium headless não tem app para `intent://`; isso foi usado para testar o
  comportamento “AR sem resposta”, não a AR em si.
- O instalador do npm 10.9 tem um bug com o grafo de peers do Vitest 4 (`edgesOut`); use npm 11
  (`npx npm@11 install`) ou `npm ci` com o `package-lock.json` versionado.

## Próxima etapa recomendada

1. Criar o projeto Supabase de homologação, aplicar migrações e seed, cadastrar o owner.
2. Publicar um preview HTTPS (Netlify/Vercel) apontando para ele.
3. Rodar o roteiro de HOMOLOGACAO.md num Android com ARCore e num iPhone com a coxinha demonstrativa.
4. Em paralelo, capturar 1 produto real (piloto) seguindo 3D_ASSET_PIPELINE.md e validar a escala na mesa.
