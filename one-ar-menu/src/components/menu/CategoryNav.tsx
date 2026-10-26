import { cn } from '@/lib/cn';
import type { Category } from '@/types/domain';

export function CategoryNav({
  categories,
  active,
  onChange,
}: {
  categories: Category[];
  active: string | null;
  onChange: (id: string | null) => void;
}) {
  const itens: Array<{ id: string | null; name: string }> = [{ id: null, name: 'Todos' }, ...categories];
  return (
    <nav aria-label="Categorias" className="no-scrollbar -mx-5 overflow-x-auto px-5">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {itens.map((c) => {
          const ativo = c.id === active;
          return (
            <li key={c.id ?? 'todos'}>
              <button
                type="button"
                aria-pressed={ativo}
                onClick={() => onChange(c.id)}
                className={cn(
                  'relative h-11 px-3.5 text-sm font-medium tracking-wide transition-colors duration-200',
                  ativo ? 'text-accent-strong' : 'text-muted hover:text-text',
                )}
              >
                {c.name}
                <span
                  className={cn(
                    'absolute inset-x-3 -bottom-px h-0.5 bg-accent transition-opacity duration-200',
                    ativo ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
