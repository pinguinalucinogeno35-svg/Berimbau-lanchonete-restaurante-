import { brl, esc, icone } from '../services/formato.js';
import { lerUltimo } from './pedido.js';
import { linkWhatsApp } from '../services/whatsapp.js';
import { toast } from '../components/toast.js';

export const titulo = 'Pedido enviado';

export function render({ loja }) {
  const u = lerUltimo();
  if (!u) return `<div class="estado-vazio"><h2>Nenhum pedido recente</h2><a class="botao" href="#/cardapio">Ver cardápio</a></div>`;
  return `
  <div class="enviado">
    <span class="icone-circulo grande">${icone('check')}</span>
    <h1>Pedido <em>#${esc(u.codigo)}</em> enviado!</h1>
    <p>Abrimos o WhatsApp com seu pedido pronto. <strong>Toque em enviar</strong> por lá e a equipe confirma em instantes.</p>
    <a class="link-seta" href="${linkWhatsApp(loja.whatsapp, u.texto)}" target="_blank" rel="noopener">O WhatsApp não abriu? Toque aqui<i class="seta" aria-hidden="true"></i></a>
    ${u.pix ? `
    <section class="bloco pix">
      <h2>${icone('pix')} Pague com Pix</h2>
      <p>Valor: <strong>${brl(u.total)}</strong></p>
      <label class="campo"><span>Pix copia e cola</span><textarea readonly rows="4">${esc(u.pix)}</textarea></label>
      <button class="botao botao-cheio botao-largo" data-copiar>${icone('check')}Copiar código Pix</button>
      <p class="nota">Envie o comprovante na mesma conversa do WhatsApp.</p>
    </section>` : ''}
    <div class="enviado-acoes">
      <a class="botao botao-contorno" href="#/">Voltar ao início</a>
      <a class="botao botao-contorno" href="#/como-chegar">${icone('local')}Como chegar</a>
    </div>
  </div>`;
}

export function montar(el) {
  el.querySelector('[data-copiar]')?.addEventListener('click', async () => {
    const ta = el.querySelector('.pix textarea');
    try { await navigator.clipboard.writeText(ta.value); } catch { ta.select(); document.execCommand('copy'); }
    toast('Código Pix copiado');
  });
}
