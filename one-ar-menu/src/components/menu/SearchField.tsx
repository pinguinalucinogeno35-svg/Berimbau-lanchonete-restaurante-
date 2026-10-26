import { Search, X } from 'lucide-react';

export function SearchField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex h-12 items-center gap-3 rounded-sm border border-line bg-bg-alt px-4 transition-colors focus-within:border-accent/70">
      <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
      <span className="sr-only">Buscar no cardápio</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por nome ou ingrediente"
        className="h-full min-w-0 flex-1 bg-transparent text-[0.95rem] text-text placeholder:text-muted/70 focus:outline-none"
        autoComplete="off"
        enterKeyHint="search"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="grid size-8 place-items-center rounded-sm text-muted hover:text-text"
          aria-label="Limpar busca"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </label>
  );
}
