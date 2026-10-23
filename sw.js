// Service worker do Berimbau Gourmet.
// Estrutura do app: cache na instalação. Fotos: cache primeiro. Dados (JSON): rede primeiro.
const VERSAO = 'berimbau-v1';
const SHELL = `${VERSAO}-shell`;
const FOTOS = `${VERSAO}-fotos`;
const DADOS = `${VERSAO}-dados`;
const LIMITE_FOTOS = 60;

const ARQUIVOS = [
  './',
  'index.html',
  'offline.html',
  'manifest.webmanifest',
  'assets/tokens.css',
  'src/styles/app.css',
  'src/main.js',
  'src/views/inicio.js',
  'src/views/cardapio.js',
  'src/views/pedido.js',
  'src/views/enviado.js',
  'src/views/historia.js',
  'src/views/como-chegar.js',
  'src/components/card-produto.js',
  'src/components/folha-item.js',
  'src/components/toast.js',
  'src/store/pedido.js',
  'src/services/formato.js',
  'src/services/horario.js',
  'src/services/pix.js',
  'src/services/whatsapp.js',
  'src/services/analytics.js',
  'assets/icones/sprite.svg',
  'assets/marca/logo-berimbau-completo.svg',
  'assets/marca/logo-berimbau-completo-creme.png',
  'assets/app/icon-192.png',
  'assets/app/favicon-48.png',
  'data/loja.json',
  'data/cardapio.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(ARQUIVOS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => !n.startsWith(VERSAO)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'pular-espera') self.skipWaiting();
});

async function limitar(nome, max) {
  const cache = await caches.open(nome);
  const chaves = await cache.keys();
  for (let i = 0; i < chaves.length - max; i++) await cache.delete(chaves[i]);
}

async function redePrimeiro(req) {
  const cache = await caches.open(DADOS);
  try {
    const resp = await fetch(req);
    if (resp.ok) cache.put(req, resp.clone());
    return resp;
  } catch {
    return (await cache.match(req)) || (await caches.match(req));
  }
}

async function cachePrimeiro(req, nome) {
  const salvo = await caches.match(req);
  if (salvo) return salvo;
  const resp = await fetch(req);
  if (resp.ok || resp.type === 'opaque') {
    const cache = await caches.open(nome);
    cache.put(req, resp.clone());
    if (nome === FOTOS) limitar(FOTOS, LIMITE_FOTOS);
  }
  return resp;
}

async function shell(req) {
  const salvo = await caches.match(req, { ignoreSearch: true });
  const rede = fetch(req)
    .then((resp) => {
      if (resp.ok) caches.open(SHELL).then((c) => c.put(req, resp.clone()));
      return resp;
    })
    .catch(() => null);
  return salvo || (await rede) || (req.mode === 'navigate' ? caches.match('offline.html') : Response.error());
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin && url.pathname.endsWith('.json')) {
    e.respondWith(redePrimeiro(req));
  } else if (req.destination === 'image' && url.origin === location.origin) {
    e.respondWith(cachePrimeiro(req, FOTOS));
  } else if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(cachePrimeiro(req, SHELL));
  } else if (url.origin === location.origin) {
    e.respondWith(shell(req));
  }
});
