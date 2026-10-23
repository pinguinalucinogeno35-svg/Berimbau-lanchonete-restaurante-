// Folha (bottom sheet) de detalhe do item, usando <dialog>.
import { brl, esc, icone } from '../services/formato.js';
import { fotoOuIcone, selos } from './card-produto.js';
import { adicionar } from '../store/pedido.js';
import { toast } from './toast.js';
import { track } from '../services/analytics.js';

let dialog;

export function abrirItem(id, cardapio) {
  const item = cardapio.itens.find((i) => i.id === id);
  if (!item || item.disponivel === false) return;
  track('ver_item', { item: id });

  dialog ??= Object.assign(document.createElement('dialog'), { className: 'folha' });
  if (!dialog.isConnected) {
    document.body.append(dialog);
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  }

  let qtd = 1;
  dialog.innerHTML = `
  <form method="dialog" class="folha-conteudo">
    <button class="folha-fechar" value="cancel" aria-label="Fechar">${icone('fechar')}</button>
    ${fotoOuIcone(item, cardapio.categorias, 'folha-foto')}
    <div class="folha-corpo">
      <div class="produto-selos">${selos(item, cardapio.selos)}</div>
      <h2>${esc(item.nome)}</h2>
      <p class="folha-desc">${esc(item.descricao)}</p>
      ${item.variacoes ? `
      <fieldset class="opcoes">
        <legend>Escolha uma opção</legend>
        ${item.variacoes.map((v, i) => `
          <label class="opcao"><input type="radio" name="variacao" value="${i}" ${i === 0 ? 'checked' : ''}>
          <span>${esc(v.nome)}</span><span class="opcao-preco">${v.preco ? `+ ${brl(v.preco)}` : ''}</span></label>`).join('')}
      </fieldset>` : ''}
      ${item.adicionais ? `
      <fieldset class="opcoes">
        <legend>Adicionais</legend>
        ${item.adicionais.map((a, i) => `
          <label class="opcao"><input type="checkbox" name="adicional" value="${i}">
          <span>${esc(a.nome)}</span><span class="opcao-preco">+ ${brl(a.preco)}</span></label>`).join('')}
      </fieldset>` : ''}
      <label class="campo">
        <span>Observação</span>
        <textarea name="obs" rows="2" maxlength="140" placeholder="Ex.: sem cebola, bem passado"></textarea>
      </label>
    </div>
    <div class="folha-rodape">
      <div class="qtd" role="group" aria-label="Quantidade">
        <button type="button" data-qtd="-1" aria-label="Diminuir">${icone('menos')}</button>
        <output aria-live="polite">1</output>
        <button type="button" data-qtd="1" aria-label="Aumentar">${icone('mais')}</button>
      </div>
      <button class="botao botao-cheio" value="ok">Adicionar · <span class="folha-total"></span></button>
    </div>
  </form>`;

  const form = dialog.querySelector('form');
  const escolha = () => {
    const fd = new FormData(form);
    return {
      variacao: item.variacoes ? item.variacoes[Number(fd.get('variacao'))] : null,
      adicionais: fd.getAll('adicional').map((i) => item.adicionais[Number(i)]),
      obs: String(fd.get('obs') || ''),
    };
  };
  const atualizarTotal = () => {
    const e = escolha();
    const unit = item.preco + (e.variacao?.preco || 0) + e.adicionais.reduce((s, a) => s + a.preco, 0);
    form.querySelector('.folha-total').textContent = brl(unit * qtd);
    form.querySelector('output').textContent = qtd;
  };
  form.addEventListener('change', atualizarTotal);
  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-qtd]');
    if (!b) return;
    qtd = Math.max(1, Math.min(30, qtd + Number(b.dataset.qtd)));
    atualizarTotal();
  });
  form.addEventListener('submit', (e) => {
    if (e.submitter?.value !== 'ok') return;
    adicionar(item, { qtd, ...escolha() });
    track('adicionar_item', { item: id, qtd });
    toast(`${qtd}x ${item.nome} no pedido`);
  });
  atualizarTotal();
  dialog.showModal();
}
