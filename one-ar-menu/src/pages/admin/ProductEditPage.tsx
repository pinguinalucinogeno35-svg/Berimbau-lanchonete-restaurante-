import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ExternalLink } from 'lucide-react';
import { Check, PageHeader, Select, TextArea, TextInput } from '@/components/admin/Form';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Skeleton } from '@/components/ui/Skeleton';
import { productFormSchema, firstError, type ProductFormValues } from '@/features/administration/schemas';
import {
  errorMessage,
  useAdminCategories,
  useAdminMutation,
  useAdminProducts,
} from '@/features/administration/useAdmin';
import { validateAssetFile } from '@/lib/fileValidation';
import { withAdmin } from '@/repositories';
import type { Product } from '@/types/domain';

const vazio: ProductFormValues = {
  name: '',
  slug: '',
  categoryId: '',
  description: '',
  ingredients: '',
  allergens: '',
  price: '',
  portionDescription: '',
  isAvailable: true,
  isPublished: false,
  isFeatured: false,
  sortOrder: 0,
};

const paraFormulario = (p: Product): ProductFormValues => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  categoryId: p.categoryId,
  description: p.description,
  ingredients: p.ingredients.join(', '),
  allergens: p.allergens.join(', '),
  price: (p.priceCents / 100).toFixed(2).replace('.', ','),
  portionDescription: p.portionDescription,
  isAvailable: p.isAvailable,
  isPublished: p.isPublished,
  isFeatured: p.isFeatured,
  sortOrder: p.sortOrder,
});

export default function ProductEditPage() {
  const { id } = useParams();
  const novo = !id || id === 'novo';
  const products = useAdminProducts();
  const atual = products.data?.find((p) => p.id === id);
  if (!novo && products.isPending) return <Skeleton className="h-96" />;
  if (!novo && !atual)
    return (
      <Notice tone="error">
        {products.error ? errorMessage(products.error) : 'Produto não encontrado.'}
      </Notice>
    );
  // key: o formulário recomeça quando muda o produto editado (sem copiar props para o estado num efeito).
  return <ProductForm key={atual?.id ?? 'novo'} atual={atual ?? null} />;
}

function ProductForm({ atual }: { atual: Product | null }) {
  const novo = !atual;
  const navigate = useNavigate();
  const categories = useAdminCategories();
  const [v, setV] = useState<ProductFormValues>(() => (atual ? paraFormulario(atual) : vazio));
  const [erros, setErros] = useState<Record<string, string>>({});
  const [foto, setFoto] = useState<File | null>(null);
  const [alt, setAlt] = useState('');

  const salvar = useAdminMutation(async (valores: ProductFormValues) => {
    const parsed = productFormSchema.parse(valores);
    const salvo = await withAdmin((r) => r.saveProduct(parsed));
    if (foto) await withAdmin((r) => r.uploadProductImage(salvo.id, foto, alt || salvo.name));
    return salvo;
  });

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const r = productFormSchema.safeParse(v);
    if (!r.success) return setErros(firstError(r.error));
    if (foto) {
      const val = await validateAssetFile('image', foto);
      if (!val.ok) return setErros({ foto: val.error ?? 'Imagem inválida.' });
    }
    setErros({});
    const salvo = await salvar.mutateAsync(v).catch(() => null);
    if (salvo) navigate(`/admin/produtos/${salvo.id}`, { replace: true });
  };

  const set = <K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) =>
    setV((s) => ({ ...s, [k]: val }));

  return (
    <>
      <PageHeader
        title={novo ? 'Novo produto' : 'Editar produto'}
        actions={
          atual?.isPublished ? (
            <ButtonLink
              to={`/produto/${atual.slug}`}
              target="_blank"
              variant="secondary"
              size="sm"
              icon={<ExternalLink className="size-4" aria-hidden="true" />}
            >
              Ver no cardápio
            </ButtonLink>
          ) : atual ? (
            <span className="text-xs text-muted">Prévia pública disponível após publicar.</span>
          ) : null
        }
      />
      <form onSubmit={enviar} className="grid max-w-3xl gap-5" noValidate>
        {salvar.error && <Notice tone="error">{errorMessage(salvar.error)}</Notice>}
        {salvar.isSuccess && <Notice tone="success">Produto salvo.</Notice>}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label="Nome"
            value={v.name}
            onChange={(e) => set('name', e.target.value)}
            error={erros.name}
            required
          />
          <TextInput
            label="Slug (endereço)"
            value={v.slug}
            onChange={(e) => set('slug', e.target.value)}
            error={erros.slug}
            hint="Em branco = gerado a partir do nome."
          />
          <Select
            label="Categoria"
            value={v.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
            error={erros.categoryId}
          >
            <option value="">Selecione…</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.isActive ? '' : ' (inativa)'}
              </option>
            ))}
          </Select>
          <TextInput
            label="Preço (R$)"
            inputMode="decimal"
            value={v.price}
            onChange={(e) => set('price', e.target.value)}
            error={erros.price}
            placeholder="0,00"
          />
        </div>
        <TextArea
          label="Descrição"
          value={v.description}
          onChange={(e) => set('description', e.target.value)}
          error={erros.description}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextArea
            label="Ingredientes"
            value={v.ingredients}
            onChange={(e) => set('ingredients', e.target.value)}
            hint="Separe por vírgula."
          />
          <TextArea
            label="Alergênicos"
            value={v.allergens}
            onChange={(e) => set('allergens', e.target.value)}
            hint="Ex.: glúten, leite, ovo, amendoim."
          />
          <TextInput
            label="Porção"
            value={v.portionDescription}
            onChange={(e) => set('portionDescription', e.target.value)}
          />
          <TextInput
            label="Ordem"
            type="number"
            min={0}
            value={String(v.sortOrder)}
            onChange={(e) => set('sortOrder', Number(e.target.value))}
            error={erros.sortOrder}
          />
        </div>
        <div className="grid gap-3 rounded-sm border border-line p-4 sm:grid-cols-3">
          <Check
            label="Disponível"
            checked={v.isAvailable}
            onChange={(e) => set('isAvailable', e.target.checked)}
          />
          <Check
            label="Publicado"
            hint="Aparece no cardápio"
            checked={v.isPublished}
            onChange={(e) => set('isPublished', e.target.checked)}
          />
          <Check
            label="Destaque"
            checked={v.isFeatured}
            onChange={(e) => set('isFeatured', e.target.checked)}
          />
        </div>
        <fieldset className="grid gap-4 rounded-sm border border-line p-4">
          <legend className="px-1 text-xs uppercase tracking-[0.12em] text-muted">Nova fotografia</legend>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
            aria-label="Arquivo de imagem"
          />
          {erros.foto && <p className="text-xs text-danger">{erros.foto}</p>}
          <TextInput
            label="Texto alternativo"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            hint="Descreva a foto para leitores de tela."
          />
        </fieldset>
        <div className="flex gap-3">
          <Button type="submit" disabled={salvar.isPending}>
            {salvar.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
          <ButtonLink to="/admin/produtos" variant="ghost">
            Cancelar
          </ButtonLink>
        </div>
      </form>
    </>
  );
}
