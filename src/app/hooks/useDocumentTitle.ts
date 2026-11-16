import { useSeo, type SeoOptions } from './useSeo';

/** Atajo de `useSeo` para las páginas que solo definen el título. */
export function useDocumentTitle(title?: string, options: Omit<SeoOptions, 'title'> = {}) {
  useSeo({ ...options, title });
}
