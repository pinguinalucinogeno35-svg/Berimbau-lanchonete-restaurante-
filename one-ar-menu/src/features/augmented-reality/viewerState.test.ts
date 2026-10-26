import {
  initialViewerState as s0,
  viewerMessage,
  viewerReducer as r,
  type ViewerAction,
  type ViewerState,
} from './viewerState';

const run = (...acoes: ViewerAction[]): ViewerState => acoes.reduce(r, s0);

describe('máquina de estados do visualizador', () => {
  it('carregando → pronto com AR disponível', () => {
    const s = run(
      { type: 'START' },
      { type: 'PROGRESS', value: 0.4 },
      { type: 'LOADED', canActivateAR: true },
    );
    expect(s).toMatchObject({ viewer: 'ready', progress: 1, ar: 'available' });
  });
  it('pronto sem AR no aparelho', () =>
    expect(run({ type: 'START' }, { type: 'LOADED', canActivateAR: false }).ar).toBe('unavailable'));
  it('progresso nunca regride e fica entre 0 e 1', () => {
    const s = run(
      { type: 'START' },
      { type: 'PROGRESS', value: 0.7 },
      { type: 'PROGRESS', value: 0.2 },
      { type: 'PROGRESS', value: 5 },
    );
    expect(s.progress).toBe(1);
  });
  it('rede lenta gera aviso só durante o carregamento', () => {
    expect(run({ type: 'START' }, { type: 'SLOW' }).slow).toBe(true);
    expect(run({ type: 'START' }, { type: 'LOADED', canActivateAR: true }, { type: 'SLOW' }).slow).toBe(
      false,
    );
  });
  it.each(['missing', 'invalid', 'interrupted'] as const)('falha de carregamento: %s', (kind) => {
    const s = run({ type: 'START' }, { type: 'LOAD_FAILED', kind });
    expect(s).toMatchObject({ viewer: 'error', error: kind, ar: 'unavailable' });
    expect(viewerMessage(s)).toBeTruthy();
  });
  it('tentar de novo recomeça o carregamento', () => {
    const s = run({ type: 'START' }, { type: 'LOAD_FAILED', kind: 'interrupted' }, { type: 'RETRY' });
    expect(s).toMatchObject({ viewer: 'loading', error: null, attempt: 1 });
  });
  it('WebGL indisponível', () => {
    const s = run({ type: 'WEBGL_UNSUPPORTED' });
    expect(s.viewer).toBe('unsupported-webgl');
    expect(viewerMessage(s)).toMatch(/WebGL/);
  });
  it('fluxo AR: iniciar → sessão → retorno', () => {
    const s = run(
      { type: 'START' },
      { type: 'LOADED', canActivateAR: true },
      { type: 'AR_LAUNCH' },
      { type: 'AR_SESSION_STARTED' },
      { type: 'AR_RETURNED' },
    );
    expect(s.ar).toBe('returned');
  });
  it('falha ao ativar AR mantém o 3D disponível', () => {
    const s = run(
      { type: 'START' },
      { type: 'LOADED', canActivateAR: true },
      { type: 'AR_LAUNCH' },
      { type: 'AR_FAILED' },
    );
    expect(s).toMatchObject({ viewer: 'ready', ar: 'failed' });
  });
  it('AR pedida sem resposta vira falha recuperável (botão volta a funcionar)', () => {
    const s = run(
      { type: 'START' },
      { type: 'LOADED', canActivateAR: true },
      { type: 'AR_LAUNCH' },
      { type: 'AR_STALLED' },
    );
    expect(s.ar).toBe('failed');
    expect(r(s, { type: 'AR_LAUNCH' }).ar).toBe('launching');
  });
  it('sessão WebXR que começa depois do aviso de demora é aceita', () => {
    const s = run(
      { type: 'START' },
      { type: 'LOADED', canActivateAR: true },
      { type: 'AR_LAUNCH' },
      { type: 'AR_STALLED' },
      { type: 'AR_SESSION_STARTED' },
    );
    expect(s.ar).toBe('presenting');
  });
  it('não inicia AR quando indisponível', () => {
    const s = run({ type: 'START' }, { type: 'LOADED', canActivateAR: false }, { type: 'AR_LAUNCH' });
    expect(s.ar).toBe('unavailable');
  });
  it('carregamento concluído não apaga um erro anterior', () => {
    const s = run(
      { type: 'START' },
      { type: 'LOAD_FAILED', kind: 'invalid' },
      { type: 'LOADED', canActivateAR: true },
    );
    expect(s.viewer).toBe('error');
  });
});
