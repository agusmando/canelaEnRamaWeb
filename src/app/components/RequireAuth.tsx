import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAppSelector } from '../store';
import { PageLoader } from './States';

export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAppSelector((s) => s.auth.status);
  const location = useLocation();
  if (status === 'checking') return <PageLoader />;
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
