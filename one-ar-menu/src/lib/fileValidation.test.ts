import { detectSignature, validateAssetBytes } from './fileValidation';

const glbHeader = () => {
  const b = new Uint8Array(20);
  b.set([0x67, 0x6c, 0x54, 0x46]); // "glTF"
  new DataView(b.buffer).setUint32(4, 2, true);
  return b;
};
const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...new Array(60).fill(0)]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);

describe('assinaturas de arquivo', () => {
  it('reconhece GLB 2.0, ZIP (USDZ), PNG e JPEG', () => {
    expect(detectSignature(glbHeader())).toBe('glb');
    expect(detectSignature(zip)).toBe('zip');
    expect(detectSignature(png)).toBe('png');
    expect(detectSignature(jpeg)).toBe('jpeg');
  });
  it('recusa glTF versão 1', () => {
    const b = glbHeader();
    new DataView(b.buffer).setUint32(4, 1, true);
    expect(detectSignature(b)).toBeNull();
  });
});

describe('validateAssetBytes', () => {
  it('aceita um GLB válido', () =>
    expect(validateAssetBytes('glb', 'coxinha.glb', 1000, glbHeader()).ok).toBe(true));
  it('não confia na extensão: conteúdo PNG com nome .glb é recusado', () => {
    expect(validateAssetBytes('glb', 'falso.glb', 1000, png)).toMatchObject({ ok: false });
  });
  it('recusa extensão errada', () =>
    expect(validateAssetBytes('glb', 'modelo.obj', 1000, glbHeader()).ok).toBe(false));
  it('recusa arquivo grande demais', () =>
    expect(validateAssetBytes('image', 'a.png', 50 * 1024 * 1024, png).ok).toBe(false));
  it('recusa imagem cuja extensão não bate com o conteúdo', () =>
    expect(validateAssetBytes('image', 'foto.png', 100, jpeg).ok).toBe(false));
  it('aceita JPEG com extensão .jpg', () =>
    expect(validateAssetBytes('image', 'foto.jpg', 100, jpeg).ok).toBe(true));
  it('avisa (sem bloquear) GLB acima do orçamento de 5 MB', () => {
    const r = validateAssetBytes('glb', 'grande.glb', 8 * 1024 * 1024, glbHeader());
    expect(r.ok).toBe(true);
    expect(r.warning).toMatch(/5 MB/);
  });
  it('USDZ precisa ser um ZIP', () => {
    expect(validateAssetBytes('usdz', 'm.usdz', 100, glbHeader()).ok).toBe(false);
    expect(validateAssetBytes('usdz', 'm.usdz', 100, zip).ok).toBe(true);
  });
});
