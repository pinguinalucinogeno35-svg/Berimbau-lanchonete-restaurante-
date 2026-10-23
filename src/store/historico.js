// Histórico dos pedidos enviados, guardado só no aparelho, para "Pedir de novo".
import { adicionar } from './pedido.js';

const CHAVE = 'berimbau:historico';
const MAXIMO = 10;

const ler = () => {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || []; } catch { return []; }
};

export const listarPedidos = ler;

export function salvarNoHistorico({ codigo, itens, total, modo, mesa }) {
  const lista = ler();
  lista.unshift({
    codigo,
    data: new Date().toISOString(),
    total,
    modo,
    mesa: mesa || '',
    itens: itens.map((i) => ({
      id: i.id, nome: i.nome, qtd: i.qtd, variacao: i.variacao,
      adicionais: i.adicionais.map((a) => a.nome), obs: i.obs,
    })),
  });
  try { localStorage.setItem(CHAVE, JSON.stringify(lista.slice(0, MAXIMO))); } catch { /* sem espaço */ }
}

// Recoloca os itens na sacola com os preços atuais do cardápio.
export function pedirDeNovo(codigo, cardapio) {
  const anterior = ler().find((p) => p.codigo === codigo);
  const resultado = { adicionados: 0, indisponiveis: [] };
  if (!anterior) return resultado;
  for (const it of anterior.itens) {
    const item = cardapio.itens.find((i) => i.id === it.id);
    if (!item || item.disponivel === false) { resultado.indisponiveis.push(it.nome); continue; }
    const variacao = item.variacoes?.find((v) => v.nome === it.variacao) || (item.variacoes ? item.variacoes[0] : null);
    const adicionais = (item.adicionais || []).filter((a) => it.adicionais.includes(a.nome));
    adicionar(item, { qtd: it.qtd, variacao, adicionais, obs: it.obs || '' });
    resultado.adicionados += it.qtd;
  }
  return resultado;
}
