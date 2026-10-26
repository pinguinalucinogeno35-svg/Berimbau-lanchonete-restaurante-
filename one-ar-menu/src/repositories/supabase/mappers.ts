// Conversão entre linhas do banco (snake_case) e o domínio do app.
import type {
  ArModel,
  Category,
  ModelApprovalStatus,
  Product,
  ProductMedia,
  PublicInfo,
  QrCode,
  Restaurant,
  ThemeSettings,
} from '@/types/domain';

export type StorageUrlResolver = (path: string | null) => string | null;

/** "/demo/x.glb" → caminho do app; "bucket/chave" → URL pública do bucket. */
export function makePublicUrlResolver(supabaseUrl: string): StorageUrlResolver {
  return (path) => {
    if (!path) return null;
    if (path.startsWith('/') || /^https:\/\//.test(path)) return path;
    const [bucket, ...resto] = path.split('/');
    if (!bucket || !resto.length) return null;
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${resto.map(encodeURIComponent).join('/')}`;
  };
}

export interface RestaurantRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_path: string | null;
  cover_path: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  theme_settings: ThemeSettings | null;
  public_info: PublicInfo | null;
  is_active: boolean;
}

export interface CategoryRow {
  id: string;
  restaurant_id: string;
  name: string;
  slug: string;
  description: string;
  image_path: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface MediaRow {
  id: string;
  media_type: 'image' | 'poster' | 'video';
  storage_path: string;
  alt_text: string;
  sort_order: number;
  is_published: boolean;
}

export interface ArModelRow {
  id: string;
  product_id: string;
  glb_path: string;
  usdz_path: string | null;
  poster_path: string | null;
  width_cm: number | string | null;
  height_cm: number | string | null;
  depth_cm: number | string | null;
  scale_verified: boolean;
  scale_locked: boolean;
  approval_status: ModelApprovalStatus;
  file_size_bytes: number | null;
  version: number;
  published_at: string | null;
  created_at?: string;
}

export interface ProductRow {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  ingredients: string[] | null;
  allergens: string[] | null;
  price_cents: number;
  portion_description: string;
  is_available: boolean;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  product_media?: MediaRow[] | null;
  product_ar_models?: ArModelRow[] | null;
}

export interface QrCodeRow {
  id: string;
  restaurant_id: string;
  code: string;
  table_label: string | null;
  target_path: string;
  is_active?: boolean;
  created_at?: string;
}

const num = (v: number | string | null) => (v === null || v === undefined || v === '' ? null : Number(v));

export function mapRestaurant(r: RestaurantRow, url: StorageUrlResolver): Restaurant {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? '',
    logoUrl: url(r.logo_path),
    coverUrl: url(r.cover_path),
    primaryColor: r.primary_color,
    secondaryColor: r.secondary_color,
    theme: r.theme_settings ?? {},
    info: r.public_info ?? {},
    isActive: r.is_active,
    isDemo: false,
  };
}

export function mapCategory(c: CategoryRow, url: StorageUrlResolver): Category {
  return {
    id: c.id,
    restaurantId: c.restaurant_id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? '',
    imageUrl: url(c.image_path),
    sortOrder: c.sort_order,
    isActive: c.is_active,
  };
}

export function mapArModel(m: ArModelRow, url: StorageUrlResolver): ArModel | null {
  const glbUrl = url(m.glb_path);
  if (!glbUrl) return null;
  const w = num(m.width_cm),
    h = num(m.height_cm),
    d = num(m.depth_cm);
  return {
    id: m.id,
    productId: m.product_id,
    glbUrl,
    usdzUrl: url(m.usdz_path),
    posterUrl: url(m.poster_path),
    dimensions: w && h && d ? { widthCm: w, heightCm: h, depthCm: d } : null,
    scaleVerified: m.scale_verified,
    scaleLocked: m.scale_locked,
    approvalStatus: m.approval_status,
    fileSizeBytes: m.file_size_bytes,
    version: m.version,
    publishedAt: m.published_at,
    isDemo: m.glb_path.startsWith('/demo/'),
  };
}

/** Escolhe o modelo público: aprovado E publicado (a RLS já filtra; aqui é defesa em profundidade). */
export function pickPublishedModel(
  models: ArModelRow[] | null | undefined,
  url: StorageUrlResolver,
): ArModel | null {
  const publicado = (models ?? []).find((m) => m.approval_status === 'approved' && m.published_at);
  return publicado ? mapArModel(publicado, url) : null;
}

export function mapProduct(
  p: ProductRow,
  url: StorageUrlResolver,
  options: { publicOnly: boolean },
): Product {
  const media: ProductMedia[] = (p.product_media ?? [])
    .filter((m) => !options.publicOnly || m.is_published)
    .map((m) => ({
      id: m.id,
      type: m.media_type,
      url: url(m.storage_path) ?? '',
      alt: m.alt_text,
      sortOrder: m.sort_order,
    }))
    .filter((m) => m.url)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    id: p.id,
    restaurantId: p.restaurant_id,
    categoryId: p.category_id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? '',
    ingredients: p.ingredients ?? [],
    allergens: p.allergens ?? [],
    priceCents: p.price_cents,
    portionDescription: p.portion_description ?? '',
    isAvailable: p.is_available,
    isPublished: p.is_published,
    isFeatured: p.is_featured,
    sortOrder: p.sort_order,
    media,
    arModel: pickPublishedModel(p.product_ar_models, url),
    isDemo: false,
  };
}

export function mapQrCode(q: QrCodeRow): QrCode {
  return {
    id: q.id,
    restaurantId: q.restaurant_id,
    code: q.code,
    tableLabel: q.table_label,
    targetPath: q.target_path,
    isActive: q.is_active ?? true,
    createdAt: q.created_at ?? '',
  };
}
