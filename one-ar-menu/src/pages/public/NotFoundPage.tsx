import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';

export default function NotFoundPage() {
  return (
    <EmptyState title="Página não encontrada">
      <p className="mb-5">O endereço pode ter mudado.</p>
      <ButtonLink to="/cardapio" variant="secondary">
        Ir para o cardápio
      </ButtonLink>
    </EmptyState>
  );
}
