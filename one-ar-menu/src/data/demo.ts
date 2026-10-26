// DADOS DEMONSTRATIVOS. Itens fictícios para provar a navegação, o 3D e a AR.
// Não representam produtos, preços ou informações reais de nenhum restaurante.
import type { ArModel, Category, Product, QrCode, Restaurant } from '@/types/domain';

export const DEMO_RESTAURANT_ID = '00000000-0000-4000-8000-000000000001';

export const demoRestaurant: Restaurant = {
  id: DEMO_RESTAURANT_ID,
  name: 'Restaurante Demonstrativo',
  slug: 'restaurante-demonstrativo',
  description:
    'Ambiente de demonstração do ONE AR Menu. A identidade oficial do restaurante será aplicada depois.',
  logoUrl: null,
  coverUrl: null,
  primaryColor: '#111514',
  secondaryColor: '#C2A77B',
  theme: {},
  info: {
    tagline: 'Cozinha tradicional · Experiência digital',
    heroTitle: 'Tradição que se vê antes de provar.',
    heroSubtitle:
      'Explore o cardápio e veja alguns pratos em 3D. Em celulares compatíveis, coloque o prato virtualmente sobre a sua mesa.',
    about:
      'Este é um texto demonstrativo. Aqui entra a história do restaurante, enviada e aprovada pelo cliente, editável pelo painel administrativo.',
    address: 'Endereço demonstrativo',
    openingHours: 'Horários demonstrativos',
    experienceTitle: 'Veja na sua mesa',
    experienceText:
      'Toque em “Ver na minha mesa”, aponte o celular para a mesa e posicione o prato. A experiência usa os recursos de realidade aumentada do próprio aparelho.',
  },
  isActive: true,
  isDemo: true,
};

const cat = (id: number, name: string, slug: string, description: string): Category => ({
  id: `00000000-0000-4000-8000-0000000001${String(id).padStart(2, '0')}`,
  restaurantId: DEMO_RESTAURANT_ID,
  name,
  slug,
  description,
  imageUrl: null,
  sortOrder: id,
  isActive: true,
});

export const demoCategories: Category[] = [
  cat(1, 'Salgados', 'salgados', 'Salgados demonstrativos'),
  cat(2, 'Pratos principais', 'pratos-principais', 'Pratos demonstrativos'),
  cat(3, 'Hambúrgueres', 'hamburgueres', 'Hambúrgueres demonstrativos'),
  cat(4, 'Sobremesas', 'sobremesas', 'Sobremesas demonstrativas'),
  cat(5, 'Bebidas', 'bebidas', 'Bebidas demonstrativas'),
];

const catId = (slug: string) => {
  const c = demoCategories.find((x) => x.slug === slug);
  if (!c) throw new Error(`Categoria demonstrativa inexistente: ${slug}`);
  return c.id;
};

const modelo = (
  n: number,
  productId: string,
  arquivo: string,
  dims: [number, number, number],
  extra: Partial<ArModel> = {},
): ArModel => ({
  id: `00000000-0000-4000-8000-0000000003${String(n).padStart(2, '0')}`,
  productId,
  glbUrl: `/demo/models/${arquivo}.glb`,
  usdzUrl: null,
  posterUrl: `/demo/posters/${arquivo}.webp`,
  dimensions: { widthCm: dims[0], depthCm: dims[1], heightCm: dims[2] },
  scaleVerified: false,
  scaleLocked: true,
  approvalStatus: 'approved',
  fileSizeBytes: null,
  version: 1,
  publishedAt: '2026-10-26T00:00:00Z',
  isDemo: true,
  ...extra,
});

let ordem = 0;
const produto = (
  n: number,
  p: Omit<Product, 'id' | 'restaurantId' | 'isDemo' | 'sortOrder' | 'media' | 'arModel' | 'isPublished'> & {
    arModel?: ArModel | null;
    poster?: string;
    isPublished?: boolean;
  },
): Product => {
  const id = `00000000-0000-4000-8000-0000000002${String(n).padStart(2, '0')}`;
  const arModel = p.arModel ? { ...p.arModel, productId: id } : null;
  return {
    id,
    restaurantId: DEMO_RESTAURANT_ID,
    categoryId: p.categoryId,
    name: p.name,
    slug: p.slug,
    description: p.description,
    ingredients: p.ingredients,
    allergens: p.allergens,
    priceCents: p.priceCents,
    portionDescription: p.portionDescription,
    isAvailable: p.isAvailable,
    isPublished: p.isPublished ?? true,
    isFeatured: p.isFeatured,
    sortOrder: ordem++,
    media: p.poster
      ? [
          {
            id: `${id}-poster`,
            type: 'image',
            url: p.poster,
            alt: `Imagem gerada do modelo 3D demonstrativo de ${p.name}`,
            sortOrder: 0,
          },
        ]
      : [],
    arModel,
    isDemo: true,
  };
};

export const demoProducts: Product[] = [
  produto(1, {
    categoryId: catId('salgados'),
    name: 'Coxinha demonstrativa',
    slug: 'coxinha-demonstrativa',
    description:
      'Item fictício usado para demonstrar a visualização em 3D e a realidade aumentada. O modelo é procedural e não representa o salgado real.',
    ingredients: ['Ingredientes demonstrativos'],
    allergens: ['glúten', 'leite'],
    priceCents: 900,
    portionDescription: '1 unidade (medidas do modelo: aprox. 6,6 × 8,6 cm)',
    isAvailable: true,
    isFeatured: true,
    poster: '/demo/posters/coxinha-demonstrativa.webp',
    arModel: modelo(1, '', 'coxinha-demonstrativa', [6.6, 6.6, 8.6]),
  }),
  produto(2, {
    categoryId: catId('salgados'),
    name: 'Empada demonstrativa',
    slug: 'empada-demonstrativa',
    description: 'Item fictício sem modelo 3D publicado: mostra como o cardápio se comporta só com texto.',
    ingredients: ['Ingredientes demonstrativos'],
    allergens: ['glúten', 'ovo'],
    priceCents: 1000,
    portionDescription: '1 unidade',
    isAvailable: true,
    isFeatured: false,
  }),
  produto(3, {
    categoryId: catId('pratos-principais'),
    name: 'Prato principal demonstrativo',
    slug: 'prato-principal-demonstrativo',
    description:
      'Item fictício de prato principal. Fotografia e modelo 3D serão adicionados com os produtos reais.',
    ingredients: ['Proteína demonstrativa', 'Acompanhamentos demonstrativos'],
    allergens: [],
    priceCents: 5800,
    portionDescription: 'Serve 1 pessoa',
    isAvailable: true,
    isFeatured: true,
  }),
  produto(4, {
    categoryId: catId('pratos-principais'),
    name: 'Risoto demonstrativo',
    slug: 'risoto-demonstrativo',
    description: 'Item fictício marcado como indisponível para demonstrar o estado de esgotado.',
    ingredients: ['Arroz', 'Ingredientes demonstrativos'],
    allergens: ['leite'],
    priceCents: 6200,
    portionDescription: 'Serve 1 pessoa',
    isAvailable: false,
    isFeatured: false,
  }),
  produto(5, {
    categoryId: catId('hamburgueres'),
    name: 'Hambúrguer demonstrativo',
    slug: 'hamburguer-demonstrativo',
    description:
      'Item fictício com modelo 3D procedural para testar o visualizador e a AR com um objeto maior.',
    ingredients: ['Pão', 'Carne', 'Queijo', 'Folhas'],
    allergens: ['glúten', 'leite', 'gergelim'],
    priceCents: 4200,
    portionDescription: '1 unidade (medidas do modelo: aprox. 11,6 × 7,9 cm)',
    isAvailable: true,
    isFeatured: true,
    poster: '/demo/posters/hamburguer-demonstrativo.webp',
    arModel: modelo(2, '', 'hamburguer-demonstrativo', [11.6, 11.6, 7.9]),
  }),
  produto(9, {
    categoryId: catId('hamburgueres'),
    name: 'Cheeseburger cheddar demonstrativo',
    slug: 'cheeseburger-cheddar-demonstrativo',
    description:
      'Hambúrguer triplo com cheddar derretido, servido no prato. Modelo 3D gerado por IA e otimizado para celular: é ilustrativo e não representa o produto real do restaurante.',
    ingredients: ['Pão', 'Carne', 'Queijo cheddar'],
    allergens: ['glúten', 'leite'],
    priceCents: 3800,
    portionDescription: '1 unidade (modelo com prato de 20 cm; hambúrguer de aprox. 11,5 cm)',
    isAvailable: true,
    isFeatured: true,
    poster: '/demo/posters/cheeseburger-cheddar.webp',
    arModel: modelo(4, '', 'cheeseburger-cheddar', [20, 20, 11.9]),
  }),
  produto(6, {
    categoryId: catId('sobremesas'),
    name: 'Sobremesa demonstrativa',
    slug: 'sobremesa-demonstrativa',
    description: 'Item fictício com modelo 3D procedural: bolinho com uma bola de sorvete.',
    ingredients: ['Ingredientes demonstrativos'],
    allergens: ['glúten', 'leite', 'ovo'],
    priceCents: 2600,
    portionDescription: '1 unidade (medidas do modelo: aprox. 6,8 × 7,8 cm)',
    isAvailable: true,
    isFeatured: false,
    poster: '/demo/posters/sobremesa-demonstrativa.webp',
    arModel: modelo(3, '', 'sobremesa-demonstrativa', [6.8, 6.8, 7.8]),
  }),
  produto(7, {
    categoryId: catId('bebidas'),
    name: 'Bebida demonstrativa',
    slug: 'bebida-demonstrativa',
    description: 'Item fictício de bebida.',
    ingredients: ['Ingredientes demonstrativos'],
    allergens: [],
    priceCents: 1200,
    portionDescription: '300 ml',
    isAvailable: true,
    isFeatured: false,
  }),
  produto(8, {
    categoryId: catId('bebidas'),
    name: 'Produto não publicado',
    slug: 'produto-nao-publicado',
    description: 'Rascunho: não deve aparecer no cardápio público.',
    ingredients: [],
    allergens: [],
    priceCents: 100,
    portionDescription: '',
    isAvailable: true,
    isFeatured: false,
    isPublished: false,
  }),
];

export const demoQrCodes: QrCode[] = [1, 2, 3].map((n) => ({
  id: `00000000-0000-4000-8000-0000000004${String(n).padStart(2, '0')}`,
  restaurantId: DEMO_RESTAURANT_ID,
  code: `mesa-${String(n).padStart(2, '0')}`,
  tableLabel: `Mesa ${n}`,
  targetPath: '/cardapio',
  isActive: true,
  createdAt: '2026-10-26T00:00:00Z',
}));
