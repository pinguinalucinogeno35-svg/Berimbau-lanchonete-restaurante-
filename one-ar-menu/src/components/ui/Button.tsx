import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'light';
type Size = 'md' | 'lg' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 font-medium tracking-wide select-none transition-[background-color,color,border-color,transform,opacity] duration-200 ease-one active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none disabled:active:scale-100';
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-ink hover:bg-accent-strong',
  secondary: 'border border-accent/60 text-accent-strong hover:border-accent hover:bg-accent/10',
  ghost: 'text-text hover:bg-text/8',
  light: 'bg-surface text-ink hover:bg-white',
};
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-sm',
  md: 'h-11 px-5 text-[0.95rem] rounded-sm',
  lg: 'h-13 px-6 text-base rounded-sm',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export const Button = forwardRef<HTMLButtonElement, CommonProps & ButtonHTMLAttributes<HTMLButtonElement>>(
  function Button(
    { variant = 'primary', size = 'md', icon, children, className, type = 'button', ...rest },
    ref,
  ) {
    return (
      <button ref={ref} type={type} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
        {icon}
        {children}
      </button>
    );
  },
);

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className,
  ...rest
}: CommonProps & LinkProps) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

export function ExternalButton({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className,
  ...rest
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {icon}
      {children}
    </a>
  );
}
