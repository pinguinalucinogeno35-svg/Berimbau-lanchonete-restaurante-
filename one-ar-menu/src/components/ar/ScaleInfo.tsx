import { Ruler } from 'lucide-react';
import { formatDimensions } from '@/lib/format';
import type { Dimensions } from '@/types/domain';

/** Informa a escala com honestidade: "tamanho real" só quando foi verificada presencialmente. */
export function ScaleInfo({
  dimensions,
  scaleVerified,
  scaleLocked,
}: {
  dimensions: Dimensions | null;
  scaleVerified: boolean;
  scaleLocked: boolean;
}) {
  return (
    <div className="flex items-start gap-3 text-sm text-muted">
      <Ruler className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
      <p>
        {dimensions ? (
          <>
            Medidas cadastradas: <span className="text-text">{formatDimensions(dimensions)}</span> (largura ×
            profundidade × altura).{' '}
          </>
        ) : (
          'Medidas ainda não cadastradas. '
        )}
        {scaleVerified
          ? 'Escala conferida presencialmente; o rastreamento do aparelho pode variar alguns milímetros.'
          : scaleLocked
            ? 'Exibido em escala aproximada às medidas cadastradas, ainda não verificada presencialmente.'
            : 'Escala livre: o tamanho na AR pode ser ajustado e não representa o tamanho real.'}
      </p>
    </div>
  );
}
