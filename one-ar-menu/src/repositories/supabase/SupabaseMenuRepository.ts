// Leitura pública do cardápio no Supabase. A RLS garante que só conteúdo publicado é devolvido.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AnalyticsEventInput, Category, Product, QrCode, Restaurant } from '@/types/domain';
import type { MenuRepository } from '../types';
import {
  makePublicUrlResolver,
  mapCategory,
  mapProduct,
  mapQrCode,
  mapRestaurant,
  type CategoryRow,
  type ProductRow,
  type QrCodeRow,
  type RestaurantRow,
  type StorageUrlResolver,
} from './mappers';

export const PRODUCT_SELECT = `
  id, restaurant_id, category_id, name, slug, description, ingredients, allergens, price_cents,
  portion_description, is_available, is_published, is_featured, sort_order,
  product_media ( id, media_type, storage_path, alt_text, sort_order, is_published ),
  product_ar_models ( id, product_id, glb_path, usdz_path, poster_path, width_cm, height_cm, depth_cm,
    scale_verified, scale_locked, approval_status, file_size_bytes, version, published_at )
`;

export class SupabaseMenuRepository implements MenuRepository {
  readonly kind = 'supabase' as const;
  private readonly url: StorageUrlResolver;
  private restaurantPromise: Promise<Restaurant> | null = null;

  constructor(
    private readonly db: SupabaseClient,
    private readonly restaurantSlug: string,
    supabaseUrl: string,
  ) {
    this.url = makePublicUrlResolver(supabaseUrl);
  }

  getRestaurant(): Promise<Restaurant> {
    this.restaurantPromise ??= (async () => {
      const { data, error } = await this.db
        .from('restaurants')
        .select(
          'id, name, slug, description, logo_path, cover_path, primary_color, secondary_color, theme_settings, public_info, is_active',
        )
        .eq('slug', this.restaurantSlug)
        .eq('is_active', true)
        .maybeSingle<RestaurantRow>();
      if (error) throw error;
      if (!data) throw new Error(`Restaurante "${this.restaurantSlug}" não encontrado ou inativo.`);
      return mapRestaurant(data, this.url);
    })().catch((e) => {
      this.restaurantPromise = null;
      throw e;
    });
    return this.restaurantPromise;
  }

  async listCategories(): Promise<Category[]> {
    const r = await this.getRestaurant();
    const { data, error } = await this.db
      .from('categories')
      .select('id, restaurant_id, name, slug, description, image_path, sort_order, is_active')
      .eq('restaurant_id', r.id)
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return (data as CategoryRow[]).map((c) => mapCategory(c, this.url));
  }

  async listProducts(): Promise<Product[]> {
    const r = await this.getRestaurant();
    const { data, error } = await this.db
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('restaurant_id', r.id)
      .eq('is_published', true)
      .order('sort_order');
    if (error) throw error;
    return (data as unknown as ProductRow[]).map((p) => mapProduct(p, this.url, { publicOnly: true }));
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const r = await this.getRestaurant();
    const { data, error } = await this.db
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('restaurant_id', r.id)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    if (error) throw error;
    return data ? mapProduct(data as unknown as ProductRow, this.url, { publicOnly: true }) : null;
  }

  async resolveQrCode(code: string): Promise<QrCode | null> {
    const { data, error } = await this.db.rpc('resolve_qr_code', { qr_code: code });
    if (error) throw error;
    const row = (data as QrCodeRow[] | null)?.[0];
    return row ? mapQrCode(row) : null;
  }

  async trackEvent(event: AnalyticsEventInput & { deviceCategory: string }): Promise<void> {
    // Melhor esforço: falhas de métrica nunca afetam o cardápio.
    await this.db.functions
      .invoke('track-event', {
        body: {
          restaurantSlug: this.restaurantSlug,
          type: event.type,
          productId: event.productId ?? null,
          qrCodeId: event.qrCodeId ?? null,
          deviceCategory: event.deviceCategory,
        },
      })
      .catch(() => undefined);
  }
}
