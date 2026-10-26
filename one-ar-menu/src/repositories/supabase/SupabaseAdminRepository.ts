// Operações do painel administrativo. Todas passam pela sessão do usuário e pela RLS do banco:
// esconder botões no frontend NÃO é o mecanismo de segurança.
import type { SupabaseClient } from '@supabase/supabase-js';
import { contentTypeFor, validateAssetFile } from '@/lib/fileValidation';
import type { ModelApprovalStatus, Product, QrCode, Restaurant } from '@/types/domain';
import type {
  AdminArModel,
  AdminRepository,
  AnalyticsSummary,
  CategoryInput,
  DashboardStats,
  ModelUploadInput,
  ProductInput,
} from '../types';
import {
  makePublicUrlResolver,
  mapArModel,
  mapCategory,
  mapProduct,
  mapQrCode,
  mapRestaurant,
  type ArModelRow,
  type CategoryRow,
  type ProductRow,
  type QrCodeRow,
  type RestaurantRow,
  type StorageUrlResolver,
} from './mappers';
import { PRODUCT_SELECT } from './SupabaseMenuRepository';

const randomCode = () => {
  const alfabeto = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('');
};

export class SupabaseAdminRepository implements AdminRepository {
  private readonly url: StorageUrlResolver;
  private restaurantIdPromise: Promise<string> | null = null;

  constructor(
    private readonly db: SupabaseClient,
    private readonly restaurantSlug: string,
    supabaseUrl: string,
  ) {
    this.url = makePublicUrlResolver(supabaseUrl);
  }

  private restaurantId(): Promise<string> {
    this.restaurantIdPromise ??= (async () => {
      const { data, error } = await this.db
        .from('restaurants')
        .select('id')
        .eq('slug', this.restaurantSlug)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Restaurante não encontrado.');
      return data.id as string;
    })().catch((e) => {
      this.restaurantIdPromise = null;
      throw e;
    });
    return this.restaurantIdPromise;
  }

  private async upload(bucket: string, path: string, file: File, contentType: string) {
    const { error } = await this.db.storage
      .from(bucket)
      .upload(path, file, { contentType, upsert: false, cacheControl: '3600' });
    if (error) throw error;
  }

  // ---------- produtos ----------
  async listAllProducts(): Promise<Product[]> {
    const rid = await this.restaurantId();
    const { data, error } = await this.db
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('restaurant_id', rid)
      .order('sort_order');
    if (error) throw error;
    return (data as unknown as ProductRow[]).map((p) => mapProduct(p, this.url, { publicOnly: false }));
  }

  async saveProduct(input: ProductInput): Promise<Product> {
    const rid = await this.restaurantId();
    const row = {
      restaurant_id: rid,
      category_id: input.categoryId,
      name: input.name.trim(),
      slug: input.slug,
      description: input.description.trim(),
      ingredients: input.ingredients,
      allergens: input.allergens,
      price_cents: input.priceCents,
      portion_description: input.portionDescription.trim(),
      is_available: input.isAvailable,
      is_published: input.isPublished,
      is_featured: input.isFeatured,
      sort_order: input.sortOrder,
    };
    const query = input.id
      ? this.db.from('products').update(row).eq('id', input.id).eq('restaurant_id', rid)
      : this.db.from('products').insert(row);
    const { data, error } = await query.select(PRODUCT_SELECT).single();
    if (error) throw error;
    return mapProduct(data as unknown as ProductRow, this.url, { publicOnly: false });
  }

  async uploadProductImage(productId: string, file: File, alt: string): Promise<void> {
    const v = await validateAssetFile('image', file);
    if (!v.ok) throw new Error(v.error);
    const rid = await this.restaurantId();
    const key = `${rid}/products/${productId}/images/${crypto.randomUUID()}.${v.extension}`;
    await this.upload('restaurant-assets', key, file, contentTypeFor(v.extension));
    const { error } = await this.db.from('product_media').insert({
      restaurant_id: rid,
      product_id: productId,
      media_type: 'image',
      storage_path: `restaurant-assets/${key}`,
      alt_text: alt.trim(),
    });
    if (error) throw error;
  }

  // ---------- categorias ----------
  async listAllCategories() {
    const rid = await this.restaurantId();
    const { data, error } = await this.db
      .from('categories')
      .select('id, restaurant_id, name, slug, description, image_path, sort_order, is_active')
      .eq('restaurant_id', rid)
      .order('sort_order');
    if (error) throw error;
    return (data as CategoryRow[]).map((c) => mapCategory(c, this.url));
  }

  async saveCategory(input: CategoryInput) {
    const rid = await this.restaurantId();
    const row = {
      restaurant_id: rid,
      name: input.name.trim(),
      slug: input.slug,
      description: input.description.trim(),
      sort_order: input.sortOrder,
      is_active: input.isActive,
    };
    const query = input.id
      ? this.db.from('categories').update(row).eq('id', input.id).eq('restaurant_id', rid)
      : this.db.from('categories').insert(row);
    const { data, error } = await query
      .select('id, restaurant_id, name, slug, description, image_path, sort_order, is_active')
      .single();
    if (error) throw error;
    return mapCategory(data as CategoryRow, this.url);
  }

  // ---------- modelos 3D ----------
  async listModels(): Promise<AdminArModel[]> {
    const rid = await this.restaurantId();
    const { data, error } = await this.db
      .from('product_ar_models')
      .select(
        'id, product_id, glb_path, usdz_path, poster_path, width_cm, height_cm, depth_cm, scale_verified, scale_locked, approval_status, file_size_bytes, version, published_at, created_at, products(name)',
      )
      .eq('restaurant_id', rid)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (
      data as unknown as Array<ArModelRow & { created_at: string; products: { name: string } | null }>
    ).flatMap((m) => {
      const base = mapArModel(m, (p) => (p && p.startsWith('staging-3d/') ? p : this.url(p)));
      return base
        ? [
            {
              ...base,
              productName: m.products?.name ?? '—',
              glbPath: m.glb_path,
              usdzPath: m.usdz_path,
              posterPath: m.poster_path,
              createdAt: m.created_at,
            },
          ]
        : [];
    });
  }

  async uploadModel(input: ModelUploadInput): Promise<AdminArModel> {
    const rid = await this.restaurantId();
    for (const [kind, file] of [
      ['glb', input.glb],
      ['usdz', input.usdz],
      ['image', input.poster],
    ] as const) {
      if (!file) continue;
      const v = await validateAssetFile(kind, file);
      if (!v.ok) throw new Error(`${file.name}: ${v.error}`);
    }
    const { data: versoes } = await this.db
      .from('product_ar_models')
      .select('version')
      .eq('product_id', input.productId)
      .order('version', { ascending: false })
      .limit(1);
    const version = ((versoes?.[0]?.version as number | undefined) ?? 0) + 1;
    const pasta = `${rid}/${input.productId}/v${version}`;
    await this.upload('staging-3d', `${pasta}/model.glb`, input.glb, contentTypeFor('glb'));
    if (input.usdz)
      await this.upload('staging-3d', `${pasta}/model.usdz`, input.usdz, contentTypeFor('usdz'));
    let posterKey: string | null = null;
    if (input.poster) {
      const ext = input.poster.name.toLowerCase().split('.').pop() ?? 'webp';
      posterKey = `${pasta}/poster.${ext}`;
      await this.upload('staging-3d', posterKey, input.poster, contentTypeFor(ext));
    }
    const { error } = await this.db.from('product_ar_models').insert({
      restaurant_id: rid,
      product_id: input.productId,
      glb_path: `staging-3d/${pasta}/model.glb`,
      usdz_path: input.usdz ? `staging-3d/${pasta}/model.usdz` : null,
      poster_path: posterKey ? `staging-3d/${posterKey}` : null,
      width_cm: input.widthCm,
      height_cm: input.heightCm,
      depth_cm: input.depthCm,
      scale_verified: input.scaleVerified,
      scale_locked: input.scaleLocked,
      approval_status: 'ready_for_review',
      file_size_bytes: input.glb.size,
      version,
    });
    if (error) throw error;
    const criado = (await this.listModels()).find(
      (m) => m.productId === input.productId && m.version === version,
    );
    if (!criado) throw new Error('Modelo enviado, mas não foi possível relê-lo.');
    return criado;
  }

  async setModelStatus(id: string, status: ModelApprovalStatus): Promise<void> {
    const { error } = await this.db
      .from('product_ar_models')
      .update({ approval_status: status })
      .eq('id', id);
    if (error) throw error;
  }

  /** Copia os arquivos aprovados de staging-3d para published-3d e publica a versão (RPC transacional). */
  async publishModel(id: string): Promise<void> {
    const modelo = (await this.listModels()).find((m) => m.id === id);
    if (!modelo) throw new Error('Modelo não encontrado.');
    if (modelo.approvalStatus !== 'approved') throw new Error('Aprove o modelo antes de publicar.');
    const copiar = async (path: string | null) => {
      if (!path || !path.startsWith('staging-3d/')) return null;
      const chave = path.slice('staging-3d/'.length);
      const { error } = await this.db.storage
        .from('staging-3d')
        .copy(chave, chave, { destinationBucket: 'published-3d' });
      if (error && !/exists/i.test(error.message)) throw error;
      return `published-3d/${chave}`;
    };
    const [glb, usdz, poster] = await Promise.all([
      copiar(modelo.glbPath),
      copiar(modelo.usdzPath),
      copiar(modelo.posterPath),
    ]);
    const { error } = await this.db.rpc('publish_ar_model', {
      model_id: id,
      published_glb_path: glb,
      published_usdz_path: usdz,
      published_poster_path: poster,
    });
    if (error) throw error;
  }

  /** URL para pré-visualizar no painel: assinada (5 min) quando o arquivo ainda está privado. */
  async getModelPreviewUrl(model: AdminArModel): Promise<string> {
    if (!model.glbPath.startsWith('staging-3d/')) return this.url(model.glbPath) ?? model.glbUrl;
    const { data, error } = await this.db.storage
      .from('staging-3d')
      .createSignedUrl(model.glbPath.slice('staging-3d/'.length), 300);
    if (error) throw error;
    return data.signedUrl;
  }

  // ---------- QR codes ----------
  async listQrCodes(): Promise<QrCode[]> {
    const rid = await this.restaurantId();
    const { data, error } = await this.db
      .from('qr_codes')
      .select('*')
      .eq('restaurant_id', rid)
      .order('created_at');
    if (error) throw error;
    return (data as QrCodeRow[]).map(mapQrCode);
  }

  async createQrCode(input: { tableLabel: string | null; targetPath: string }): Promise<QrCode> {
    const rid = await this.restaurantId();
    const { data, error } = await this.db
      .from('qr_codes')
      .insert({
        restaurant_id: rid,
        code: randomCode(),
        table_label: input.tableLabel?.trim() || null,
        target_path: input.targetPath,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapQrCode(data as QrCodeRow);
  }

  async setQrCodeActive(id: string, active: boolean): Promise<void> {
    const { error } = await this.db.from('qr_codes').update({ is_active: active }).eq('id', id);
    if (error) throw error;
  }

  // ---------- configurações ----------
  async getRestaurantForEdit(): Promise<Restaurant> {
    const { data, error } = await this.db
      .from('restaurants')
      .select(
        'id, name, slug, description, logo_path, cover_path, primary_color, secondary_color, theme_settings, public_info, is_active',
      )
      .eq('slug', this.restaurantSlug)
      .single<RestaurantRow>();
    if (error) throw error;
    return mapRestaurant(data, this.url);
  }

  async saveRestaurant(
    input: Pick<Restaurant, 'name' | 'description' | 'primaryColor' | 'secondaryColor' | 'theme' | 'info'>,
  ) {
    const rid = await this.restaurantId();
    const { error } = await this.db
      .from('restaurants')
      .update({
        name: input.name.trim(),
        description: input.description.trim(),
        primary_color: input.primaryColor,
        secondary_color: input.secondaryColor,
        theme_settings: input.theme,
        public_info: input.info,
      })
      .eq('id', rid);
    if (error) throw error;
  }

  async uploadBrandingImage(kind: 'logo' | 'cover', file: File): Promise<void> {
    const v = await validateAssetFile('image', file);
    if (!v.ok) throw new Error(v.error);
    const rid = await this.restaurantId();
    const key = `${rid}/branding/${kind}-${Date.now()}.${v.extension}`;
    await this.upload('restaurant-assets', key, file, contentTypeFor(v.extension));
    const { error } = await this.db
      .from('restaurants')
      .update(
        kind === 'logo'
          ? { logo_path: `restaurant-assets/${key}` }
          : { cover_path: `restaurant-assets/${key}` },
      )
      .eq('id', rid);
    if (error) throw error;
  }

  // ---------- métricas ----------
  async getDashboardStats(): Promise<DashboardStats> {
    const [produtos, modelos, resumo] = await Promise.all([
      this.listAllProducts(),
      this.listModels(),
      this.getAnalyticsSummary(30).catch(() => null),
    ]);
    return {
      totalProducts: produtos.length,
      publishedProducts: produtos.filter((p) => p.isPublished).length,
      unavailableProducts: produtos.filter((p) => !p.isAvailable).length,
      productsWith3d: new Set(modelos.filter((m) => m.publishedAt).map((m) => m.productId)).size,
      modelsAwaitingReview: modelos.filter((m) => m.approvalStatus === 'ready_for_review').length,
      events: Object.fromEntries((resumo?.byType ?? []).map((e) => [e.type, e.total])),
    };
  }

  async getAnalyticsSummary(days: number): Promise<AnalyticsSummary> {
    const rid = await this.restaurantId();
    const since = new Date(Date.now() - days * 86400_000).toISOString();
    // MVP: agrega no cliente (volume pequeno). Para volumes maiores, trocar por uma view/RPC agregada.
    const { data, error } = await this.db
      .from('analytics_events')
      .select('event_type, product_id, qr_code_id')
      .eq('restaurant_id', rid)
      .gte('created_at', since)
      .limit(20000);
    if (error) throw error;
    const eventos = data as Array<{
      event_type: string;
      product_id: string | null;
      qr_code_id: string | null;
    }>;
    const porTipo = new Map<string, number>();
    const porProduto = new Map<string, { views: number; opens3d: number }>();
    const porQr = new Map<string, number>();
    for (const e of eventos) {
      porTipo.set(e.event_type, (porTipo.get(e.event_type) ?? 0) + 1);
      if (e.product_id) {
        const p = porProduto.get(e.product_id) ?? { views: 0, opens3d: 0 };
        if (e.event_type === 'product_view') p.views++;
        if (e.event_type === 'model_3d_open') p.opens3d++;
        porProduto.set(e.product_id, p);
      }
      if (e.qr_code_id && e.event_type === 'menu_open')
        porQr.set(e.qr_code_id, (porQr.get(e.qr_code_id) ?? 0) + 1);
    }
    const [produtos, qrs] = await Promise.all([this.listAllProducts(), this.listQrCodes()]);
    return {
      since,
      byType: [...porTipo].map(([type, total]) => ({ type, total })).sort((a, b) => b.total - a.total),
      topProducts: [...porProduto]
        .map(([productId, v]) => ({
          productId,
          name: produtos.find((p) => p.id === productId)?.name ?? 'Produto removido',
          ...v,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10),
      topQrCodes: [...porQr]
        .map(([qrCodeId, total]) => {
          const q = qrs.find((x) => x.id === qrCodeId);
          return { qrCodeId, label: q?.tableLabel || q?.code || 'QR removido', total };
        })
        .sort((a, b) => b.total - a.total),
    };
  }
}
