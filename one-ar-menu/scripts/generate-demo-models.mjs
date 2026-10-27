// Gera os modelos 3D DEMONSTRATIVOS (GLB) do ONE AR Menu.
//
// Os modelos são procedurais (torno/lathe + ruído), em METROS, com a origem no centro da base
// (y = 0 é o ponto de contato com a mesa). Eles provam o fluxo técnico de 3D e AR e
// NÃO representam alimentos reais. Uso: npm run models:demo

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Document, NodeIO } from '@gltf-transform/core';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'demo', 'models');
mkdirSync(OUT, { recursive: true });

// ---------- utilidades ----------
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const mixColor = (c1, c2, t) => c1.map((v, i) => mix(v, c2[i], t));
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const hex = (h) => [1, 3, 5].map((i) => srgbToLinear(parseInt(h.slice(i, i + 2), 16) / 255));

// Ruído de valor 3D determinístico (sem dependências).
function hash3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise3(x, y, z) {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    zi = Math.floor(z);
  const xf = x - xi,
    yf = y - yi,
    zf = z - zi;
  const s = (t) => t * t * (3 - 2 * t);
  const u = s(xf),
    v = s(yf),
    w = s(zf);
  let r = 0;
  for (let dx = 0; dx <= 1; dx++)
    for (let dy = 0; dy <= 1; dy++)
      for (let dz = 0; dz <= 1; dz++) {
        const wgt = (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
        r += wgt * hash3(xi + dx, yi + dy, zi + dz);
      }
  return r;
}
const fbm = (x, y, z) =>
  noise3(x, y, z) * 0.6 + noise3(x * 2.3, y * 2.3, z * 2.3) * 0.3 + noise3(x * 5.1, y * 5.1, z * 5.1) * 0.1;

/**
 * Superfície de revolução. `perfil(u)` devolve { r, y } para u em [0,1] (de baixo para cima).
 * `cor(u, ang, n)` devolve RGB linear; `deslocar(px,py,pz,u)` devolve deslocamento radial em metros.
 */
function torno({
  perfil,
  segmentos = 96,
  aneis = 72,
  cor,
  deslocar = () => 0,
  fecharBase = true,
  fecharTopo = false,
}) {
  const pos = [],
    nor = [],
    col = [],
    idx = [];
  const pontos = [];
  for (let i = 0; i <= aneis; i++) pontos.push(perfil(i / aneis));

  for (let i = 0; i <= aneis; i++) {
    const u = i / aneis;
    const { r, y } = pontos[i];
    for (let j = 0; j <= segmentos; j++) {
      const a = (j / segmentos) * Math.PI * 2;
      const cx = Math.cos(a),
        cz = Math.sin(a);
      const n = fbm(cx * 6 + 11, y * 90, cz * 6 + 7);
      const rr = Math.max(0, r + (r > 1e-4 ? deslocar(cx, y, cz, u, n) : 0));
      pos.push(rr * cx, y, rr * cz);
      col.push(...cor(u, a, n));
      nor.push(0, 0, 0);
    }
  }
  const linha = segmentos + 1;
  for (let i = 0; i < aneis; i++)
    for (let j = 0; j < segmentos; j++) {
      const a = i * linha + j,
        b = a + linha;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }

  const tampa = (anel, paraBaixo) => {
    const { y } = pontos[anel];
    const centro = pos.length / 3;
    pos.push(0, y, 0);
    nor.push(0, paraBaixo ? -1 : 1, 0);
    const base = anel * linha;
    col.push(col[base * 3], col[base * 3 + 1], col[base * 3 + 2]);
    for (let j = 0; j < segmentos; j++) {
      const a = base + j,
        b = base + j + 1;
      if (paraBaixo) idx.push(centro, a, b);
      else idx.push(centro, b, a);
    }
  };
  if (fecharBase && pontos[0].r > 1e-4) tampa(0, true);
  if (fecharTopo && pontos[aneis].r > 1e-4) tampa(aneis, false);

  // Normais suaves por acumulação de faces.
  const P = (k) => [pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]];
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]];
    const pa = P(a),
      pb = P(b),
      pc = P(c);
    const e1 = pb.map((v, i) => v - pa[i]),
      e2 = pc.map((v, i) => v - pa[i]);
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    for (const k of [a, b, c]) for (let i = 0; i < 3; i++) nor[k * 3 + i] += n[i];
  }
  // A emenda (j=0 e j=segmentos) tem a mesma posição: soma as duas normais para não aparecer costura.
  for (let i = 0; i <= aneis; i++) {
    const a = i * linha,
      b = a + segmentos;
    for (let c = 0; c < 3; c++) {
      const m = nor[a * 3 + c] + nor[b * 3 + c];
      nor[a * 3 + c] = m;
      nor[b * 3 + c] = m;
    }
  }
  for (let k = 0; k < nor.length; k += 3) {
    const l = Math.hypot(nor[k], nor[k + 1], nor[k + 2]);
    if (l < 1e-12) {
      nor[k] = 0;
      nor[k + 1] = 1;
      nor[k + 2] = 0;
      continue;
    }
    nor[k] /= l;
    nor[k + 1] /= l;
    nor[k + 2] /= l;
  }
  return { pos, nor, col, idx };
}

function criarGlb(nome, partes, { rugosidade = 0.75, extras = {} } = {}) {
  const doc = new Document();
  doc.createBuffer();
  const material = doc
    .createMaterial(`${nome}-material`)
    .setBaseColorFactor([1, 1, 1, 1])
    .setRoughnessFactor(rugosidade)
    .setMetallicFactor(0);
  const mesh = doc.createMesh(nome);
  for (const p of partes) {
    const prim = doc
      .createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(p.pos)))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(p.nor)))
      .setAttribute('COLOR_0', doc.createAccessor().setType('VEC3').setArray(new Float32Array(p.col)))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(p.idx)))
      .setMaterial(
        p.rugosidade !== undefined
          ? doc
              .createMaterial(`${nome}-${p.nome}`)
              .setBaseColorFactor([1, 1, 1, 1])
              .setRoughnessFactor(p.rugosidade)
              .setMetallicFactor(0)
          : material,
      );
    mesh.addPrimitive(prim);
  }
  const node = doc.createNode(nome).setMesh(mesh);
  const scene = doc.createScene(nome).addChild(node);
  doc.getRoot().setDefaultScene(scene);
  doc.getRoot().getAsset().generator = 'ONE AR Menu — gerador de modelos demonstrativos';
  doc.getRoot().setExtras({
    demonstrativo: true,
    aviso: 'Modelo demonstrativo. Não representa o alimento real.',
    unidades: 'metros',
    ...extras,
  });
  return doc;
}

function medidas(partes) {
  let min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (const p of partes)
    for (let k = 0; k < p.pos.length; k += 3)
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], p.pos[k + i]);
        max[i] = Math.max(max[i], p.pos[k + i]);
      }
  return {
    larguraCm: +((max[0] - min[0]) * 100).toFixed(1),
    alturaCm: +((max[1] - min[1]) * 100).toFixed(1),
    profundidadeCm: +((max[2] - min[2]) * 100).toFixed(1),
    minY: min[1],
  };
}

const io = new NodeIO();
const resumo = {};

// `escala` ajusta o tamanho final (fator uniforme) sem mudar a forma; a base continua em y = 0.
async function salvar(nome, partes, opcoes = {}) {
  const { escala = 1, ...resto } = opcoes;
  if (escala !== 1) for (const p of partes) p.pos = p.pos.map((v) => v * escala);
  opcoes = resto;
  const m = medidas(partes);
  if (Math.abs(m.minY) > 1e-4) throw new Error(`${nome}: a base precisa estar em y=0 (está em ${m.minY})`);
  const doc = criarGlb(nome, partes, { ...opcoes, extras: { dimensoesCm: m } });
  const bin = await io.writeBinary(doc);
  writeFileSync(join(OUT, `${nome}.glb`), bin);
  resumo[nome] = { ...m, bytes: bin.byteLength };
}

// ---------- Coxinha demonstrativa (≈ 6,6 × 8,6 cm) ----------
{
  const H = 0.086,
    R = 0.033;
  const DOURADO = hex('#B8732D'),
    TOSTADO = hex('#7A4318'),
    CLARO = hex('#D9A05A');
  const perfil = (u) => {
    // Gota: base arredondada com apoio plano na mesa, barriga larga e ponta afunilada no topo.
    const y = u * H;
    let g;
    if (u <= 0.3) g = 0.62 + 0.38 * Math.pow(Math.sin((Math.PI / 2) * (u / 0.3)), 0.7);
    else g = Math.pow(Math.max(0, 1 - Math.pow((u - 0.3) / 0.7, 1.6)), 0.9);
    return { r: R * g, y };
  };
  const coxinha = torno({
    perfil,
    segmentos: 112,
    aneis: 96,
    deslocar: (_x, _y, _z, u, n) => (n - 0.5) * 0.0012 * (0.4 + 0.6 * Math.sin(Math.PI * u)),
    cor: (u, _a, n) => {
      let c = mixColor(CLARO, DOURADO, clamp(n * 1.4 - 0.1, 0, 1));
      c = mixColor(c, TOSTADO, clamp((n - 0.62) * 3, 0, 1) * 0.8 + (u < 0.06 ? 0.35 : 0));
      return c;
    },
  });
  // Coxinha de lanchonete: ~8,2 cm de largura × ~10,7 cm de altura.
  await salvar('coxinha-demonstrativa', [coxinha], { rugosidade: 0.82, escala: 1.622 });
}

// ---------- Hambúrguer demonstrativo (≈ 11 × 8 cm) ----------
{
  const partes = [];
  let y0 = 0;
  const camada = ({ nome, altura, raio, perfil, cor, deslocar, rug }) => {
    const ini = y0;
    const p = torno({
      perfil: (u) => ({ r: perfil(u) * raio, y: ini + u * altura }),
      cor,
      deslocar,
      fecharBase: true,
      fecharTopo: true,
      segmentos: 96,
      aneis: 40,
    });
    p.nome = nome;
    p.rugosidade = rug;
    partes.push(p);
    y0 += altura;
  };
  const PAO = hex('#C4782F'),
    PAO_CLARO = hex('#E2B074'),
    CARNE = hex('#4A2A1C'),
    CARNE_CLARA = hex('#6B3C25');
  camada({
    nome: 'pao-base',
    altura: 0.016,
    raio: 0.052,
    rug: 0.7,
    perfil: (u) => 0.9 + 0.1 * Math.sin(Math.PI * Math.min(1, u * 1.6)),
    cor: (u, _a, n) => mixColor(PAO_CLARO, PAO, clamp(1 - u + n * 0.4, 0, 1)),
  });
  camada({
    nome: 'carne',
    altura: 0.018,
    raio: 0.054,
    rug: 0.9,
    perfil: (u) => 0.94 + 0.06 * Math.sin(Math.PI * u),
    deslocar: (_x, _y, _z, _u, n) => (n - 0.5) * 0.002,
    cor: (_u, _a, n) => mixColor(CARNE, CARNE_CLARA, n),
  });
  camada({
    nome: 'queijo',
    altura: 0.003,
    raio: 0.056,
    rug: 0.45,
    perfil: () => 1,
    deslocar: (x, _y, z) => 0.003 * Math.max(0, Math.sin(Math.atan2(z, x) * 4)),
    cor: () => hex('#F2B53A'),
  });
  camada({
    nome: 'alface',
    altura: 0.006,
    raio: 0.055,
    rug: 0.6,
    perfil: () => 1,
    deslocar: (x, _y, z) => 0.004 * Math.sin(Math.atan2(z, x) * 9),
    cor: (_u, _a, n) => mixColor(hex('#5E8A2E'), hex('#8DB548'), n),
  });
  camada({
    nome: 'pao-topo',
    altura: 0.036,
    raio: 0.054,
    rug: 0.62,
    perfil: (u) =>
      Math.pow(Math.max(0, 1 - Math.pow(u, 2.2)), 0.5) * (0.96 + 0.04 * (1 - u)) + (u === 1 ? 0 : 0),
    deslocar: (_x, _y, _z, u, n) => (n > 0.78 && u > 0.35 ? 0.0012 : 0),
    cor: (u, _a, n) =>
      n > 0.78 && u > 0.35 ? hex('#F3E2C0') : mixColor(PAO, PAO_CLARO, clamp(0.3 - u * 0.3 + n * 0.2, 0, 1)),
  });
  // Hambúrguer artesanal: ~12,6 cm de diâmetro.
  await salvar('hamburguer-demonstrativo', partes, { escala: 1.292 });
}

// ---------- Sobremesa demonstrativa: bolinho com bola de sorvete (≈ 7 × 7 cm) ----------
{
  const partes = [];
  const H = 0.042,
    R = 0.034;
  const bolo = torno({
    perfil: (u) => ({
      r: R * (u < 0.85 ? 1 : Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.85) / 0.15, 2)) * 0.9 + 0.1)),
      y: u * H,
    }),
    deslocar: (_x, _y, _z, _u, n) => (n - 0.5) * 0.0008,
    cor: (u, _a, n) => mixColor(hex('#3A1E12'), hex('#5A3020'), clamp(n + u * 0.2, 0, 1)),
    fecharTopo: true,
    segmentos: 96,
    aneis: 48,
  });
  bolo.nome = 'bolo';
  bolo.rugosidade = 0.8;
  partes.push(bolo);
  const Rs = 0.022,
    base = H - 0.006;
  const sorvete = torno({
    perfil: (u) => {
      const t = Math.PI * u;
      return { r: Math.sin(t) * Rs * (u < 0.15 ? 0.9 + u : 1), y: base + (1 - Math.cos(t)) * Rs * 0.95 };
    },
    deslocar: (_x, _y, _z, u, n) => (n - 0.5) * 0.0014 * Math.sin(Math.PI * u),
    cor: (_u, _a, n) => mixColor(hex('#F4EAD2'), hex('#E8D7B0'), n),
    fecharBase: true,
    segmentos: 96,
    aneis: 48,
  });
  sorvete.nome = 'sorvete';
  sorvete.rugosidade = 0.55;
  partes.push(sorvete);
  // Bolinho individual: ~8 cm de diâmetro.
  await salvar('sobremesa-demonstrativa', partes, { escala: 1.539 });
}

// ---------- Régua de calibração (30 cm) ----------
// Serve para conferir a escala da AR no aparelho: posicione ao lado de uma régua real ou de uma folha A4 (29,7 cm).
{
  function caixa(x0, x1, y0, y1, z0, z1, cor) {
    const faces = [
      [
        [x1, y0, z0],
        [x1, y1, z0],
        [x1, y1, z1],
        [x1, y0, z1],
        [1, 0, 0],
      ],
      [
        [x0, y0, z1],
        [x0, y1, z1],
        [x0, y1, z0],
        [x0, y0, z0],
        [-1, 0, 0],
      ],
      [
        [x0, y1, z0],
        [x0, y1, z1],
        [x1, y1, z1],
        [x1, y1, z0],
        [0, 1, 0],
      ],
      [
        [x0, y0, z1],
        [x0, y0, z0],
        [x1, y0, z0],
        [x1, y0, z1],
        [0, -1, 0],
      ],
      [
        [x0, y0, z1],
        [x1, y0, z1],
        [x1, y1, z1],
        [x0, y1, z1],
        [0, 0, 1],
      ],
      [
        [x1, y0, z0],
        [x0, y0, z0],
        [x0, y1, z0],
        [x1, y1, z0],
        [0, 0, -1],
      ],
    ];
    const pos = [],
      nor = [],
      col = [],
      idx = [];
    for (const [a, b, c, d, n] of faces) {
      const base = pos.length / 3;
      for (const v of [a, b, c, d]) {
        pos.push(...v);
        nor.push(...n);
        col.push(...cor);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    return { pos, nor, col, idx };
  }
  function juntar(lista) {
    const out = { pos: [], nor: [], col: [], idx: [] };
    for (const c of lista) {
      const off = out.pos.length / 3;
      out.pos.push(...c.pos);
      out.nor.push(...c.nor);
      out.col.push(...c.col);
      out.idx.push(...c.idx.map((i) => i + off));
    }
    return out;
  }
  const L = 0.3,
    W = 0.035,
    T = 0.003;
  const corpo = caixa(-L / 2, L / 2, 0, T, -W / 2, W / 2, hex('#F2E6C9'));
  corpo.nome = 'corpo';
  corpo.rugosidade = 0.6;
  const marcas = [];
  for (let cm = 0; cm <= 30; cm++) {
    const x = -L / 2 + cm / 100;
    const comprimento = cm % 10 === 0 ? 0.016 : cm % 5 === 0 ? 0.011 : 0.006;
    const largura = cm % 10 === 0 ? 0.0012 : 0.0008;
    marcas.push(
      caixa(x - largura / 2, x + largura / 2, T, T + 0.0004, -W / 2, -W / 2 + comprimento, hex('#202521')),
    );
  }
  // Faixas alternadas a cada 5 cm na borda oposta: facilitam contar à distância.
  for (let i = 0; i < 6; i++) {
    const x0 = -L / 2 + i * 0.05;
    const cor = i % 2 ? hex('#C2A77B') : hex('#66735C');
    marcas.push(caixa(x0, x0 + 0.05, T, T + 0.0003, W / 2 - 0.006, W / 2, cor));
  }
  const tinta = juntar(marcas);
  tinta.nome = 'marcas';
  tinta.rugosidade = 0.8;
  await salvar('regua-calibracao-30cm', [corpo, tinta]);
}

console.log(JSON.stringify(resumo, null, 2));
writeFileSync(join(OUT, 'dimensoes.json'), JSON.stringify(resumo, null, 2) + '\n');
