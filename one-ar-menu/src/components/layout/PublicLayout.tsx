import { NavLink, Outlet, Link, ScrollRestoration } from 'react-router';
import { WifiOff } from 'lucide-react';
import { useRestaurant } from '@/hooks/useMenu';
import { useOnline } from '@/hooks/useOnline';
import { isDemoMode } from '@/config/env';
import { cn } from '@/lib/cn';
import { UpdatePrompt } from './UpdatePrompt';

export function Brand({ compact = false }: { compact?: boolean }) {
  const { data } = useRestaurant();
  const nome = data?.name ?? 'Cardápio';
  return (
    <Link to="/" className="flex items-center gap-3" aria-label={`${nome}, página inicial`}>
      {data?.logoUrl ? (
        <img src={data.logoUrl} alt="" className="brand-logo h-10 w-auto" />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-sm border border-accent/60 font-display text-lg text-accent"
        >
          {nome.charAt(0)}
        </span>
      )}
      {!compact && (
        <span
          className={cn(
            'font-display text-xl leading-none tracking-wide text-text',
            data?.logoUrl && 'sr-only',
          )}
        >
          {nome}
        </span>
      )}
    </Link>
  );
}

export function PublicLayout() {
  const online = useOnline();
  const link = ({ isActive }: { isActive: boolean }) =>
    cn(
      'px-2 py-1 text-sm tracking-wide transition-colors',
      isActive ? 'text-accent-strong' : 'text-muted hover:text-text',
    );
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-3 focus:py-2 focus:text-ink"
      >
        Pular para o conteúdo
      </a>
      {isDemoMode && (
        <p className="bg-olive/90 px-4 py-1.5 text-center text-[0.72rem] font-medium tracking-wide text-on-olive">
          Modo demonstrativo · itens, preços e modelos 3D fictícios
        </p>
      )}
      <header
        className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Brand />
          <nav aria-label="Principal" className="flex items-center gap-2">
            <NavLink to="/cardapio" className={link}>
              Cardápio
            </NavLink>
            <NavLink to="/sobre" className={link}>
              Sobre
            </NavLink>
          </nav>
        </div>
      </header>
      {!online && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 bg-bg-alt px-4 py-2 text-xs text-muted"
        >
          <WifiOff className="size-3.5" aria-hidden="true" /> Sem conexão. Preços e disponibilidade podem
          estar desatualizados.
        </div>
      )}
      <main id="conteudo" className="flex-1">
        <Outlet />
      </main>
      <footer className="pad-safe-bottom border-t border-line px-5 pt-8 text-xs text-muted">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:justify-between">
          <p>Preços em reais (R$). Informe a equipe sobre alergias e restrições.</p>
          <p>
            Cardápio digital por <span className="text-accent">ONE Studio Digital</span>
          </p>
        </div>
      </footer>
      <UpdatePrompt />
      <ScrollRestoration />
    </div>
  );
}
