import { cn } from '@/lib/cn';

export type ScaleMode = 'real' | 'livre';

const OPCOES: Array<{ value: ScaleMode; label: string; hint: string }> = [
  {
    value: 'livre',
    label: 'Ampliar com 2 dedos',
    hint: 'Abre no tamanho real. Faça o movimento de pinça para ampliar e ver os detalhes; ao ampliar, o tamanho deixa de ser o real.',
  },
  {
    value: 'real',
    label: 'Travar tamanho real',
    hint: 'Mantém sempre as medidas cadastradas. Não é possível ampliar.',
  },
];

/** Escolha da escala na AR. Padrão: abre no tamanho real e permite ampliar com pinça; opção de travar. */
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
