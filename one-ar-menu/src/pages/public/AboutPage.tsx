import { useRestaurant } from '@/hooks/useMenu';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';

export default function AboutPage() {
  const { data: r, isPending, isError, refetch } = useRestaurant();
  useDocumentTitle('Sobre');
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  const contatos = r
    ? ([
        ['Endereço', r.info.address],
        ['Horários', r.info.openingHours],
        ['Telefone', r.info.phone],
        ['Instagram', r.info.instagram],
        ['Site', r.info.website],
      ].filter(([, v]) => v) as Array<[string, string]>)
    : [];
  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 pt-10">
      <p className="eyebrow">Sobre</p>
      <h1 className="mt-2 text-5xl">{isPending ? <Skeleton className="h-12 w-2/3" /> : r?.name}</h1>
      <span className="hairline mt-6 block" />
      <div className="mt-6 whitespace-pre-line text-[1.05rem] leading-relaxed text-muted">
        {r?.info.about ?? r?.description}
      </div>
      {contatos.length > 0 && (
        <dl className="mt-10 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
          {contatos.map(([k, v]) => (
            <div key={k}>
              <dt className="eyebrow mb-1">{k}</dt>
              <dd className="text-text">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
