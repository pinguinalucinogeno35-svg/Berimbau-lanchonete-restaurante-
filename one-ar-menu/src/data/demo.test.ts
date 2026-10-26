import { demoProducts, versioned } from './demo';
import versoes from './assetVersions.json';

describe('URLs versionadas dos assets demonstrativos', () => {
  it('acrescenta o hash do conteúdo para evitar cache antigo', () => {
    expect(versioned('/demo/models/coxinha-demonstrativa.glb')).toMatch(
      /^\/demo\/models\/coxinha-demonstrativa\.glb\?v=[0-9a-f]{10}$/,
    );
  });
  it('mantém caminhos desconhecidos sem alteração', () => expect(versioned('/outro.glb')).toBe('/outro.glb'));
  it('todo modelo e poster dos produtos existe no mapa de versões (arquivo presente em public/)', () => {
    const urls = demoProducts
      .flatMap((p) => [p.arModel?.glbUrl, p.arModel?.posterUrl, ...p.media.map((m) => m.url)])
      .filter(Boolean) as string[];
    expect(urls.length).toBeGreaterThan(0);
    for (const u of urls) expect(Object.keys(versoes)).toContain(u.split('?')[0]);
    for (const u of urls) expect(u).toMatch(/\?v=/);
  });
});
