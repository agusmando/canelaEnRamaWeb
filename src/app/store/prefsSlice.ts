import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Id } from '../api/types';

/**
 * Preferencias del visitante guardadas en el navegador:
 *   - favoritos (lista de deseos)
 *   - productos vistos recientemente
 * Viven en localStorage y, con sesión iniciada, se sincronizan con la cuenta
 * (GET/PUT /user/prefs) — ver `syncPrefs` en store/index.ts.
 */
const KEY = 'cer_prefs';
const MAX_RECENT = 12;

export interface PrefsState {
  favorites: Id[];
  recent: Id[];
}

function read(): PrefsState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    const ids = (v: unknown) => (Array.isArray(v) ? v.filter((n): n is number => Number.isInteger(n)) : []);
    return { favorites: ids(raw.favorites), recent: ids(raw.recent).slice(0, MAX_RECENT) };
  } catch {
    return { favorites: [], recent: [] };
  }
}

export function persistPrefs(state: PrefsState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* sin storage: duran lo que la pestaña */
  }
}

const prefsSlice = createSlice({
  name: 'prefs',
  initialState: read,
  reducers: {
    toggleFavorite(state, action: PayloadAction<Id>) {
      const id = action.payload;
      state.favorites = state.favorites.includes(id) ? state.favorites.filter((f) => f !== id) : [id, ...state.favorites];
    },
    removeFavorite(state, action: PayloadAction<Id>) {
      state.favorites = state.favorites.filter((f) => f !== action.payload);
    },
    markViewed(state, action: PayloadAction<Id>) {
      const id = action.payload;
      if (state.recent[0] === id) return;
      state.recent = [id, ...state.recent.filter((r) => r !== id)].slice(0, MAX_RECENT);
    },
    /** Fusiona las preferencias que vienen del servidor (unión, gana el orden del servidor). */
    hydrate(state, action: PayloadAction<{ favorites?: Id[]; recent?: Id[] }>) {
      const { favorites = [], recent = [] } = action.payload;
      state.favorites = [...new Set([...favorites, ...state.favorites])];
      state.recent = [...new Set([...recent, ...state.recent])].slice(0, MAX_RECENT);
    },
  },
});

export const { toggleFavorite, removeFavorite, markViewed, hydrate } = prefsSlice.actions;
export default prefsSlice.reducer;
