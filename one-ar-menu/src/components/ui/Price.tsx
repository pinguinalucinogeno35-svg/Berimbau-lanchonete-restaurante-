import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';

export function Price({ cents, className }: { cents: number; className?: string }) {
  return (
    <span className={cn('font-body font-medium tabular-nums tracking-wide text-accent-strong', className)}>
      {formatPrice(cents)}
    </span>
  );
}
