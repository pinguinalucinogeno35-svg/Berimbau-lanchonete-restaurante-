// Validação de arquivos enviados no painel. Não confia no MIME informado pelo navegador:
// confere extensão, tamanho e a assinatura (primeiros bytes) do conteúdo.
// O bucket do Supabase aplica de novo limite de tamanho e tipos (defesa em profundidade).

export type AssetKind = 'glb' | 'usdz' | 'image';

export const LIMITS: Record<AssetKind, number> = {
  glb: 25 * 1024 * 1024,
  usdz: 30 * 1024 * 1024,
  image: 5 * 1024 * 1024,
};

/** Orçamento recomendado (aviso, não bloqueio) para modelos principais. */
export const GLB_BUDGET_BYTES = 5 * 1024 * 1024;

const EXT: Record<AssetKind, string[]> = {
  glb: ['glb'],
  usdz: ['usdz'],
  image: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
};

export const CONTENT_TYPE: Record<string, string> = {
  glb: 'model/gltf-binary',
  usdz: 'model/vnd.usdz+zip',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
};

export const contentTypeFor = (extension: string | undefined): string =>
  (extension && CONTENT_TYPE[extension]) || 'application/octet-stream';

export interface ValidationResult {
  ok: boolean;
  error?: string;
  warning?: string;
  extension?: string;
}

const startsWith = (b: Uint8Array, sig: number[], offset = 0) => sig.every((v, i) => b[offset + i] === v);
const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.slice(from, to));

export function detectSignature(bytes: Uint8Array): 'glb' | 'zip' | 'png' | 'jpeg' | 'webp' | 'avif' | null {
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'glTF') {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return dv.getUint32(4, true) === 2 ? 'glb' : null; // só glTF 2.0
  }
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return 'zip';
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return 'webp';
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === 'ftyp' && /avi[fs]/.test(ascii(bytes, 8, 12)))
    return 'avif';
  return null;
}

export function validateAssetBytes(
  kind: AssetKind,
  fileName: string,
  size: number,
  header: Uint8Array,
): ValidationResult {
  const extension = fileName.toLowerCase().split('.').pop() ?? '';
  if (!EXT[kind].includes(extension))
    return {
      ok: false,
      error: `Extensão .${extension || '?'} não permitida (esperado: ${EXT[kind].join(', ')}).`,
    };
  if (size <= 0) return { ok: false, error: 'Arquivo vazio.' };
  if (size > LIMITS[kind])
    return {
      ok: false,
      error: `Arquivo maior que o limite de ${Math.round(LIMITS[kind] / 1024 / 1024)} MB.`,
    };
  const sig = detectSignature(header);
  const esperado =
    kind === 'glb'
      ? sig === 'glb'
      : kind === 'usdz'
        ? sig === 'zip'
        : sig !== null && sig !== 'glb' && sig !== 'zip';
  if (!esperado) return { ok: false, error: 'O conteúdo do arquivo não corresponde ao tipo informado.' };
  if (kind === 'image' && sig && !(sig === extension || (sig === 'jpeg' && extension === 'jpg'))) {
    return { ok: false, error: `A imagem é ${sig.toUpperCase()}, mas a extensão é .${extension}.` };
  }
  if (
    kind === 'usdz' &&
    ascii(header, 30, 30 + Math.min(40, header[26] ?? 0)).match(/\.(usdc|usda|usd)$/) === null
  ) {
    return {
      ok: true,
      extension,
      warning: 'O primeiro item do USDZ não é um arquivo USD; confira se foi exportado corretamente.',
    };
  }
  if (kind === 'glb' && size > GLB_BUDGET_BYTES) {
    return {
      ok: true,
      extension,
      warning: 'Modelo acima de 5 MB: considere otimizar texturas e malha para celulares.',
    };
  }
  return { ok: true, extension };
}

export async function validateAssetFile(kind: AssetKind, file: File): Promise<ValidationResult> {
  const header = new Uint8Array(await file.slice(0, 128).arrayBuffer());
  return validateAssetBytes(kind, file.name, file.size, header);
}
