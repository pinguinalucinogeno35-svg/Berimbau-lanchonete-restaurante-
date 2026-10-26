import { detectDevice } from './device';

const win = (standalone = false) =>
  ({ matchMedia: () => ({ matches: standalone }), isSecureContext: true }) as unknown as Window;

const ua = {
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  android:
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
  androidTablet:
    'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36',
  instagram:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 300.0',
  ipadOs:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  desktop:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36',
};

it('iPhone: iOS, celular', () =>
  expect(detectDevice({ userAgent: ua.iphone, maxTouchPoints: 5 }, win())).toMatchObject({
    os: 'ios',
    category: 'mobile',
    inAppBrowser: null,
  }));
it('Android celular e tablet', () => {
  expect(detectDevice({ userAgent: ua.android, maxTouchPoints: 5 }, win())).toMatchObject({
    os: 'android',
    category: 'mobile',
  });
  expect(detectDevice({ userAgent: ua.androidTablet, maxTouchPoints: 5 }, win())).toMatchObject({
    os: 'android',
    category: 'tablet',
  });
});
it('detecta navegador interno do Instagram', () =>
  expect(detectDevice({ userAgent: ua.instagram, maxTouchPoints: 5 }, win()).inAppBrowser).toBe('Instagram'));
it('iPadOS se apresenta como Mac, mas com toque', () =>
  expect(detectDevice({ userAgent: ua.ipadOs, maxTouchPoints: 5 }, win())).toMatchObject({
    os: 'ios',
    category: 'tablet',
  }));
it('desktop', () =>
  expect(detectDevice({ userAgent: ua.desktop, maxTouchPoints: 0 }, win())).toMatchObject({
    os: 'other',
    category: 'desktop',
  }));
it('PWA instalada', () =>
  expect(detectDevice({ userAgent: ua.iphone, maxTouchPoints: 5 }, win(true)).isStandalonePwa).toBe(true));
