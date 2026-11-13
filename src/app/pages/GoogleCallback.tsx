import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { AlertCircle } from 'lucide-react';
import { useAppDispatch } from '../store';
import { finishGoogleSignIn } from '../store/authSlice';
import { GoogleIcon } from '../components/GoogleButton';
import { Spinner } from '../components/States';

/** Google redirige acá (`/auth/callback/google?code&state`). */
export default function GoogleCallback() {
  const [params] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode: el código de Google es de un solo uso
    ran.current = true;
    dispatch(finishGoogleSignIn(params)).then((res) => {
      if (finishGoogleSignIn.fulfilled.match(res)) navigate(res.payload.returnTo, { replace: true });
      else setError(res.payload ?? 'No se pudo ingresar con Google.');
    });
  }, [dispatch, navigate, params]);

  return (
    <div className="container-page flex min-h-[55vh] flex-col items-center justify-center text-center">
      {error ? (
        <>
          <AlertCircle className="size-10 text-brand-500" />
          <h1 className="mt-4 text-2xl font-semibold text-ink-800">No pudimos ingresar con Google</h1>
          <p className="mt-2 max-w-md text-ink-600">{error}</p>
          <Link to="/login" replace className="btn-primary mt-6 h-11 px-6">
            Volver a intentar
          </Link>
        </>
      ) : (
        <>
          <GoogleIcon className="size-12" />
          <p className="mt-5 flex items-center gap-2 text-lg text-ink-700">
            <Spinner /> Ingresando con Google…
          </p>
        </>
      )}
    </div>
  );
}
