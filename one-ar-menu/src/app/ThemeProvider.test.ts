import { applyTheme } from './ThemeProvider';

it('aplica cores válidas e ignora valores inseguros', () => {
  const root = document.createElement('div');
  const limpar = applyTheme(
    {
      colors: { accent: '#AA8844', bg: 'red; background:url(x)' },
      fonts: { display: 'Playfair Display', body: "x'); }" },
    },
    root,
  );
  expect(root.style.getPropertyValue('--one-accent')).toBe('#AA8844');
  expect(root.style.getPropertyValue('--one-bg')).toBe('');
  expect(root.style.getPropertyValue('--one-font-display')).toContain('Playfair Display');
  expect(root.style.getPropertyValue('--one-font-body')).toBe('');
  limpar();
  expect(root.style.getPropertyValue('--one-accent')).toBe('');
});
