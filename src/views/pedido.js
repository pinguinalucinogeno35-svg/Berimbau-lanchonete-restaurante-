import { brl, esc, icone } from '../services/formato.js';
import { status } from '../services/horario.js';
import { pedido, alterarQtd, atualizar, atualizarCliente, calcularTotais, limparItens } from '../store/pedido.js';
import { mensagemPedido, linkWhatsApp } from '../services/whatsapp.js';
import { pixCopiaECola } from '../services/pix.js';
import { track, origem } from '../services/analytics.js';
import { salvarNoHistorico } from '../store/historico.js';

export const titulo = 'Seu pedido';

const ULTIMO = 'berimbau:ultimo-pedido';

function vazio() {
  return `
  <header class="pagina-topo"><h1>Seu <em>pedido</em></h1></header>
  <div class="estado-vazio">
    <span class="icone-circulo grande">${icone('sacola')}</span>
    <h2>Sua sacola está vazia</h2>
    <p>Escolha seus sabores no cardápio e finalize por aqui, sem taxa de app.</p>
    <a class="botao" href="#/cardapio">Ver cardápio<i class="seta" aria-hidden="true"></i></a>
    <a class="link-seta" href="#/meus-pedidos">Pedir de novo um pedido anterior<i class="seta" aria-hidden="true"></i></a>
  </div>`;
}

function itens() {
  return pedido.itens.map((i) => {
    const extras = [i.variacao, ...i.adicionais.map((a) => `+ ${a.nome}`)].filter(Boolean).join(' · ');
    return `
    <li class="linha-item">
      <div>
        <strong>${esc(i.nome)}</strong>
        ${extras ? `<small>${esc(extras)}</small>` : ''}
        ${i.obs ? `<small>Obs.: ${esc(i.obs)}</small>` : ''}
        <span class="linha-preco">${brl(i.unitario * i.qtd)}</span>
      </div>
      <div class="qtd pequeno" role="group" aria-label="Quantidade de ${esc(i.nome)}">
        <button type="button" data-alterar="-1" data-chave="${esc(i.chave)}" aria-label="Diminuir">${icone(i.qtd === 1 ? 'fechar' : 'menos')}</button>
        <output>${i.qtd}</output>
        <button type="button" data-alterar="1" data-chave="${esc(i.chave)}" aria-label="Aumentar">${icone('mais')}</button>
      </div>
    </li>`;
  }).join('');
}

export function render({ loja }) {
  if (!pedido.itens.length) return vazio();
  const t = calcularTotais(loja);
  const st = status(loja);
  const c = pedido.cliente;
  const entrega = pedido.modo === 'entrega';
  const naMesa = pedido.modo === 'mesa' && pedido.mesa;
  const abaixoMinimo = entrega && t.subtotal < loja.entrega.pedidoMinimo;

  return `
  <header class="pagina-topo"><h1>Seu <em>pedido</em></h1>
    ${st.aberto ? '' : `<p class="aviso">${icone('relogio')} ${esc(st.texto)}. Você pode enviar agora e confirmamos quando abrirmos.</p>`}
  </header>
  <form class="pedido" novalidate>
    <section class="bloco">
      <h2>Itens</h2>
      <ul class="lista-itens">${itens()}</ul>
      <a class="link-seta" href="#/cardapio">Adicionar mais itens<i class="seta" aria-hidden="true"></i></a>
    </section>

    <section class="bloco">
      <h2>Como quer receber?</h2>
      <div class="segmentado${pedido.mesa ? ' tres' : ''}" role="radiogroup">
        ${pedido.mesa ? `<label><input type="radio" name="modo" value="mesa" ${naMesa ? 'checked' : ''}>${icone('talheres')}<span>Na mesa ${esc(pedido.mesa)}<small>Servimos aí</small></span></label>` : ''}
        <label><input type="radio" name="modo" value="retirada" ${pedido.modo === 'retirada' ? 'checked' : ''}>${icone('retirada')}<span>Retirar no balcão<small>${esc(loja.retirada.tempo)}</small></span></label>
        ${loja.entrega.ativa ? `<label><input type="radio" name="modo" value="entrega" ${entrega ? 'checked' : ''}>${icone('entrega')}<span>Entrega<small>Taxa por bairro</small></span></label>` : ''}
      </div>
      ${entrega ? `
      <label class="campo"><span>Bairro</span>
        <select name="bairro" required>
          <option value="">Selecione o bairro</option>
          ${loja.entrega.bairros.map((b) => `<option ${b.nome === pedido.bairro ? 'selected' : ''}>${esc(b.nome)}</option>`).join('')}
        </select>
        ${t.bairro ? `<small>Taxa ${brl(t.bairro.taxa)} · ${esc(t.bairro.tempo)}</small>` : ''}
      </label>
      <label class="campo"><span>Endereço</span><input name="endereco" autocomplete="street-address" value="${esc(c.endereco)}" placeholder="Rua, número, complemento" required></label>
      <label class="campo"><span>Ponto de referência <small>(opcional)</small></span><input name="referencia" value="${esc(c.referencia)}"></label>
      ${abaixoMinimo ? `<p class="aviso">Pedido mínimo para entrega: ${brl(loja.entrega.pedidoMinimo)}.</p>` : ''}` : naMesa ? `
      <p class="nota">${icone('talheres')} A equipe leva o pedido até a mesa ${esc(pedido.mesa)}.</p>` : `
      <p class="nota">${icone('local')} ${esc(loja.endereco.rua)} – ${esc(loja.endereco.bairro)}</p>`}
    </section>

    <section class="bloco">
      <h2>Seus dados</h2>
      <label class="campo"><span>Nome</span><input name="nome" autocomplete="given-name" value="${esc(c.nome)}" required></label>
      <label class="campo"><span>WhatsApp</span><input name="telefone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(c.telefone)}" placeholder="(73) 9 0000-0000" required></label>
      <p class="nota">Seus dados ficam salvos só neste aparelho.</p>
    </section>

    <section class="bloco">
      <h2>Pagamento</h2>
      <div class="segmentado tres" role="radiogroup">
        <label><input type="radio" name="pagamento" value="pix" ${pedido.pagamento === 'pix' ? 'checked' : ''}>${icone('pix')}<span>Pix</span></label>
        <label><input type="radio" name="pagamento" value="cartao" ${pedido.pagamento === 'cartao' ? 'checked' : ''}>${icone('cupom')}<span>Cartão</span></label>
        <label><input type="radio" name="pagamento" value="dinheiro" ${pedido.pagamento === 'dinheiro' ? 'checked' : ''}>${icone('sacola')}<span>Dinheiro</span></label>
      </div>
      ${pedido.pagamento === 'dinheiro' ? `<label class="campo"><span>Troco para <small>(opcional)</small></span><input name="troco" type="number" inputmode="decimal" min="0" step="1" value="${pedido.troco || ''}"></label>` : ''}
      ${pedido.pagamento === 'cartao' ? `<p class="nota">Maquininha na ${entrega ? 'entrega' : naMesa ? 'mesa' : 'retirada'}.</p>` : ''}
      ${pedido.pagamento === 'pix' ? `<p class="nota">Depois de enviar, mostramos o Pix copia e cola com o valor exato.</p>` : ''}
    </section>

    <section class="bloco">
      <h2>Cupom</h2>
      <div class="cupom-linha">
        <input name="cupom" value="${esc(pedido.cupom)}" placeholder="Ex.: BEMVINDO" autocapitalize="characters" aria-label="Código do cupom">
        <button type="button" class="botao botao-contorno" data-aplicar-cupom>Aplicar</button>
      </div>
      ${t.cupom ? `<p class="ok">${icone('check')} ${esc(t.cupom.descricao)}</p>` : ''}
      ${t.avisoCupom ? `<p class="aviso">${esc(t.avisoCupom)}</p>` : ''}
    </section>

    <section class="bloco resumo">
      <dl>
        <div><dt>Subtotal</dt><dd>${brl(t.subtotal)}</dd></div>
        ${entrega ? `<div><dt>Entrega</dt><dd>${t.bairro ? brl(t.taxa) : 'selecione o bairro'}</dd></div>` : ''}
        ${t.desconto ? `<div><dt>Desconto</dt><dd>- ${brl(t.desconto)}</dd></div>` : ''}
        <div class="total"><dt>Total</dt><dd>${brl(t.total)}</dd></div>
      </dl>
      <p class="erro" data-erro role="alert" hidden></p>
      <button class="botao botao-cheio botao-largo" data-enviar ${abaixoMinimo ? 'disabled' : ''}>${icone('mensagem')}Enviar pedido pelo WhatsApp</button>
      <div class="alternativas">
        <a href="${loja.ifood}" target="_blank" rel="noopener" data-track="clique_ifood">${icone('entrega')}Prefere o iFood?</a>
        <a href="tel:${loja.telefone.replace(/[^\d+]/g, '')}" data-track="clique_ligar">${icone('telefone')}Ligar para a loja</a>
      </div>
    </section>
  </form>`;
}

export function montar(el, ctx) {
  const { loja, rerender } = ctx;
  const form = el.querySelector('form');
  if (!form) return;
  track('iniciar_pedido');

  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-alterar]');
    if (b) { alterarQtd(b.dataset.chave, Number(b.dataset.alterar)); rerender(); }
    if (e.target.closest('[data-aplicar-cupom]')) {
      atualizar({ cupom: form.cupom.value.trim().toUpperCase() });
      rerender();
    }
  });

  form.cupom.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    atualizar({ cupom: form.cupom.value.trim().toUpperCase() });
    rerender();
  });

  form.addEventListener('input', (e) => {
    const { name, value } = e.target;
    if (['nome', 'telefone', 'endereco', 'referencia'].includes(name)) atualizarCliente({ [name]: value });
    if (name === 'troco') atualizar({ troco: Number(value) || 0 });
  });

  form.addEventListener('change', (e) => {
    const { name, value } = e.target;
    if (name === 'modo' || name === 'pagamento' || name === 'bairro') { atualizar({ [name]: value }); rerender(); }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const erro = form.querySelector('[data-erro]');
    const c = pedido.cliente;
    const faltando = [];
    if (!c.nome.trim()) faltando.push('nome');
    if (c.telefone.replace(/\D/g, '').length < 10) faltando.push('WhatsApp com DDD');
    if (pedido.modo === 'entrega') {
      if (!pedido.bairro) faltando.push('bairro');
      if (!c.endereco.trim()) faltando.push('endereço');
    }
    if (faltando.length) {
      erro.textContent = `Preencha: ${faltando.join(', ')}.`;
      erro.hidden = false;
      form.querySelector(':invalid, [name="nome"]')?.focus();
      return;
    }
    const t = calcularTotais(loja);
    const codigo = Date.now().toString(36).slice(-4).toUpperCase();
    const texto = mensagemPedido(pedido, t, codigo);
    const pix = pedido.pagamento === 'pix'
      ? pixCopiaECola({ ...loja.pix, valor: t.total, txid: `BERIMBAU${codigo}` })
      : '';
    try {
      localStorage.setItem(ULTIMO, JSON.stringify({ codigo, total: t.total, pix, modo: pedido.modo, pagamento: pedido.pagamento, texto }));
    } catch { /* segue sem histórico */ }
    salvarNoHistorico({ codigo, itens: pedido.itens, total: t.total, modo: pedido.modo, mesa: pedido.mesa });
    track('enviar_pedido_whatsapp', { total: t.total, modo: pedido.modo, pagamento: pedido.pagamento, mesa: pedido.mesa, origem: origem() });
    window.open(linkWhatsApp(loja.whatsapp, texto), '_blank', 'noopener');
    limparItens();
    location.hash = '#/pedido/enviado';
  });
}

export function lerUltimo() {
  try { return JSON.parse(localStorage.getItem(ULTIMO)); } catch { return null; }
}
