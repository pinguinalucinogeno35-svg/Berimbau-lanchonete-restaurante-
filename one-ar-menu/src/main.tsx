import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AppProviders } from '@/app/providers';
import { createRouter } from '@/app/router';
// Fontes servidas pelo próprio app (sem Google Fonts: funciona offline e não envia IP dos clientes a terceiros).
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource-variable/dm-sans/opsz.css';
import '@/styles/index.css';

const router = createRouter();

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado.');

createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
