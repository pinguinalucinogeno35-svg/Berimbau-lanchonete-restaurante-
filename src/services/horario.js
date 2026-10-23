// Horário de funcionamento e período do dia, sempre no fuso da loja.
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const NOMES = { dom: 'Domingo', seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado' };

const min = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function agoraNaLoja(fuso = 'America/Bahia', data = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: fuso, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(data)
      .map((x) => [x.type, x.value])
  );
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { dia: DIAS[dia], indice: dia, minutos: Number(p.hour) * 60 + Number(p.minute) };
}

export function status(loja, data = new Date()) {
  const { dia, indice, minutos } = agoraNaLoja(loja.fuso, data);
  const hoje = loja.horarios[dia] || [];
  for (const [ini, fim] of hoje) {
    if (minutos >= min(ini) && minutos < min(fim)) {
      const resta = min(fim) - minutos;
      return { aberto: true, texto: resta <= 45 ? `Fecha em ${resta} min` : `Aberto agora · até ${fim}`, alerta: resta <= 45 };
    }
  }
  const proximoHoje = hoje.find(([ini]) => min(ini) > minutos);
  if (proximoHoje) return { aberto: false, texto: `Fechado · abre hoje às ${proximoHoje[0]}` };
  for (let i = 1; i <= 7; i++) {
    const d = DIAS[(indice + i) % 7];
    const h = loja.horarios[d];
    if (h && h.length) return { aberto: false, texto: `Fechado · abre ${i === 1 ? 'amanhã' : NOMES[d].toLowerCase()} às ${h[0][0]}` };
  }
  return { aberto: false, texto: 'Fechado' };
}

export function periodoAtual(periodos, fuso, data = new Date()) {
  const { minutos } = agoraNaLoja(fuso, data);
  return periodos.find((p) => minutos >= min(p.inicio) && minutos < min(p.fim)) || periodos[0];
}

export function tabelaHorarios(loja) {
  const { dia } = agoraNaLoja(loja.fuso);
  return ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((d) => ({
    dia: NOMES[d],
    hoje: d === dia,
    texto: (loja.horarios[d] || []).map(([a, b]) => `${a} – ${b}`).join(', ') || 'Fechado',
  }));
}
