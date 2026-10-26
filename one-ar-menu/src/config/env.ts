// Leitura centralizada das variáveis de ambiente (somente VITE_*, públicas por definição).

export type DataSource = 'demo' | 'supabase';

const raw = import.meta.env;

const supabaseUrl = (raw.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (raw.VITE_SUPABASE_ANON_KEY ?? '').trim();
const requested = (raw.VITE_DATA_SOURCE ?? 'demo').trim() as DataSource;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const env = {
  /** Fonte efetiva: só usa Supabase quando pedido E configurado. */
  dataSource: (requested === 'supabase' && supabaseConfigured ? 'supabase' : 'demo') as DataSource,
  requestedDataSource: requested,
  supabaseUrl,
  supabaseAnonKey,
  restaurantSlug: (raw.VITE_RESTAURANT_SLUG ?? 'restaurante-demonstrativo').trim(),
  publicAppUrl: (raw.VITE_PUBLIC_APP_URL ?? '').trim().replace(/\/$/, ''),
} as const;

export const isDemoMode = env.dataSource === 'demo';

export function publicUrl(path: string): string {
  const base = env.publicAppUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
