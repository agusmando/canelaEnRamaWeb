import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { ArrowRight, Check, Lock, Mail } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Divider, Field, FormError } from '../components/Field';
import { GoogleButton } from '../components/GoogleButton';
import { ActionButton } from '../components/ActionButton';
import { useAppDispatch, useAppSelector } from '../store';
import { signUp } from '../store/authSlice';
import { useReturnTo } from '../hooks/useReturnTo';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { cn } from '../lib/utils';
import { showError } from '../lib/notifications';

/** Reglas por defecto de SuperTokens: 8+ caracteres, al menos una letra y un número. */
export const passwordRules = (p: string) => [
  { ok: p.length >= 8, label: 'Al menos 8 caracteres' },
  { ok: /[a-zA-Z]/.test(p), label: 'Una letra' },
  { ok: /\d/.test(p), label: 'Un número' },
];

export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {passwordRules(password).map((r) => (
        <li key={r.label} className={cn('flex items-center gap-1.5', r.ok ? 'text-leaf-600' : 'text-ink-400')}>
          <Check className="size-3.5" strokeWidth={3} /> {r.label}
        </li>
      ))}
    </ul>
  );
}

export default function Register() {
  useDocumentTitle('Crear cuenta', { noindex: true });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const returnTo = useReturnTo();
  const status = useAppSelector((s) => s.auth.status);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  if (status === 'authenticated' && !loading) return <Navigate to={returnTo} replace />;

  const valid = passwordRules(password).every((r) => r.ok);
  const mismatch = confirm.length > 0 && confirm !== password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Ingresá un email válido.');
    if (!valid) return setError('La contraseña no cumple los requisitos.');
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    const res = await dispatch(signUp({ email, password }));
    setLoading(false);
    if (signUp.fulfilled.match(res)) navigate(returnTo, { replace: true });
    else {
      const message = res.payload ?? 'No se pudo crear la cuenta.';
      setError(message);
      showError({ message });
    }
  };

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold text-ink-800 sm:text-[44px]">Crear cuenta</h1>
      <p className="mt-6 text-lg text-ink-800">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" state={{ from: returnTo }} className="inline-flex items-center gap-2 font-semibold hover:text-brand-500">
          Iniciá sesión <ArrowRight className="size-4" />
        </Link>
      </p>

      <div className="mt-6">
        <GoogleButton label="Registrarme con Google" returnTo={returnTo} />
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
            autoComplete="new-password"
            placeholder="Elegí una contraseña"
            icon={<Lock className="size-5" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <PasswordChecklist password={password} />
        </div>
        <Field
          label="Repetí la contraseña"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Repetí tu contraseña"
          icon={<Lock className="size-5" />}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={(touched || confirm.length >= password.length) && mismatch ? 'Las contraseñas no coinciden.' : undefined}
          required
        />
        <ActionButton type="submit" loading={loading} loadingLabel="Creando cuenta…" className="btn-primary h-[52px] w-full text-lg font-semibold">
          Crear cuenta
        </ActionButton>
        <p className="text-center text-sm text-ink-500">Al registrarte aceptás que te contactemos por tus pedidos.</p>
      </form>
    </AuthShell>
  );
}
