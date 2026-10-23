// Página "link na bio": um endereço só para o Instagram, com atalhos para cada destaque.
import { esc, icone } from '../services/formato.js';
import { status } from '../services/horario.js';

export const titulo = 'Links';
export const semNavegacao = true;

export function render({ loja }) {
  const st = status(loja);
  const link = (href, ic, titulo, sub, extra = '') =>
    `<a class="canal" href="${href}" ${extra}>${icone(ic)}<span><strong>${titulo}</strong><small>${sub}</small></span><i class="seta" aria-hidden="true"></i></a>`;
  return `
  <div class="links">
    <img class="links-logo" src="assets/marca/logo-berimbau-completo.svg" alt="Berimbau Gourmet">
    <p>${esc(loja.descricao)}</p>
    <span class="status ${st.aberto ? 'aberto' : 'fechado'}">${icone('relogio')}${esc(st.texto)}</span>
    <nav class="links-lista" aria-label="Links">
      ${link('#/cardapio', 'cardapio', 'Ver cardápio', 'Preços e fotos', 'data-track="bio_cardapio"')}
      ${link('#/pedido', 'sacola', 'Fazer pedido pelo site', 'Sem taxa de app · Pix', 'data-track="bio_pedido"')}
      ${link(loja.ifood, 'entrega', 'Pedir pelo iFood', 'Entrega pelo app', 'target="_blank" rel="noopener" data-track="clique_ifood"')}
      ${link('#/como-chegar', 'local', 'Como chegar', esc(loja.endereco.rua), 'data-track="bio_como_chegar"')}
      ${link(`https://wa.me/${loja.whatsapp}`, 'mensagem', 'WhatsApp', 'Dúvidas e encomendas', 'target="_blank" rel="noopener" data-track="clique_whatsapp"')}
    </nav>
    <h2>Destaques</h2>
    <nav class="links-destaques" aria-label="Destaques">
      <a href="#/cardapio?p=cafe"><span class="icone-circulo">${icone('xicara')}</span>Café</a>
      <a href="#/cardapio?p=almoco"><span class="icone-circulo">${icone('talheres')}</span>Almoço</a>
      <a href="#/cardapio?p=tudo&c=salgados"><span class="icone-circulo">${icone('pao-de-queijo')}</span>Salgados</a>
      <a href="#/historia"><span class="icone-circulo">${icone('historia')}</span>História</a>
      <a href="#/como-chegar"><span class="icone-circulo">${icone('local')}</span>Unidade</a>
    </nav>
  </div>`;
}
