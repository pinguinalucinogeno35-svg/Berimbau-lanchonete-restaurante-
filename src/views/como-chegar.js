import { esc, icone } from '../services/formato.js';
import { status, tabelaHorarios } from '../services/horario.js';

export const titulo = 'Como chegar';

export function render({ loja }) {
  const e = loja.endereco;
  const st = status(loja);
  const q = encodeURIComponent(`${e.rua}, ${e.cidade} - ${e.uf}`);
  return `
  <header class="pagina-topo">
    <h1>No coração <em>de Ilhéus.</em></h1>
    <p>Gastronomia, tradição e encontros no centro histórico.</p>
  </header>
  <section class="card-mapa">
    <div class="mapa">
      <iframe title="Mapa do Berimbau Gourmet" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
        src="https://maps.google.com/maps?q=${q}&z=17&output=embed"></iframe>
    </div>
    <div class="endereco">
      ${icone('local')}
      <h2>${esc(e.rua)} — ${esc(e.bairro)}, ${esc(e.cidade)} - ${esc(e.uf)}</h2>
      <div class="div"></div>
      <p>${esc(loja.referencia)}</p>
      <a class="botao botao-cheio" href="${loja.maps}" target="_blank" rel="noopener" data-track="clique_maps">${icone('mapa')}Abrir rota no Maps</a>
    </div>
  </section>
  <section class="secao horarios">
    <h2>Horários</h2>
    <span class="status ${st.aberto ? 'aberto' : 'fechado'}">${icone('relogio')}${esc(st.texto)}</span>
    <table>
      ${tabelaHorarios(loja).map((h) => `<tr${h.hoje ? ' class="hoje"' : ''}><th scope="row">${h.dia}${h.hoje ? ' <small>hoje</small>' : ''}</th><td>${esc(h.texto)}</td></tr>`).join('')}
    </table>
  </section>
  <section class="secao contatos">
    <a class="canal" href="tel:${loja.telefone.replace(/[^\d+]/g, '')}" data-track="clique_ligar">${icone('telefone')}<span><strong>Ligar</strong><small>${esc(loja.telefone)}</small></span><i class="seta" aria-hidden="true"></i></a>
    <a class="canal" href="https://wa.me/${loja.whatsapp}" target="_blank" rel="noopener" data-track="clique_whatsapp">${icone('mensagem')}<span><strong>WhatsApp</strong><small>Dúvidas e encomendas</small></span><i class="seta" aria-hidden="true"></i></a>
    <a class="canal" href="${loja.instagram}" target="_blank" rel="noopener" data-track="clique_instagram">${icone('camera-social')}<span><strong>Instagram</strong><small>@berimbaugourmet</small></span><i class="seta" aria-hidden="true"></i></a>
  </section>`;
}
