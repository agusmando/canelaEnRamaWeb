import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Divider, Field, FormError } from '../components/Field';
import { GoogleButton } from '../components/GoogleButton';
import { Spinner } from '../components/States';
import { useAppDispatch, useAppSelector } from '../store';
import { clearNotice, signIn } from '../store/authSlice';
import { useReturnTo } from '../hooks/useReturnTo';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Login() {
  useDocumentTitle('Acceder');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const returnTo = useReturnTo();
  const { status, notice } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (notice) {
      setError(notice);
      dispatch(clearNotice());
    }
  }, [notice, dispatch]);

  if (status === 'authenticated' && !loading) return <Navigate to={returnTo} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await dispatch(signIn({ email, password }));
    setLoading(false);
    if (signIn.fulfilled.match(res)) navigate(returnTo, { replace: true });
    else setError(res.payload ?? 'No se pudo iniciar sesión.');
  };

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold text-ink-800 sm:text-[44px]">Acceder</h1>
      <p className="mt-6 text-lg text-ink-800">
        ¿Aún no sos miembro?{' '}
        <Link to="/registro" state={{ from: returnTo }} className="inline-flex items-center gap-2 font-semibold hover:text-brand-500">
          Registrate acá <ArrowRight className="size-4" />
        </Link>
      </p>

      <div className="mt-6">
        <GoogleButton label="Continuar con Google" returnTo={returnTo} />
      </div>
      <Divider>o con tu email</Divider>

      <form onSubmit={submit} className="space-y-5" noValidate>
        <FormError message={error} />
        <Field
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Ingrese su correo electrónico"
          icon={<Mail className="size-5" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div>
          <Field
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Ingrese su contraseña"
            icon={<Lock className="size-5" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="mt-2 text-right text-[17px] text-ink-800">
            ¿Olvidaste tu contraseña?{' '}
            <Link to="/recuperar" state={{ email }} className="font-medium text-[#1a73e8] underline underline-offset-2">
              Click acá
            </Link>
          </p>
        </div>
        <button type="submit" disabled={loading || !email || !password} className="btn-primary h-[52px] w-full text-lg font-semibold">
          {loading && <Spinner />} Iniciá sesión
        </button>
      </form>
    </AuthShell>
  );
}
