// Visualizador 3D + realidade aumentada reutilizável, baseado no <model-viewer> (Google).
// - Carrega o <model-viewer> e o modelo só quando este componente é montado (nunca nos cards).
// - AR só é oferecida quando o próprio <model-viewer> confirma `canActivateAR` no aparelho.
// - Modos AR oficiais: WebXR (Android/Chrome), Scene Viewer (Android) e Quick Look (iOS).
// - Qualquer falha cai para o 3D ou para a foto; o cardápio nunca é bloqueado.
import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { ModelViewerElement } from '@google/model-viewer';
import { Box, Loader2, RotateCcw, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { cn } from '@/lib/cn';
import { supportsWebGL } from '@/lib/device';
import {
  initialViewerState,
  viewerMessage,
  viewerReducer,
  type LoadErrorKind,
} from '@/features/augmented-reality/viewerState';
import type { Dimensions } from '@/types/domain';

export interface ARProductViewerProps {
  productId: string;
  name: string;
  alt: string;
  glbUrl: string | null;
  usdzUrl?: string | null;
  posterUrl?: string | null;
  dimensions?: Dimensions | null;
  /** Só modelos aprovados são exibidos. */
  approved: boolean;
  scaleVerified: boolean;
  scaleLocked: boolean;
  /** Sobrescreve a escala na AR: 'fixed' = tamanho real cadastrado; 'auto' = livre (o cliente pode ampliar). */
  arScale?: 'fixed' | 'auto';
  isDemo?: boolean;
  variant?: 'inline' | 'immersive';
  /** Mostrar o botão de AR dentro do componente (na página de produto ele fica na página de experiência). */
  showArButton?: boolean;
  onModelOpen?: () => void;
  onArLaunch?: () => void;
  onArError?: (reason: string) => void;
  onArReturn?: () => void;
  onLoadError?: (kind: LoadErrorKind) => void;
  className?: string;
}

const SLOW_AFTER_MS = 10_000;
/** Se a AR não abrir nem a página sair de foco nesse tempo, libera o botão e explica. */
const AR_STALL_MS = 12_000;

let modelViewerImport: Promise<unknown> | null = null;
export function loadModelViewer(): Promise<unknown> {
  modelViewerImport ??= import('@google/model-viewer').catch((e) => {
    modelViewerImport = null;
    throw e;
  });
  return modelViewerImport;
}

/** Distingue arquivo inexistente de arquivo inválido/rede depois de uma falha de carregamento. */
async function classifyLoadError(url: string): Promise<LoadErrorKind> {
  if (!navigator.onLine) return 'interrupted';
  try {
    const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (r.status === 404 || r.status === 403 || r.status === 400) return 'missing';
    return r.ok ? 'invalid' : 'interrupted';
  } catch {
    return 'interrupted';
  }
}

export function ARProductViewer(props: ARProductViewerProps) {
  const {
    glbUrl,
    usdzUrl,
    posterUrl,
    alt,
    approved,
    scaleLocked,
    arScale,
    variant = 'inline',
    showArButton = false,
    onModelOpen,
    onArLaunch,
    onArError,
    onArReturn,
    onLoadError,
    className,
  } = props;
  const [state, dispatch] = useReducer(viewerReducer, initialViewerState);
  const mvRef = useRef<ModelViewerElement | null>(null);
  const leftPage = useRef(false);
  const callbacks = useRef({ onModelOpen, onArLaunch, onArError, onArReturn, onLoadError });
  useEffect(() => {
    callbacks.current = { onModelOpen, onArLaunch, onArError, onArReturn, onLoadError };
  });

  // 1) Pré-condições e carregamento do componente <model-viewer>.
  useEffect(() => {
    if (!glbUrl || !approved) {
      dispatch({ type: 'NO_MODEL' });
      return;
    }
    if (!supportsWebGL()) {
      dispatch({ type: 'WEBGL_UNSUPPORTED' });
      return;
    }
    let ativo = true;
    dispatch({ type: 'START' });
    loadModelViewer().catch(() => {
      if (ativo) dispatch({ type: 'LOAD_FAILED', kind: 'interrupted' });
    });
    return () => {
      ativo = false;
    };
  }, [glbUrl, approved]);

  // 2) Aviso de rede lenta.
  useEffect(() => {
    if (state.viewer !== 'loading') return;
    const t = window.setTimeout(() => dispatch({ type: 'SLOW' }), SLOW_AFTER_MS);
    return () => window.clearTimeout(t);
  }, [state.viewer, state.attempt]);

  // 3) Eventos do <model-viewer>.
  const ligarEventos = useCallback(
    (mv: ModelViewerElement | null) => {
      mvRef.current = mv;
      if (!mv || !glbUrl) return;
      const onProgress = (e: Event) =>
        dispatch({
          type: 'PROGRESS',
          value: (e as CustomEvent<{ totalProgress: number }>).detail.totalProgress,
        });
      const onLoad = () => {
        dispatch({ type: 'LOADED', canActivateAR: Boolean(mv.canActivateAR) });
        callbacks.current.onModelOpen?.();
      };
      const onError = async (e: Event) => {
        const tipo = (e as CustomEvent<{ type?: string }>).detail?.type;
        if (tipo && tipo !== 'loadfailure') return;
        const kind = await classifyLoadError(glbUrl);
        dispatch({ type: 'LOAD_FAILED', kind });
        callbacks.current.onLoadError?.(kind);
      };
      const onArStatus = (e: Event) => {
        const status = (e as CustomEvent<{ status: string }>).detail.status;
        if (status === 'session-started') dispatch({ type: 'AR_SESSION_STARTED' });
        else if (status === 'failed') {
          dispatch({ type: 'AR_FAILED' });
          callbacks.current.onArError?.('ar-status-failed');
        } else if (status === 'not-presenting') {
          dispatch({ type: 'AR_RETURNED' });
        }
      };
      mv.addEventListener('progress', onProgress);
      mv.addEventListener('load', onLoad);
      mv.addEventListener('error', onError);
      mv.addEventListener('ar-status', onArStatus);
      return () => {
        mv.removeEventListener('progress', onProgress);
        mv.removeEventListener('load', onLoad);
        mv.removeEventListener('error', onError);
        mv.removeEventListener('ar-status', onArStatus);
      };
    },
    [glbUrl],
  );

  // 4) Retorno de Scene Viewer / Quick Look: o navegador some e volta (visibilitychange).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && (state.ar === 'launching' || state.ar === 'presenting'))
        leftPage.current = true;
      if (document.visibilityState === 'visible' && leftPage.current) {
        leftPage.current = false;
        dispatch({ type: 'AR_RETURNED' });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [state.ar]);

  // 5) Proteção: AR pedida mas nada aconteceu (sem Scene Viewer/Quick Look/WebXR respondendo).
  useEffect(() => {
    if (state.ar !== 'launching') return;
    const t = window.setTimeout(() => {
      if (leftPage.current) return;
      dispatch({ type: 'AR_STALLED' });
      callbacks.current.onArError?.('timeout');
    }, AR_STALL_MS);
    return () => window.clearTimeout(t);
  }, [state.ar]);

  // Registra o retorno da AR uma única vez por sessão AR.
  const ultimoAr = useRef(state.ar);
  useEffect(() => {
    if (state.ar === 'returned' && ultimoAr.current !== 'returned') callbacks.current.onArReturn?.();
    ultimoAr.current = state.ar;
  }, [state.ar]);

  const iniciarAr = async () => {
    const mv = mvRef.current;
    if (!mv || !mv.canActivateAR) return;
    dispatch({ type: 'AR_LAUNCH' });
    callbacks.current.onArLaunch?.();
    try {
      await mv.activateAR();
    } catch {
      dispatch({ type: 'AR_FAILED' });
      callbacks.current.onArError?.('activate-exception');
    }
  };

  const mensagem = viewerMessage(state);
  const altura = variant === 'immersive' ? 'h-[min(68dvh,640px)]' : 'aspect-square sm:aspect-[4/3]';
  const mostrarViewer = state.viewer === 'loading' || state.viewer === 'ready';
  const fallbackImagem = posterUrl ? (
    <img src={posterUrl} alt={alt} className="size-full object-contain" />
  ) : null;

  return (
    <div
      className={cn('flex flex-col gap-3', className)}
      data-viewer-state={state.viewer}
      data-ar-state={state.ar}
    >
      <div className={cn('relative w-full overflow-hidden rounded-sm border border-line bg-bg-alt', altura)}>
        {mostrarViewer && glbUrl ? (
          <model-viewer
            key={state.attempt}
            ref={ligarEventos as never}
            src={
              state.attempt
                ? `${glbUrl}${glbUrl.includes('?') ? '&' : '?'}tentativa=${state.attempt}`
                : glbUrl
            }
            ios-src={usdzUrl ?? undefined}
            poster={posterUrl ?? undefined}
            alt={alt}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale={arScale ?? (scaleLocked ? 'fixed' : 'auto')}
            ar-placement="floor"
            camera-controls
            touch-action="pan-y"
            interaction-prompt="auto"
            shadow-intensity="1"
            shadow-softness="0.85"
            exposure="1"
            environment-image="neutral"
            xr-environment
            camera-orbit="30deg 72deg auto"
            loading="eager"
            reveal="auto"
          >
            {/* Botão e barra padrão do model-viewer ficam ocultos: usamos os nossos, acessíveis. */}
            <div slot="ar-button" hidden />
            <div slot="progress-bar" hidden />
          </model-viewer>
        ) : (
          <div className="grid size-full place-items-center">
            {fallbackImagem ?? <Box className="size-10 text-muted" aria-hidden="true" />}
          </div>
        )}

        {state.viewer === 'loading' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2 text-sm text-muted" role="status" aria-live="polite">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Carregando modelo 3D {state.progress > 0 ? `· ${Math.round(state.progress * 100)}%` : ''}
            </div>
            <div className="h-0.5 w-full bg-line" aria-hidden="true">
              <div
                className="h-full bg-accent transition-[width] duration-200"
                style={{ width: `${Math.round(state.progress * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {mensagem && (
        <Notice
          tone={
            state.viewer === 'error' && state.error !== 'no-model'
              ? 'error'
              : state.ar === 'failed' || state.slow
                ? 'warning'
                : 'info'
          }
          action={
            state.viewer === 'error' && state.error !== 'no-model' && state.error !== 'missing' ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => dispatch({ type: 'RETRY' })}
                icon={<RotateCcw className="size-4" aria-hidden="true" />}
              >
                Tentar de novo
              </Button>
            ) : undefined
          }
        >
          {mensagem}
        </Notice>
      )}

      {showArButton && (state.viewer === 'ready' || state.viewer === 'loading') && (
        <Button
          size="lg"
          onClick={iniciarAr}
          disabled={
            !(state.ar === 'available' || state.ar === 'returned' || state.ar === 'failed') ||
            state.viewer !== 'ready'
          }
          icon={
            state.ar === 'launching' ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <ScanLine className="size-5" aria-hidden="true" />
            )
          }
          className="w-full"
          aria-describedby="ar-status-text"
        >
          {state.ar === 'launching'
            ? 'Abrindo realidade aumentada…'
            : state.ar === 'returned' || state.ar === 'failed'
              ? 'Ver na minha mesa de novo'
              : 'Ver na minha mesa'}
        </Button>
      )}
      {showArButton && (
        <p id="ar-status-text" className="text-xs text-muted">
          {state.viewer !== 'ready'
            ? 'A realidade aumentada fica disponível depois que o modelo carrega.'
            : state.ar === 'unavailable'
              ? 'A realidade aumentada não está disponível neste aparelho ou navegador. Você pode girar e ampliar o modelo em 3D acima.'
              : 'Usa a realidade aumentada do próprio aparelho. Nenhuma imagem da câmera é enviada ou gravada.'}
        </p>
      )}
    </div>
  );
}
