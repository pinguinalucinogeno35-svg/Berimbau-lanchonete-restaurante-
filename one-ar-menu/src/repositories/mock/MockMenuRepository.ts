// Repositório do modo demonstrativo: lê dados fictícios em memória e NÃO grava nada em servidor.
import { demoCategories, demoProducts, demoQrCodes, demoRestaurant } from '@/data/demo';
import type { AnalyticsEventInput, Category, Product, QrCode, Restaurant } from '@/types/domain';
import type { MenuRepository } from '../types';

const SESSION_KEY = 'one-ar-menu:demo-events';

export class MockMenuRepository implements MenuRepository {
  readonly kind = 'demo' as const;
  private readonly latency: number;

  constructor(options: { latencyMs?: number } = {}) {
    this.latency = options.latencyMs ?? 0;
  }

  private async wait<T>(value: T): Promise<T> {
    if (this.latency) await new Promise((r) => setTimeout(r, this.latency));
    return structuredClone(value);
  }

  getRestaurant(): Promise<Restaurant> {
    return this.wait(demoRestaurant);
  }

  listCategories(): Promise<Category[]> {
    return this.wait(demoCategories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder));
  }

  listProducts(): Promise<Product[]> {
    const ativas = new Set(demoCategories.filter((c) => c.isActive).map((c) => c.id));
    return this.wait(
      demoProducts
        .filter((p) => p.isPublished && ativas.has(p.categoryId))
        .map((p) => ({
          ...p,
          arModel:
            p.arModel && p.arModel.approvalStatus === 'approved' && p.arModel.publishedAt ? p.arModel : null,
        })),
    );
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const lista = await this.listProducts();
    return lista.find((p) => p.slug === slug) ?? null;
  }

  async resolveQrCode(code: string): Promise<QrCode | null> {
    return this.wait(demoQrCodes.find((q) => q.code === code && q.isActive) ?? null);
  }

  async trackEvent(event: AnalyticsEventInput & { deviceCategory: string }): Promise<void> {
    // Só para inspeção local no modo demonstrativo (sessionStorage desta aba).
    try {
      const atual = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '[]') as unknown[];
      atual.push({ ...event, at: new Date().toISOString() });
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(atual.slice(-200)));
    } catch {
      /* armazenamento indisponível: ignora */
    }
  }
}
