// Detecção de plataforma usada para escolher a orientação de AR. Nunca usada como garantia de suporte:
// o suporte real é confirmado pelo <model-viewer> (canActivateAR) no aparelho.
import type { DeviceCategory } from '@/types/domain';

export interface DeviceInfo {
  os: 'ios' | 'android' | 'other';
  category: DeviceCategory;
  isStandalonePwa: boolean;
  inAppBrowser: string | null;
  isSecureContext: boolean;
}

const IN_APP: Array<[RegExp, string]> = [
  [/Instagram/i, 'Instagram'],
  [/FBAN|FBAV|FB_IAB/i, 'Facebook'],
  [/Line\//i, 'LINE'],
  [/TikTok|musical_ly|Bytedance/i, 'TikTok'],
  [/LinkedInApp/i, 'LinkedIn'],
  [/Snapchat/i, 'Snapchat'],
];

export function detectDevice(
  nav: Pick<Navigator, 'userAgent' | 'maxTouchPoints'> = navigator,
  win: Window = window,
): DeviceInfo {
  const ua = nav.userAgent || '';
  const iPadOs = /Macintosh/.test(ua) && (nav.maxTouchPoints ?? 0) > 1;
  const os: DeviceInfo['os'] =
    /iPhone|iPad|iPod/.test(ua) || iPadOs ? 'ios' : /Android/i.test(ua) ? 'android' : 'other';
  const tablet = iPadOs || /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const mobile = !tablet && (os !== 'other' || /Mobi/i.test(ua));
  const standalone =
    (typeof win.matchMedia === 'function' && win.matchMedia('(display-mode: standalone)').matches) ||
    (nav as Navigator & { standalone?: boolean }).standalone === true;
  return {
    os,
    category: tablet ? 'tablet' : mobile ? 'mobile' : 'desktop',
    isStandalonePwa: Boolean(standalone),
    inAppBrowser: IN_APP.find(([re]) => re.test(ua))?.[1] ?? null,
    isSecureContext: Boolean(win.isSecureContext),
  };
}

/** WebGL disponível? Necessário para o visualizador 3D. */
export function supportsWebGL(doc: Document = document): boolean {
  try {
    const canvas = doc.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
