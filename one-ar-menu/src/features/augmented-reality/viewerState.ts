// Máquina de estados do visualizador 3D/AR. Pura (sem DOM) para ser testável.

export type ViewerStatus = 'idle' | 'unsupported-webgl' | 'loading' | 'ready' | 'error';
export type ArStatus =
  'unknown' | 'available' | 'unavailable' | 'launching' | 'presenting' | 'returned' | 'failed';
export type LoadErrorKind = 'missing' | 'invalid' | 'interrupted' | 'no-model';

export interface ViewerState {
  viewer: ViewerStatus;
  progress: number; // 0..1
  slow: boolean;
  error: LoadErrorKind | null;
  ar: ArStatus;
  attempt: number;
}

export type ViewerAction =
  | { type: 'START' }
  | { type: 'NO_MODEL' }
  | { type: 'WEBGL_UNSUPPORTED' }
  | { type: 'PROGRESS'; value: number }
  | { type: 'SLOW' }
  | { type: 'LOADED'; canActivateAR: boolean }
  | { type: 'LOAD_FAILED'; kind: LoadErrorKind }
  | { type: 'RETRY' }
  | { type: 'AR_LAUNCH' }
  | { type: 'AR_SESSION_STARTED' }
  | { type: 'AR_FAILED' }
  /** A AR foi pedida, mas nada aconteceu (página continuou visível, sem sessão). */
  | { type: 'AR_STALLED' }
  | { type: 'AR_RETURNED' };

export const initialViewerState: ViewerState = {
  viewer: 'idle',
  progress: 0,
  slow: false,
  error: null,
  ar: 'unknown',
  attempt: 0,
};

export function viewerReducer(state: ViewerState, action: ViewerAction): ViewerState {
  switch (action.type) {
    case 'START':
      return state.viewer === 'idle'
        ? { ...state, viewer: 'loading', progress: 0, slow: false, error: null }
        : state;
    case 'NO_MODEL':
      return { ...state, viewer: 'error', error: 'no-model', ar: 'unavailable' };
    case 'WEBGL_UNSUPPORTED':
      return { ...state, viewer: 'unsupported-webgl', ar: 'unavailable' };
    case 'PROGRESS':
      if (state.viewer !== 'loading') return state;
      return { ...state, progress: Math.max(state.progress, Math.min(1, Math.max(0, action.value))) };
    case 'SLOW':
      return state.viewer === 'loading' ? { ...state, slow: true } : state;
    case 'LOADED':
      if (state.viewer === 'error' || state.viewer === 'unsupported-webgl') return state;
      return {
        ...state,
        viewer: 'ready',
        progress: 1,
        slow: false,
        ar: action.canActivateAR ? 'available' : 'unavailable',
      };
    case 'LOAD_FAILED':
      return { ...state, viewer: 'error', error: action.kind, slow: false, ar: 'unavailable' };
    case 'RETRY':
      return { ...initialViewerState, viewer: 'loading', attempt: state.attempt + 1 };
    case 'AR_LAUNCH':
      return state.ar === 'available' || state.ar === 'returned' || state.ar === 'failed'
        ? { ...state, ar: 'launching' }
        : state;
    case 'AR_SESSION_STARTED':
      // 'failed' também: a sessão WebXR pode começar depois do aviso de demora (ex.: permissão de câmera lenta).
      return state.ar === 'launching' || state.ar === 'failed' ? { ...state, ar: 'presenting' } : state;
    case 'AR_STALLED':
      return state.ar === 'launching' ? { ...state, ar: 'failed' } : state;
    case 'AR_FAILED':
      return state.ar === 'launching' || state.ar === 'presenting' ? { ...state, ar: 'failed' } : state;
    case 'AR_RETURNED':
      return state.ar === 'launching' || state.ar === 'presenting' ? { ...state, ar: 'returned' } : state;
    default:
      return state;
  }
}

/** Mensagem curta para cada estado relevante (exibida em texto, nunca só no 3D). */
export function viewerMessage(s: ViewerState): string | null {
  if (s.viewer === 'unsupported-webgl')
    return 'Este navegador não suporta visualização 3D (WebGL). As informações do produto continuam disponíveis abaixo.';
  if (s.viewer === 'error') {
    switch (s.error) {
      case 'missing':
        return 'O arquivo do modelo 3D não foi encontrado.';
      case 'invalid':
        return 'Não foi possível abrir o modelo 3D: o arquivo parece inválido.';
      case 'interrupted':
        return 'O download do modelo foi interrompido. Verifique a conexão e tente de novo.';
      case 'no-model':
        return 'Este produto ainda não tem modelo 3D publicado.';
      default:
        return 'Não foi possível carregar o modelo 3D.';
    }
  }
  if (s.viewer === 'loading' && s.slow) return 'A conexão está lenta. O modelo continua carregando…';
  if (s.ar === 'failed')
    return 'Não foi possível abrir a realidade aumentada neste aparelho. Você pode continuar explorando em 3D.';
  if (s.ar === 'returned') return 'Você voltou da realidade aumentada.';
  return null;
}
