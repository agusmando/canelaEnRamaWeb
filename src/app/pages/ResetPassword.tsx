import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CheckCircle2, Lock } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Field, FormError } from '../components/Field';
import { resetPassword } from '../store/authSlice';
import { getErrorMessage } from '../api/client';
import { PasswordChecklist, passwordRules } from './Register';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ActionButton } from '../components/ActionButton';
import { showError } from '../lib/notifications';

/** Destino del enlace que envía SuperTokens: `/auth/reset-password?token=…`. */
export default function ResetPassword() {
  useDocumentTitle('Nueva contraseña', { noindex: true });
  const token = useSearchParams()[0].get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!passwordRules(password).every((r) => r.ok)) return setError('La contraseña no cumple los requisitos.');
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold text-ink-800 sm:text-4xl">Nueva contraseña</h1>
      {!token ? (
        <p className="mt-6 text-ink-600">
          El enlace no es válido. <Link to="/recuperar" className="font-medium text-brand-500 underline">Pedí uno nuevo</Link>.
        </p>
      ) : done ? (
        <div className="mt-8 rounded-xl bg-brand-50 p-6">
          <CheckCircle2 className="size-8 text-leaf-600" />
          <p className="mt-3 text-lg font-medium text-ink-800">¡Listo! Ya podés ingresar con tu nueva contraseña.</p>
          <Link to="/login" className="btn-primary mt-5 h-11 px-6">
            Ir a iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
          <FormError message={error} />
          <div>
            <Field label="Contraseña nueva" name="password" type="password" autoComplete="new-password" icon={<Lock className="size-5" />} value={password} onChange={(e) => setPassword(e.target.value)} />
            <PasswordChecklist password={password} />
          </div>
          <Field label="Repetí la contraseña" name="confirm" type="password" autoComplete="new-password" icon={<Lock className="size-5" />} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <ActionButton type="submit" loading={loading} loadingLabel="Guardando contraseña…" className="btn-primary h-[52px] w-full text-lg font-semibold">
            Guardar contraseña
          </ActionButton>
        </form>
      )}
    </AuthShell>
  );
}
