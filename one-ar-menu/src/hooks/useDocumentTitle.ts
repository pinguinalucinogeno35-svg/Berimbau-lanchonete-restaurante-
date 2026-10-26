import { useEffect } from 'react';

export function useDocumentTitle(titulo?: string | null) {
  useEffect(() => {
    if (titulo) document.title = `${titulo} | Cardápio`;
  }, [titulo]);
}
