import { useLocation } from 'react-router';

/** Ruta a la que volver después de ingresar (viene en `location.state.from`). */
export function useReturnTo(fallback = '/') {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return from && from.startsWith('/') && !from.startsWith('/login') && !from.startsWith('/registro') ? from : fallback;
}
