import { categoryFormSchema, modelFormSchema, productFormSchema, qrFormSchema } from './schemas';
import { canAtLeast } from '@/features/authentication/AuthProvider';

const produto = {
  name: 'Coxinha',
  slug: '',
  categoryId: '00000000-0000-4000-8000-000000000101',
  description: 'Teste',
  ingredients: 'frango, massa',
  allergens: 'Glúten, Leite',
  price: '9,90',
  portionDescription: '1 unidade',
  isAvailable: true,
  isPublished: false,
  isFeatured: false,
  sortOrder: 0,
};

describe('formulário de produto', () => {
  it('converte preço, gera slug e normaliza listas', () => {
    const r = productFormSchema.parse(produto);
    expect(r).toMatchObject({
      priceCents: 990,
      slug: 'coxinha',
      ingredients: ['frango', 'massa'],
      allergens: ['glúten', 'leite'],
    });
  });
  it('recusa preço inválido e categoria ausente', () => {
    expect(productFormSchema.safeParse({ ...produto, price: 'abc' }).success).toBe(false);
    expect(productFormSchema.safeParse({ ...produto, categoryId: '' }).success).toBe(false);
  });
  it('recusa slug com caracteres inválidos', () =>
    expect(productFormSchema.safeParse({ ...produto, slug: 'Com Espaço' }).success).toBe(false));
});

it('categoria exige slug válido', () => {
  expect(
    categoryFormSchema.safeParse({
      name: 'Bebidas',
      slug: 'bebidas',
      description: '',
      sortOrder: 1,
      isActive: true,
    }).success,
  ).toBe(true);
  expect(
    categoryFormSchema.safeParse({
      name: 'Bebidas',
      slug: 'Bebidas!',
      description: '',
      sortOrder: 1,
      isActive: true,
    }).success,
  ).toBe(false);
});

describe('formulário de modelo 3D', () => {
  const base = {
    productId: '00000000-0000-4000-8000-000000000201',
    widthCm: '6.6',
    heightCm: '8.6',
    depthCm: '6.6',
    scaleVerified: false,
    scaleLocked: true,
  };
  it('aceita medidas em centímetros', () => expect(modelFormSchema.safeParse(base).success).toBe(true));
  it('recusa medida zero ou absurda', () => {
    expect(modelFormSchema.safeParse({ ...base, widthCm: '0' }).success).toBe(false);
    expect(modelFormSchema.safeParse({ ...base, heightCm: '860' }).success).toBe(false);
  });
  it('escala verificada exige escala travada', () =>
    expect(modelFormSchema.safeParse({ ...base, scaleVerified: true, scaleLocked: false }).success).toBe(
      false,
    ));
});

it('QR code só aceita caminhos internos', () => {
  expect(qrFormSchema.safeParse({ tableLabel: 'Mesa 1', targetPath: '/cardapio' }).success).toBe(true);
  expect(qrFormSchema.safeParse({ tableLabel: '', targetPath: 'https://evil.example' }).success).toBe(false);
  expect(qrFormSchema.safeParse({ tableLabel: '', targetPath: '//evil.example' }).success).toBe(false);
});

it('hierarquia de papéis na interface', () => {
  expect(canAtLeast('owner', 'manager')).toBe(true);
  expect(canAtLeast('manager', 'manager')).toBe(true);
  expect(canAtLeast('editor', 'manager')).toBe(false);
  expect(canAtLeast(null, 'editor')).toBe(false);
});
