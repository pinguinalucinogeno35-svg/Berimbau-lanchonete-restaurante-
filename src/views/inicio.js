import { esc, icone } from '../services/formato.js';
import { status, periodoAtual } from '../services/horario.js';
import { cardMini } from '../components/card-produto.js';
import { listarPedidos } from '../store/historico.js';
import { cartaoPedido, ligarPedirDeNovo } from './meus-pedidos.js';

export const titulo = 'Café, lanches e almoço no centro de Ilhéus';

export function render({ loja, cardapio }) {
  const st = status(loja);
  const periodo = periodoAtual(cardapio.periodos, loja.fuso);
  const doPeriodo = cardapio.itens
    .filter((i) => i.periodos.includes(periodo.id) && i.disponivel !== false)
    .sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0))
    .slice(0, 8);
  const destaques = cardapio.itens.filter((i) => i.destaque && i.disponivel !== false);
  const ultimo = listarPedidos()[0];

  return `
  <section class="hero">
    <img class="hero-fundo" src="assets/fotos/ambiente-salao.webp" alt="" fetchpriority="high">
    <div class="hero-conteudo">
      <span class="status ${st.aberto ? 'aberto' : 'fechado'}${st.alerta ? ' alerta' : ''}">${icone('relogio')}${esc(st.texto)}</span>
      <h1>Sabores que contam <em>histórias.</em></h1>
      <p>${esc(loja.descricao)}</p>
      <p class="rotulo">${loja.segmentos.map(esc).join(' · ')}</p>
    </div>
  </section>

  <nav class="acoes" aria-label="Atalhos">
    <a class="acao" href="#/cardapio">${icone('cardapio')}<span>Ver cardápio</span><i class="seta" aria-hidden="true"></i></a>
    <a class="acao acao-destaque" href="#/pedido">${icone('sacola')}<span>Fazer pedido</span><i class="seta" aria-hidden="true"></i></a>
    <a class="acao" href="#/historia">${icone('historia')}<span>Nossa história</span><i class="seta" aria-hidden="true"></i></a>
    <a class="acao" href="#/como-chegar">${icone('local')}<span>Como chegar</span><i class="seta" aria-hidden="true"></i></a>
  </nav>

  <section class="secao">
    <div class="secao-topo">
      <span class="icone-circulo">${icone(periodo.icone)}</span>
      <div>
        <h2>Agora é hora de <em>${esc(periodo.nome.toLowerCase())}</em></h2>
        <p>${esc(periodo.chamada)}</p>
      </div>
    </div>
    <div class="carrossel" data-lista>${doPeriodo.map((i) => cardMini(i, cardapio)).join('')}</div>
    <a class="link-seta" href="#/cardapio?p=${periodo.id}">Ver tudo de ${esc(periodo.nome.toLowerCase())}<i class="seta" aria-hidden="true"></i></a>
  </section>

  ${ultimo ? `
  <section class="secao">
    <h2>Pedir <em>de novo</em></h2>
    <div class="div"></div>
    ${cartaoPedido(ultimo)}
    <a class="link-seta" href="#/meus-pedidos">Ver todos os meus pedidos<i class="seta" aria-hidden="true"></i></a>
  </section>` : ''}

  <section class="secao">
    <h2>Os queridinhos <em>da casa</em></h2>
    <div class="div"></div>
    <div class="grade-destaques" data-lista>${destaques.map((i) => cardMini(i, cardapio)).join('')}</div>
  </section>

  <section class="secao prova">
    <h2>Reputação <em>real.</em></h2>
    <div class="div"></div>
    <div class="numeros">
      <div class="numero">${icone('estrela')}<strong>${String(loja.avaliacao.nota).replace('.', ',')}</strong><span>no ${esc(loja.avaliacao.fonte)}</span></div>
      <div class="numero">${icone('avaliacoes')}<strong>${esc(loja.avaliacao.total)}</strong><span>avaliações</span></div>
      <a class="numero" href="${loja.instagram}" target="_blank" rel="noopener">${icone('camera-social')}<strong>${esc(loja.seguidores)}</strong><span>no Instagram</span></a>
    </div>
  </section>

  <section class="secao canais">
    <h2>Peça pelo seu <em>canal preferido.</em></h2>
    <div class="div"></div>
    <a class="canal" href="#/cardapio">${icone('globo')}<span><strong>Pelo site</strong><small>Sem taxa de app · Pix ou na entrega</small></span><i class="seta" aria-hidden="true"></i></a>
    <a class="canal" href="${loja.ifood}" target="_blank" rel="noopener" data-track="clique_ifood">${icone('entrega')}<span><strong>iFood</strong><small>Peça pelo app</small></span><i class="seta" aria-hidden="true"></i></a>
    <a class="canal" href="${loja.maps}" target="_blank" rel="noopener" data-track="clique_maps">${icone('mapa')}<span><strong>Google Maps</strong><small>Veja o local e trace a rota</small></span><i class="seta" aria-hidden="true"></i></a>
  </section>

  <section class="secao instalar" data-instalar hidden>
    <span class="icone-circulo">${icone('instalar')}</span>
    <div>
      <h2>Berimbau no seu celular</h2>
      <p data-instalar-texto>Instale o app e tenha o cardápio sempre à mão, até sem internet.</p>
    </div>
    <button class="botao" data-instalar-botao>Instalar app</button>
  </section>`;
}

export function montar(el, { cardapio }) {
  ligarPedirDeNovo(el, cardapio);
}
