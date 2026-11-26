import { describe, expect, it } from 'vitest';
import { safeReturnTo } from './returnTo';

describe('safeReturnTo', () => {
  it('conserva rutas internas con query y hash', () => {
    expect(safeReturnTo('/pedidos/12?tab=envio#detalle')).toBe('/pedidos/12?tab=envio#detalle');
  });

  it.each(['https://evil.com', '//evil.com', '/\\evil.com', 'javascript:alert(1)', undefined])(
    'rechaza destinos no internos: %s',
    (value) => {
      expect(safeReturnTo(value)).toBe('/');
    },
  );
});
