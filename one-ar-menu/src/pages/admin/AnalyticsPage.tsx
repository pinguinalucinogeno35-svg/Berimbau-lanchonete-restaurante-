import { useState } from 'react';
import { PageHeader } from '@/components/admin/Form';
import { Notice } from '@/components/ui/Notice';
import { Skeleton } from '@/components/ui/Skeleton';
import { errorMessage, useAnalyticsSummary } from '@/features/administration/useAdmin';

const NOMES: Record<string, string> = {
  menu_open: 'Aberturas do cardápio',
  product_view: 'Produtos vistos',
  model_3d_open: 'Modelos 3D abertos',
  ar_launch_attempt: 'Tentativas de AR',
  ar_launch_error: 'Erros ao abrir AR',
  ar_return: 'Retornos da AR',
};

export default function AnalyticsPage() {
  const [dias, setDias] = useState(30);
  const { data, isPending, error } = useAnalyticsSummary(dias);
  const max = Math.max(1, ...(data?.byType.map((e) => e.total) ?? [0]));
  return (
    <>
      <PageHeader
        title="Métricas"
        description="Uso do cardápio, sem dados pessoais. Tentativa de AR não significa que o prato foi posicionado."
        actions={
          <select
            aria-label="Período"
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="h-9 rounded-sm border border-line bg-bg px-2 text-sm"
          >
            <option value={7}>7 dias</option>
            <option value={30}>30 dias</option>
            <option value={90}>90 dias</option>
          </select>
        }
      />
      {error && <Notice tone="error">{errorMessage(error)}</Notice>}
      {isPending ? (
        <Skeleton className="h-64" />
      ) : data && data.byType.length === 0 ? (
        <p className="text-sm text-muted">Nenhum evento registrado no período.</p>
      ) : data ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-2xl">Eventos</h2>
            <ul className="flex flex-col gap-2">
              {data.byType.map((e) => (
                <li key={e.type} className="text-sm">
                  <div className="flex justify-between">
                    <span>{NOMES[e.type] ?? e.type}</span>
                    <span className="tabular-nums">{e.total}</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-line">
                    <div className="h-full bg-accent" style={{ width: `${(e.total / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="mb-3 text-2xl">Produtos mais vistos</h2>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.1em] text-muted">
                <tr>
                  <th className="py-2">Produto</th>
                  <th>Visualizações</th>
                  <th>3D</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p) => (
                  <tr key={p.productId} className="border-t border-line">
                    <td className="py-2">{p.name}</td>
                    <td className="tabular-nums">{p.views}</td>
                    <td className="tabular-nums">{p.opens3d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section>
            <h2 className="mb-3 text-2xl">QR codes mais usados</h2>
            {data.topQrCodes.length === 0 ? (
              <p className="text-sm text-muted">Sem acessos por QR code no período.</p>
            ) : (
              <ul className="text-sm">
                {data.topQrCodes.map((q) => (
                  <li key={q.qrCodeId} className="flex justify-between border-t border-line py-2">
                    <span>{q.label}</span>
                    <span className="tabular-nums">{q.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
