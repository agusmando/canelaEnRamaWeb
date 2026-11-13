import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** `sessionId` del carrito de invitado (se usa como token en `/cart/:token`). */
const GUEST_KEY = 'cer_guest_cart';

function read(): string | null {
  try {
    return localStorage.getItem(GUEST_KEY);
  } catch {
    return null;
  }
}

export function persistGuestToken(token: string | null) {
  try {
    if (token) localStorage.setItem(GUEST_KEY, token);
    else localStorage.removeItem(GUEST_KEY);
  } catch {
    /* sin storage: el carrito dura lo que la pestaña */
  }
}

interface CartState {
  guestToken: string | null;
  /** Panel lateral del carrito abierto. */
  drawerOpen: boolean;
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: { guestToken: read(), drawerOpen: false } as CartState,
  reducers: {
    setGuestToken(state, action: PayloadAction<string | null>) {
      state.guestToken = action.payload;
    },
    setDrawerOpen(state, action: PayloadAction<boolean>) {
      state.drawerOpen = action.payload;
    },
  },
});

export const { setGuestToken, setDrawerOpen } = cartSlice.actions;
export default cartSlice.reducer;
