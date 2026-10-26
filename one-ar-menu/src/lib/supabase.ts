import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, supabaseConfigured } from '@/config/env';

let client: SupabaseClient | null = null;

/** Cliente Supabase com a anon key (pública). Nunca usa service role no navegador. */
export function getSupabase(): SupabaseClient {
  if (!supabaseConfigured)
    throw new Error('Supabase não configurado (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  client ??= createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}
