import {
  makePublicUrlResolver,
  mapProduct,
  pickPublishedModel,
  type ArModelRow,
  type ProductRow,
} from './mappers';

const url = makePublicUrlResolver('https://abc.supabase.co');

const modelo = (extra: Partial<ArModelRow>): ArModelRow => ({
  id: 'm1',
  product_id: 'p1',
  glb_path: 'published-3d/r1/p1/v1/model.glb',
  usdz_path: null,
  poster_path: null,
  width_cm: '6.60',
  height_cm: '8.60',
  depth_cm: '6.60',
  scale_verified: false,
  scale_locked: true,
  approval_status: 'approved',
  file_size_bytes: 1000,
  version: 1,
  published_at: '2026-10-26T00:00:00Z',
  ...extra,
});

describe('resolução de URLs do Storage', () => {
  it('caminho "bucket/chave" vira URL pública', () => {
    expect(url('published-3d/r1/p1/v1/model.glb')).toBe(
      'https://abc.supabase.co/storage/v1/object/public/published-3d/r1/p1/v1/model.glb',
    );
  });
  it('caminho absoluto do app é mantido (assets demonstrativos)', () =>
    expect(url('/demo/models/x.glb')).toBe('/demo/models/x.glb'));
  it('nulo e caminho sem chave viram null', () => {
    expect(url(null)).toBeNull();
    expect(url('so-bucket')).toBeNull();
  });
});

describe('modelo público', () => {
  it('ignora modelos não aprovados ou não publicados (defesa em profundidade)', () => {
    expect(
      pickPublishedModel([modelo({ approval_status: 'ready_for_review', published_at: null })], url),
    ).toBeNull();
    expect(pickPublishedModel([modelo({ published_at: null })], url)).toBeNull();
  });
  it('converte medidas numéricas vindas como texto', () => {
    expect(pickPublishedModel([modelo({})], url)?.dimensions).toEqual({
      widthCm: 6.6,
      heightCm: 8.6,
      depthCm: 6.6,
    });
  });
  it('sem medidas completas, dimensions é null', () => {
    expect(pickPublishedModel([modelo({ depth_cm: null })], url)?.dimensions).toBeNull();
  });
});

it('mapProduct no modo público esconde mídias não publicadas', () => {
  const row: ProductRow = {
    id: 'p1',
    restaurant_id: 'r1',
    category_id: 'c1',
    name: 'X',
    slug: 'x',
    description: '',
    ingredients: null,
    allergens: null,
    price_cents: 100,
    portion_description: '',
    is_available: true,
    is_published: true,
    is_featured: false,
    sort_order: 0,
    product_media: [
      {
        id: 'a',
        media_type: 'image',
        storage_path: 'restaurant-assets/r1/products/p1/images/a.webp',
        alt_text: 'A',
        sort_order: 1,
        is_published: true,
      },
      {
        id: 'b',
        media_type: 'image',
        storage_path: 'restaurant-assets/r1/products/p1/images/b.webp',
        alt_text: 'B',
        sort_order: 0,
        is_published: false,
      },
    ],
    product_ar_models: [],
  };
  const p = mapProduct(row, url, { publicOnly: true });
  expect(p.media.map((m) => m.id)).toEqual(['a']);
  expect(p.ingredients).toEqual([]);
  expect(p.arModel).toBeNull();
});
