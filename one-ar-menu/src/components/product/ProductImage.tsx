import { UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Product } from '@/types/domain';

/** Foto principal do produto ou um espaço neutro elegante (nunca uma imagem "inventada"). */
export function ProductImage({
  product,
  className,
  eager = false,
}: {
  product: Product;
  className?: string;
  eager?: boolean;
}) {
  const foto = product.media.find((m) => m.type === 'image') ?? product.media[0];
  if (foto) {
    return (
      <img
        src={foto.url}
        alt={foto.alt || product.name}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        width={800}
        height={800}
        className={cn('size-full object-contain', className)}
      />
    );
  }
  return (
    <div
      className={cn('grid size-full place-items-center bg-bg-alt', className)}
      role="img"
      aria-label={`${product.name}: fotografia ainda não disponível`}
    >
      <div className="flex flex-col items-center gap-2 text-muted/70">
        <UtensilsCrossed className="size-7" aria-hidden="true" strokeWidth={1.25} />
        <span className="text-[0.65rem] uppercase tracking-[0.18em]">Foto em breve</span>
      </div>
    </div>
  );
}
