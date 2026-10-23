import { brl } from './formato.js';

const PAGAMENTO = { pix: 'Pix', cartao: 'Cartão (maquininha)', dinheiro: 'Dinheiro' };

export function mensagemPedido(pedido, totais, codigo) {
  const l = [];
  l.push(`*Novo pedido – Berimbau Gourmet* #${codigo}`, '');
  for (const it of pedido.itens) {
    const extras = [it.variacao, ...it.adicionais.map((a) => `+ ${a.nome}`)].filter(Boolean).join(', ');
    l.push(`${it.qtd}x ${it.nome}${extras ? ` (${extras})` : ''} – ${brl(it.unitario * it.qtd)}`);
    if (it.obs) l.push(`   Obs.: ${it.obs}`);
  }
  l.push('', `Subtotal: ${brl(totais.subtotal)}`);
  if (totais.taxa) l.push(`Entrega (${pedido.bairro}): ${brl(totais.taxa)}`);
  if (totais.desconto) l.push(`Cupom ${pedido.cupom}: -${brl(totais.desconto)}`);
  l.push(`*Total: ${brl(totais.total)}*`, '');
  const recebimento = { entrega: 'Entrega', mesa: `Consumo na *mesa ${pedido.mesa}*`, retirada: 'Retirada no balcão' };
  l.push(`Recebimento: ${recebimento[pedido.modo] || recebimento.retirada}`);
  l.push(`Pagamento: ${PAGAMENTO[pedido.pagamento] || pedido.pagamento}${pedido.pagamento === 'dinheiro' && pedido.troco ? ` (troco para ${brl(pedido.troco)})` : ''}`);
  l.push(`Cliente: ${pedido.cliente.nome} – ${pedido.cliente.telefone}`);
  if (pedido.modo === 'entrega') {
    l.push(`Endereço: ${pedido.cliente.endereco}, ${pedido.bairro}`);
    if (pedido.cliente.referencia) l.push(`Referência: ${pedido.cliente.referencia}`);
  }
  return l.join('\n');
}

export const linkWhatsApp = (numero, texto) => `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
