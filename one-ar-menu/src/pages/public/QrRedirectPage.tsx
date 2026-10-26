// /q/:code — entrada pelos QR codes das mesas. Registra o código (sem dados pessoais) e redireciona.
import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { withMenu } from '@/repositories';
import { rememberQrCode, trackEvent } from '@/features/analytics/track';
import { Skeleton } from '@/components/ui/Skeleton';

const SAFE_PATH = /^\/[A-Za-z0-9/_-]*$/;

export default function QrRedirectPage() {
  const { code = '' } = useParams();
  const qr = useQuery({
    queryKey: ['qr', code],
    queryFn: () => withMenu((r) => r.resolveQrCode(code)),
    retry: 1,
  });
  useEffect(() => {
    if (qr.data) {
      rememberQrCode(qr.data.id);
      trackEvent('menu_open', { oncePerSession: true });
    }
  }, [qr.data]);
  if (qr.isPending)
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Skeleton className="h-40" />
      </div>
    );
  const destino =
    qr.data && SAFE_PATH.test(qr.data.targetPath) && !qr.data.targetPath.includes('//')
      ? qr.data.targetPath
      : '/cardapio';
  return <Navigate to={destino} replace />;
}
