import { useState, type FormEvent } from 'react';
import { CheckCircle2, Eye, Send, Upload, XCircle } from 'lucide-react';
import { Check, PageHeader, Select, TextInput } from '@/components/admin/Form';
import { ARProductViewer } from '@/components/ar/ARProductViewer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Skeleton } from '@/components/ui/Skeleton';
import { canAtLeast, useAuth } from '@/features/authentication/AuthProvider';
import { firstError, modelFormSchema } from '@/features/administration/schemas';
import {
  errorMessage,
  useAdminModels,
  useAdminMutation,
  useAdminProducts,
} from '@/features/administration/useAdmin';
import { validateAssetFile } from '@/lib/fileValidation';
import { formatBytes, formatDimensions } from '@/lib/format';
import { withAdmin, type AdminArModel } from '@/repositories';
import type { ModelApprovalStatus } from '@/types/domain';

const STATUS: Record<
  ModelApprovalStatus,
  { label: string; tone: 'muted' | 'accent' | 'success' | 'danger' | 'olive' }
> = {
  draft: { label: 'Rascunho', tone: 'muted' },
  processing: { label: 'Processando', tone: 'muted' },
  ready_for_review: { label: 'Aguardando revisão', tone: 'accent' },
  approved: { label: 'Aprovado', tone: 'success' },
  rejected: { label: 'Rejeitado', tone: 'danger' },
};

function Preview({ model }: { model: AdminArModel }) {
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  if (!url) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          variant="secondary"
          icon={<Eye className="size-4" aria-hidden="true" />}
          onClick={() =>
            withAdmin((r) => r.getModelPreviewUrl(model))
              .then(setUrl)
              .catch((e) => setErro(errorMessage(e)))
          }
        >
          Pré-visualizar em 3D
        </Button>
        {erro && <p className="text-xs text-danger">{erro}</p>}
      </div>
    );
  }
  return (
    <ARProductViewer
      productId={model.productId}
      name={model.productName}
      alt={`Pré-visualização do modelo ${model.productName}`}
      glbUrl={url}
      approved /* pré-visualização interna, independente da aprovação */
      scaleVerified={model.scaleVerified}
      scaleLocked={model.scaleLocked}
      dimensions={model.dimensions}
    />
  );
}

export default function Models3DPage() {
  const { role } = useAuth();
  const models = useAdminModels();
  const products = useAdminProducts();
  const podeRevisar = canAtLeast(role, 'manager');
  const [f, setF] = useState({
    productId: '',
    widthCm: '',
    heightCm: '',
    depthCm: '',
    scaleVerified: false,
    scaleLocked: true,
  });
  const [arquivos, setArquivos] = useState<{ glb: File | null; usdz: File | null; poster: File | null }>({
    glb: null,
    usdz: null,
    poster: null,
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [avisos, setAvisos] = useState<string[]>([]);

  const enviar = useAdminMutation(async () => {
    const dados = modelFormSchema.parse(f);
    const glb = arquivos.glb;
    if (!glb) throw new Error('Envie o arquivo GLB.');
    return withAdmin((r) => r.uploadModel({ ...dados, glb, usdz: arquivos.usdz, poster: arquivos.poster }));
  });
  const status = useAdminMutation(({ id, s }: { id: string; s: ModelApprovalStatus }) =>
    withAdmin((r) => r.setModelStatus(id, s)),
  );
  const publicar = useAdminMutation((id: string) => withAdmin((r) => r.publishModel(id)));

  const submeter = async (e: FormEvent) => {
    e.preventDefault();
    const r = modelFormSchema.safeParse(f);
    const novosErros = r.success ? {} : firstError(r.error);
    const novosAvisos: string[] = [];
    if (!arquivos.glb) novosErros.glb = 'Envie o arquivo GLB.';
    for (const [kind, file] of [
      ['glb', arquivos.glb],
      ['usdz', arquivos.usdz],
      ['image', arquivos.poster],
    ] as const) {
      if (!file) continue;
      const v = await validateAssetFile(kind, file);
      if (!v.ok) novosErros[kind === 'image' ? 'poster' : kind] = v.error ?? 'Arquivo inválido.';
      if (v.warning) novosAvisos.push(`${file.name}: ${v.warning}`);
    }
    setErros(novosErros);
    setAvisos(novosAvisos);
    if (Object.keys(novosErros).length) return;
    enviar.mutate(undefined, { onSuccess: () => setArquivos({ glb: null, usdz: null, poster: null }) });
  };

  const erroGeral = models.error ?? enviar.error ?? status.error ?? publicar.error;

  return (
    <>
      <PageHeader
        title="Modelos 3D"
        description="Envie, revise, aprove e publique. O envio nunca publica automaticamente."
      />
      {erroGeral && (
        <Notice tone="error" className="mb-4">
          {errorMessage(erroGeral)}
        </Notice>
      )}
      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <section aria-label="Modelos enviados" className="flex flex-col gap-4">
          {models.isPending && <Skeleton className="h-64" />}
          {models.data?.length === 0 && <p className="text-sm text-muted">Nenhum modelo enviado ainda.</p>}
          {models.data?.map((m) => (
            <article
              key={m.id}
              className="grid gap-4 rounded-sm border border-line p-4 md:grid-cols-[1fr_260px]"
            >
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl">{m.productName}</h2>
                  <Badge tone={STATUS[m.approvalStatus].tone}>{STATUS[m.approvalStatus].label}</Badge>
                  {m.publishedAt && <Badge tone="olive">Publicado</Badge>}
                </div>
                <p className="text-muted">
                  Versão {m.version} · {formatBytes(m.fileSizeBytes)} ·{' '}
                  {m.dimensions ? formatDimensions(m.dimensions) : 'sem medidas'} ·{' '}
                  {m.scaleVerified ? 'escala verificada' : 'escala não verificada'} ·{' '}
                  {m.usdzPath ? 'com USDZ' : 'sem USDZ (iOS usará conversão automática)'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {podeRevisar && m.approvalStatus !== 'approved' && (
                    <Button
                      size="sm"
                      icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
                      onClick={() => status.mutate({ id: m.id, s: 'approved' })}
                    >
                      Aprovar
                    </Button>
                  )}
                  {podeRevisar && m.approvalStatus !== 'rejected' && !m.publishedAt && (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<XCircle className="size-4" aria-hidden="true" />}
                      onClick={() => status.mutate({ id: m.id, s: 'rejected' })}
                    >
                      Rejeitar
                    </Button>
                  )}
                  {podeRevisar && m.approvalStatus === 'approved' && !m.publishedAt && (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Send className="size-4" aria-hidden="true" />}
                      onClick={() => publicar.mutate(m.id)}
                      disabled={publicar.isPending}
                    >
                      Publicar no cardápio
                    </Button>
                  )}
                  {!podeRevisar && (
                    <p className="text-xs text-muted">Aprovação e publicação: gerente ou proprietário.</p>
                  )}
                </div>
              </div>
              <Preview model={m} />
            </article>
          ))}
        </section>

        <form
          onSubmit={submeter}
          className="flex flex-col gap-4 self-start rounded-sm border border-line p-4"
          noValidate
        >
          <h2 className="flex items-center gap-2 text-2xl">
            <Upload className="size-5 text-accent" aria-hidden="true" /> Enviar modelo
          </h2>
          {enviar.isSuccess && <Notice tone="success">Modelo enviado para revisão.</Notice>}
          {avisos.map((a) => (
            <Notice key={a} tone="warning">
              {a}
            </Notice>
          ))}
          <Select
            label="Produto"
            value={f.productId}
            onChange={(e) => setF({ ...f, productId: e.target.value })}
            error={erros.productId}
          >
            <option value="">Selecione…</option>
            {products.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.12em] text-muted">
            GLB (obrigatório)
            <input
              type="file"
              accept=".glb,model/gltf-binary"
              onChange={(e) => setArquivos({ ...arquivos, glb: e.target.files?.[0] ?? null })}
            />
            {erros.glb && <span className="normal-case tracking-normal text-danger">{erros.glb}</span>}
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.12em] text-muted">
            USDZ (iPhone, recomendado)
            <input
              type="file"
              accept=".usdz,model/vnd.usdz+zip"
              onChange={(e) => setArquivos({ ...arquivos, usdz: e.target.files?.[0] ?? null })}
            />
            {erros.usdz && <span className="normal-case tracking-normal text-danger">{erros.usdz}</span>}
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.12em] text-muted">
            Poster (WebP/PNG/JPEG)
            <input
              type="file"
              accept="image/webp,image/png,image/jpeg"
              onChange={(e) => setArquivos({ ...arquivos, poster: e.target.files?.[0] ?? null })}
            />
            {erros.poster && <span className="normal-case tracking-normal text-danger">{erros.poster}</span>}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <TextInput
              label="Largura cm"
              inputMode="decimal"
              value={f.widthCm}
              onChange={(e) => setF({ ...f, widthCm: e.target.value })}
              error={erros.widthCm}
            />
            <TextInput
              label="Profund. cm"
              inputMode="decimal"
              value={f.depthCm}
              onChange={(e) => setF({ ...f, depthCm: e.target.value })}
              error={erros.depthCm}
            />
            <TextInput
              label="Altura cm"
              inputMode="decimal"
              value={f.heightCm}
              onChange={(e) => setF({ ...f, heightCm: e.target.value })}
              error={erros.heightCm}
            />
          </div>
          <Check
            label="Escala travada (tamanho fixo na AR)"
            checked={f.scaleLocked}
            onChange={(e) => setF({ ...f, scaleLocked: e.target.checked })}
          />
          <Check
            label="Escala verificada presencialmente"
            hint="Marque só depois de conferir com régua num aparelho real."
            checked={f.scaleVerified}
            onChange={(e) => setF({ ...f, scaleVerified: e.target.checked })}
          />
          {erros.scaleLocked && <p className="text-xs text-danger">{erros.scaleLocked}</p>}
          <Button type="submit" disabled={enviar.isPending}>
            {enviar.isPending ? 'Enviando…' : 'Enviar para revisão'}
          </Button>
        </form>
      </div>
    </>
  );
}
