import { createBrowserRouter, Outlet, type RouteObject } from 'react-router';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ErrorState } from '@/components/ui/States';
import { RequireAdmin } from '@/features/authentication/RequireAdmin';

// Code splitting por rota: cada página vira um chunk carregado sob demanda.
const page = (loader: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await loader()).default,
});

function RouteError() {
  return (
    <ErrorState
      title="Não foi possível abrir esta página"
      message="Verifique a conexão e tente de novo."
      onRetry={() => window.location.reload()}
    />
  );
}

export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, lazy: page(() => import('@/pages/public/HomePage')) },
      { path: 'cardapio', lazy: page(() => import('@/pages/public/MenuPage')) },
      { path: 'produto/:slug', lazy: page(() => import('@/pages/public/ProductPage')) },
      { path: 'experiencia/:slug', lazy: page(() => import('@/pages/public/ExperiencePage')) },
      { path: 'sobre', lazy: page(() => import('@/pages/public/AboutPage')) },
      { path: 'q/:code', lazy: page(() => import('@/pages/public/QrRedirectPage')) },
      { path: '*', lazy: page(() => import('@/pages/public/NotFoundPage')) },
    ],
  },
  { path: 'admin/login', lazy: page(() => import('@/pages/admin/LoginPage')), errorElement: <RouteError /> },
  {
    path: 'admin',
    errorElement: <RouteError />,
    element: (
      <RequireAdmin>
        <Outlet />
      </RequireAdmin>
    ),
    children: [
      {
        lazy: async () => ({ Component: (await import('@/components/layout/AdminLayout')).AdminLayout }),
        children: [
          { index: true, lazy: page(() => import('@/pages/admin/DashboardPage')) },
          { path: 'produtos', lazy: page(() => import('@/pages/admin/ProductsPage')) },
          { path: 'produtos/:id', lazy: page(() => import('@/pages/admin/ProductEditPage')) },
          { path: 'categorias', lazy: page(() => import('@/pages/admin/CategoriesPage')) },
          { path: 'modelos-3d', lazy: page(() => import('@/pages/admin/Models3DPage')) },
          { path: 'qr-codes', lazy: page(() => import('@/pages/admin/QrCodesPage')) },
          { path: 'configuracoes', lazy: page(() => import('@/pages/admin/SettingsPage')) },
          { path: 'analytics', lazy: page(() => import('@/pages/admin/AnalyticsPage')) },
        ],
      },
    ],
  },
];

export const createRouter = () => createBrowserRouter(routes);
