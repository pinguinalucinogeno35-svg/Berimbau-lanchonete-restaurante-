# Berimbau Gourmet — PWA

Cafeteria · Lanchonete · Restaurante no centro histórico de Ilhéus (Rua Marquês de Paranaguá, 135).

## Rodar localmente

Não há etapa de build: é HTML, CSS e JavaScript (módulos ES) puros.

```bash
python3 -m http.server 8080
# abra http://localhost:8080
```

O service worker só funciona em `localhost` ou HTTPS. Para publicar, basta enviar a pasta para
Netlify, Vercel ou GitHub Pages.

## Fase 1 (MVP) — o que já funciona

- **Início**: hero, selo "Aberto agora" calculado no fuso da Bahia, atalhos, "Agora é hora de..."
  (período do dia automático), destaques, prova social, canais (site, iFood, Maps) e convite para instalar.
- **Cardápio**: abas Café da manhã / Almoço / Lanche da tarde / Tudo, busca sem acento, categorias,
  selos, itens esgotados e folha de detalhe com variações, adicionais, observação e quantidade.
- **Pedido**: sacola salva no aparelho, retirada ou entrega com taxa por bairro e pedido mínimo,
  cupons, dados do cliente, pagamento (Pix, cartão, dinheiro com troco) e envio pelo WhatsApp
  com a mensagem formatada.
- **Pedido enviado**: código do pedido e **Pix copia e cola** (BR Code com CRC16) com o valor exato.
- **Nossa história** e **Como chegar** (mapa, horários com o dia de hoje destacado, contatos).
- **PWA**: manifest, ícones, atalhos, service worker (estrutura em cache, fotos cache-first,
  JSON network-first), página offline, aviso de nova versão.
- **SEO local**: JSON-LD `Restaurant` + `CafeOrCoffeeShop`, Open Graph com imagem.
- **Métricas**: eventos enviados para `window.dataLayer` (`src/services/analytics.js`).

## Fase 2 — o que entrou

- **QR code nas mesas**: o link `#/cardapio?mesa=5` coloca o cliente na mesa 5 (faixa no topo, opção
  "Na mesa 5" no pedido, sem endereço nem taxa; a mensagem do WhatsApp diz a mesa). Expira em 4 horas.
- **Gerador de QR codes para imprimir**: `#/qr` (uso interno, fora do menu). Cartões da marca para
  balcão, link da bio e cada mesa, 4 por folha A4.
- **Pix com QR code** na tela de pedido enviado, além do copia e cola.
- **Meus pedidos / Pedir de novo**: os últimos 10 pedidos ficam no aparelho; um toque devolve os itens
  à sacola com os preços atuais (itens esgotados são avisados). O último pedido aparece na tela inicial.
- **Link na bio do Instagram**: `#/links` — página própria, sem menu, com atalhos e os destaques
  (Café, Almoço, Salgados, História, Unidade). Links profundos: `#/cardapio?p=almoco`,
  `#/cardapio?p=tudo&c=salgados`.
- **Origem das visitas**: `?origem=instagram`, `qr-mesa`, `qr-balcao` ficam registradas na visita e
  vão junto em todos os eventos de métrica.

### Links para usar

| Onde | Link |
|---|---|
| Bio do Instagram | `https://berimbau-gourmet.netlify.app/#/links?origem=instagram` |
| Gerar QR codes | `https://berimbau-gourmet.netlify.app/#/qr` |
| Destaque "Almoço" | `https://berimbau-gourmet.netlify.app/#/cardapio?p=almoco&origem=instagram` |

## Conteúdo (o que trocar pelos dados reais)

| Arquivo | O que contém |
|---|---|
| `data/loja.json` | endereço, coordenadas, horários, WhatsApp, telefone, links (iFood, Maps, Instagram), chave Pix, bairros e taxas, cupons |
| `data/cardapio.json` | períodos do dia, categorias, itens (preço, foto, selos, variações, adicionais, `disponivel`) |
| `src/views/historia.js` | marcos da linha do tempo |

Ambos os JSON estão marcados com `"exemplo": true`: **preços, horários, WhatsApp e chave Pix são fictícios.**
Depois de alterar arquivos do app, aumente `VERSAO` em `sw.js` para os clientes receberem a atualização.

## Estrutura

```
index.html · manifest.webmanifest · sw.js · offline.html
data/            loja.json, cardapio.json
src/main.js      roteador (hash), service worker, instalação
src/views/       inicio, cardapio, pedido, enviado, historia, como-chegar, meus-pedidos, links, qr
src/components/  card-produto, folha-item, toast
src/store/       pedido.js (sacola, cliente, mesa), historico.js (pedidos anteriores)
src/services/    horario, pix, qr, whatsapp, formato, analytics
src/vendor/      qrcode.js (qrcode-generator, MIT)
src/styles/      app.css
assets/          biblioteca de marca (abaixo) + assets/app (ícones do PWA, og-image)
```

## Biblioteca de marca

Abra `biblioteca.html` no navegador para ver tudo. Material recortado da proposta **ONE × Berimbau Gourmet**.

```
assets/
├── tokens.css          cores, fontes, raios, classes .icone / .icone-circulo / .botao
├── marca/              logo completo, símbolo e texto: SVG vetorizado + PNG transparente
│                       (terracota, cafe, branco, creme) e logo ONE (cafe, branco)
├── icones/             41 ícones SVG próprios (32×32, traço 1.6, currentColor) + sprite.svg
├── elementos/          curvas em SVG, divisor, recortes de botão, card de mapa e textura sépia
├── fotos/              fotos do deck em WebP (simulações por IA, só referência)
├── mockups/            telas do site, Instagram e jornada de pedido
└── referencias/        ícones originais do deck (raster), só como referência de estilo
```

### Uso rápido

```html
<link rel="stylesheet" href="assets/tokens.css">
<!-- cole o conteúdo de assets/icones/sprite.svg no início do <body> -->
<svg class="icone"><use href="#i-xicara"/></svg>
<img src="assets/marca/logo-berimbau-completo.svg" alt="Berimbau Gourmet">
```

### Observações

- Os slides eram imagens de 1672×941 px; o logo foi vetorizado a partir desse raster. Para impressão,
  pedir o arquivo original do logo.
- As cores foram amostradas das imagens e a tipografia é uma aproximação (Cormorant Garamond + Montserrat).
- Regra da marca: nenhum emoji ou glifo de texto como ícone — sempre usar os SVGs de `assets/icones/`.
