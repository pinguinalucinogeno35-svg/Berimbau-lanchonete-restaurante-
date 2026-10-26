import { useDeferredValue, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { CategoryNav } from '@/components/menu/CategoryNav';
import { FilterChips } from '@/components/menu/FilterChips';
import { ProductCard } from '@/components/menu/ProductCard';
import { SearchField } from '@/components/menu/SearchField';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useCategories, useProducts } from '@/hooks/useMenu';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { filterProducts, sortProducts } from '@/lib/search';
import { trackEvent } from '@/features/analytics/track';

export default function MenuPage() {
  const [params, setParams] = useSearchParams();
  const categories = useCategories();
  const products = useProducts();
  useDocumentTitle('Cardápio');
  useEffect(() => trackEvent('menu_open', { oncePerSession: true }), []);

  const categoriaSlug = params.get('categoria');
  const query = params.get('q') ?? '';
  const so3d = params.get('3d') === '1';
  const soDisponiveis = params.get('disponiveis') === '1';
  const busca = useDeferredValue(query);

  const categoriaAtiva = categories.data?.find((c) => c.slug === categoriaSlug)?.id ?? null;
  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };

  const lista = useMemo(
    () =>
      sortProducts(
        filterProducts(products.data ?? [], {
          categoryId: categoriaAtiva,
          query: busca,
          onlyWith3d: so3d,
          onlyAvailable: soDisponiveis,
        }),
      ),
    [products.data, categoriaAtiva, busca, so3d, soDisponiveis],
  );

  const grupos = useMemo(() => {
    const cats = categories.data ?? [];
    if (categoriaAtiva || busca) return [{ id: 'resultado', name: '', items: lista }];
    return cats
      .map((c) => ({ id: c.id, name: c.name, items: lista.filter((p) => p.categoryId === c.id) }))
      .filter((g) => g.items.length);
  }, [categories.data, categoriaAtiva, busca, lista]);

  if (categories.isError || products.isError) {
    return (
      <ErrorState
        message="Não foi possível carregar o cardápio."
        onRetry={() => void Promise.all([categories.refetch(), products.refetch()])}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-8">
      <header className="mb-6">
        <p className="eyebrow">Cardápio</p>
        <h1 className="mt-2 text-5xl">Nosso cardápio</h1>
      </header>

      <div className="sticky top-16 z-20 -mx-5 mb-6 flex flex-col gap-3 bg-bg/95 px-5 pb-3 pt-2 backdrop-blur-md">
        {categories.data ? (
          <CategoryNav
            categories={categories.data}
            active={categoriaAtiva}
            onChange={(id) => update({ categoria: categories.data.find((c) => c.id === id)?.slug ?? null })}
          />
        ) : (
          <Skeleton className="h-11 w-full" />
        )}
        <SearchField value={query} onChange={(v) => update({ q: v || null })} />
        <FilterChips
          options={[
            { key: '3d', label: 'Com 3D', active: so3d },
            { key: 'disponiveis', label: 'Disponíveis', active: soDisponiveis },
          ]}
          onToggle={(k) => update({ [k]: params.get(k) === '1' ? null : '1' })}
        />
      </div>

      {products.isPending ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <EmptyState title="Nada encontrado">
          <p>Tente outro termo ou remova os filtros.</p>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-10" aria-live="polite">
          {grupos.map((g) => (
            <section key={g.id} aria-label={g.name || 'Resultados'}>
              {g.name && <h2 className="mb-4 text-3xl">{g.name}</h2>}
              <div className="grid gap-3 md:grid-cols-2">
                {g.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
