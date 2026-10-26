import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { AuthProvider } from '@/features/authentication/AuthProvider';
import { ThemeProvider } from './ThemeProvider';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 2, refetchOnWindowFocus: true, networkMode: 'offlineFirst' },
      mutations: { networkMode: 'online' },
    },
  });
}

export function AppProviders({ children, client }: { children: ReactNode; client?: QueryClient }) {
  const [qc] = useState(() => client ?? makeQueryClient());
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
