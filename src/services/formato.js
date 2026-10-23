const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const brl = (v) => moeda.format(v);

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const icone = (nome, extra = '') =>
  `<svg class="icone ${extra}" aria-hidden="true" focusable="false"><use href="#i-${nome}"/></svg>`;
