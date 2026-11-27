import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { useDispatch, useSelector } from 'react-redux';
import { request, setSessionExpiredHandler } from '../api/client';
import { cartKeyOf, setGuestTokenHandler, shopApi } from '../api/shopApi';
import authReducer, { sessionExpired } from './authSlice';
import cartReducer, { persistGuestToken, setGuestToken } from './cartSlice';
import prefsReducer, { hydrate, persistPrefs, toggleFavorite } from './prefsSlice';
import type { Id } from '../api/types';

export const store = configureStore({
  reducer: {
    [shopApi.reducerPath]: shopApi.reducer,
    auth: authReducer,
    cart: cartReducer,
    prefs: prefsReducer,
  },
  middleware: (getDefault) => getDefault().concat(shopApi.middleware),
});

setupListeners(store.dispatch);

setSessionExpiredHandler(() => {
  store.dispatch(sessionExpired());
  store.dispatch(shopApi.util.invalidateTags(['Cart', 'Order', 'Address', 'ShippingQuote']));
});

setGuestTokenHandler((token) => store.dispatch(setGuestToken(token)));

let prevGuest = store.getState().cart.guestToken;
let prevPrefs = store.getState().prefs;

// Sync de preferencias con la cuenta: al entrar un usuario se descargan y fusionan
// (la unión puede tener items solo-locales, así que se re-sube el resultado fusionado);
// los cambios posteriores se suben con debounce.
let prefsUser: string | null = null;
let prefsLoaded = false;
let prefsSaveTimer: ReturnType<typeof setTimeout> | undefined;

const loadPrefs = async (userId: string) => {
  try {
    const prefs = await request<{ favorites?: Id[]; recent?: Id[] }>({ url: '/user/prefs' });
    if (store.getState().auth.user?.supertokensId !== userId) return;
    store.dispatch(hydrate(prefs));
  } catch {
    // Sin conexión o backend viejo: quedan las preferencias locales.
  } finally {
    if (store.getState().auth.user?.supertokensId === userId) {
      prefsLoaded = true;
      savePrefs();
    }
  }
};

const savePrefs = () => {
  window.clearTimeout(prefsSaveTimer);
  prefsSaveTimer = window.setTimeout(() => {
    const { auth, prefs } = store.getState();
    if (auth.status !== 'authenticated' || !prefsLoaded) return;
    request({ url: '/user/prefs', method: 'PUT', data: { favorites: prefs.favorites, recent: prefs.recent } }).catch(
      () => undefined,
    );
  }, 1000);
};

store.subscribe(() => {
  const { cart, prefs, auth } = store.getState();
  if (cart.guestToken !== prevGuest) persistGuestToken((prevGuest = cart.guestToken));
  const prefsChanged = prefs !== prevPrefs;
  if (prefsChanged) persistPrefs((prevPrefs = prefs));

  const uid = auth.status === 'authenticated' ? (auth.user?.supertokensId ?? null) : null;
  if (uid !== prefsUser) {
    prefsUser = uid;
    prefsLoaded = false;
    window.clearTimeout(prefsSaveTimer);
    if (uid) void loadPrefs(uid);
  }
  if (prefsChanged && uid && prefsLoaded) savePrefs();
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

/** Clave del carrito actual (usuario o invitado), para `useCartQuery`. */
export const useCartKey = () => {
  const userId = useAppSelector((s) => s.auth.user?.supertokensId ?? null);
  const guest = useAppSelector((s) => s.cart.guestToken);
  return cartKeyOf({ auth: { user: userId ? { supertokensId: userId } : null }, cart: { guestToken: guest } });
};

/** ¿Está en favoritos? + alternar. */
export const useFavorite = (id: number) => {
  const dispatch = useAppDispatch();
  const isFav = useAppSelector((s) => s.prefs.favorites.includes(id));
  return [isFav, () => dispatch(toggleFavorite(id))] as const;
};
