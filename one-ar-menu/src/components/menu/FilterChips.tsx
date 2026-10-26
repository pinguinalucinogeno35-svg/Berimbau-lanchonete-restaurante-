import { cn } from '@/lib/cn';

export interface ChipOption {
  key: string;
  label: string;
  active: boolean;
}

export function FilterChips({
  options,
  onToggle,
}: {
  options: ChipOption[];
  onToggle: (key: string) => void;
}) {
  return (
    <div role="group" aria-label="Filtros" className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={o.active}
          onClick={() => onToggle(o.key)}
          className={cn(
            'h-9 rounded-sm border px-3 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200',
            o.active
              ? 'border-accent bg-accent/12 text-accent-strong'
              : 'border-line text-muted hover:text-text',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
