import { brl, esc, icone } from '../services/formato.js';
import { listarPedidos, pedirDeNovo } from '../store/historico.js';
import { toast } from '../components/toast.js';
import { track } from '../services/analytics.js';

export const titulo = 'Meus pedidos';

const dataCurta = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const MODO = { entrega: 'Entrega', retirada: 'Retirada', mesa: 'Mesa' };

export function cartaoPedido(p) {
  const resumo = p.itens.map((i) => `${i.qtd}x ${i.nome}`).join(', ');
  return `
  <article class="pedido-antigo">
    <header>
      <strong>#${esc(p.codigo)}</strong>
      <span>${dataCurta(p.data)} · ${MODO[p.modo] || ''}${p.mesa ? ` ${esc(p.mesa)}` : ''}</span>
    </header>
    <p>${esc(resumo)}</p>
    <footer>
      <span class="linha-preco">${brl(p.total)}</span>
      <button class="botao botao-contorno" data-pedir-de-novo="${esc(p.codigo)}">${icone('sacola')}Pedir de novo</button>
    </footer>
  </article>`;
}

export function render() {
  const lista = listarPedidos();
  return `
  <header class="pagina-topo">
    <h1>Meus <em>pedidos</em></h1>
    <p>Seus últimos pedidos feitos por este aparelho. Peça de novo com um toque.</p>
  </header>
  ${lista.length ? `<section class="secao lista-pedidos">${lista.map(cartaoPedido).join('')}</section>` : `
  <div class="estado-vazio">
    <span class="icone-circulo grande">${icone('relogio')}</span>
    <h2>Nenhum pedido ainda</h2>
    <p>Quando você fizer um pedido pelo site, ele aparece aqui para repetir depois.</p>
    <a class="botao" href="#/cardapio">Ver cardápio<i class="seta" aria-hidden="true"></i></a>
  </div>`}`;
}

// Usado também pela tela inicial.
export function ligarPedirDeNovo(el, cardapio) {
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pedir-de-novo]');
    if (!b) return;
    const r = pedirDeNovo(b.dataset.pedirDeNovo, cardapio);
    track('pedir_de_novo', { itens: r.adicionados });
    if (r.indisponiveis.length) toast(`Indisponível hoje: ${r.indisponiveis.join(', ')}`);
    if (r.adicionados) {
      if (!r.indisponiveis.length) toast('Itens de volta na sacola');
      location.hash = '#/pedido';
    }
  });
}

export function montar(el, { cardapio }) {
  ligarPedirDeNovo(el, cardapio);
}
