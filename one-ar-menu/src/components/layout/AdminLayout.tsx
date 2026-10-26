import { NavLink, Outlet } from 'react-router';
import {
  BarChart3,
  Box,
  FolderTree,
  LayoutDashboard,
  LogOut,
  QrCode,
  Settings,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '@/features/authentication/AuthProvider';
import { cn } from '@/lib/cn';

const LINKS = [
  { to: '/admin', label: 'Visão geral', Icon: LayoutDashboard, end: true },
  { to: '/admin/produtos', label: 'Produtos', Icon: UtensilsCrossed },
  { to: '/admin/categorias', label: 'Categorias', Icon: FolderTree },
  { to: '/admin/modelos-3d', label: 'Modelos 3D', Icon: Box },
  { to: '/admin/qr-codes', label: 'QR codes', Icon: QrCode },
  { to: '/admin/analytics', label: 'Métricas', Icon: BarChart3 },
  { to: '/admin/configuracoes', label: 'Configurações', Icon: Settings },
];

const ROLE_LABEL = { owner: 'Proprietário', manager: 'Gerente', editor: 'Editor' } as const;

export function AdminLayout() {
  const { session, role, signOut } = useAuth();
  return (
    <div className="min-h-dvh bg-bg-alt md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-bg md:min-h-dvh md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 px-5 py-4 md:block">
          <div>
            <p className="font-display text-2xl">Painel</p>
            <p className="text-xs text-muted">ONE AR Menu</p>
          </div>
        </div>
        <nav
          aria-label="Administração"
          className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible"
        >
          {LINKS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-3 rounded-sm px-3 py-2 text-sm',
                  isActive ? 'bg-accent/12 text-accent-strong' : 'text-muted hover:bg-text/5 hover:text-text',
                )
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-line px-5 py-4 text-xs text-muted md:block">
          <p className="truncate text-text">{session?.user.email}</p>
          <p>{role ? ROLE_LABEL[role] : ''}</p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-3 inline-flex items-center gap-2 hover:text-text"
          >
            <LogOut className="size-3.5" aria-hidden="true" /> Sair
          </button>
        </div>
      </aside>
      <main id="conteudo" className="min-w-0 px-5 py-8 md:px-10">
        <Outlet />
      </main>
    </div>
  );
}
