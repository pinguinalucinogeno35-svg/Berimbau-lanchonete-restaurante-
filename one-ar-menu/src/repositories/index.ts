// Fábrica dos repositórios. O código do Supabase só é baixado quando o modo Supabase está ativo,
// deixando o JavaScript inicial do cardápio menor.
import { env } from '@/config/env';
import { MockMenuRepository } from './mock/MockMenuRepository';
import { BackendRequiredError, type AdminRepository, type MenuRepository } from './types';

let menu: Promise<MenuRepository> | null = null;
let admin: Promise<AdminRepository> | null = null;

/** Repositório público: Supabase quando configurado; senão, dados demonstrativos locais. */
export function getMenuRepository(): Promise<MenuRepository> {
  menu ??=
    env.dataSource === 'supabase'
      ? Promise.all([import('@/lib/supabase'), import('./supabase/SupabaseMenuRepository')]).then(
          ([{ getSupabase }, { SupabaseMenuRepository }]) =>
            new SupabaseMenuRepository(getSupabase(), env.restaurantSlug, env.supabaseUrl),
        )
      : Promise.resolve(new MockMenuRepository());
  return menu;
}

/** Repositório do painel: existe somente com Supabase. No modo demonstrativo rejeita com BackendRequiredError. */
export function getAdminRepository(): Promise<AdminRepository> {
  if (env.dataSource !== 'supabase')
    return Promise.reject(new BackendRequiredError('O painel administrativo'));
  admin ??= Promise.all([import('@/lib/supabase'), import('./supabase/SupabaseAdminRepository')]).then(
    ([{ getSupabase }, { SupabaseAdminRepository }]) =>
      new SupabaseAdminRepository(getSupabase(), env.restaurantSlug, env.supabaseUrl),
  );
  return admin;
}

/** Atalho para chamar um método do repositório público. */
export const withMenu = <T>(fn: (r: MenuRepository) => Promise<T>) => getMenuRepository().then(fn);
/** Atalho para chamar um método do repositório administrativo. */
export const withAdmin = <T>(fn: (r: AdminRepository) => Promise<T>) => getAdminRepository().then(fn);

export { BackendRequiredError } from './types';
export type * from './types';
