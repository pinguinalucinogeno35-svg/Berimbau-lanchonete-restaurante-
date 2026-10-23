import { brl, esc, icone } from '../services/formato.js';

export function fotoOuIcone(item, categorias, classe = '') {
  if (item.foto) return `<img class="${classe}" src="${item.foto}" alt="" loading="lazy" decoding="async">`;
  const cat = categorias.find((c) => c.id === item.categoria);
  return `<span class="${classe} sem-foto">${icone(cat?.icone || 'talheres')}</span>`;
}

export function selos(item, nomes) {
  return (item.selos || []).map((s) => `<span class="selo selo-${s}">${esc(nomes[s] || s)}</span>`).join('');
}

export function cardProduto(item, cardapio) {
  const indisponivel = item.disponivel === false;
  return `
  <article class="produto${indisponivel ? ' indisponivel' : ''}">
    <button class="produto-abrir" data-item="${item.id}" ${indisponivel ? 'disabled' : ''}
      aria-label="${esc(item.nome)}, ${brl(item.preco)}${indisponivel ? ', esgotado hoje' : ''}">
      ${fotoOuIcone(item, cardapio.categorias, 'produto-foto')}
      <span class="produto-info">
        <span class="produto-selos">${selos(item, cardapio.selos)}${indisponivel ? '<span class="selo selo-esgotado">Esgotado hoje</span>' : ''}</span>
        <strong class="produto-nome">${esc(item.nome)}</strong>
        <span class="produto-desc">${esc(item.descricao)}</span>
        <span class="produto-preco">${item.variacoes ? 'a partir de ' : ''}${brl(item.preco)}</span>
      </span>
      ${indisponivel ? '' : `<span class="produto-mais">${icone('mais')}</span>`}
    </button>
  </article>`;
}

export function cardMini(item, cardapio) {
  return `
  <button class="mini" data-item="${item.id}">
    ${fotoOuIcone(item, cardapio.categorias, 'mini-foto')}
    <strong>${esc(item.nome)}</strong>
    <span>${brl(item.preco)}</span>
  </button>`;
}
