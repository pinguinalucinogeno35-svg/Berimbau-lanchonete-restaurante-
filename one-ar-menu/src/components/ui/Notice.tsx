import type { ReactNode } from 'react';
import { AlertTriangle, Info, CircleCheck, CircleX } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tone = 'info' | 'warning' | 'error' | 'success';
const estilos: Record<Tone, { cls: string; Icon: typeof Info }> = {
  info: { cls: 'border-line bg-bg-alt text-muted', Icon: Info },
  warning: { cls: 'border-accent/40 bg-accent/8 text-accent-strong', Icon: AlertTriangle },
  error: { cls: 'border-danger/50 bg-danger/8 text-danger', Icon: CircleX },
  success: { cls: 'border-success/50 bg-success/8 text-success', Icon: CircleCheck },
};

export function Notice({
  tone = 'info',
  title,
  children,
  className,
  action,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  const { cls, Icon } = estilos[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-sm border px-4 py-3 text-sm leading-relaxed', cls, className)}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold text-text">{title}</p>}
        {children && <div>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
