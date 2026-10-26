import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { withAdmin } from '@/repositories';

export const adminKeys = {
  products: ['admin', 'products'] as const,
  categories: ['admin', 'categories'] as const,
  models: ['admin', 'models'] as const,
  qr: ['admin', 'qr'] as const,
  restaurant: ['admin', 'restaurant'] as const,
  stats: ['admin', 'stats'] as const,
  analytics: (d: number) => ['admin', 'analytics', d] as const,
};

export const useAdminProducts = () =>
  useQuery({ queryKey: adminKeys.products, queryFn: () => withAdmin((r) => r.listAllProducts()) });
export const useAdminCategories = () =>
  useQuery({ queryKey: adminKeys.categories, queryFn: () => withAdmin((r) => r.listAllCategories()) });
export const useAdminModels = () =>
  useQuery({ queryKey: adminKeys.models, queryFn: () => withAdmin((r) => r.listModels()) });
export const useAdminQrCodes = () =>
  useQuery({ queryKey: adminKeys.qr, queryFn: () => withAdmin((r) => r.listQrCodes()) });
export const useAdminRestaurant = () =>
  useQuery({ queryKey: adminKeys.restaurant, queryFn: () => withAdmin((r) => r.getRestaurantForEdit()) });
export const useDashboardStats = () =>
  useQuery({ queryKey: adminKeys.stats, queryFn: () => withAdmin((r) => r.getDashboardStats()) });
export const useAnalyticsSummary = (days: number) =>
  useQuery({
    queryKey: adminKeys.analytics(days),
    queryFn: () => withAdmin((r) => r.getAnalyticsSummary(days)),
  });

/** Mutação que invalida o painel e o cardápio público após salvar. */
export function useAdminMutation<TInput, TOutput>(fn: (input: TInput) => Promise<TOutput>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      void qc.invalidateQueries({ queryKey: ['products'] });
      void qc.invalidateQueries({ queryKey: ['categories'] });
      void qc.invalidateQueries({ queryKey: ['restaurant'] });
    },
  });
}

export function errorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    const msg = String((e as { message: unknown }).message);
    if (/row-level security|permission denied/i.test(msg)) return 'Seu papel não permite esta ação.';
    if (/duplicate key/i.test(msg)) return 'Já existe um registro com este identificador (slug ou código).';
    return msg;
  }
  return 'Erro inesperado.';
}
