# Berimbau Gourmet — PWA

Cafeteria · Lanchonete · Restaurante no centro histórico de Ilhéus (Rua Marquês de Paranaguá, 135).

## Biblioteca de marca

Abra `biblioteca.html` no navegador para ver tudo. Material recortado da proposta **ONE × Berimbau Gourmet**.

```
assets/
├── tokens.css          cores, fontes, raios, classes .icone / .icone-circulo / .botao
├── marca/              logo completo, símbolo e texto: SVG vetorizado + PNG transparente
│                       (terracota, cafe, branco, creme) e logo ONE (cafe, branco)
├── icones/             40 ícones SVG próprios (32×32, traço 1.6, currentColor) + sprite.svg
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
