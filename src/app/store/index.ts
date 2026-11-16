import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { useDispatch, useSelector } from 'react-redux';
import { setSessionExpiredHandler } from '../api/client';
import { cartKeyOf, setGuestTokenHandler, shopApi } from '../api/shopApi';
import authReducer, { sessionExpired } from './authSlice';
import cartReducer, { persistGuestToken, setGuestToken } from './cartSlice';
import prefsReducer, { persistPrefs, toggleFavorite } from './prefsSlice';

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
store.subscribe(() => {
  const { cart, prefs } = store.getState();
  if (cart.guestToken !== prevGuest) persistGuestToken((prevGuest = cart.guestToken));
  if (prefs !== prevPrefs) persistPrefs((prevPrefs = prefs));
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
