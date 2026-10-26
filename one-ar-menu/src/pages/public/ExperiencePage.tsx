import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { ARProductViewer } from '@/components/ar/ARProductViewer';
import { ArGuidance, ArSteps } from '@/components/ar/ArGuidance';
import { DesktopHandoff } from '@/components/ar/DesktopHandoff';
import { ScaleInfo } from '@/components/ar/ScaleInfo';
import { ButtonLink } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Price } from '@/components/ui/Price';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useProduct } from '@/hooks/useMenu';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { detectDevice } from '@/lib/device';
import { trackEvent } from '@/features/analytics/track';

export default function ExperiencePage() {
  const { slug = '' } = useParams();
  const product = useProduct(slug);
  const device = useMemo(() => detectDevice(), []);
  const p = product.data;
  useDocumentTitle(p ? `${p.name} em 3D` : null);

  if (product.isPending)
    return (
      <div className="mx-auto max-w-3xl px-5 py-8">
        <Skeleton className="h-[60dvh]" />
      </div>
    );
  if (product.isError)
    return <ErrorState message="Não foi possível carregar este produto." onRetry={() => product.refetch()} />;
  if (!p) return <EmptyState title="Produto não encontrado" />;

  const modelo = p.arModel;
  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 pt-6">
      <Link
        to={`/produto/${p.slug}`}
        className="mb-5 inline-flex items-center gap-2 text-sm text-muted hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao produto
      </Link>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Experiência 3D</p>
          <h1 className="mt-1 text-4xl">{p.name}</h1>
        </div>
        <Price cents={p.priceCents} className="text-lg" />
      </header>

      {!modelo ? (
        <Notice
          tone="info"
          title="Sem modelo 3D"
          action={
            <ButtonLink to={`/produto/${p.slug}`} variant="secondary" size="sm">
              Ver detalhes do produto
            </ButtonLink>
          }
        >
          Este produto ainda não tem um modelo 3D aprovado. Veja a foto e as informações na página do produto.
        </Notice>
      ) : (
        <div className="flex flex-col gap-6">
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
            variant="immersive"
            showArButton={device.category !== 'desktop'}
            onModelOpen={() => trackEvent('model_3d_open', { productId: p.id })}
            onArLaunch={() => trackEvent('ar_launch_attempt', { productId: p.id })}
            onArError={() => trackEvent('ar_launch_error', { productId: p.id })}
            onArReturn={() => trackEvent('ar_return', { productId: p.id })}
          />
          {modelo.isDemo && (
            <Notice tone="warning">Modelo demonstrativo. Não representa o alimento real.</Notice>
          )}
          <ScaleInfo
            dimensions={modelo.dimensions}
            scaleVerified={modelo.scaleVerified}
            scaleLocked={modelo.scaleLocked}
          />
          {device.category === 'desktop' ? (
            <>
              <p className="text-sm text-muted">
                No computador, gire e amplie o modelo com o mouse. A realidade aumentada está disponível em
                celulares compatíveis.
              </p>
              <DesktopHandoff path={`/experiencia/${p.slug}`} />
            </>
          ) : (
            <section aria-labelledby="como-usar" className="flex flex-col gap-4 border-t border-line pt-5">
              <h2 id="como-usar" className="text-2xl">
                Como usar
              </h2>
              <ArSteps />
              <ArGuidance device={device} />
            </section>
          )}
          <ButtonLink to="/cardapio" variant="secondary" className="self-start">
            Voltar ao cardápio
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
