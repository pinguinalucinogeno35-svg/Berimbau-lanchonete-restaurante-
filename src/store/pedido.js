// Sacola do pedido e dados do cliente, guardados só no aparelho.
const CHAVE = 'berimbau:pedido';
const CHAVE_CLIENTE = 'berimbau:cliente';

const ler = (k, padrao) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch { return padrao; }
};
const gravar = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* armazenamento indisponível */ }
};

const vazio = () => ({ itens: [], modo: 'retirada', bairro: '', cupom: '', pagamento: 'pix', troco: 0 });

export const pedido = Object.assign(vazio(), ler(CHAVE, {}));
pedido.cliente = Object.assign({ nome: '', telefone: '', endereco: '', referencia: '' }, ler(CHAVE_CLIENTE, {}));

function salvar() {
  const { cliente, ...resto } = pedido;
  gravar(CHAVE, resto);
  gravar(CHAVE_CLIENTE, cliente);
  window.dispatchEvent(new CustomEvent('pedido:mudou'));
}

export const quantidadeTotal = () => pedido.itens.reduce((s, i) => s + i.qtd, 0);

export function adicionar(item, { qtd = 1, variacao = null, adicionais = [], obs = '' } = {}) {
  const extra = (variacao?.preco || 0) + adicionais.reduce((s, a) => s + a.preco, 0);
  const chave = [item.id, variacao?.nome || '', ...adicionais.map((a) => a.nome).sort(), obs.trim()].join('|');
  const existente = pedido.itens.find((i) => i.chave === chave);
  if (existente) existente.qtd += qtd;
  else pedido.itens.push({
    chave, id: item.id, nome: item.nome, qtd,
    variacao: variacao?.nome || '', adicionais, obs: obs.trim(),
    unitario: item.preco + extra,
  });
  salvar();
}

export function alterarQtd(chave, delta) {
  const it = pedido.itens.find((i) => i.chave === chave);
  if (!it) return;
  it.qtd += delta;
  if (it.qtd <= 0) pedido.itens = pedido.itens.filter((i) => i !== it);
  salvar();
}

export function atualizar(campos) {
  Object.assign(pedido, campos);
  salvar();
}

export function atualizarCliente(campos) {
  Object.assign(pedido.cliente, campos);
  salvar();
}

export function limparItens() {
  pedido.itens = [];
  pedido.cupom = '';
  salvar();
}

export function calcularTotais(loja) {
  const subtotal = pedido.itens.reduce((s, i) => s + i.unitario * i.qtd, 0);
  const bairro = loja.entrega.bairros.find((b) => b.nome === pedido.bairro);
  const taxa = pedido.modo === 'entrega' && bairro ? bairro.taxa : 0;
  const cupom = loja.cupons.find((c) => c.codigo === (pedido.cupom || '').toUpperCase());
  let desconto = 0;
  let avisoCupom = '';
  if (pedido.cupom && !cupom) avisoCupom = 'Cupom não encontrado.';
  else if (cupom && cupom.minimo && subtotal < cupom.minimo) avisoCupom = `Válido a partir de R$ ${cupom.minimo}.`;
  else if (cupom) desconto = cupom.tipo === 'percentual' ? subtotal * (cupom.valor / 100) : Math.min(cupom.valor, subtotal);
  desconto = Math.round(desconto * 100) / 100;
  return { subtotal, taxa, desconto, total: Math.max(0, subtotal + taxa - desconto), bairro, cupom: desconto ? cupom : null, avisoCupom };
}
