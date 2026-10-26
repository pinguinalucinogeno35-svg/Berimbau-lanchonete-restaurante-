// Validação dos formulários do painel (o banco tem constraints equivalentes).
import { z } from 'zod';
import { parsePriceToCents, slugify } from '@/lib/format';

const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use letras minúsculas, números e hífens.')
  .max(80);
const lista = (texto: string) =>
  texto
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

export const productFormSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(2, 'Informe o nome.').max(120),
    slug: z.string().trim().optional(),
    categoryId: z.string().uuid('Escolha uma categoria.'),
    description: z.string().trim().max(2000),
    ingredients: z.string().max(2000),
    allergens: z.string().max(500),
    price: z.string().trim().min(1, 'Informe o preço.'),
    portionDescription: z.string().trim().max(200),
    isAvailable: z.boolean(),
    isPublished: z.boolean(),
    isFeatured: z.boolean(),
    sortOrder: z.coerce.number().int().min(0).max(100000),
  })
  .transform((v, ctx) => {
    const priceCents = parsePriceToCents(v.price);
    if (priceCents === null) {
      ctx.addIssue({ code: 'custom', path: ['price'], message: 'Preço inválido. Exemplo: 12,50' });
      return z.NEVER;
    }
    const s = v.slug?.trim() || slugify(v.name);
    if (!slug.safeParse(s).success) {
      ctx.addIssue({ code: 'custom', path: ['slug'], message: 'Slug inválido.' });
      return z.NEVER;
    }
    return {
      id: v.id,
      name: v.name,
      slug: s,
      categoryId: v.categoryId,
      description: v.description,
      ingredients: lista(v.ingredients),
      allergens: lista(v.allergens).map((a) => a.toLowerCase()),
      priceCents,
      portionDescription: v.portionDescription,
      isAvailable: v.isAvailable,
      isPublished: v.isPublished,
      isFeatured: v.isFeatured,
      sortOrder: v.sortOrder,
    };
  });

export type ProductFormValues = z.input<typeof productFormSchema>;

export const categoryFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, 'Informe o nome.').max(80),
  slug: slug,
  description: z.string().trim().max(500),
  sortOrder: z.coerce.number().int().min(0).max(100000),
  isActive: z.boolean(),
});

const medida = z.coerce
  .number()
  .positive('Informe uma medida maior que zero.')
  .max(500, 'Medida acima de 5 m: confira a unidade (cm).');
export const modelFormSchema = z
  .object({
    productId: z.string().uuid('Escolha o produto.'),
    widthCm: medida,
    heightCm: medida,
    depthCm: medida,
    scaleVerified: z.boolean(),
    scaleLocked: z.boolean(),
  })
  .refine((v) => !v.scaleVerified || v.scaleLocked, {
    path: ['scaleLocked'],
    message: 'Escala verificada precisa ficar travada (ar-scale fixo).',
  });

export const qrFormSchema = z.object({
  tableLabel: z.string().trim().max(40),
  targetPath: z
    .string()
    .trim()
    .regex(/^\/[A-Za-z0-9/_-]*$/, 'Use um caminho interno, como /cardapio')
    .refine((p) => !p.includes('//'), 'Caminho inválido.'),
});

export function firstError(e: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of e.issues) {
    const k = String(issue.path[0] ?? '_');
    out[k] ??= issue.message;
  }
  return out;
}
