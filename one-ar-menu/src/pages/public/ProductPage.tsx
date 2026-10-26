import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Box, ScanLine } from 'lucide-react';
import { ARProductViewer } from '@/components/ar/ARProductViewer';
import { ScaleInfo } from '@/components/ar/ScaleInfo';
import { ProductCard } from '@/components/menu/ProductCard';
import { ProductImage } from '@/components/product/ProductImage';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Price } from '@/components/ui/Price';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useCategories, useProduct, useProducts } from '@/hooks/useMenu';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { relatedProducts } from '@/lib/search';
import { trackEvent } from '@/features/analytics/track';
import { cn } from '@/lib/cn';

export default function ProductPage() {
  const { slug = '' } = useParams();
  // key: ao trocar de produto, o estado da página (aba foto/3D) recomeça do zero.
  return <ProductDetails key={slug} slug={slug} />;
}

function ProductDetails({ slug }: { slug: string }) {
  const product = useProduct(slug);
  const all = useProducts();
  const categories = useCategories();
  const [aba, setAba] = useState<'foto' | '3d'>('foto');
  const p = product.data;
  useDocumentTitle(p?.name);

  useEffect(() => {
    if (p) trackEvent('product_view', { productId: p.id, oncePerSession: true });
  }, [p]);

  if (product.isPending) {
    return (
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:grid-cols-2">
        <Skeleton className="aspect-square" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }
  if (product.isError)
    return <ErrorState message="Não foi possível carregar este produto." onRetry={() => product.refetch()} />;
  if (!p) {
    return (
      <EmptyState title="Produto não encontrado">
        <p className="mb-4">Ele pode ter saído do cardápio.</p>
        <ButtonLink to="/cardapio" variant="secondary">
          Voltar ao cardápio
        </ButtonLink>
      </EmptyState>
    );
  }

  const categoria = categories.data?.find((c) => c.id === p.categoryId);
  const modelo = p.arModel;
  const relacionados = all.data ? relatedProducts(all.data, p) : [];
  const temFoto = p.media.some((m) => m.type === 'image');

  return (
    <article className="mx-auto max-w-6xl px-5 pb-16 pt-6">
      <Link to="/cardapio" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-text">
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao cardápio
      </Link>

      <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:gap-12">
        <div className="flex flex-col gap-3">
          {modelo && (
            <div
              role="tablist"
              aria-label="Visualização"
              className="flex gap-1 self-start rounded-sm border border-line p-1"
            >
              {(['foto', '3d'] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={aba === t}
                  onClick={() => setAba(t)}
                  className={cn(
                    'h-9 rounded-sm px-4 text-sm transition-colors',
                    aba === t ? 'bg-accent text-ink' : 'text-muted hover:text-text',
                  )}
                >
                  {t === 'foto' ? (temFoto ? 'Foto' : 'Imagem') : 'Ver em 3D'}
                </button>
              ))}
            </div>
          )}
          {aba === '3d' && modelo ? (
            <ARProductViewer
              productId={p.id}
              name={p.name}
              alt={`Modelo 3D de ${p.name}`}
              glbUrl={modelo.glbUrl}
              usdzUrl={modelo.usdzUrl}
              posterUrl={modelo.posterUrl}
              dimensions={modelo.dimensions}
              approved={modelo.approvalStatus === 'approved'}
              scaleVerified={modelo.scaleVerified}
              scaleLocked={modelo.scaleLocked}
              isDemo={modelo.isDemo}
              onModelOpen={() => trackEvent('model_3d_open', { productId: p.id })}
            />
          ) : (
            <div className="aspect-square overflow-hidden rounded-sm border border-line bg-bg-alt">
              <ProductImage product={p} eager />
            </div>
          )}
          {modelo?.isDemo && (
            <p className="text-xs text-muted">Modelo demonstrativo. Não representa o alimento real.</p>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            {categoria && <p className="eyebrow">{categoria.name}</p>}
            {p.isFeatured && <Badge tone="accent">Destaque</Badge>}
            {modelo && (
              <Badge tone="olive" icon={<Box className="size-3" aria-hidden="true" />}>
                3D
              </Badge>
            )}
          </div>
          <h1 className="text-[2.6rem] leading-[1.02] sm:text-5xl">{p.name}</h1>
          <Price cents={p.priceCents} className="text-xl" />
          {!p.isAvailable && (
            <Notice tone="warning" title="Indisponível no momento">
              Este item não está sendo servido agora.
            </Notice>
          )}
          <p className="text-[1.02rem] leading-relaxed text-muted">{p.description}</p>

          {modelo && (
            <div className="flex flex-col gap-3 rounded-sm border border-line p-4">
              <ButtonLink
                to={`/experiencia/${p.slug}`}
                size="lg"
                icon={<ScanLine className="size-5" aria-hidden="true" />}
                className="w-full"
              >
                Ver na minha mesa
              </ButtonLink>
              <ScaleInfo
                dimensions={modelo.dimensions}
                scaleVerified={modelo.scaleVerified}
                scaleLocked={modelo.scaleLocked}
              />
            </div>
          )}

          <dl className="grid gap-4 border-t border-line pt-5 text-sm">
            {p.portionDescription && (
              <div>
                <dt className="eyebrow mb-1">Porção</dt>
                <dd className="text-text">{p.portionDescription}</dd>
              </div>
            )}
            <div>
              <dt className="eyebrow mb-1">Ingredientes</dt>
              <dd className="text-text">
                {p.ingredients.length ? p.ingredients.join(', ') : 'Consulte a equipe.'}
              </dd>
            </div>
            <div>
              <dt className="eyebrow mb-1">Alergênicos</dt>
              <dd className="text-text">
                {p.allergens.length ? (
                  <>
                    Contém: <strong className="font-semibold">{p.allergens.join(', ')}</strong>.
                  </>
                ) : (
                  'Nenhum alergênico cadastrado. Em caso de alergia, confirme com a equipe.'
                )}
              </dd>
            </div>
          </dl>
          <Button variant="ghost" size="sm" className="self-start" onClick={() => history.back()}>
            Voltar
          </Button>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-16" aria-labelledby="relacionados">
          <h2 id="relacionados" className="mb-5 text-3xl">
            Você também pode gostar
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {relacionados.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
