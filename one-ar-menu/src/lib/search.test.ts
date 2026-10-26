import { demoProducts } from '@/data/demo';
import { filterProducts, relatedProducts, sortProducts } from './search';

const publicados = demoProducts.filter((p) => p.isPublished);
const salgados = publicados[0]!.categoryId;

describe('filterProducts', () => {
  it('filtra por categoria', () => {
    const r = filterProducts(publicados, { categoryId: salgados });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => p.categoryId === salgados)).toBe(true);
  });
  it('busca sem diferenciar acentos e maiúsculas, inclusive em ingredientes', () => {
    expect(filterProducts(publicados, { query: 'HAMBURGUER' }).map((p) => p.slug)).toContain(
      'hamburguer-demonstrativo',
    );
    expect(filterProducts(publicados, { query: 'queijo' }).map((p) => p.slug)).toContain(
      'hamburguer-demonstrativo',
    );
    expect(filterProducts(publicados, { query: 'xyz-inexistente' })).toHaveLength(0);
  });
  it('exige todos os termos da busca', () => {
    expect(filterProducts(publicados, { query: 'coxinha demonstrativa' })).toHaveLength(1);
  });
  it('filtra itens com 3D e disponíveis', () => {
    expect(filterProducts(publicados, { onlyWith3d: true }).every((p) => p.arModel)).toBe(true);
    expect(filterProducts(publicados, { onlyAvailable: true }).every((p) => p.isAvailable)).toBe(true);
  });
});

it('sortProducts coloca indisponíveis no fim', () => {
  const ordenados = sortProducts(publicados);
  const primeiroIndisponivel = ordenados.findIndex((p) => !p.isAvailable);
  expect(ordenados.slice(primeiroIndisponivel).every((p) => !p.isAvailable)).toBe(true);
});

it('relatedProducts não inclui o próprio produto nem indisponíveis', () => {
  const base = publicados.find((p) => p.slug === 'prato-principal-demonstrativo')!;
  const r = relatedProducts(publicados, base);
  expect(r.find((p) => p.id === base.id)).toBeUndefined();
  expect(r.every((p) => p.isAvailable)).toBe(true);
});
