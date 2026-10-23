import { esc, icone } from '../services/formato.js';

export const titulo = 'Nossa história';

const MARCOS = [
  ['Origem', 'Texto de exemplo: o Berimbau nasce no centro histórico de Ilhéus como um ponto de encontro para o café da manhã.'],
  ['Tradição', 'Texto de exemplo: o pão de queijo vira assinatura da casa e atravessa gerações de clientes.'],
  ['Cozinha', 'Texto de exemplo: chegam o almoço completo e os sabores do sul da Bahia, como cacau, moqueca e carne do sol.'],
  ['Hoje', 'Cafeteria, lanchonete e restaurante, com mais de mil avaliações e a mesma essência de sempre.'],
];

export function render({ loja }) {
  return `
  <header class="pagina-topo historia-topo">
    <img src="assets/fotos/centro-historico-rua.webp" alt="Casarões do centro histórico de Ilhéus" loading="lazy">
    <div>
      <h1>Uma história que <em>Ilhéus já conhece.</em></h1>
      <p>${esc(loja.descricao)}</p>
    </div>
  </header>
  <section class="secao">
    <p class="aviso">Conteúdo de exemplo. Substituir pela história real enviada pelo Berimbau.</p>
    <ol class="linha-tempo">
      ${MARCOS.map(([t, d]) => `<li><span class="icone-circulo">${icone('historia')}</span><div><h2>${esc(t)}</h2><p>${esc(d)}</p></div></li>`).join('')}
    </ol>
  </section>
  <section class="secao galeria">
    <img src="assets/fotos/pao-de-queijo-cafe.webp" alt="Pão de queijo e cappuccino" loading="lazy">
    <img src="assets/fotos/almoco-parmegiana.webp" alt="Prato do almoço" loading="lazy">
    <img src="assets/fotos/lanche-da-tarde.webp" alt="Lanche da tarde" loading="lazy">
  </section>
  <section class="secao chamada">
    <h2>Venha viver <em>essa história.</em></h2>
    <a class="botao" href="#/como-chegar">${icone('local')}Como chegar</a>
  </section>`;
}
