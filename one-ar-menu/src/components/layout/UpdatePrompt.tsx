// Aviso de nova versão do app (PWA). O usuário escolhe quando atualizar.
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/Button';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });
  if (!needRefresh) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-sm border border-line bg-bg-alt p-3 shadow-lg"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <p className="flex-1 text-sm">Nova versão do cardápio disponível.</p>
      <Button size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>
        Depois
      </Button>
      <Button size="sm" onClick={() => updateServiceWorker(true)}>
        Atualizar
      </Button>
    </div>
  );
}
