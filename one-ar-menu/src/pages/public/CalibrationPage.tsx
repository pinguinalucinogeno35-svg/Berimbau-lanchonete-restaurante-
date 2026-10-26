// /calibrar — régua virtual de 30 cm para conferir se a AR do aparelho mostra o tamanho certo.
import { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { ARProductViewer } from '@/components/ar/ARProductViewer';
import { ArGuidance } from '@/components/ar/ArGuidance';
import { DesktopHandoff } from '@/components/ar/DesktopHandoff';
import { Notice } from '@/components/ui/Notice';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { detectDevice } from '@/lib/device';
import { versioned } from '@/data/demo';

const PASSOS = [
  'Coloque sobre a mesa uma régua de verdade ou uma folha A4 (o lado maior tem 29,7 cm).',
  'Toque em “Ver na minha mesa” e posicione a régua virtual encostada na real.',
  'Compare: a régua virtual tem 30 cm. Se as duas baterem, o aparelho está mostrando os pratos no tamanho cadastrado.',
  'Se não baterem, anote quantos centímetros a virtual mede pela régua real e o modelo do celular, e nos envie.',
];

export default function CalibrationPage() {
  const device = useMemo(() => detectDevice(), []);
  useDocumentTitle('Calibrar tamanho');
  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 pt-6">
      <Link to="/cardapio" className="mb-5 inline-flex items-center gap-2 text-sm text-muted hover:text-text">
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao cardápio
      </Link>
      <p className="eyebrow">Calibração</p>
      <h1 className="mt-1 text-4xl">Régua de 30 cm</h1>
      <p className="mt-3 text-muted">
        Use esta régua virtual para conferir a escala da realidade aumentada no seu aparelho. Ela é exibida
        sempre em tamanho fixo.
      </p>
      <div className="mt-6 flex flex-col gap-6">
        <ARProductViewer
          productId="calibracao"
          name="Régua de calibração"
          alt="Régua virtual de 30 centímetros para calibração"
          glbUrl={versioned('/demo/models/regua-calibracao-30cm.glb')}
          posterUrl={versioned('/demo/posters/regua-calibracao-30cm.webp')}
          dimensions={{ widthCm: 30, depthCm: 3.5, heightCm: 0.3 }}
          approved
          scaleVerified={false}
          scaleLocked
          variant="immersive"
          showArButton={device.category !== 'desktop'}
        />
        <ol className="flex flex-col gap-2.5 text-sm text-muted">
          {PASSOS.map((p, i) => (
            <li key={p} className="flex gap-3">
              <span className="font-display text-lg leading-5 text-accent">{i + 1}</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
        <Notice tone="info" title="Por que pode variar?">
          A AR estima a distância até a mesa pela câmera. Com pouca luz, mesa lisa demais (vidro, branca) ou o
          celular muito alto, a estimativa piora. Mova o celular devagar e mantenha a mesa bem iluminada.
        </Notice>
        {device.category === 'desktop' ? <DesktopHandoff path="/calibrar" /> : <ArGuidance device={device} />}
      </div>
    </div>
  );
}
