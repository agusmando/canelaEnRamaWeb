import { useEffect } from 'react';

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · Canela en Rama` : 'Canela en Rama · Almacén natural';
  }, [title]);
}
