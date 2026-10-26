// Gera src/data/assetVersions.json com um hash do conteúdo de cada modelo/poster demonstrativo.
// O app usa o hash na URL (?v=...), então um arquivo alterado nunca é servido de um cache antigo
// (service worker, navegador, CDN ou Scene Viewer). Roda automaticamente antes do build (prebuild).
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const versoes = {};
for (const pasta of ['demo/models', 'demo/posters']) {
  for (const f of readdirSync(join(RAIZ, 'public', pasta)).sort()) {
    if (!/\.(glb|usdz|webp|png|jpg)$/.test(f)) continue;
    const hash = createHash('sha256')
      .update(readFileSync(join(RAIZ, 'public', pasta, f)))
      .digest('hex')
      .slice(0, 10);
    versoes[`/${pasta}/${f}`] = hash;
  }
}
writeFileSync(join(RAIZ, 'src', 'data', 'assetVersions.json'), JSON.stringify(versoes, null, 2) + '\n');
console.log(`${Object.keys(versoes).length} arquivos versionados`);
