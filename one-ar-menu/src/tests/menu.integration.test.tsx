// Integração: páginas públicas com o repositório demonstrativo e o roteador real.
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuPage from '@/pages/public/MenuPage';
import ProductPage from '@/pages/public/ProductPage';
import { renderRoutes } from './render';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, vi.fn()], updateServiceWorker: vi.fn() }),
}));

const routes = [
  { path: '/cardapio', element: <MenuPage /> },
  { path: '/produto/:slug', element: <ProductPage /> },
];

describe('cardápio', () => {
  it('lista produtos publicados agrupados por categoria e marca os que têm 3D', async () => {
    renderRoutes(routes, '/cardapio');
    expect(await screen.findByRole('heading', { name: 'Salgados' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Coxinha demonstrativa/ })).toBeInTheDocument();
    expect(screen.queryByText('Produto não publicado')).not.toBeInTheDocument();
    const card = screen.getByRole('link', { name: /Coxinha demonstrativa/ });
    expect(within(card).getByText('3D')).toBeInTheDocument();
  });

  it('filtra por categoria', async () => {
    const user = userEvent.setup();
    renderRoutes(routes, '/cardapio');
    await user.click(await screen.findByRole('button', { name: 'Sobremesas' }));
    expect(screen.getByRole('button', { name: 'Sobremesas' })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: /Coxinha demonstrativa/ })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: /Sobremesa demonstrativa/ })).toBeInTheDocument();
  });

  it('busca por nome sem acento e mostra estado vazio', async () => {
    const user = userEvent.setup();
    renderRoutes(routes, '/cardapio');
    const busca = await screen.findByRole('searchbox');
    await user.type(busca, 'hamburguer');
    await waitFor(() => expect(screen.getAllByRole('link', { name: /demonstrativ/ })).toHaveLength(1));
    await user.clear(busca);
    await user.type(busca, 'zzzz');
    expect(await screen.findByText('Nada encontrado')).toBeInTheDocument();
  });

  it('indica produto indisponível', async () => {
    renderRoutes(routes, '/cardapio');
    expect(
      await screen.findByRole('link', { name: /Risoto demonstrativo, indisponível/ }),
    ).toBeInTheDocument();
  });
});

describe('página do produto', () => {
  it('mostra preço, alergênicos e o botão de AR só para produto com modelo aprovado', async () => {
    renderRoutes(routes, '/produto/coxinha-demonstrativa');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Coxinha demonstrativa' }),
    ).toBeInTheDocument();
    expect(screen.getByText('R$ 9,00')).toBeInTheDocument();
    expect(screen.getByText(/glúten, leite/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver na minha mesa' })).toHaveAttribute(
      'href',
      '/experiencia/coxinha-demonstrativa',
    );
    expect(screen.getByText(/não verificada presencialmente/)).toBeInTheDocument();
  });

  it('produto sem modelo não oferece AR nem 3D', async () => {
    renderRoutes(routes, '/produto/empada-demonstrativa');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Empada demonstrativa' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ver na minha mesa' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Ver em 3D' })).not.toBeInTheDocument();
  });

  it('produto inexistente ou não publicado mostra "não encontrado"', async () => {
    renderRoutes(routes, '/produto/produto-nao-publicado');
    expect(await screen.findByText('Produto não encontrado')).toBeInTheDocument();
  });
});
