import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { PageHeader } from '@/components/admin/Form';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice } from '@/lib/format';
import { withAdmin } from '@/repositories';
import type { Product } from '@/types/domain';
import {
  errorMessage,
  useAdminCategories,
  useAdminMutation,
  useAdminProducts,
} from '@/features/administration/useAdmin';

const toInput = (p: Product) => ({
  id: p.id,
  categoryId: p.categoryId,
  name: p.name,
  slug: p.slug,
  description: p.description,
  ingredients: p.ingredients,
  allergens: p.allergens,
  priceCents: p.priceCents,
  portionDescription: p.portionDescription,
  isAvailable: p.isAvailable,
  isPublished: p.isPublished,
  isFeatured: p.isFeatured,
  sortOrder: p.sortOrder,
});

export default function ProductsPage() {
  const products = useAdminProducts();
  const categories = useAdminCategories();
  const salvar = useAdminMutation((p: Product) => withAdmin((r) => r.saveProduct(toInput(p))));
  const alternar = (p: Product, campo: 'isAvailable' | 'isPublished' | 'isFeatured') =>
    salvar.mutate({ ...p, [campo]: !p[campo] });

  return (
    <>
      <PageHeader
        title="Produtos"
        actions={
          <ButtonLink
            to="/admin/produtos/novo"
            size="sm"
            icon={<Plus className="size-4" aria-hidden="true" />}
          >
            Novo produto
          </ButtonLink>
        }
      />
      {(products.error || salvar.error) && (
        <Notice tone="error" className="mb-4">
          {errorMessage(products.error ?? salvar.error)}
        </Notice>
      )}
      {products.isPending ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="overflow-x-auto rounded-sm border border-line">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-bg text-xs uppercase tracking-[0.1em] text-muted">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">3D</th>
                <th className="px-4 py-3">Disponível</th>
                <th className="px-4 py-3">Publicado</th>
                <th className="px-4 py-3">Destaque</th>
              </tr>
            </thead>
            <tbody>
              {products.data?.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/produtos/${p.id}`}
                      className="font-medium text-text hover:text-accent-strong"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {categories.data?.find((c) => c.id === p.categoryId)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatPrice(p.priceCents)}</td>
                  <td className="px-4 py-3">
                    {p.arModel ? (
                      <Badge tone="olive">Publicado</Badge>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  {(['isAvailable', 'isPublished', 'isFeatured'] as const).map((campo) => (
                    <td key={campo} className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="size-4 accent-[var(--one-accent)]"
                        checked={p[campo]}
                        disabled={salvar.isPending}
                        onChange={() => alternar(p, campo)}
                        aria-label={`${campo === 'isAvailable' ? 'Disponível' : campo === 'isPublished' ? 'Publicado' : 'Destaque'}: ${p.name}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
