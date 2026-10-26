// Renderiza posters (WebP) dos modelos demonstrativos usando o próprio <model-viewer> num Chromium headless.
/* global document, FileReader -- usados dentro de page.evaluate (contexto do navegador) */
// Uso: PLAYWRIGHT_CHROMIUM_PATH=/caminho/chrome node scripts/render-posters.mjs
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
// Sem argumentos: renderiza os modelos demonstrativos. Com argumentos: só os nomes informados (sem .glb).
const MODELOS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['coxinha-demonstrativa', 'hamburguer-demonstrativo', 'sobremesa-demonstrativa', 'cheeseburger-cheddar'];
const SAIDA = join(RAIZ, 'public', 'demo', 'posters');
mkdirSync(SAIDA, { recursive: true });

const TIPOS = { '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.html': 'text/html' };
const pagina = (m) => `<!doctype html><html><body style="margin:0;background:transparent">
<script type="module" src="/node_modules/@google/model-viewer/dist/model-viewer.min.js"></script>
<model-viewer id="mv" src="/public/demo/models/${m}.glb" style="width:1024px;height:1024px;background:transparent"
  camera-orbit="30deg 72deg 105%" shadow-intensity="1.1" shadow-softness="0.9"
  exposure="1.05" environment-image="neutral" interaction-prompt="none"></model-viewer></body></html>`;

const servidor = createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/render/')) {
    res.writeHead(200, { 'content-type': 'text/html' });
    return res.end(pagina(url.pathname.split('/').pop()));
  }
  const arq = join(RAIZ, decodeURIComponent(url.pathname));
  if (!arq.startsWith(RAIZ) || !existsSync(arq)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'content-type': TIPOS[extname(arq)] || 'application/octet-stream' });
  res.end(readFileSync(arq));
}).listen(0, '127.0.0.1');
await new Promise((r) => servidor.once('listening', r));
const base = `http://127.0.0.1:${servidor.address().port}`;

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
for (const m of MODELOS) {
  await page.goto(`${base}/render/${m}`);
  await page.waitForFunction(() => document.querySelector('#mv')?.loaded === true, null, { timeout: 60000 });
  await page.waitForTimeout(800);
  const dataUrl = await page.evaluate(async () => {
    const blob = await document.querySelector('#mv').toBlob({ mimeType: 'image/png' });
    return await new Promise((r) => {
      const fr = new FileReader();
      fr.onload = () => r(fr.result);
      fr.readAsDataURL(blob);
    });
  });
  const png = Buffer.from(dataUrl.split(',')[1], 'base64');
  const sharp = (await import('sharp')).default;
  await sharp(png)
    .resize(800, 800)
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(join(SAIDA, `${m}.webp`));
  console.log('poster', m);
}
await browser.close();
servidor.close();
