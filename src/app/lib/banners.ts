/** URL absoluta (http/https) → se abre en otra pestaña; si no, es una ruta interna. */
export const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);

/** Ruta interna segura: debe empezar con "/" (y no "//", que sería otro dominio). */
export const isInternalPath = (url: string) => url.startsWith('/') && !url.startsWith('//');
