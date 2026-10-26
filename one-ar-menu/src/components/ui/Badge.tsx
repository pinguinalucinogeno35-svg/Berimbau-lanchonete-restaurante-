import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'accent' | 'olive' | 'muted' | 'danger' | 'success' | 'dark';
const tones: Record<Tone, string> = {
  accent: 'border-accent/50 text-accent-strong',
  olive: 'border-olive text-olive-text',
  muted: 'border-line text-muted',
  danger: 'border-danger/60 text-danger',
  success: 'border-success/60 text-success',
  dark: 'border-transparent bg-bg/80 text-text backdrop-blur',
};

export function Badge({
  tone = 'muted',
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em]',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
