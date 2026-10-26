import { cn } from '@/lib/cn';

export type ScaleMode = 'real' | 'livre';

const OPCOES: Array<{ value: ScaleMode; label: string; hint: string }> = [
  { value: 'real', label: 'Tamanho real', hint: 'Usa as medidas cadastradas. Não dá para ampliar.' },
  { value: 'livre', label: 'Livre', hint: 'Amplie ou reduza com dois dedos. O tamanho deixa de ser o real.' },
];

/** Escolha da escala na AR. "Tamanho real" é o padrão; "Livre" serve para ver detalhes de perto. */
export function ScaleModeToggle({ value, onChange }: { value: ScaleMode; onChange: (v: ScaleMode) => void }) {
  const hint = OPCOES.find((o) => o.value === value)?.hint ?? '';
  return (
    <div className="flex flex-col gap-2">
      <div
        role="radiogroup"
        aria-label="Escala na realidade aumentada"
        className="grid grid-cols-2 gap-1 rounded-sm border border-line p-1"
      >
        {OPCOES.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-10 rounded-sm text-sm font-medium transition-colors',
              value === o.value ? 'bg-accent text-ink' : 'text-muted hover:text-text',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted" aria-live="polite">
        {hint}
      </p>
    </div>
  );
}
