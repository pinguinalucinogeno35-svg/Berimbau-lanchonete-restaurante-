import { Navigate, useLocation } from 'react-router';
import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useAuth } from './AuthProvider';

/** Guarda das rotas /admin: exige sessão E vínculo com o restaurante. A RLS valida de novo no banco. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.status === 'loading')
    return (
      <div className="p-8">
        <Skeleton className="h-40" />
      </div>
    );
  if (auth.status !== 'signed-in')
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (!auth.role) {
    return (
      <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 py-20 text-center">
        <ShieldAlert className="size-8 text-danger" aria-hidden="true" />
        <h1 className="text-3xl">Sem acesso a este restaurante</h1>
        <p className="text-muted">
          {auth.roleError ??
            'Sua conta está autenticada, mas não tem um papel (owner, manager ou editor) neste restaurante.'}
        </p>
        <Button variant="secondary" onClick={() => void auth.signOut()}>
          Sair
        </Button>
      </div>
    );
  }
  return children;
}
