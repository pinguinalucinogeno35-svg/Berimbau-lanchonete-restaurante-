// Identidade visual (tema) do cardápio. Os tokens de cada tema ficam em src/styles/index.css
// (:root[data-tema="..."]); aqui ficam nome, logo e textos usados no modo demonstrativo.
import type { Restaurant } from '@/types/domain';

export type BrandId = 'one' | 'berimbau';

export interface BrandPreset {
  id: BrandId;
  /** Cor do fundo, usada na barra do navegador (meta theme-color). */
  themeColor: string;
  /** Ícone da aba (quando diferente do padrão em index.html). */
  favicon?: string;
  /** Sobrescreve o restaurante demonstrativo (os produtos continuam demonstrativos). */
  demoRestaurant?: Partial<Pick<Restaurant, 'name' | 'description' | 'logoUrl' | 'coverUrl'>> & {
    info?: Partial<Restaurant['info']>;
  };
}

export const BRANDS: Record<BrandId, BrandPreset> = {
  one: { id: 'one', themeColor: '#111514' },
  berimbau: {
    id: 'berimbau',
    themeColor: '#FCF6EF',
    favicon: '/brand/berimbau/favicon-48.png',
    demoRestaurant: {
      name: 'Berimbau Gourmet',
      description: 'Gastronomia, tradição e uma experiência especial no coração de Ilhéus.',
      logoUrl: '/brand/berimbau/logo.webp',
      coverUrl: '/brand/berimbau/capa-centro-historico.webp',
      info: {
        tagline: 'Cafeteria · Lanchonete · Restaurante',
        heroTitle: 'Sabores que contam histórias.',
        heroSubtitle:
          'Explore o cardápio no coração de Ilhéus e veja alguns pratos em 3D. Em celulares compatíveis, coloque o prato sobre a sua mesa antes de pedir.',
        about:
          'Versão de teste da identidade visual do Berimbau Gourmet no cardápio digital. A história da casa, os pratos e os preços entram depois de aprovados pelo restaurante.',
        address: 'Centro histórico de Ilhéus (BA) · endereço a confirmar',
        openingHours: 'Horários a confirmar',
      },
    },
  },
};

const CHAVE = 'one-ar-menu:tema';

const valido = (v: string | null | undefined): v is BrandId => v === 'one' || v === 'berimbau';

/**
 * Ordem: ?tema= na URL (fica salvo no aparelho) → escolha salva → VITE_BRAND do build → "one".
 */
export function resolveBrand(
  search = typeof window !== 'undefined' ? window.location.search : '',
  padrao = import.meta.env.VITE_BRAND,
): BrandId {
  const daUrl = new URLSearchParams(search).get('tema');
  if (valido(daUrl)) {
    try {
      localStorage.setItem(CHAVE, daUrl);
    } catch {
      // armazenamento indisponível (aba anônima): vale só nesta visita
    }
    return daUrl;
  }
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (valido(salvo)) return salvo;
  } catch {
    // ignora
  }
  return valido(padrao) ? padrao : 'one';
}

export const brand: BrandPreset = BRANDS[resolveBrand()];

/** Aplica o tema no <html> antes da primeira renderização (evita piscar o tema errado). */
export function applyBrand(preset: BrandPreset = brand, root: HTMLElement = document.documentElement) {
  root.dataset.tema = preset.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', preset.themeColor);
  if (preset.favicon) {
    const icone = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icone) {
      icone.href = preset.favicon;
      icone.type = 'image/png';
    }
  }
}
