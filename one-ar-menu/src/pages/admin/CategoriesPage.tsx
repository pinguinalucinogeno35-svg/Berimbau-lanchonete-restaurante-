import { useState, type FormEvent } from 'react';
import { Check, PageHeader, TextInput } from '@/components/admin/Form';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Skeleton } from '@/components/ui/Skeleton';
import { categoryFormSchema, firstError } from '@/features/administration/schemas';
import { errorMessage, useAdminCategories, useAdminMutation } from '@/features/administration/useAdmin';
import { slugify } from '@/lib/format';
import { withAdmin, type CategoryInput } from '@/repositories';

const novo = { name: '', slug: '', description: '', sortOrder: 0, isActive: true };

export default function CategoriesPage() {
  const categories = useAdminCategories();
  const [form, setForm] = useState<CategoryInput>(novo);
  const [erros, setErros] = useState<Record<string, string>>({});
  const salvar = useAdminMutation((c: CategoryInput) => withAdmin((r) => r.saveCategory(c)));

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const r = categoryFormSchema.safeParse({ ...form, slug: form.slug || slugify(form.name) });
    if (!r.success) return setErros(firstError(r.error));
    setErros({});
    salvar.mutate(r.data, { onSuccess: () => setForm(novo) });
  };
  const mover = (id: string, delta: number) => {
    const c = categories.data?.find((x) => x.id === id);
    if (c) salvar.mutate({ ...c, sortOrder: Math.max(0, c.sortOrder + delta) });
  };

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Crie, edite, ordene e desative categorias. Categorias inativas somem do cardápio."
      />
      {(categories.error || salvar.error) && (
        <Notice tone="error" className="mb-4">
          {errorMessage(categories.error ?? salvar.error)}
        </Notice>
      )}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {categories.isPending ? (
          <Skeleton className="h-64" />
        ) : (
          <ul className="divide-y divide-line rounded-sm border border-line">
            {categories.data?.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="w-8 text-xs tabular-nums text-muted">{c.sortOrder}</span>
                <button
                  type="button"
                  className="flex-1 text-left font-medium hover:text-accent-strong"
                  onClick={() => setForm(c)}
                >
                  {c.name} {!c.isActive && <span className="text-xs text-muted">(inativa)</span>}
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => mover(c.id, -1)}
                  aria-label={`Subir ${c.name}`}
                >
                  Subir
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => mover(c.id, 1)}
                  aria-label={`Descer ${c.name}`}
                >
                  Descer
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => salvar.mutate({ ...c, isActive: !c.isActive })}
                >
                  {c.isActive ? 'Desativar' : 'Ativar'}
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={enviar} className="flex flex-col gap-4 rounded-sm border border-line p-4" noValidate>
          <h2 className="text-2xl">{form.id ? 'Editar categoria' : 'Nova categoria'}</h2>
          <TextInput
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={erros.name}
          />
          <TextInput
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            error={erros.slug}
            hint="Em branco = gerado do nome."
          />
          <TextInput
            label="Descrição"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextInput
            label="Ordem"
            type="number"
            min={0}
            value={String(form.sortOrder)}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
          />
          <Check
            label="Ativa"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={salvar.isPending}>
              Salvar
            </Button>
            {form.id && (
              <Button variant="ghost" onClick={() => setForm(novo)}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
