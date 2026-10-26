// Camada mínima de métricas: só eventos de uso, sem dados pessoais. Falhas são silenciosas.
import { detectDevice } from '@/lib/device';
import { withMenu } from '@/repositories';
import type { AnalyticsEventType } from '@/types/domain';

const QR_KEY = 'one-ar-menu:qr';
const ONCE_KEY = 'one-ar-menu:once';

export function rememberQrCode(id: string | null) {
  try {
    if (id) sessionStorage.setItem(QR_KEY, id);
  } catch {
    /* sem sessionStorage */
  }
}

function currentQrCode(): string | null {
  try {
    return sessionStorage.getItem(QR_KEY);
  } catch {
    return null;
  }
}

/** Evita contar o mesmo evento repetidas vezes na mesma visita (ex.: abrir o cardápio de novo). */
function firstTimeInSession(key: string): boolean {
  try {
    const vistos = new Set<string>(JSON.parse(sessionStorage.getItem(ONCE_KEY) ?? '[]'));
    if (vistos.has(key)) return false;
    vistos.add(key);
    sessionStorage.setItem(ONCE_KEY, JSON.stringify([...vistos].slice(-300)));
    return true;
  } catch {
    return true;
  }
}

export function trackEvent(
  type: AnalyticsEventType,
  options: { productId?: string | null; oncePerSession?: boolean } = {},
) {
  if (options.oncePerSession && !firstTimeInSession(`${type}:${options.productId ?? ''}`)) return;
  try {
    const evento = {
      type,
      productId: options.productId ?? null,
      qrCodeId: currentQrCode(),
      deviceCategory: detectDevice().category,
    };
    void withMenu((r) => r.trackEvent(evento)).catch(() => undefined);
  } catch {
    /* nunca quebra a interface por causa de métricas */
  }
}
