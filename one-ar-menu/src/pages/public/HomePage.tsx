import { useEffect } from 'react';
import { ArrowRight, ScanLine } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { ProductCard } from '@/components/menu/ProductCard';
import { useProducts, useRestaurant } from '@/hooks/useMenu';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { trackEvent } from '@/features/analytics/track';

export default function HomePage() {
  const restaurant = useRestaurant();
  const products = useProducts();
  useDocumentTitle(restaurant.data?.name);
  useEffect(() => trackEvent('menu_open', { oncePerSession: true }), []);

  if (restaurant.isError)
    return (
      <ErrorState message="Não foi possível carregar o cardápio." onRetry={() => restaurant.refetch()} />
    );

  const r = restaurant.data;
  const destaques = (products.data ?? []).filter((p) => p.isFeatured && p.isAvailable).slice(0, 4);
  const destaque3d = (products.data ?? []).find((p) => p.arModel && p.isAvailable);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        {r?.coverUrl && (
          <img
            src={r.coverUrl}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-35"
            fetchPriority="high"
          />
        )}
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-14 pt-12 md:grid-cols-[1.15fr_1fr] md:items-center md:pb-20 md:pt-20">
          <div className="reveal flex flex-col gap-5">
            {r ? <p className="eyebrow">{r.info.tagline ?? r.name}</p> : <Skeleton className="h-4 w-48" />}
            <h1 className="text-[2.6rem] leading-[1.02] sm:text-6xl">
              {r?.info.heroTitle ?? r?.name ?? <Skeleton className="h-24 w-full" />}
            </h1>
            <span className="hairline" />
            <p className="max-w-[52ch] text-[1.02rem] text-muted">{r?.info.heroSubtitle ?? r?.description}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <ButtonLink
                to="/cardapio"
                size="lg"
                icon={<ArrowRight className="size-5" aria-hidden="true" />}
                className="flex-row-reverse"
              >
                Explorar cardápio
              </ButtonLink>
            </div>
          </div>
          {destaque3d?.arModel?.posterUrl && (
            <figure className="reveal relative mx-auto w-full max-w-sm [animation-delay:120ms]">
              <img
                src={destaque3d.arModel.posterUrl}
                alt={`Modelo 3D demonstrativo: ${destaque3d.name}`}
                className="aspect-square w-full object-contain"
              />
              <figcaption className="mt-2 text-center text-xs text-muted">
                {destaque3d.arModel.isDemo
                  ? 'Modelo demonstrativo. Não representa o alimento real.'
                  : destaque3d.name}
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-6 rounded-sm border border-line bg-bg-alt/70 p-6 md:grid-cols-[auto_1fr_auto] md:items-center">
          <ScanLine className="size-8 text-accent" aria-hidden="true" strokeWidth={1.25} />
          <div>
            <h2 className="text-3xl">{r?.info.experienceTitle ?? 'Veja na sua mesa'}</h2>
            <p className="mt-2 max-w-[60ch] text-sm text-muted">
              {r?.info.experienceText ??
                'Produtos marcados com 3D podem ser vistos em três dimensões e, em celulares compatíveis, posicionados sobre a mesa.'}
            </p>
          </div>
          {destaque3d && (
            <ButtonLink to={`/produto/${destaque3d.slug}`} variant="secondary">
              Experimentar com {destaque3d.name.split(' ')[0]}
            </ButtonLink>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16" aria-labelledby="destaques">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Seleção da casa</p>
            <h2 id="destaques" className="mt-2 text-4xl">
              Destaques
            </h2>
          </div>
          <ButtonLink to="/cardapio" variant="ghost" size="sm">
            Cardápio completo
          </ButtonLink>
        </div>
        {products.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {destaques.map((p) => (
              <ProductCard key={p.id} product={p} layout="tile" />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
