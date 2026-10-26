// Sessão administrativa (Supabase Auth) + papel do usuário no restaurante.
// O papel serve para a interface; quem garante a permissão é a RLS no banco.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { env } from '@/config/env';
import type { MemberRole } from '@/types/domain';

export type AuthStatus = 'unconfigured' | 'loading' | 'signed-out' | 'signed-in';

export interface AuthState {
  status: AuthStatus;
  session: Session | null;
  role: MemberRole | null;
  roleError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// O cliente Supabase só é baixado quando o modo Supabase está ativo.
const supabase = () => import('@/lib/supabase').then((m) => m.getSupabase());

async function fetchRole(userId: string): Promise<MemberRole | null> {
  const db = await supabase();
  const { data: r } = await db.from('restaurants').select('id').eq('slug', env.restaurantSlug).maybeSingle();
  if (!r) return null;
  const { data, error } = await db
    .from('restaurant_members')
    .select('role')
    .eq('restaurant_id', r.id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.role as MemberRole | undefined) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = env.dataSource === 'supabase';
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(configured ? 'loading' : 'unconfigured');
  const [role, setRole] = useState<MemberRole | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    let ativo = true;
    let cancelar: (() => void) | undefined;
    const aplicar = async (s: Session | null) => {
      if (!ativo) return;
      setSession(s);
      if (!s) {
        setRole(null);
        setStatus('signed-out');
        return;
      }
      try {
        setRole(await fetchRole(s.user.id));
        setRoleError(null);
      } catch (e) {
        setRole(null);
        setRoleError(e instanceof Error ? e.message : 'Falha ao verificar permissões.');
      }
      if (ativo) setStatus('signed-in');
    };
    void supabase().then((db) => {
      if (!ativo) return;
      void db.auth.getSession().then(({ data }) => aplicar(data.session));
      const { data: sub } = db.auth.onAuthStateChange((_evento, s) => {
        void aplicar(s);
      });
      cancelar = () => sub.subscription.unsubscribe();
    });
    return () => {
      ativo = false;
      cancelar?.();
    };
  }, [configured]);

  const value = useMemo<AuthState>(
    () => ({
      status,
      session,
      role,
      roleError,
      signIn: async (email, password) => {
        const { error } = await (await supabase()).auth.signInWithPassword({ email, password });
        if (error)
          throw new Error(
            error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message,
          );
      },
      signOut: async () => {
        await (await supabase()).auth.signOut();
      },
    }),
    [status, session, role, roleError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return ctx;
}

export const roleRank = (r: MemberRole | null) =>
  r === 'owner' ? 3 : r === 'manager' ? 2 : r === 'editor' ? 1 : 0;
export const canAtLeast = (r: MemberRole | null, min: MemberRole) => roleRank(r) >= roleRank(min);
