import { PageHeader, StatCard } from '@/components/admin/Form';
import { Notice } from '@/components/ui/Notice';
import { Skeleton } from '@/components/ui/Skeleton';
import { ButtonLink } from '@/components/ui/Button';
import { errorMessage, useDashboardStats } from '@/features/administration/useAdmin';

export default function DashboardPage() {
  const { data, isPending, error } = useDashboardStats();
  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Situação do cardápio e uso nos últimos 30 dias."
        actions={
          <ButtonLink to="/" variant="secondary" size="sm">
            Ver cardápio
          </ButtonLink>
        }
      />
      {error && <Notice tone="error">{errorMessage(error)}</Notice>}
      {isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Produtos cadastrados" value={data.totalProducts} />
            <StatCard label="Publicados" value={data.publishedProducts} />
            <StatCard label="Indisponíveis" value={data.unavailableProducts} />
            <StatCard label="Com modelo 3D publicado" value={data.productsWith3d} />
            <StatCard label="Modelos aguardando aprovação" value={data.modelsAwaitingReview} />
            <StatCard
              label="Aberturas do cardápio"
              value={data.events.menu_open ?? 0}
              hint="Uma por visita"
            />
            <StatCard label="Aberturas de produtos" value={data.events.product_view ?? 0} />
            <StatCard
              label="Tentativas de AR"
              value={data.events.ar_launch_attempt ?? 0}
              hint="Tentativa não significa posicionamento concluído"
            />
          </div>
          {Object.keys(data.events).length === 0 && (
            <p className="mt-4 text-sm text-muted">
              Ainda não há eventos de uso registrados (ou seu papel não permite ver métricas).
            </p>
          )}
        </>
      ) : null}
    </>
  );
}
