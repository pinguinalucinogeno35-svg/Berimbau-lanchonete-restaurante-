# Design system

Identidade **demonstrativa**, sóbria e gastronômica, pronta para receber a marca oficial do restaurante.

## Tokens (`src/styles/index.css`)

| Token CSS                          | Utilitário Tailwind            | Valor padrão          | Uso                                            |
| ---------------------------------- | ------------------------------ | --------------------- | ---------------------------------------------- |
| `--one-bg`                         | `bg-bg`                        | `#111514`             | Fundo principal                                |
| `--one-bg-alt`                     | `bg-bg-alt`                    | `#1B211F`             | Superfícies, cards                             |
| `--one-bg-raised`                  | `bg-raised`                    | `#232A27`             | Skeleton/realce                                |
| `--one-surface`                    | `bg-surface`                   | `#F6F2E9`             | Superfície clara (QR, botões claros)           |
| `--one-accent`                     | `bg-accent`, `text-accent`     | `#C2A77B`             | Dourado/champagne: CTA, filetes                |
| `--one-accent-strong`              | `text-accent-strong`           | `#D8C29C`             | Texto em destaque (contraste AA sobre o fundo) |
| `--one-olive` / `--one-olive-text` | `bg-olive` / `text-olive-text` | `#66735C` / `#9AA88E` | Faixa demo, selo 3D                            |
| `--one-text`                       | `text-text`                    | `#F8F6F0`             | Texto principal                                |
| `--one-text-muted`                 | `text-muted`                   | `#B9B6AC`             | Texto secundário                               |
| `--one-text-dark`                  | `text-ink`                     | `#202521`             | Texto sobre dourado/claro                      |
| `--one-line`                       | `border-line`                  | 12% do texto          | Filetes e bordas                               |
| `--one-danger` / `--one-success`   | `text-danger` / `text-success` | `#E0A08F` / `#A9C39A` | Estados                                        |
| `--one-radius-sm/-/-lg`            | `rounded-sm` …                 | 4 / 8 / 14 px         | Cantos discretos                               |
| `--one-ease`, `--one-duration`     | `ease-one`                     | 220 ms                | Transições                                     |

Contraste: `#F8F6F0` e `#B9B6AC` sobre `#111514` passam AA; `#202521` sobre `#C2A77B` passa AA para texto de botão.
O `#66735C` original não tem contraste para texto pequeno; por isso o texto oliva usa `#9AA88E`.

## Tipografia

- Títulos: **Cormorant Garamond** 500/600 (`font-display`), números alinhados.
- Texto e navegação: **DM Sans** variável (`font-body`).
- Servidas pelo app via `@fontsource` (offline e sem terceiros).
- Rótulos: classe `.eyebrow` (caixa alta, espaçamento largo, dourado).

## Personalização por restaurante

`restaurants.theme_settings` (editável em **/admin/configuracoes**):

```json
{
  "colors": {
    "bg": "#…",
    "bgAlt": "#…",
    "surface": "#…",
    "accent": "#…",
    "olive": "#…",
    "text": "#…",
    "textDark": "#…"
  },
  "fonts": { "display": "Nome da fonte", "body": "Nome da fonte" }
}
```

O `ThemeProvider` aplica os valores sobre os tokens em tempo de execução, aceitando só `#RRGGBB` e nomes de fonte
seguros. Fontes novas precisam ser incluídas no projeto (pacote `@fontsource` ou arquivos próprios).
Logo e imagem principal vêm de `logo_path` e `cover_path`.

## Componentes

- `ui/`: `Button`/`ButtonLink` (primary, secondary, ghost, light), `Badge`, `Notice` (info/warning/error/success),
  `Skeleton`, `Price`, `ErrorState`, `EmptyState`.
- `menu/`: `CategoryNav` (abas horizontais com `aria-pressed`), `SearchField`, `FilterChips`, `ProductCard`.
- `product/ProductImage`: foto ou espaço neutro “Foto em breve” (nunca imagem inventada).
- `ar/`: `ARProductViewer`, `ScaleInfo`, `ArGuidance`, `ArSteps`, `DesktopHandoff`.

## Princípios

Sem gradientes chamativos, neon ou sombras artificiais; filetes finos e cantos pequenos; a interface continua
completa e bonita sem 3D e sem animações. Animações curtas (entrada, skeleton), desligadas com
`prefers-reduced-motion`. Ícones: Lucide (traço fino); nenhum emoji como ícone.
