import type {
  AnalyticsEventInput,
  ArModel,
  Category,
  ModelApprovalStatus,
  Product,
  QrCode,
  Restaurant,
} from '@/types/domain';

/** Leitura pública do cardápio. Implementações só devolvem conteúdo publicado. */
export interface MenuRepository {
  readonly kind: 'demo' | 'supabase';
  getRestaurant(): Promise<Restaurant>;
  listCategories(): Promise<Category[]>;
  listProducts(): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  resolveQrCode(code: string): Promise<QrCode | null>;
  trackEvent(event: AnalyticsEventInput & { deviceCategory: string }): Promise<void>;
}

export class BackendRequiredError extends Error {
  constructor(acao = 'Esta operação') {
    super(`${acao} exige o backend Supabase configurado. No modo demonstrativo nada é salvo.`);
    this.name = 'BackendRequiredError';
  }
}

export interface ProductInput {
  id?: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  ingredients: string[];
  allergens: string[];
  priceCents: number;
  portionDescription: string;
  isAvailable: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export interface CategoryInput {
  id?: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminArModel extends ArModel {
  productName: string;
  glbPath: string;
  usdzPath: string | null;
  posterPath: string | null;
  createdAt: string;
}

export interface ModelUploadInput {
  productId: string;
  glb: File;
  usdz?: File | null;
  poster?: File | null;
  widthCm: number;
  heightCm: number;
  depthCm: number;
  scaleVerified: boolean;
  scaleLocked: boolean;
}

export interface DashboardStats {
  totalProducts: number;
  publishedProducts: number;
  unavailableProducts: number;
  productsWith3d: number;
  modelsAwaitingReview: number;
  events: Partial<Record<string, number>>;
}

export interface AnalyticsSummary {
  byType: Array<{ type: string; total: number }>;
  topProducts: Array<{ productId: string; name: string; views: number; opens3d: number }>;
  topQrCodes: Array<{ qrCodeId: string; label: string; total: number }>;
  since: string;
}

/** Operações do painel. Sempre passam pelo Supabase com sessão e RLS. */
export interface AdminRepository {
  listAllProducts(): Promise<Product[]>;
  saveProduct(input: ProductInput): Promise<Product>;
  uploadProductImage(productId: string, file: File, alt: string): Promise<void>;
  listAllCategories(): Promise<Category[]>;
  saveCategory(input: CategoryInput): Promise<Category>;
  listModels(): Promise<AdminArModel[]>;
  uploadModel(input: ModelUploadInput): Promise<AdminArModel>;
  setModelStatus(id: string, status: ModelApprovalStatus): Promise<void>;
  publishModel(id: string): Promise<void>;
  getModelPreviewUrl(model: AdminArModel): Promise<string>;
  listQrCodes(): Promise<QrCode[]>;
  createQrCode(input: { tableLabel: string | null; targetPath: string }): Promise<QrCode>;
  setQrCodeActive(id: string, active: boolean): Promise<void>;
  getRestaurantForEdit(): Promise<Restaurant>;
  saveRestaurant(
    input: Pick<Restaurant, 'name' | 'description' | 'primaryColor' | 'secondaryColor' | 'theme' | 'info'>,
  ): Promise<void>;
  uploadBrandingImage(kind: 'logo' | 'cover', file: File): Promise<void>;
  getDashboardStats(): Promise<DashboardStats>;
  getAnalyticsSummary(days: number): Promise<AnalyticsSummary>;
}
