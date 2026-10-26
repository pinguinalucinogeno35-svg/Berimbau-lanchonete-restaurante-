import { useQuery } from '@tanstack/react-query';
import { withMenu } from '@/repositories';

// Preços e disponibilidade: dados considerados "frescos" por só 30 s e revalidados ao voltar à aba.
const STALE = 30_000;

export const menuKeys = {
  restaurant: ['restaurant'] as const,
  categories: ['categories'] as const,
  products: ['products'] as const,
  product: (slug: string) => ['product', slug] as const,
};

export function useRestaurant() {
  return useQuery({
    queryKey: menuKeys.restaurant,
    queryFn: () => withMenu((r) => r.getRestaurant()),
    staleTime: 5 * 60_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: menuKeys.categories,
    queryFn: () => withMenu((r) => r.listCategories()),
    staleTime: STALE,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: menuKeys.products,
    queryFn: () => withMenu((r) => r.listProducts()),
    staleTime: STALE,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: menuKeys.product(slug),
    queryFn: () => withMenu((r) => r.getProductBySlug(slug)),
    staleTime: STALE,
  });
}
