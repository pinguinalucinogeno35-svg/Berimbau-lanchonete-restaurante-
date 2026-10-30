import { afterEach, describe, expect, it } from 'vitest';
import { BRANDS, applyBrand, resolveBrand } from './brand';

afterEach(() => localStorage.clear());

describe('resolveBrand', () => {
  it('usa o padrão do build quando nada foi escolhido', () => {
    expect(resolveBrand('', undefined)).toBe('one');
    expect(resolveBrand('', 'berimbau')).toBe('berimbau');
    expect(resolveBrand('', 'invalido')).toBe('one');
  });

  it('?tema= na URL vence o padrão e fica salvo no aparelho', () => {
    expect(resolveBrand('?tema=berimbau', 'one')).toBe('berimbau');
    expect(resolveBrand('', 'one')).toBe('berimbau');
    expect(resolveBrand('?tema=one', 'berimbau')).toBe('one');
    expect(resolveBrand('', 'berimbau')).toBe('one');
  });

  it('ignora valores desconhecidos na URL', () => {
    expect(resolveBrand('?tema=<script>', 'berimbau')).toBe('berimbau');
  });
});

describe('applyBrand', () => {
  it('marca o <html> com o tema e ajusta a cor da barra', () => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.append(meta);
    applyBrand(BRANDS.berimbau);
    expect(document.documentElement.dataset.tema).toBe('berimbau');
    expect(meta.content).toBe('#FCF6EF');
    meta.remove();
  });
});
