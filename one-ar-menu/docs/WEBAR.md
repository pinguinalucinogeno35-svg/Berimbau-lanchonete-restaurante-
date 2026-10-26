# WebAR: como funciona em cada plataforma

O componente `ARProductViewer` (`src/components/ar/ARProductViewer.tsx`) usa o `<model-viewer>` com
`ar ar-modes="webxr scene-viewer quick-look" ar-placement="floor"` e `ar-scale="fixed"` quando a escala está travada.
O próprio `<model-viewer>` decide o modo disponível. **Nenhum desses caminhos foi testado em aparelho físico ainda.**

## Android

| Caminho      | Quando                                 | Observações                                                                              |
| ------------ | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| WebXR        | Chrome com suporte a WebXR AR + ARCore | Sessão dentro do navegador; eventos `ar-status` informam início/falha/fim                |
| Scene Viewer | Demais Androids com Chrome             | Abre o app de AR do Google via `intent://`; o retorno é detectado por `visibilitychange` |

- **Achado nos testes automatizados:** num Android emulado, o `<model-viewer>` informa `canActivateAR = true`
  porque oferece o Scene Viewer com base no navegador; ele **não consegue checar o ARCore antes do toque**.
  Em aparelhos sem “Google Play Services para RA”, a falha só aparece depois do toque: o Scene Viewer usa a URL de
  fallback e o `<model-viewer>` emite `ar-status: failed`. O app mostra a mensagem e mantém o 3D.
- Se nada acontecer em 12 s (sem sessão e sem sair da página), o app libera o botão e explica (proteção contra
  “Abrindo…” infinito).
- O intent gerado foi conferido no teste E2E: `arvr.google.com/scene-viewer/1.2?…&resizable=false&file=<GLB>`
  (`resizable=false` = escala fixa).
- O GLB precisa estar em **HTTPS público** para o Scene Viewer baixá-lo.

## iPhone / iPad

- Caminho: **AR Quick Look** (Safari). Usa o `usdz_path` do modelo, se houver.
- Sem USDZ, o `<model-viewer>` gera um USDZ a partir do GLB na hora. Serve como fallback, mas **não equivale a um
  USDZ preparado e testado** (materiais e escala podem diferir). Para homologação, envie USDZ próprio.
- Quick Look ocupa a tela inteira; o retorno é detectado por `visibilitychange`.
- **PWA instalada (tela inicial):** a abertura do Quick Look a partir do modo standalone deve ser testada. O app já
  mostra a orientação “se não abrir, use o Safari” com botão de copiar link.

## Navegadores internos de apps (Instagram, Facebook, TikTok…)

Costumam bloquear AR. O app detecta pelo user agent e mostra como abrir no Safari/Chrome (copiar link).

## Desktop

Visualização 3D interativa (girar, zoom). **Não há simulação de câmera AR.** A página de experiência mostra um QR
code para abrir o mesmo produto no celular.

## Escala

- Modelos em **metros**, origem no centro da base (y = 0 apoiado na mesa).
- Medidas reais em cm no banco (`width_cm`, `depth_cm`, `height_cm`).
- `scale_locked = true` ⇒ `ar-scale="fixed"` (o cliente não redimensiona).
- O texto “escala conferida presencialmente” só aparece com `scale_verified = true`. O rastreamento do aparelho
  tem erro de alguns milímetros a centímetros, conforme luz, textura da mesa e aparelho.

## Privacidade

O app não acessa a câmera diretamente (`getUserMedia` não é usado). A câmera é controlada pela AR do sistema
(WebXR/Scene Viewer/Quick Look); nenhuma imagem é enviada ou gravada.

## Estados tratados

Carregando (com %), pronto, AR disponível, AR indisponível, arquivo inexistente (404), arquivo inválido,
rede lenta (> 10 s), download interrompido (offline/erro de rede, com “tentar de novo”), WebGL ausente,
falha ao ativar AR, AR sem resposta (12 s) e retorno da AR.

## Testes executados × pendentes

| Teste                                                                         | Status                          |
| ----------------------------------------------------------------------------- | ------------------------------- |
| Máquina de estados (unitário)                                                 | ✔ automatizado                  |
| GLB carrega e renderiza em Chromium (WebGL por SwiftShader), mobile e desktop | ✔ automatizado (Playwright)     |
| Arquivo inexistente e corrompido                                              | ✔ automatizado                  |
| Intent do Scene Viewer gerado com escala fixa                                 | ✔ automatizado                  |
| Abertura real de AR, posicionamento na mesa, escala                           | ✘ **pendente: aparelho físico** |
| Quick Look no iPhone (Safari e PWA instalada)                                 | ✘ **pendente: aparelho físico** |
