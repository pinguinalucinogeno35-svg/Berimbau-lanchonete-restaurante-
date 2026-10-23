import { esc, icone } from '../services/formato.js';
import { periodoAtual } from '../services/horario.js';
import { cardProduto } from '../components/card-produto.js';
import { track } from '../services/analytics.js';

export const titulo = 'Cardápio';

const normal = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function lista(cardapio, periodo, busca) {
  const q = normal(busca.trim());
  const itens = cardapio.itens.filter((i) =>
    (periodo === 'tudo' || i.periodos.includes(periodo)) &&
    (!q || normal(`${i.nome} ${i.descricao}`).includes(q)));
  if (!itens.length) return `<p class="vazio">Nada encontrado${q ? ` para “${esc(busca)}”` : ''}. Tente outro termo ou período.</p>`;
  return cardapio.categorias
    .map((c) => {
      const daCat = itens.filter((i) => i.categoria === c.id);
      if (!daCat.length) return '';
      return `
      <section class="categoria" id="cat-${c.id}">
        <h2>${icone(c.icone)}${esc(c.nome)}</h2>
        <div class="produtos">${daCat.map((i) => cardProduto(i, cardapio)).join('')}</div>
      </section>`;
    })
    .join('');
}

export function render({ loja, cardapio, params }) {
  const periodo = params.get('p') || periodoAtual(cardapio.periodos, loja.fuso).id;
  const busca = params.get('q') || '';
  const abas = [...cardapio.periodos, { id: 'tudo', nome: 'Tudo', icone: 'cardapio' }];
  return `
  <header class="pagina-topo">
    <h1>Nosso <em>cardápio</em></h1>
    <p>Sabores que contam histórias de Ilhéus.${cardapio.exemplo ? ' <span class="selo">Dados de exemplo</span>' : ''}</p>
  </header>
  <div class="cardapio-filtros">
    <div class="abas" role="tablist" aria-label="Momento do dia">
      ${abas.map((a) => `<button role="tab" class="aba" data-periodo="${a.id}" aria-selected="${a.id === periodo}">${icone(a.icone)}${esc(a.nome)}</button>`).join('')}
    </div>
    <label class="busca">${icone('busca')}<span class="sr">Buscar no cardápio</span>
      <input type="search" placeholder="Buscar pão de queijo, moqueca..." value="${esc(busca)}" autocomplete="off">
    </label>
  </div>
  <div class="cardapio-lista" data-lista>${lista(cardapio, periodo, busca)}</div>
  <p class="atualizado">Cardápio atualizado em ${new Date(cardapio.atualizado + 'T12:00').toLocaleDateString('pt-BR')}. Preços sujeitos a alteração.</p>`;
}

export function montar(el, { cardapio }) {
  let periodo = el.querySelector('.aba[aria-selected="true"]').dataset.periodo;
  const input = el.querySelector('input[type=search]');
  const alvo = el.querySelector('.cardapio-lista');
  const atualizar = () => {
    alvo.innerHTML = lista(cardapio, periodo, input.value);
    history.replaceState(null, '', `#/cardapio?p=${periodo}${input.value ? `&q=${encodeURIComponent(input.value)}` : ''}`);
  };
  el.querySelector('.abas').addEventListener('click', (e) => {
    const aba = e.target.closest('.aba');
    if (!aba) return;
    periodo = aba.dataset.periodo;
    el.querySelectorAll('.aba').forEach((a) => a.setAttribute('aria-selected', a === aba));
    atualizar();
  });
  let t;
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(atualizar, 150); });
  track('ver_cardapio', { periodo });
}
