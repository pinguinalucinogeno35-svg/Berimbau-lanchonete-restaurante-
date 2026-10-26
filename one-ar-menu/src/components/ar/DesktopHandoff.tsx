// No computador não existe AR: oferece um QR code para abrir o mesmo produto no celular.
import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { publicUrl } from '@/config/env';

export function DesktopHandoff({ path }: { path: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const url = publicUrl(path);
  useEffect(() => {
    let ativo = true;
    import('qrcode')
      .then((qr) =>
        qr.toString(url, {
          type: 'svg',
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#202521', light: '#F6F2E9' },
        }),
      )
      .then((s) => ativo && setSvg(s))
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [url]);
  return (
    <div className="flex items-center gap-5 rounded-sm border border-line p-4">
      <div className="size-28 shrink-0 overflow-hidden rounded-sm bg-surface p-1" aria-hidden={!svg}>
        {svg && (
          <div
            className="size-full [&>svg]:size-full"
            role="img"
            aria-label="QR code para abrir no celular"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>
      <div className="text-sm">
        <p className="flex items-center gap-2 font-medium text-text">
          <Smartphone className="size-4 text-accent" aria-hidden="true" /> Abra no celular para ver na sua
          mesa
        </p>
        <p className="mt-1 text-muted">
          Aponte a câmera do celular para o código. A realidade aumentada funciona em aparelhos compatíveis.
        </p>
        <p className="mt-2 break-all text-xs text-muted/80">{url}</p>
      </div>
    </div>
  );
}
