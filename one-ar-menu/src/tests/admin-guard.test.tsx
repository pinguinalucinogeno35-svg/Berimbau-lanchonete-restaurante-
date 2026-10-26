import { screen } from '@testing-library/react';
import { RequireAdmin } from '@/features/authentication/RequireAdmin';
import { renderRoutes } from './render';

it('sem Supabase/sessão, rotas /admin redirecionam para o login', async () => {
  renderRoutes(
    [
      {
        path: '/admin',
        element: (
          <RequireAdmin>
            <p>conteúdo protegido</p>
          </RequireAdmin>
        ),
      },
      { path: '/admin/login', element: <p>tela de login</p> },
    ],
    '/admin',
  );
  expect(await screen.findByText('tela de login')).toBeInTheDocument();
  expect(screen.queryByText('conteúdo protegido')).not.toBeInTheDocument();
});
