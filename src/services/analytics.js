// Ponto único de métricas. Troque o corpo de `track` pelo Plausible ou GA4 quando definido.
const CHAVE_ORIGEM = 'berimbau:origem';

// Guarda de onde o cliente veio (?origem=instagram, qr-mesa, qr-balcao...) durante a visita.
export function registrarOrigem(valor) {
  if (!valor) return;
  try { sessionStorage.setItem(CHAVE_ORIGEM, String(valor).slice(0, 40)); } catch { /* sem sessão */ }
}

export function origem() {
  try { return sessionStorage.getItem(CHAVE_ORIGEM) || 'direto'; } catch { return 'direto'; }
}

export function track(evento, dados = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: evento, origem: origem(), ...dados });
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') console.debug('[track]', evento, dados);
}
