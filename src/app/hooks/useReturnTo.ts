import { useLocation } from 'react-router';
import { safeReturnTo } from '../lib/returnTo';

/** Ruta a la que volver después de ingresar (viene en `location.state.from`). */
export function useReturnTo(fallback = '/') {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const safe = safeReturnTo(from, '');
  return safe && !safe.startsWith('/login') && !safe.startsWith('/registro') ? safe : fallback;
}
