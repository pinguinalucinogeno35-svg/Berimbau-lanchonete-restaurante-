import type { Product } from '@/types/domain';

export const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export interface ProductFilters {
  categoryId?: string | null;
  query?: string;
  onlyWith3d?: boolean;
  onlyAvailable?: boolean;
  onlyFeatured?: boolean;
}

/** Filtra produtos por categoria, busca (nome, descrição, ingredientes) e marcadores. Sem acentos. */
export function filterProducts(products: Product[], f: ProductFilters): Product[] {
  const termos = normalize(f.query ?? '')
    .split(/\s+/)
    .filter(Boolean);
  return products.filter((p) => {
    if (f.categoryId && p.categoryId !== f.categoryId) return false;
    if (f.onlyWith3d && !p.arModel) return false;
    if (f.onlyAvailable && !p.isAvailable) return false;
    if (f.onlyFeatured && !p.isFeatured) return false;
    if (!termos.length) return true;
    const alvo = normalize(`${p.name} ${p.description} ${p.ingredients.join(' ')}`);
    return termos.every((t) => alvo.includes(t));
  });
}

/** Ordena: disponíveis primeiro, depois sort_order e nome. */
export function sortProducts(products: Product[]): Product[] {
  return [...products].sort(
    (a, b) =>
      Number(b.isAvailable) - Number(a.isAvailable) ||
      a.sortOrder - b.sortOrder ||
      a.name.localeCompare(b.name, 'pt-BR'),
  );
}

export function relatedProducts(all: Product[], product: Product, limit = 3): Product[] {
  const mesmos = all.filter((p) => p.id !== product.id && p.categoryId === product.categoryId);
  const outros = all.filter(
    (p) => p.id !== product.id && p.categoryId !== product.categoryId && p.isFeatured,
  );
  return [...mesmos, ...outros].filter((p) => p.isAvailable).slice(0, limit);
}
