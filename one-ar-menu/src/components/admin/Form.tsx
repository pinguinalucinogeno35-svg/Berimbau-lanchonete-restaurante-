import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

const campo =
  'w-full rounded-sm border border-line bg-bg px-3 py-2.5 text-sm text-text placeholder:text-muted/60 focus:border-accent/70 focus:outline-none aria-[invalid=true]:border-danger';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string, describedBy?: string) => ReactNode;
}) {
  const id = useId();
  const desc = error ? `${id}-erro` : hint ? `${id}-dica` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </label>
      {children(id, desc)}
      {error ? (
        <p id={desc} className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={desc} className="text-xs text-muted/80">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function TextInput({
  label,
  hint,
  error,
  className,
  ...rest
}: { label: string; hint?: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id, d) => (
        <input
          id={id}
          aria-describedby={d}
          aria-invalid={Boolean(error)}
          className={cn(campo, className)}
          {...rest}
        />
      )}
    </Field>
  );
}

export function TextArea({
  label,
  hint,
  error,
  ...rest
}: { label: string; hint?: string; error?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id, d) => (
        <textarea
          id={id}
          aria-describedby={d}
          aria-invalid={Boolean(error)}
          className={cn(campo, 'min-h-24')}
          {...rest}
        />
      )}
    </Field>
  );
}

export function Select({
  label,
  hint,
  error,
  children,
  ...rest
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id, d) => (
        <select id={id} aria-describedby={d} aria-invalid={Boolean(error)} className={campo} {...rest}>
          {children}
        </select>
      )}
    </Field>
  );
}

export function Check({
  label,
  hint,
  ...rest
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input type="checkbox" className="mt-0.5 size-4 accent-[var(--one-accent)]" {...rest} />
      <span>
        <span className="text-text">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div>
        <h1 className="text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-sm border border-line bg-bg-alt p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 font-display text-4xl tabular-nums text-text">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
