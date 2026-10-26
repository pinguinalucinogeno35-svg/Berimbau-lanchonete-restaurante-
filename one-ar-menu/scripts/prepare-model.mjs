// Prepara um GLB recebido para o cardápio (celular + AR):
//  - remove compressões que nem todo visualizador AR aceita (meshopt, quantização);
//  - simplifica a malha até um número-alvo de triângulos;
//  - escala para a LARGURA real informada (cm), centraliza e apoia a base em y = 0;
//  - reduz as texturas mantendo JPEG/PNG (formatos aceitos por Scene Viewer e Quick Look).
//
// Uso:
//   node scripts/prepare-model.mjs entrada.glb saida.glb --largura-cm 11.5 [--triangulos 120000] [--textura 1024]

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize, prune, simplify, textureCompress, weld, getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const args = process.argv.slice(2);
const [entrada, saida] = args;
const opt = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? Number(args[i + 1]) : padrao;
};
const larguraCm = opt('largura-cm', NaN);
const alvoTriangulos = opt('triangulos', 120000);
const textura = opt('textura', 1024);
if (!entrada || !saida || !Number.isFinite(larguraCm) || larguraCm <= 0) {
  console.error(
    'Uso: node scripts/prepare-model.mjs entrada.glb saida.glb --largura-cm 11.5 [--triangulos 120000] [--textura 1024]',
  );
  process.exit(1);
}

await MeshoptDecoder.ready;
await MeshoptSimplifier.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(entrada);
const root = doc.getRoot();

const contarTriangulos = () =>
  root
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((s, p) => s + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0);

const antes = {
  triangulos: Math.round(contarTriangulos()),
  extensoes: root.listExtensionsUsed().map((e) => e.extensionName),
};

// 1) Descompactar: geometria em float, sem extensões de compressão.
await doc.transform(dequantize());
for (const ext of root.listExtensionsUsed()) {
  if (
    ['EXT_meshopt_compression', 'KHR_mesh_quantization', 'KHR_draco_mesh_compression'].includes(
      ext.extensionName,
    )
  )
    ext.dispose();
}

// 2) Simplificar até o alvo.
const ratio = Math.min(1, alvoTriangulos / antes.triangulos);
if (ratio < 1)
  await doc.transform(
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.002, lockBorder: false }),
  );

// 3) Escala real, centro em X/Z e base em y = 0 (envolve a cena num nó-pai).
const cena = root.getDefaultScene() ?? root.listScenes()[0];
const b = getBounds(cena);
const largura = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2]);
const f = larguraCm / 100 / largura;
const pai = doc.createNode('modelo-preparado');
for (const filho of cena.listChildren()) {
  cena.removeChild(filho);
  pai.addChild(filho);
}
const cx = (b.min[0] + b.max[0]) / 2;
const cz = (b.min[2] + b.max[2]) / 2;
pai.setScale([f, f, f]).setTranslation([-cx * f, -b.min[1] * f, -cz * f]);
cena.addChild(pai);

// 4) Texturas menores, mantendo o formato original.
await doc.transform(textureCompress({ encoder: sharp, resize: [textura, textura], quality: 85 }), prune());

const final = getBounds(cena);
const dims = {
  larguraCm: +((final.max[0] - final.min[0]) * 100).toFixed(1),
  profundidadeCm: +((final.max[2] - final.min[2]) * 100).toFixed(1),
  alturaCm: +((final.max[1] - final.min[1]) * 100).toFixed(1),
  baseY: +final.min[1].toFixed(5),
};
root.getAsset().generator = `${root.getAsset().generator ?? ''} + ONE AR Menu prepare-model`.trim();
await io.write(saida, doc);

const { statSync } = await import('node:fs');
console.log(
  JSON.stringify(
    {
      antes,
      depois: {
        triangulos: Math.round(contarTriangulos()),
        extensoes: root.listExtensionsUsed().map((e) => e.extensionName),
        texturas: root.listTextures().map((t) => `${t.getMimeType()} ${t.getSize()?.join('x')}`),
        megabytes: +(statSync(saida).size / 1024 / 1024).toFixed(2),
      },
      dimensoes: dims,
    },
    null,
    2,
  ),
);
