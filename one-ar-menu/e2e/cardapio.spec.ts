import { expect, test } from '@playwright/test';

test.describe('jornada pública (modo demonstrativo)', () => {
  test('home → cardápio → categoria → produto → 3D → experiência → volta ao cardápio', async ({
    page,
  }, info) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));

    await page.goto('/');
    await expect(page.getByText('Modo demonstrativo')).toBeVisible();
    await page.getByRole('link', { name: 'Explorar cardápio' }).click();
    await expect(page).toHaveURL(/\/cardapio$/);
    await expect(page.getByRole('heading', { name: 'Nosso cardápio' })).toBeVisible();

    await page.getByRole('button', { name: 'Salgados' }).click();
    await expect(page).toHaveURL(/categoria=salgados/);
    await expect(page.getByRole('link', { name: /Hambúrguer demonstrativo/ })).toHaveCount(0);

    await page.getByRole('link', { name: /Coxinha demonstrativa/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Coxinha demonstrativa' })).toBeVisible();
    await expect(page.getByText('R$ 9,00')).toBeVisible();

    // Visualizador 3D carrega o GLB de verdade (WebGL via SwiftShader no Chromium headless).
    await page.getByRole('tab', { name: 'Ver em 3D' }).click();
    const viewer = page.locator('[data-viewer-state]');
    await expect(viewer).toHaveAttribute('data-viewer-state', 'ready', { timeout: 30_000 });
    await expect(page.locator('model-viewer')).toHaveAttribute('ar-scale', 'fixed');
    await expect(page.locator('model-viewer')).toHaveAttribute('ar-modes', 'webxr scene-viewer quick-look');

    await page.getByRole('link', { name: 'Ver na minha mesa' }).click();
    await expect(page).toHaveURL(/\/experiencia\/coxinha-demonstrativa$/);
    await expect(page.locator('[data-viewer-state]')).toHaveAttribute('data-viewer-state', 'ready', {
      timeout: 30_000,
    });

    if (info.project.name === 'desktop') {
      // Desktop: sem câmera AR simulada; oferece QR para abrir no celular.
      await expect(page.getByText('Abra no celular para ver na sua mesa')).toBeVisible();
      await expect(page.getByRole('button', { name: /Ver na minha mesa/ })).toHaveCount(0);
    } else {
      // Celular Android emulado: o <model-viewer> oferece Scene Viewer com base no user agent (não consegue
      // checar o ARCore antes). O botão fica ativo; a confirmação real só acontece num aparelho físico.
      await expect(page.locator('[data-ar-state]')).toHaveAttribute('data-ar-state', 'available');
      await expect(page.getByRole('button', { name: /Ver na minha mesa/ })).toBeEnabled();
      await expect(page.getByText('Como usar')).toBeVisible();
      await expect(page.getByText(/Google Play Services para RA/)).toBeVisible();
    }
    await expect(
      page.getByText('Modelo demonstrativo. Não representa o alimento real.').first(),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Voltar ao cardápio' }).click();
    await expect(page).toHaveURL(/\/cardapio$/);
    expect(erros).toEqual([]);
  });

  test('toque em "Ver na minha mesa" gera o intent do Scene Viewer e registra só a tentativa', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'mobile', 'AR só é oferecida em celular');
    const intents: string[] = [];
    page.on('request', (r) => r.url().startsWith('intent://') && intents.push(r.url()));
    await page.goto('/experiencia/coxinha-demonstrativa');
    await expect(page.locator('[data-viewer-state]')).toHaveAttribute('data-viewer-state', 'ready', {
      timeout: 30_000,
    });
    await page.getByRole('button', { name: /Ver na minha mesa/ }).click();
    await expect.poll(() => intents.length).toBeGreaterThan(0);
    // Escala fixa => Scene Viewer sem redimensionamento; arquivo é o GLB publicado.
    expect(intents[0]).toContain('arvr.google.com/scene-viewer');
    expect(intents[0]).toContain('resizable=false');
    expect(decodeURIComponent(intents[0]!)).toContain('/demo/models/coxinha-demonstrativa.glb');
    await expect
      .poll(async () => page.evaluate(() => sessionStorage.getItem('one-ar-menu:demo-events') ?? ''))
      .toContain('ar_launch_attempt');
    // Sem app de AR para atender (Chromium headless), o app não fica travado: libera o botão e explica.
    await expect(page.locator('[data-ar-state]')).toHaveAttribute('data-ar-state', 'failed', {
      timeout: 20_000,
    });
    await expect(page.getByText(/Não foi possível abrir a realidade aumentada/)).toBeVisible();
  });

  test('modelo do cheeseburger (texturas + 120 mil triângulos) carrega e usa escala fixa', async ({
    page,
  }) => {
    await page.goto('/experiencia/cheeseburger-cheddar-demonstrativo');
    await expect(page.locator('[data-viewer-state]')).toHaveAttribute('data-viewer-state', 'ready', {
      timeout: 45_000,
    });
    await expect(page.locator('model-viewer')).toHaveAttribute('ar-scale', 'fixed');
    await expect(page.getByText(/26 × 26 × 15,5 cm/)).toBeVisible();
  });

  test('régua de calibração de 30 cm carrega em escala fixa', async ({ page }) => {
    await page.goto('/calibrar');
    await expect(page.locator('[data-viewer-state]')).toHaveAttribute('data-viewer-state', 'ready', {
      timeout: 30_000,
    });
    await expect(page.locator('model-viewer')).toHaveAttribute('ar-scale', 'fixed');
  });

  test('alternar para escala livre muda o ar-scale (só no celular)', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'alternância só aparece no celular');
    await page.goto('/experiencia/coxinha-demonstrativa');
    await expect(page.locator('model-viewer')).toHaveAttribute('ar-scale', 'fixed', { timeout: 30_000 });
    await page.getByRole('radio', { name: 'Livre' }).click();
    await expect(page.locator('model-viewer')).toHaveAttribute('ar-scale', 'auto');
    await expect(page.getByText(/O tamanho deixa de ser o real/)).toBeVisible();
    await page.getByRole('radio', { name: 'Tamanho real' }).click();
    await expect(page.locator('model-viewer')).toHaveAttribute('ar-scale', 'fixed');
  });

  test('busca e filtro "Com 3D"', async ({ page }) => {
    await page.goto('/cardapio');
    await page.getByRole('searchbox').fill('sobremesa');
    await expect(page.getByRole('link', { name: /Sobremesa demonstrativa/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Coxinha demonstrativa/ })).toHaveCount(0);
    await page.getByRole('searchbox').fill('');
    await page.getByRole('button', { name: 'Com 3D' }).click();
    await expect(page.getByRole('link', { name: /Empada demonstrativa/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Hambúrguer demonstrativo/ })).toBeVisible();
  });

  test('produto não publicado não é acessível', async ({ page }) => {
    await page.goto('/produto/produto-nao-publicado');
    await expect(page.getByText('Produto não encontrado')).toBeVisible();
  });

  test('QR code da mesa leva ao cardápio', async ({ page }) => {
    await page.goto('/q/mesa-01');
    await expect(page).toHaveURL(/\/cardapio$/);
  });

  test('modelo 3D inexistente mostra erro e não quebra a página', async ({ page }) => {
    await page.route('**/demo/models/hamburguer-demonstrativo.glb', (r) =>
      r.fulfill({ status: 404, body: 'not found' }),
    );
    await page.goto('/experiencia/hamburguer-demonstrativo');
    await expect(page.locator('[data-viewer-state]')).toHaveAttribute('data-viewer-state', 'error', {
      timeout: 30_000,
    });
    await expect(page.getByText('O arquivo do modelo 3D não foi encontrado.')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Hambúrguer demonstrativo' })).toBeVisible();
  });

  test('arquivo 3D corrompido mostra erro de arquivo inválido', async ({ page }) => {
    await page.route('**/demo/models/sobremesa-demonstrativa.glb', (r) =>
      r.fulfill({ status: 200, contentType: 'model/gltf-binary', body: 'isto não é um glb' }),
    );
    await page.goto('/experiencia/sobremesa-demonstrativa');
    await expect(page.locator('[data-viewer-state]')).toHaveAttribute('data-viewer-state', 'error', {
      timeout: 30_000,
    });
    await expect(page.getByText(/arquivo parece inválido/)).toBeVisible();
  });
});

test.describe('painel administrativo', () => {
  test('rotas /admin exigem autenticação', async ({ page }) => {
    for (const rota of ['/admin', '/admin/produtos', '/admin/modelos-3d', '/admin/configuracoes']) {
      await page.goto(rota);
      await expect(page).toHaveURL(/\/admin\/login$/);
    }
    await expect(page.getByText('Modo demonstrativo').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeDisabled();
  });
});
