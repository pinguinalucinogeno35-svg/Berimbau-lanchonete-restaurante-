import { render, screen } from '@testing-library/react';
import { ARProductViewer } from '@/components/ar/ARProductViewer';

const base = { productId: 'p', name: 'Coxinha', alt: 'Modelo', scaleVerified: false, scaleLocked: true };

describe('ARProductViewer', () => {
  it('sem URL do modelo: informa e não quebra', () => {
    render(<ARProductViewer {...base} glbUrl={null} approved />);
    expect(screen.getByText(/ainda não tem modelo 3D publicado/)).toBeInTheDocument();
  });
  it('modelo não aprovado não é exibido', () => {
    render(<ARProductViewer {...base} glbUrl="/x.glb" approved={false} />);
    expect(screen.getByText(/ainda não tem modelo 3D publicado/)).toBeInTheDocument();
    expect(document.querySelector('model-viewer')).toBeNull();
  });
  it('sem WebGL: mostra o poster e uma mensagem, sem botão de AR ativo', () => {
    // jsdom não tem WebGL, situação equivalente a um navegador sem suporte.
    render(<ARProductViewer {...base} glbUrl="/x.glb" posterUrl="/poster.webp" approved showArButton />);
    expect(screen.getByText(/não suporta visualização 3D/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Modelo' })).toHaveAttribute('src', '/poster.webp');
    expect(screen.queryByRole('button', { name: /Ver na minha mesa/ })).not.toBeInTheDocument();
  });
});
