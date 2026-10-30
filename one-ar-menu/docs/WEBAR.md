# WebAR: como funciona em cada plataforma

O componente `ARProductViewer` (`src/components/ar/ARProductViewer.tsx`) usa o `<model-viewer>` com
`ar ar-modes="webxr scene-viewer quick-look" ar-placement="floor"` e `ar-scale="fixed"` quando a escala está travada.
O próprio `<model-viewer>` decide o modo disponível. Em 26/10/2026 a AR abriu e a ampliação por pinça funcionou num celular real (modo e aparelho a registrar em HOMOLOGACAO.md).

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

### “Os produtos parecem pequenos” (teste físico de 26/10/2026)

O cliente relatou que todos os produtos pareciam muito pequenos na AR. Diagnóstico:

1. Os arquivos estavam corretos em metros e a AR usa `ar-scale="fixed"`, então o aparelho mostrava exatamente as
   medidas cadastradas. **O problema eram as medidas**, menores que porções de lanchonete (coxinha de festa de
   6,6 × 8,6 cm; prato de 20 cm).
2. Medidas ajustadas para porções típicas (referência, ainda sem medir o produto real):
   coxinha 8,2 × 10,7 cm; hambúrguer 12,6 cm; sobremesa 8,1 × 9,2 cm; cheeseburger em prato raso de 26 cm.
3. Para separar “medida errada” de “AR do aparelho errada”, existe a **régua de calibração** em `/calibrar`
   (30 cm, sempre em escala fixa): posicione ao lado de uma régua real ou de uma folha A4 (29,7 cm).
4. A página de experiência tem a opção **Tamanho real / Livre**. “Livre” usa `ar-scale="auto"` para o cliente
   ampliar e ver detalhes; o texto avisa que o tamanho deixa de ser o real.
5. Em WebXR, `xr-environment` usa a estimativa de luz do ambiente para iluminar o modelo como o restante da mesa.

**Atualização (pedido do cliente):** o padrão da experiência passou a ser **“Ampliar com 2 dedos”**
(`ar-scale="auto"`): o prato abre no tamanho cadastrado e o movimento de pinça amplia (Scene Viewer sem
`resizable=false`, Quick Look com escala de conteúdo, WebXR com escala livre). **“Travar tamanho real”**
(`ar-scale="fixed"`) segue disponível. A régua de calibração continua sempre fixa. No visualizador 3D,
`min-field-of-view="6deg"` e `min-camera-orbit="auto auto 0m"` permitem aproximar bem mais.

**Segunda ampliação (27/10/2026, pedido do cliente: “ainda está em proporções menores”):** os arquivos foram
conferidos (caixa delimitadora = medidas cadastradas, erro < 1 mm), então a AR mostrava as medidas certas. As medidas
de referência dos modelos demonstrativos passaram para porções grandes: coxinha 10,7 × 13,9 cm; hambúrguer
15 × 10,2 cm; sobremesa 10,5 × 12 cm; cheeseburger em prato de 30 cm (hambúrguer ≈ 17 cm). Continuam sendo
referência demonstrativa: com produto real, use a medida do prato servido.

**Distância inicial (30/10/2026, teste físico):** com o prato lado a lado, o cliente achou o tamanho certo, mas o
prato aparecia **longe da câmera**. No WebXR, o `<model-viewer>` 4.4 coloca o objeto a
`max(1 m, 2 × raio)` à frente da câmera e só depois baixa até a mesa, então o prato caía a ~1 m. O plugin
`arPlacementDistance` (`vite.config.ts`) faz o prato nascer a **35 cm** da câmera (pedido do cliente; 1,2 × raio se o objeto for maior) no build; se uma atualização do
`<model-viewer>` mudar esse trecho, o build falha. Scene Viewer e Quick Look decidem a distância sozinhos (não há
parâmetro); neles, o cliente arrasta o prato para perto. Os passos da página de experiência orientam isso.

**Volta às medidas reais (30/10/2026):** com o prato nascendo perto, o cliente pediu os tamanhos reais. A
“segunda ampliação” foi desfeita: coxinha 8,2 × 10,7 cm; hambúrguer 12,6 × 8,6 cm; sobremesa 8,1 × 9,2 cm;
cheeseburger em prato raso de 26 cm (arquivo de 26 cm restaurado do histórico, sem reprocessar). Conclusão: a
sensação de “pequeno” vinha da distância de 1 m, não das medidas.

Percepção: objetos em tamanho real costumam parecer menores na tela do que ao vivo, principalmente com o celular
alto. A régua é o tira-teima objetivo.

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
| Abertura real de AR e ampliação por pinça                                     | ✔ 1 celular real (26/10/2026)   |
| Escala conferida com régua / matriz completa de aparelhos                     | ✘ **pendente: aparelho físico** |
| Quick Look no iPhone (Safari e PWA instalada)                                 | ✘ **pendente: aparelho físico** |
