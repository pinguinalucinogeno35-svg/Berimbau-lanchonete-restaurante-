import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({
  title = 'Algo não saiu como esperado',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 py-16 text-center">
      <span className="hairline" />
      <h2 className="text-3xl">{title}</h2>
      {message && <p className="text-muted">{message}</p>}
      {onRetry && (
        <Button
          variant="secondary"
          onClick={onRetry}
          icon={<RotateCcw className="size-4" aria-hidden="true" />}
        >
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-5 py-14 text-center">
      <span className="hairline" />
      <h2 className="text-2xl">{title}</h2>
      {children && <div className="text-muted">{children}</div>}
    </div>
  );
}
