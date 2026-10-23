// Ponto único de métricas. Troque o corpo de `track` pelo Plausible ou GA4 quando definido.
export function track(evento, dados = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: evento, ...dados });
  if (location.hostname === 'localhost') console.debug('[track]', evento, dados);
}
