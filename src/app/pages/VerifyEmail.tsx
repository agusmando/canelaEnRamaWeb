import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Spinner } from '../components/States';
import { verifyEmailToken } from '../store/authSlice';
import { getErrorMessage } from '../api/client';
import { useAppSelector } from '../store';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/** Destino del enlace del mail "Confirmá tu email": `/auth/verify-email?token=…`. */
export default function VerifyEmail() {
  useDocumentTitle('Confirmar email', { noindex: true });
  const token = useSearchParams()[0].get('token') ?? '';
  const loggedIn = useAppSelector((s) => s.auth.status === 'authenticated');
  const [state, setState] = useState<'loading' | 'done' | 'error'>(token ? 'loading' : 'error');
  const [error, setError] = useState('El enlace no es válido.');
  const sent = useRef(false);

  useEffect(() => {
    // El token se puede usar una sola vez (en dev, StrictMode corre el efecto dos veces)
    if (!token || sent.current) return;
    sent.current = true;
    verifyEmailToken(token)
      .then(() => setState('done'))
      .catch((e) => {
        setError(getErrorMessage(e));
        setState('error');
      });
  }, [token]);

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold text-ink-800 sm:text-4xl">Confirmar email</h1>
      {state === 'loading' ? (
        <p className="mt-8 flex items-center gap-3 text-ink-600">
          <Spinner /> Confirmando tu email…
        </p>
      ) : state === 'done' ? (
        <div className="mt-8 rounded-xl bg-brand-50 p-6" role="status">
          <CheckCircle2 className="size-8 text-leaf-600" />
          <p className="mt-3 text-lg font-medium text-ink-800">¡Listo! Confirmamos tu email.</p>
          <p className="mt-1 text-ink-600">Desde ahora podés entrar a tu cuenta con tu contraseña o con Google (si usás el mismo email).</p>
          <Link to={loggedIn ? '/mi-cuenta' : '/login'} className="btn-primary mt-5 h-11 px-6">
            {loggedIn ? 'Ir a mi cuenta' : 'Iniciar sesión'}
          </Link>
        </div>
      ) : (
        <div className="mt-8 rounded-xl bg-ink-50 p-6" role="alert">
          <AlertCircle className="size-8 text-brand-500" />
          <p className="mt-3 text-lg font-medium text-ink-800">{error}</p>
          <Link to={loggedIn ? '/mi-cuenta' : '/login'} className="btn-primary mt-5 h-11 px-6">
            {loggedIn ? 'Ir a mi cuenta' : 'Iniciar sesión'}
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
