/** Solo rutas internas: evita open redirects (`//evil.com`, `https://…`, backslashes). */
export function safeReturnTo(to: string | undefined, fallback = '/') {
  if (!to || !to.startsWith('/') || to.startsWith('//') || to.includes('\\')) return fallback;
  try {
    const url = new URL(to, 'https://canelaenrama.local');
    if (url.origin !== 'https://canelaenrama.local') return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
