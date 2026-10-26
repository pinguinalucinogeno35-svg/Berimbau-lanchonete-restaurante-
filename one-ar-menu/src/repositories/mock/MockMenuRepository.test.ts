import { MockMenuRepository } from './MockMenuRepository';

const repo = new MockMenuRepository();

describe('MockMenuRepository (modo demonstrativo)', () => {
  it('não expõe produtos não publicados', async () => {
    const lista = await repo.listProducts();
    expect(lista.find((p) => p.slug === 'produto-nao-publicado')).toBeUndefined();
    expect(await repo.getProductBySlug('produto-nao-publicado')).toBeNull();
  });
  it('todos os itens são marcados como demonstrativos', async () => {
    expect((await repo.listProducts()).every((p) => p.isDemo)).toBe(true);
    expect((await repo.getRestaurant()).isDemo).toBe(true);
  });
  it('só expõe modelos aprovados e publicados', async () => {
    const comModelo = (await repo.listProducts()).filter((p) => p.arModel);
    expect(comModelo.length).toBeGreaterThan(0);
    expect(comModelo.every((p) => p.arModel!.approvalStatus === 'approved' && p.arModel!.publishedAt)).toBe(
      true,
    );
  });
  it('resolve QR code ativo e ignora código desconhecido', async () => {
    expect((await repo.resolveQrCode('mesa-01'))?.tableLabel).toBe('Mesa 1');
    expect(await repo.resolveQrCode('nao-existe')).toBeNull();
  });
  it('devolve cópias (alterar o resultado não altera os dados)', async () => {
    const a = await repo.listProducts();
    a[0]!.name = 'alterado';
    expect((await repo.listProducts())[0]!.name).not.toBe('alterado');
  });
});
