import * as inicio from './views/inicio.js';
import * as cardapioView from './views/cardapio.js';
import * as pedidoView from './views/pedido.js';
import * as enviado from './views/enviado.js';
import * as historia from './views/historia.js';
import * as comoChegar from './views/como-chegar.js';
import * as meusPedidos from './views/meus-pedidos.js';
import * as links from './views/links.js';
import * as qr from './views/qr.js';
import { abrirItem } from './components/folha-item.js';
import { quantidadeTotal, pedido, entrarNaMesa, sairDaMesa } from './store/pedido.js';
import { track, registrarOrigem } from './services/analytics.js';

const ROTAS = {
  '': inicio,
  cardapio: cardapioView,
  pedido: pedidoView,
  'pedido/enviado': enviado,
  historia,
  'como-chegar': comoChegar,
  'meus-pedidos': meusPedidos,
  links,
  qr,
};

const app = document.getElementById('app');
const ctx = {};

async function carregar() {
  const [loja, cardapio, sprite] = await Promise.all([
    fetch('data/loja.json').then((r) => r.json()),
    fetch('data/cardapio.json').then((r) => r.json()),
    fetch('assets/icones/sprite.svg').then((r) => r.text()),
  ]);
  document.getElementById('sprite').innerHTML = sprite;
  Object.assign(ctx, { loja, cardapio });
}

function rota() {
  const [caminho, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  return { caminho: caminho.replace(/\/$/, ''), params: new URLSearchParams(query) };
}

// Parâmetros que podem vir em qualquer link: ?mesa=5 (QR da mesa) e ?origem=instagram
function lerParametros(params) {
  if (params.has('origem')) {
    registrarOrigem(params.get('origem'));
    track('chegada', { origem: params.get('origem') });
  }
  if (params.has('mesa') && params.get('mesa') !== pedido.mesa) {
    entrarNaMesa(params.get('mesa'));
    track('entrar_mesa', { mesa: pedido.mesa });
  }
}

function atualizarFaixaMesa() {
  const faixa = document.getElementById('faixa-mesa');
  faixa.hidden = !pedido.mesa;
  if (pedido.mesa) faixa.querySelector('[data-mesa]').textContent = pedido.mesa;
}

document.getElementById('sair-mesa').addEventListener('click', () => {
  sairDaMesa();
  const { caminho, params } = rota();
  params.delete('mesa');
  history.replaceState(null, '', `#/${caminho}${params.size ? `?${params}` : ''}`);
  render({ rolarTopo: false });
});

function render({ rolarTopo = true } = {}) {
  const { caminho, params } = rota();
  lerParametros(params);
  const view = ROTAS[caminho] || inicio;
  document.body.classList.toggle('sem-navegacao', !!view.semNavegacao);
  atualizarFaixaMesa();
  const c = { ...ctx, params, rerender: () => render({ rolarTopo: false }) };
  const y = scrollY;
  app.innerHTML = view.render(c);
  view.montar?.(app, c);
  document.title = `${view.titulo} | Berimbau Gourmet`;
  const secao = caminho.split('/')[0];
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === secao) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  if (rolarTopo) { scrollTo(0, 0); app.focus({ preventScroll: true }); } else scrollTo(0, y);
  prepararInstalacao();
}

function atualizarContador() {
  const n = quantidadeTotal();
  document.querySelectorAll('[data-contador]').forEach((el) => {
    el.textContent = n;
    el.hidden = n === 0;
  });
}

// Abrir itens a partir de qualquer cartão de produto.
document.addEventListener('click', (e) => {
  const card = e.target.closest('[data-item]');
  if (card) abrirItem(card.dataset.item, ctx.cardapio);
  const t = e.target.closest('[data-track]');
  if (t) track(t.dataset.track);
});

// Instalação do PWA
let promptInstalacao = null;
const ehIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const instalado = matchMedia('(display-mode: standalone)').matches || navigator.standalone;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  promptInstalacao = e;
  prepararInstalacao();
});
window.addEventListener('appinstalled', () => { promptInstalacao = null; track('instalar_app'); prepararInstalacao(); });

function prepararInstalacao() {
  const bloco = document.querySelector('[data-instalar]');
  if (!bloco) return;
  bloco.hidden = instalado || !(promptInstalacao || ehIOS);
  const botao = bloco.querySelector('[data-instalar-botao]');
  if (ehIOS && !promptInstalacao) {
    bloco.querySelector('[data-instalar-texto]').textContent =
      'No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.';
    botao.hidden = true;
  }
  botao.onclick = async () => {
    if (!promptInstalacao) return;
    promptInstalacao.prompt();
    await promptInstalacao.userChoice;
    promptInstalacao = null;
    prepararInstalacao();
  };
}

// Service worker + aviso de nova versão
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      reg.addEventListener('updatefound', () => {
        const novo = reg.installing;
        novo?.addEventListener('statechange', () => {
          if (novo.state === 'installed' && navigator.serviceWorker.controller) {
            document.getElementById('atualizacao').hidden = false;
          }
        });
      });
    } catch { /* sem service worker, o site segue funcionando */ }
  });
  document.getElementById('atualizar')?.addEventListener('click', async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    reg?.waiting?.postMessage('pular-espera');
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
    setTimeout(() => location.reload(), 1500);
  });
}

window.addEventListener('online', () => document.body.classList.remove('offline'));
window.addEventListener('offline', () => document.body.classList.add('offline'));
if (!navigator.onLine) document.body.classList.add('offline');

window.addEventListener('hashchange', () => render());
window.addEventListener('pedido:mudou', atualizarContador);

carregar()
  .then(() => { render(); atualizarContador(); })
  .catch(() => {
    app.innerHTML = '<div class="estado-vazio"><h2>Não foi possível carregar o cardápio</h2><p>Verifique sua conexão e tente de novo.</p><button class="botao" onclick="location.reload()">Tentar de novo</button></div>';
  });
