import type React from 'react';
import { createBrowserRouter } from 'react-router';
import { StoreLayout } from './layouts/StoreLayout';
import { RequireAuth } from './components/RequireAuth';
import Home from './pages/Home';
import { PageLoader } from './components/States';

/** Cada página se descarga al visitarla (code splitting por ruta). */
const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await load()).default,
});

const lazyAccount = async () => {
  const { default: Account } = await import('./pages/Account');
  return {
    Component: () => (
      <RequireAuth>
        <Account />
      </RequireAuth>
    ),
  };
};

export const router = createBrowserRouter([
  {
    Component: StoreLayout,
    HydrateFallback: PageLoader,
    children: [
      { index: true, Component: Home },
      { path: 'productos', lazy: page(() => import('./pages/Catalog')) },
      { path: 'producto/:id', lazy: page(() => import('./pages/ProductDetail')) },
      { path: 'ofertas', lazy: page(() => import('./pages/Offers')) },
      { path: 'favoritos', lazy: page(() => import('./pages/Favorites')) },
      { path: 'carrito', lazy: page(() => import('./pages/Cart')) },
      { path: 'login', lazy: page(() => import('./pages/Login')) },
      { path: 'registro', lazy: page(() => import('./pages/Register')) },
      { path: 'recuperar', lazy: page(() => import('./pages/ForgotPassword')) },
      // Rutas que usa SuperTokens (websiteBasePath = /auth).
      { path: 'auth/reset-password', lazy: page(() => import('./pages/ResetPassword')) },
      { path: 'auth/callback/google', lazy: page(() => import('./pages/GoogleCallback')) },
      {
        path: 'mi-cuenta',
        lazy: lazyAccount,
        children: [
          { index: true, lazy: page(() => import('./pages/Profile')) },
          { path: 'pedidos', lazy: page(() => import('./pages/Orders')) },
          { path: 'pedidos/:id', lazy: page(() => import('./pages/OrderDetail')) },
        ],
      },
      { path: 'contacto', lazy: page(() => import('./pages/Contact')) },
      { path: 'envios', lazy: page(() => import('./pages/Shipping')) },
      { path: 'seguimiento', lazy: page(() => import('./pages/Tracking')) },
      { path: 'seguimiento/:code', lazy: page(() => import('./pages/Tracking')) },
      { path: '*', lazy: page(() => import('./pages/NotFound')) },
    ],
  },
]);
