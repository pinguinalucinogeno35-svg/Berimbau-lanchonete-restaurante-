// Ferramenta interna (não aparece no menu): gera cartões com QR code para mesas, balcão e bio.
import { esc, icone } from '../services/formato.js';
import { qrSvg } from '../services/qr.js';

export const titulo = 'QR codes';
export const semNavegacao = true;

const base = () => `${location.origin}${location.pathname}`;

function cartao({ titulo, sub, url }) {
  return `
  <article class="cartao-qr">
    <img src="assets/marca/logo-berimbau-completo.svg" alt="Berimbau Gourmet">
    <h2>${esc(titulo)}</h2>
    ${qrSvg(url, { rotulo: `QR code: ${titulo}` })}
    <p>${esc(sub)}</p>
    <small>${esc(url.replace(/^https?:\/\//, ''))}</small>
  </article>`;
}

function cartoes(qtd) {
  const lista = [
    { titulo: 'Cardápio', sub: 'Aponte a câmera para ver o cardápio e pedir no balcão.', url: `${base()}#/cardapio?origem=qr-balcao` },
    { titulo: 'Peça pelo celular', sub: 'Link para a bio do Instagram.', url: `${base()}#/links?origem=instagram` },
  ];
  for (let i = 1; i <= qtd; i++) {
    lista.push({ titulo: `Mesa ${i}`, sub: 'Aponte a câmera, escolha e peça daqui mesmo. Servimos na sua mesa.', url: `${base()}#/cardapio?mesa=${i}&origem=qr-mesa` });
  }
  return lista.map(cartao).join('');
}

export function render() {
  return `
  <header class="pagina-topo nao-imprimir">
    <h1>QR codes para <em>imprimir</em></h1>
    <p>Uso interno. Defina o número de mesas e imprima (4 cartões por folha A4). Cada QR de mesa já identifica a mesa no pedido.</p>
    <div class="qr-controles">
      <label class="campo"><span>Número de mesas</span><input type="number" min="0" max="60" value="12" data-mesas></label>
      <button class="botao botao-cheio" onclick="print()">${icone('check')}Imprimir</button>
    </div>
  </header>
  <section class="grade-qr" data-cartoes>${cartoes(12)}</section>`;
}

export function montar(el) {
  const input = el.querySelector('[data-mesas]');
  input.addEventListener('change', () => {
    const qtd = Math.max(0, Math.min(60, Number(input.value) || 0));
    el.querySelector('[data-cartoes]').innerHTML = cartoes(qtd);
  });
}
