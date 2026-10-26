import { Link } from 'react-router';
import { Box } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { ProductImage } from '@/components/product/ProductImage';
import { cn } from '@/lib/cn';
import type { Product } from '@/types/domain';

export function ProductCard({ product, layout = 'row' }: { product: Product; layout?: 'row' | 'tile' }) {
  const indisponivel = !product.isAvailable;
  return (
    <Link
      to={`/produto/${product.slug}`}
      className={cn(
        'group flex gap-4 rounded-sm border border-line bg-bg-alt/60 p-3 transition-colors duration-200 hover:border-accent/40 hover:bg-bg-alt',
        layout === 'tile' && 'flex-col p-0',
        indisponivel && 'opacity-60',
      )}
      aria-label={`${product.name}, ${indisponivel ? 'indisponível no momento, ' : ''}ver detalhes`}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-sm bg-bg',
          layout === 'tile' ? 'aspect-square w-full rounded-b-none' : 'size-24 sm:size-28',
        )}
      >
        <ProductImage
          product={product}
          className="transition-transform duration-500 ease-one group-hover:scale-[1.03]"
        />
        {product.arModel && (
          <Badge
            tone="dark"
            className="absolute left-1.5 top-1.5"
            icon={<Box className="size-3" aria-hidden="true" />}
          >
            3D
          </Badge>
        )}
      </div>
      <div className={cn('flex min-w-0 flex-1 flex-col gap-1', layout === 'tile' && 'px-4 pb-4')}>
        <div className="flex flex-wrap items-center gap-1.5">
          {product.isFeatured && <Badge tone="accent">Destaque</Badge>}
          {indisponivel && <Badge tone="danger">Indisponível</Badge>}
        </div>
        <h3 className="font-display text-[1.3rem] leading-tight text-text">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-muted">{product.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Price cents={product.priceCents} />
          {product.arModel && <span className="text-xs text-olive-text">Ver em 3D</span>}
        </div>
      </div>
    </Link>
  );
}
