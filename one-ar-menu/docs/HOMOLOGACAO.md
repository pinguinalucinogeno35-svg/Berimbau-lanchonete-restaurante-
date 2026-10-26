# Checklist de homologação (aparelhos físicos, no restaurante)

Preencha uma linha por aparelho. **Até agora nenhum teste físico foi executado.**

## Matriz de aparelhos

| Aparelho                                             | Sistema / navegador        | Link | PWA instalada | Testado por / data | Resultado                                     |
| ---------------------------------------------------- | -------------------------- | ---- | ------------- | ------------------ | --------------------------------------------- |
| Samsung Galaxy S23 Ultra                             | Android 14+ / Chrome atual | ☐    | ☐             |                    |                                               |
| Android intermediário (ex.: Galaxy A-series, Moto G) | Chrome atual               | ☐    | ☐             |                    |                                               |
| Android **sem** Google Play Services para RA         | Chrome                     | ☐    | —             |                    | Esperado: 3D ok + mensagem de AR indisponível |
| iPhone 15 (ou equivalente)                           | iOS 17+ / Safari           | ☐    | ☐             |                    |                                               |
| iPhone pelo navegador interno do Instagram           | —                          | ☐    | —             |                    | Esperado: orientação para abrir no Safari     |
| Desktop                                              | Chrome, Safari, Firefox    | ☐    | —             |                    | Esperado: 3D + QR para o celular              |

## Roteiro por aparelho

1. Escanear o QR code da mesa → abre o cardápio (sem login, sem pedir permissão).
2. Navegar por categorias, buscar um item, abrir um produto: preço, ingredientes e alergênicos legíveis.
3. Aba “Ver em 3D”: carrega com progresso; girar e ampliar funcionam com um dedo/dois dedos; a página rola normalmente.
4. “Ver na minha mesa” → página de experiência → tocar no botão:
   - [ ] a AR abre (anotar o modo: WebXR / Scene Viewer / Quick Look)
   - [ ] a superfície da mesa é detectada em até ~10 s com boa luz
   - [ ] o prato fica apoiado na mesa (não flutua nem afunda)
   - [ ] **escala:** colocar régua ao lado; medir largura e altura virtuais; anotar diferença (%)
   - [ ] fechar a AR volta para a página, sem perder o lugar
5. Repetir a AR com a PWA instalada (adicionar à tela inicial).
6. Modo avião depois de abrir o cardápio: o app mostra aviso de conexão; nada trava.
7. Rede lenta (3G simulado ou sinal fraco): aviso de “conexão lenta” aparece; dá para continuar navegando.
8. Acessibilidade: aumentar fonte do sistema para 200%; leitor de tela (TalkBack/VoiceOver) lê nome, preço e alergênicos.

## Critérios de aceite da AR

- Abre em ≥ 1 Android e ≥ 1 iPhone da matriz.
- Diferença de escala ≤ ~5% nos modelos marcados como verificados.
- Nenhum aparelho incompatível fica sem caminho: 3D ou foto sempre disponíveis.

## Registro de problemas

| #   | Aparelho | Passo | O que aconteceu | Captura | Status |
| --- | -------- | ----- | --------------- | ------- | ------ |
|     |          |       |                 |         |        |
