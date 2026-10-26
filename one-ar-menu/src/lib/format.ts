const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Formata centavos em reais (pt-BR). Valores inválidos viram "Preço indisponível". */
export function formatPrice(cents: number): string {
  if (!Number.isFinite(cents) || cents < 0) return 'Preço indisponível';
  return brl.format(Math.round(cents) / 100).replace(/\u00a0/g, ' ');
}

/** Converte texto digitado ("12,50", "R$ 12.50") em centavos. Retorna null se inválido. */
export function parsePriceToCents(input: string): number | null {
  const limpo = input.replace(/[^\d,.-]/g, '').trim();
  if (!limpo) return null;
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  const valor = Number(normalizado);
  if (!Number.isFinite(valor) || valor < 0) return null;
  return Math.round(valor * 100);
}

export function formatDimensions(d: { widthCm: number; heightCm: number; depthCm: number }): string {
  const n = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return `${n(d.widthCm)} × ${n(d.depthCm)} × ${n(d.heightCm)} cm`;
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
}

export function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
