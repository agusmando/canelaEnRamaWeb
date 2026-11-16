import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ApiError, request, tokens } from '../api/client';
import { shopApi } from '../api/shopApi';
import type { User } from '../api/types';
import { setGuestToken } from './cartSlice';

/**
 * Sesión del cliente con SuperTokens en modo header:
 *   - email/contraseña: POST /auth/signup y /auth/signin (rid: emailpassword)
 *   - Google:           GET /auth/authorisationurl + POST /auth/signinup (rid: thirdparty)
 * Luego GET /user/me trae el usuario y, si había carrito de invitado, se fusiona.
 */

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  notice: string | null;
}

const initialState: AuthState = {
  user: null,
  status: tokens.access ? 'checking' : 'anonymous',
  notice: null,
};

const EP_HEADERS = { rid: 'emailpassword' };
const TP_HEADERS = { rid: 'thirdparty' };

interface StResponse {
  status: string;
  formFields?: { id: string; error: string }[];
  reason?: string;
  message?: string;
}

/** Traduce los mensajes estándar de SuperTokens. */
function translate(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('already exists')) return 'Ya existe una cuenta con ese email. Iniciá sesión.';
  if (m.includes('email is invalid') || m.includes('email is not valid')) return 'El email no es válido.';
  if (m.includes('password must contain') || m.includes('at least 8'))
    return 'La contraseña debe tener al menos 8 caracteres e incluir un número.';
  if (m.includes('field is not optional')) return 'Completá todos los campos.';
  return msg;
}

function stError(res: StResponse, fallback: string): string {
  if (res.status === 'WRONG_CREDENTIALS_ERROR') return 'Email o contraseña incorrectos.';
  if (res.status === 'FIELD_ERROR') return res.formFields?.map((f) => translate(f.error)).join(' ') || fallback;
  if (res.status === 'EMAIL_ALREADY_EXISTS_ERROR') return translate('already exists');
  if (res.status === 'NO_EMAIL_GIVEN_BY_PROVIDER') return 'Google no compartió tu email. Probá con otra cuenta.';
  if (res.status === 'SIGN_IN_UP_NOT_ALLOWED' || res.status === 'SIGN_IN_NOT_ALLOWED' || res.status === 'SIGN_UP_NOT_ALLOWED')
    return res.reason || 'No es posible ingresar con esta cuenta.';
  return res.reason || res.message || fallback;
}

const fetchMe = () => request<User>({ url: '/user/me' });

/** Común a todos los ingresos: valida tokens, trae el usuario y fusiona el carrito de invitado. */
const finishLogin = async (
  res: StResponse,
  fallback: string,
  getState: () => unknown,
  dispatch: (a: unknown) => unknown,
): Promise<User> => {
  if (res.status !== 'OK') throw new ApiError(stError(res, fallback), 400);
  if (!tokens.access) throw new ApiError('El servidor no devolvió el token de sesión.', 0);

  const user = await fetchMe();
  const guest = (getState() as { cart: { guestToken: string | null } }).cart.guestToken;
  if (guest) {
    await request({ url: `/cart/${guest}`, method: 'PUT', data: { mergeGuestCart: true } }).catch(() => undefined);
    dispatch(setGuestToken(null));
  }
  return user;
};

const rejectMsg = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

type Thunk<_A = void> = { rejectValue: string };

export const signIn = createAsyncThunk<User, { email: string; password: string }, Thunk<void>>(
  'auth/signIn',
  async ({ email, password }, { rejectWithValue, getState, dispatch }) => {
    try {
      tokens.clear();
      const res = await request<StResponse>({
        url: '/auth/signin',
        method: 'POST',
        headers: EP_HEADERS,
        data: { formFields: [{ id: 'email', value: email.trim() }, { id: 'password', value: password }] },
      });
      return await finishLogin(res, 'No se pudo iniciar sesión.', getState, dispatch);
    } catch (e) {
      tokens.clear();
      return rejectWithValue(rejectMsg(e, 'No se pudo iniciar sesión.'));
    }
  },
);

export const signUp = createAsyncThunk<User, { email: string; password: string }, Thunk<void>>(
  'auth/signUp',
  async ({ email, password }, { rejectWithValue, getState, dispatch }) => {
    try {
      tokens.clear();
      const res = await request<StResponse>({
        url: '/auth/signup',
        method: 'POST',
        headers: EP_HEADERS,
        data: { formFields: [{ id: 'email', value: email.trim() }, { id: 'password', value: password }] },
      });
      return await finishLogin(res, 'No se pudo crear la cuenta.', getState, dispatch);
    } catch (e) {
      tokens.clear();
      return rejectWithValue(rejectMsg(e, 'No se pudo crear la cuenta.'));
    }
  },
);

// ---------------------------------------------------------------- Google

const GOOGLE_KEY = 'cer_google_oauth';
export const googleRedirectUri = () => `${window.location.origin}/auth/callback/google`;

interface GoogleState {
  state: string;
  pkceCodeVerifier?: string;
  returnTo: string;
}

/** Pide la URL de autorización al backend y redirige a Google. */
export async function startGoogleSignIn(returnTo = '/') {
  const res = await request<{ status: string; urlWithQueryParams: string; pkceCodeVerifier?: string }>({
    url: '/auth/authorisationurl',
    headers: TP_HEADERS,
    params: { thirdPartyId: 'google', redirectURIOnProviderDashboard: googleRedirectUri() },
  });
  if (res.status !== 'OK' || !res.urlWithQueryParams) {
    throw new ApiError('El inicio de sesión con Google no está disponible.', 500);
  }
  const state = crypto.randomUUID();
  const saved: GoogleState = { state, pkceCodeVerifier: res.pkceCodeVerifier, returnTo };
  sessionStorage.setItem(GOOGLE_KEY, JSON.stringify(saved));
  const url = new URL(res.urlWithQueryParams);
  url.searchParams.set('state', state);
  window.location.assign(url.toString());
}

/** Completa el login al volver de Google (`/auth/callback/google?code&state`). Devuelve `returnTo`. */
export const finishGoogleSignIn = createAsyncThunk<{ user: User; returnTo: string }, URLSearchParams, Thunk<void>>(
  'auth/google',
  async (params, { rejectWithValue, getState, dispatch }) => {
    let saved: GoogleState | null = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(GOOGLE_KEY) ?? 'null');
    } catch {
      saved = null;
    }
    sessionStorage.removeItem(GOOGLE_KEY);

    if (params.get('error')) return rejectWithValue('Cancelaste el ingreso con Google.');
    if (!saved || saved.state !== params.get('state') || !params.get('code')) {
      return rejectWithValue('La sesión con Google expiró o es inválida. Intentá de nuevo.');
    }
    try {
      tokens.clear();
      const res = await request<StResponse>({
        url: '/auth/signinup',
        method: 'POST',
        headers: TP_HEADERS,
        data: {
          thirdPartyId: 'google',
          redirectURIInfo: {
            redirectURIOnProviderDashboard: googleRedirectUri(),
            redirectURIQueryParams: Object.fromEntries(params.entries()),
            pkceCodeVerifier: saved.pkceCodeVerifier,
          },
        },
      });
      const user = await finishLogin(res, 'No se pudo ingresar con Google.', getState, dispatch);
      return { user, returnTo: saved.returnTo || '/' };
    } catch (e) {
      tokens.clear();
      return rejectWithValue(rejectMsg(e, 'No se pudo ingresar con Google.'));
    }
  },
);

// ---------------------------------------------------------------- Contraseña

export async function requestPasswordReset(email: string) {
  const res = await request<StResponse>({
    url: '/auth/user/password/reset/token',
    method: 'POST',
    headers: EP_HEADERS,
    data: { formFields: [{ id: 'email', value: email.trim() }] },
  });
  if (res.status !== 'OK') throw new ApiError(stError(res, 'No pudimos enviar el email.'), 400);
}

export async function resetPassword(token: string, password: string) {
  const res = await request<StResponse>({
    url: '/auth/user/password/reset',
    method: 'POST',
    headers: EP_HEADERS,
    data: { method: 'token', token, formFields: [{ id: 'password', value: password }] },
  });
  if (res.status === 'RESET_PASSWORD_INVALID_TOKEN_ERROR') {
    throw new ApiError('El enlace venció o ya fue usado. Pedí uno nuevo.', 400);
  }
  if (res.status !== 'OK') throw new ApiError(stError(res, 'No se pudo cambiar la contraseña.'), 400);
}

// ---------------------------------------------------------------- Sesión

export const restoreSession = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/restore',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchMe();
    } catch (e) {
      // 401 ya lo resolvió el cliente (intentó renovar y, si no pudo, limpió los tokens).
      // Errores de red / cold start del backend: conservamos los tokens para el próximo intento.
      return rejectWithValue(rejectMsg(e, 'Sesión inválida'));
    }
  },
);

export const signOut = createAsyncThunk('auth/signOut', async (_, { dispatch }) => {
  await request({ url: '/auth/signout', method: 'POST' }).catch(() => undefined);
  tokens.clear();
  dispatch(shopApi.util.invalidateTags(['Cart', 'Order', 'Address', 'ShippingQuote']));
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionExpired(state) {
      if (state.status === 'authenticated') state.notice = 'Tu sesión expiró. Volvé a ingresar.';
      state.user = null;
      state.status = 'anonymous';
    },
    clearNotice(state) {
      state.notice = null;
    },
  },
  extraReducers: (b) => {
    const authenticated = (s: AuthState, user: User) => {
      s.user = user;
      s.status = 'authenticated';
      s.notice = null;
    };
    b.addCase(signIn.fulfilled, (s, a) => authenticated(s, a.payload));
    b.addCase(signUp.fulfilled, (s, a) => authenticated(s, a.payload));
    b.addCase(finishGoogleSignIn.fulfilled, (s, a) => authenticated(s, a.payload.user));
    b.addCase(restoreSession.pending, (s) => {
      s.status = 'checking';
    });
    b.addCase(restoreSession.fulfilled, (s, a) => authenticated(s, a.payload));
    b.addCase(restoreSession.rejected, (s) => {
      s.user = null;
      s.status = 'anonymous';
    });
    b.addCase(signOut.fulfilled, (s) => {
      s.user = null;
      s.status = 'anonymous';
    });
  },
});

export const { sessionExpired, clearNotice } = authSlice.actions;
export default authSlice.reducer;
