// Tipos de domínio do ONE AR Menu (independentes da fonte de dados).

export type MemberRole = 'owner' | 'manager' | 'editor';
export type ModelApprovalStatus = 'draft' | 'processing' | 'ready_for_review' | 'approved' | 'rejected';
export type MediaType = 'image' | 'poster' | 'video';

export type AnalyticsEventType =
  'menu_open' | 'product_view' | 'model_3d_open' | 'ar_launch_attempt' | 'ar_launch_error' | 'ar_return';

export type DeviceCategory = 'mobile' | 'tablet' | 'desktop';

export interface ThemeSettings {
  colors?: Partial<{
    bg: string;
    bgAlt: string;
    surface: string;
    accent: string;
    olive: string;
    text: string;
    textDark: string;
  }>;
  fonts?: Partial<{ display: string; body: string }>;
}

export interface PublicInfo {
  tagline?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  about?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  openingHours?: string;
  experienceTitle?: string;
  experienceText?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  coverUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  theme: ThemeSettings;
  info: PublicInfo;
  isActive: boolean;
  isDemo: boolean;
}

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductMedia {
  id: string;
  type: MediaType;
  url: string;
  alt: string;
  sortOrder: number;
}

export interface Dimensions {
  widthCm: number;
  heightCm: number;
  depthCm: number;
}

export interface ArModel {
  id: string;
  productId: string;
  glbUrl: string;
  usdzUrl: string | null;
  posterUrl: string | null;
  dimensions: Dimensions | null;
  scaleVerified: boolean;
  scaleLocked: boolean;
  approvalStatus: ModelApprovalStatus;
  fileSizeBytes: number | null;
  version: number;
  publishedAt: string | null;
  isDemo: boolean;
}

export interface Product {
  id: string;
  restaurantId: string;
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
  media: ProductMedia[];
  /** Modelo público (aprovado e publicado). Null quando não existe. */
  arModel: ArModel | null;
  isDemo: boolean;
}

export interface QrCode {
  id: string;
  restaurantId: string;
  code: string;
  tableLabel: string | null;
  targetPath: string;
  isActive: boolean;
  createdAt: string;
}

export interface AnalyticsEventInput {
  type: AnalyticsEventType;
  productId?: string | null;
  qrCodeId?: string | null;
}
