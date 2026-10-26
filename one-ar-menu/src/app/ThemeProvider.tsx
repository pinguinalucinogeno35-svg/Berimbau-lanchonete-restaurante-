// Aplica a identidade do restaurante (theme_settings) sobre os tokens padrão, em tempo de execução.
import { useEffect, type ReactNode } from 'react';
import { useRestaurant } from '@/hooks/useMenu';
import type { ThemeSettings } from '@/types/domain';

const HEX = /^#[0-9a-f]{6}$/i;
const FONTE = /^[\w\s'-]{1,60}$/;

const MAPA: Array<[keyof NonNullable<ThemeSettings['colors']>, string]> = [
  ['bg', '--one-bg'],
  ['bgAlt', '--one-bg-alt'],
  ['surface', '--one-surface'],
  ['accent', '--one-accent'],
  ['olive', '--one-olive'],
  ['text', '--one-text'],
  ['textDark', '--one-text-dark'],
];

export function applyTheme(theme: ThemeSettings, root: HTMLElement = document.documentElement): () => void {
  const aplicados: string[] = [];
  for (const [chave, variavel] of MAPA) {
    const valor = theme.colors?.[chave];
    if (valor && HEX.test(valor)) {
      root.style.setProperty(variavel, valor);
      aplicados.push(variavel);
    }
  }
  if (theme.fonts?.display && FONTE.test(theme.fonts.display)) {
    root.style.setProperty('--one-font-display', `'${theme.fonts.display}', serif`);
    aplicados.push('--one-font-display');
  }
  if (theme.fonts?.body && FONTE.test(theme.fonts.body)) {
    root.style.setProperty('--one-font-body', `'${theme.fonts.body}', system-ui, sans-serif`);
    aplicados.push('--one-font-body');
  }
  return () => aplicados.forEach((v) => root.style.removeProperty(v));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data } = useRestaurant();
  useEffect(() => {
    if (!data) return;
    const limpar = applyTheme(data.theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    const cor = data.theme.colors?.bg;
    if (meta && cor && HEX.test(cor)) meta.setAttribute('content', cor);
    return limpar;
  }, [data]);
  return children;
}
