// Orientações conforme o ambiente detectado. Não promete suporte: só explica caminhos possíveis.
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import type { DeviceInfo } from '@/lib/device';

function CopyLink() {
  const [ok, setOk] = useState(false);
  return (
    <Button
      size="sm"
      variant="secondary"
      icon={
        ok ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />
      }
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setOk(true);
        } catch {
          window.prompt('Copie o link:', window.location.href);
        }
      }}
    >
      {ok ? 'Link copiado' : 'Copiar link'}
    </Button>
  );
}

export function ArGuidance({ device }: { device: DeviceInfo }) {
  const navegador = device.os === 'ios' ? 'Safari' : 'Chrome';
  return (
    <div className="flex flex-col gap-3">
      {!device.isSecureContext && (
        <Notice tone="warning" title="Conexão sem HTTPS">
          A realidade aumentada exige uma conexão segura (HTTPS). Abra o endereço oficial do cardápio.
        </Notice>
      )}
      {device.inAppBrowser && (
        <Notice tone="warning" title={`Aberto dentro do ${device.inAppBrowser}`} action={<CopyLink />}>
          Navegadores internos de aplicativos costumam bloquear a realidade aumentada. Copie o link e abra no{' '}
          {navegador}.
        </Notice>
      )}
      {device.os === 'ios' && device.isStandalonePwa && (
        <Notice tone="info" title="App instalado no iPhone" action={<CopyLink />}>
          Se a realidade aumentada não abrir pelo app instalado, abra este mesmo link no Safari.
        </Notice>
      )}
      {device.os === 'android' && (
        <p className="text-xs leading-relaxed text-muted">
          No Android, a AR depende do Chrome atualizado e do “Google Play Services para RA” (ARCore). Se o
          aparelho não for compatível, o modelo continua disponível em 3D.
        </p>
      )}
      {device.os === 'ios' && !device.isStandalonePwa && (
        <p className="text-xs leading-relaxed text-muted">
          No iPhone, a AR abre pelo AR Quick Look do sistema. Use o Safari para melhor compatibilidade.
        </p>
      )}
    </div>
  );
}

export function ArSteps() {
  const passos = [
    'Toque em “Ver na minha mesa”.',
    'Aponte o celular para baixo, para o ponto da mesa à sua frente onde o prato ficaria, e mova devagar até a superfície ser reconhecida.',
    'O prato aparece onde o centro da tela aponta: se ficar longe, arraste-o com um dedo para perto de você.',
    'Para comparar o tamanho, deixe o prato virtual ao lado de um objeto real, à mesma distância. Longe, tudo parece menor.',
    'Feche a experiência para voltar ao cardápio.',
  ];
  return (
    <ol className="flex flex-col gap-2.5 text-sm text-muted">
      {passos.map((p, i) => (
        <li key={p} className="flex gap-3">
          <span className="font-display text-lg leading-5 text-accent">{i + 1}</span>
          <span>{p}</span>
        </li>
      ))}
    </ol>
  );
}
