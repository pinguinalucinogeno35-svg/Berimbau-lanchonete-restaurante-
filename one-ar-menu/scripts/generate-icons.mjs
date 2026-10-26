// Gera os ícones do PWA (monograma provisório "O" sobre o fundo do tema). Substituir pela marca oficial.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

const svg = (size, pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#111514"/>
  <rect x="${pad}" y="${pad}" width="${size - pad * 2}" height="${size - pad * 2}" fill="none" stroke="#C2A77B" stroke-width="${size * 0.012}"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.2}" fill="none" stroke="#C2A77B" stroke-width="${size * 0.05}"/>
  <line x1="${size * 0.38}" y1="${size * 0.74}" x2="${size * 0.62}" y2="${size * 0.74}" stroke="#66735C" stroke-width="${size * 0.02}"/>
</svg>`;

writeFileSync(join(OUT, 'favicon.svg'), svg(64, 6));
const gerar = (nome, size, pad) =>
  sharp(Buffer.from(svg(size, pad)))
    .png()
    .toFile(join(OUT, nome));
await Promise.all([
  gerar('icon-192.png', 192, 18),
  gerar('icon-512.png', 512, 48),
  gerar('icon-maskable-512.png', 512, 110),
  gerar('apple-touch-icon.png', 180, 16),
]);
console.log('ícones gerados em public/icons');
