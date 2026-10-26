import { useState, type FormEvent } from 'react';
import { PageHeader, TextArea, TextInput } from '@/components/admin/Form';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Skeleton } from '@/components/ui/Skeleton';
import { errorMessage, useAdminMutation, useAdminRestaurant } from '@/features/administration/useAdmin';
import { withAdmin } from '@/repositories';
import type { PublicInfo, Restaurant, ThemeSettings } from '@/types/domain';

const HEX = /^#[0-9a-fA-F]{6}$/;
type Editavel = Pick<
  Restaurant,
  'name' | 'description' | 'primaryColor' | 'secondaryColor' | 'theme' | 'info'
>;

const CAMPOS_INFO: Array<[keyof PublicInfo, string, boolean?]> = [
  ['tagline', 'Linha de apoio'],
  ['heroTitle', 'Título da página inicial'],
  ['heroSubtitle', 'Texto da página inicial', true],
  ['about', 'Sobre (história)', true],
  ['address', 'Endereço'],
  ['openingHours', 'Horários'],
  ['phone', 'Telefone'],
  ['whatsapp', 'WhatsApp'],
  ['instagram', 'Instagram'],
  ['website', 'Site'],
  ['experienceTitle', 'Título da experiência AR'],
  ['experienceText', 'Texto da experiência AR', true],
];

const CORES: Array<[keyof NonNullable<ThemeSettings['colors']>, string]> = [
  ['bg', 'Fundo'],
  ['bgAlt', 'Fundo alternativo'],
  ['surface', 'Superfície clara'],
  ['accent', 'Destaque'],
  ['olive', 'Cor secundária'],
  ['text', 'Texto claro'],
  ['textDark', 'Texto escuro'],
];

export default function SettingsPage() {
  const r = useAdminRestaurant();
  if (r.error) return <Notice tone="error">{errorMessage(r.error)}</Notice>;
  if (r.isPending || !r.data) return <Skeleton className="h-96" />;
  const d = r.data;
  return (
    <SettingsForm
      key={d.id}
      inicial={{
        name: d.name,
        description: d.description,
        primaryColor: d.primaryColor,
        secondaryColor: d.secondaryColor,
        theme: d.theme,
        info: d.info,
      }}
    />
  );
}

function SettingsForm({ inicial }: { inicial: Editavel }) {
  const [v, setV] = useState<Editavel>(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const salvar = useAdminMutation((d: Editavel) => withAdmin((r) => r.saveRestaurant(d)));
  const imagem = useAdminMutation(({ kind, file }: { kind: 'logo' | 'cover'; file: File }) =>
    withAdmin((r) => r.uploadBrandingImage(kind, file)),
  );

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const cores = Object.values(v.theme.colors ?? {}).filter(Boolean) as string[];
    if (
      cores.some((c) => !HEX.test(c)) ||
      [v.primaryColor, v.secondaryColor].some((c) => c && !HEX.test(c))
    ) {
      return setErro('Use cores no formato #RRGGBB.');
    }
    setErro(null);
    salvar.mutate(v);
  };
  const setInfo = (k: keyof PublicInfo, val: string) =>
    setV({ ...v, info: { ...v.info, [k]: val || undefined } });
  const setCor = (k: keyof NonNullable<ThemeSettings['colors']>, val: string) =>
    setV({ ...v, theme: { ...v.theme, colors: { ...v.theme.colors, [k]: val || undefined } } });

  return (
    <>
      <PageHeader title="Configurações" description="Identidade e informações públicas do restaurante." />
      <form onSubmit={enviar} className="grid max-w-4xl gap-8" noValidate>
        {(erro || salvar.error || imagem.error) && (
          <Notice tone="error">{erro ?? errorMessage(salvar.error ?? imagem.error)}</Notice>
        )}
        {salvar.isSuccess && <Notice tone="success">Configurações salvas.</Notice>}
        <section className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Nome oficial"
            value={v.name}
            onChange={(e) => setV({ ...v, name: e.target.value })}
          />
          <TextInput
            label="Descrição curta"
            value={v.description}
            onChange={(e) => setV({ ...v, description: e.target.value })}
          />
          {CAMPOS_INFO.map(([k, label, longo]) =>
            longo ? (
              <TextArea
                key={k}
                label={label}
                value={v.info[k] ?? ''}
                onChange={(e) => setInfo(k, e.target.value)}
              />
            ) : (
              <TextInput
                key={k}
                label={label}
                value={v.info[k] ?? ''}
                onChange={(e) => setInfo(k, e.target.value)}
              />
            ),
          )}
        </section>
        <section className="grid gap-4 rounded-sm border border-line p-4 sm:grid-cols-3">
          <h2 className="text-2xl sm:col-span-3">Tema</h2>
          {CORES.map(([k, label]) => (
            <TextInput
              key={k}
              label={label}
              placeholder="#RRGGBB"
              value={v.theme.colors?.[k] ?? ''}
              onChange={(e) => setCor(k, e.target.value)}
            />
          ))}
          <TextInput
            label="Fonte de títulos"
            placeholder="Cormorant Garamond"
            value={v.theme.fonts?.display ?? ''}
            onChange={(e) =>
              setV({
                ...v,
                theme: { ...v.theme, fonts: { ...v.theme.fonts, display: e.target.value || undefined } },
              })
            }
          />
          <TextInput
            label="Fonte de textos"
            placeholder="DM Sans"
            value={v.theme.fonts?.body ?? ''}
            onChange={(e) =>
              setV({
                ...v,
                theme: { ...v.theme, fonts: { ...v.theme.fonts, body: e.target.value || undefined } },
              })
            }
          />
          <p className="text-xs text-muted sm:col-span-3">
            Fontes diferentes das padrão precisam ser incluídas no index.html (Google Fonts ou arquivos
            próprios).
          </p>
        </section>
        <section className="grid gap-4 rounded-sm border border-line p-4 sm:grid-cols-2">
          <h2 className="text-2xl sm:col-span-2">Imagens</h2>
          {(['logo', 'cover'] as const).map((kind) => (
            <label key={kind} className="flex flex-col gap-2 text-xs uppercase tracking-[0.12em] text-muted">
              {kind === 'logo' ? 'Logomarca' : 'Imagem principal (hero)'}
              <input
                type="file"
                accept="image/png,image/webp,image/jpeg,image/avif"
                disabled={imagem.isPending}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) imagem.mutate({ kind, file });
                }}
              />
            </label>
          ))}
          {imagem.isSuccess && <p className="text-xs text-success">Imagem atualizada.</p>}
        </section>
        <Button type="submit" className="justify-self-start" disabled={salvar.isPending}>
          {salvar.isPending ? 'Salvando…' : 'Salvar configurações'}
        </Button>
      </form>
    </>
  );
}
