import { useEffect, useState, type FormEvent } from 'react';
import { Printer, Plus } from 'lucide-react';
import { PageHeader, TextInput } from '@/components/admin/Form';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Skeleton } from '@/components/ui/Skeleton';
import { publicUrl } from '@/config/env';
import { firstError, qrFormSchema } from '@/features/administration/schemas';
import { errorMessage, useAdminMutation, useAdminQrCodes } from '@/features/administration/useAdmin';
import { withAdmin } from '@/repositories';
import type { QrCode } from '@/types/domain';

function QrSvg({ code }: { code: QrCode }) {
  const [svg, setSvg] = useState('');
  const url = publicUrl(`/q/${code.code}`);
  useEffect(() => {
    import('qrcode')
      .then((qr) => qr.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }))
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [url]);
  return (
    <div
      className="aspect-square w-full bg-white p-2 [&>svg]:size-full"
      role="img"
      aria-label={`QR code ${code.tableLabel ?? code.code}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default function QrCodesPage() {
  const qrs = useAdminQrCodes();
  const [form, setForm] = useState({ tableLabel: '', targetPath: '/cardapio' });
  const [erros, setErros] = useState<Record<string, string>>({});
  const criar = useAdminMutation((v: { tableLabel: string; targetPath: string }) =>
    withAdmin((r) => r.createQrCode({ tableLabel: v.tableLabel || null, targetPath: v.targetPath })),
  );
  const ativar = useAdminMutation(({ id, a }: { id: string; a: boolean }) =>
    withAdmin((r) => r.setQrCodeActive(id, a)),
  );

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const r = qrFormSchema.safeParse(form);
    if (!r.success) return setErros(firstError(r.error));
    setErros({});
    criar.mutate(r.data, { onSuccess: () => setForm({ tableLabel: '', targetPath: '/cardapio' }) });
  };

  return (
    <>
      <PageHeader
        title="QR codes"
        description="Cada código leva a uma URL pública do cardápio (/q/código). Não contém dados sensíveis."
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => window.print()}
            icon={<Printer className="size-4" aria-hidden="true" />}
          >
            Imprimir ativos
          </Button>
        }
      />
      {(qrs.error || criar.error || ativar.error) && (
        <Notice tone="error" className="mb-4">
          {errorMessage(qrs.error ?? criar.error ?? ativar.error)}
        </Notice>
      )}
      <form onSubmit={enviar} className="mb-8 flex flex-wrap items-end gap-3 print:hidden" noValidate>
        <div className="w-48">
          <TextInput
            label="Mesa (opcional)"
            value={form.tableLabel}
            onChange={(e) => setForm({ ...form, tableLabel: e.target.value })}
            error={erros.tableLabel}
          />
        </div>
        <div className="w-56">
          <TextInput
            label="Destino"
            value={form.targetPath}
            onChange={(e) => setForm({ ...form, targetPath: e.target.value })}
            error={erros.targetPath}
          />
        </div>
        <Button
          type="submit"
          icon={<Plus className="size-4" aria-hidden="true" />}
          disabled={criar.isPending}
        >
          Gerar QR code
        </Button>
      </form>
      {qrs.isPending ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3">
          {qrs.data?.map((q) => (
            <article
              key={q.id}
              className={`flex flex-col gap-2 rounded-sm border border-line p-3 ${q.isActive ? '' : 'opacity-50 print:hidden'}`}
            >
              <QrSvg code={q} />
              <p className="font-display text-xl">{q.tableLabel ?? 'Cardápio'}</p>
              <p className="break-all text-xs text-muted">{publicUrl(`/q/${q.code}`)}</p>
              <Button
                size="sm"
                variant="ghost"
                className="print:hidden"
                onClick={() => ativar.mutate({ id: q.id, a: !q.isActive })}
              >
                {q.isActive ? 'Desativar' : 'Reativar'}
              </Button>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
