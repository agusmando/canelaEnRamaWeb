import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ArrowLeft, Mail, MailCheck } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Field, FormError } from '../components/Field';
import { Spinner } from '../components/States';
import { requestPasswordReset } from '../store/authSlice';
import { getErrorMessage } from '../api/client';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function ForgotPassword() {
  useDocumentTitle('Recuperar contraseña', { noindex: true });
  const initial = (useLocation().state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Ingresá un email válido.');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-ink-600 hover:text-brand-500">
        <ArrowLeft className="size-4" /> Volver
      </Link>
      <h1 className="text-3xl font-semibold text-ink-800 sm:text-4xl">Recuperar contraseña</h1>
      {sent ? (
        <div className="mt-8 rounded-xl bg-brand-50 p-5 sm:p-6">
          <MailCheck className="size-8 text-brand-500" />
          <p className="mt-3 text-lg font-medium text-ink-800">Revisá tu correo</p>
          <p className="mt-1 text-ink-600">
            Si existe una cuenta para <strong className="break-all">{email}</strong>, te enviamos un enlace para crear una contraseña nueva. Si te registraste con
            Google, ingresá con el botón de Google.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-lg text-ink-600">Te enviamos un enlace por email para que elijas una contraseña nueva.</p>
          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
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
            />
            <button type="submit" disabled={loading} className="btn-primary h-[52px] w-full text-lg font-semibold">
              {loading && <Spinner />} Enviar enlace
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
