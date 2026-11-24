import { toast } from 'sonner';
import { getErrorMessage } from '../api/client';

export function showError(error: unknown, fallback = 'No pudimos completar la solicitud.') {
  const message = typeof error === 'string' ? error : getErrorMessage(error);
  const finalMessage = message || fallback;
  toast.error(finalMessage, {
    description: 'Intentá nuevamente en unos segundos.',
    duration: 5000,
  });
  return finalMessage;
}

export function showSuccess(message: string, description?: string) {
  toast.success(message, { description, duration: 3500 });
}
