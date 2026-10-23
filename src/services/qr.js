import qrcode from '../vendor/qrcode.js';

// Gera um QR code em SVG (um único <path>), na cor da marca.
export function qrSvg(texto, { cor = '#23160C', fundo = '#FFFFFF', margem = 2, nivel = 'M', rotulo = '' } = {}) {
  const qr = qrcode(0, nivel);
  qr.addData(texto, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  const total = n + margem * 2;
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) d += `M${c + margem} ${r + margem}h1v1h-1z`;
    }
  }
  const acess = rotulo ? `role="img" aria-label="${rotulo}"` : 'aria-hidden="true"';
  return `<svg class="qr" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" ${acess}>`
    + `<rect width="${total}" height="${total}" fill="${fundo}"/><path d="${d}" fill="${cor}"/></svg>`;
}
