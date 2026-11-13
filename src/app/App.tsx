import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { store, useAppDispatch, useAppSelector } from './store';
import { restoreSession } from './store/authSlice';
import { router } from './routes';

/** Valida la sesión guardada al arrancar. */
function Bootstrap() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);

  useEffect(() => {
    if (status === 'checking') dispatch(restoreSession());
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontFamily: 'DM Sans, sans-serif' } }} />
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Bootstrap />
    </Provider>
  );
}
