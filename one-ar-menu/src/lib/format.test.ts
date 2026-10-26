import { formatDimensions, formatPrice, parsePriceToCents, slugify } from './format';

describe('formatPrice', () => {
  it('formata centavos em reais no padrão pt-BR', () => {
    expect(formatPrice(900)).toBe('R$ 9,00');
    expect(formatPrice(123456)).toBe('R$ 1.234,56');
    expect(formatPrice(0)).toBe('R$ 0,00');
  });
  it('trata valores inválidos sem quebrar', () => {
    expect(formatPrice(-1)).toBe('Preço indisponível');
    expect(formatPrice(Number.NaN)).toBe('Preço indisponível');
  });
});

describe('parsePriceToCents', () => {
  it.each([
    ['12,50', 1250],
    ['R$ 1.234,56', 123456],
    ['12.5', 1250],
    ['0', 0],
  ])('%s → %i centavos', (entrada, esperado) => expect(parsePriceToCents(entrada)).toBe(esperado));
  it('recusa entradas inválidas', () => {
    expect(parsePriceToCents('')).toBeNull();
    expect(parsePriceToCents('abc')).toBeNull();
    expect(parsePriceToCents('-3')).toBeNull();
  });
});

it('slugify remove acentos e símbolos', () => {
  expect(slugify('Pão de Queijo Especial!')).toBe('pao-de-queijo-especial');
  expect(slugify('  Hambúrguer  ')).toBe('hamburguer');
});

it('formatDimensions usa largura × profundidade × altura', () => {
  expect(formatDimensions({ widthCm: 6.6, depthCm: 6.6, heightCm: 8.6 })).toBe('6,6 × 6,6 × 8,6 cm');
});
