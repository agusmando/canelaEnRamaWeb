import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, request, toApiError, type QueryError } from './client';
import type {
  Banner,
  BannerPlacement,
  Cart,
  CartLineInput,
  Brand,
  CatalogResult,
  CatalogSearchArgs,
  Category,
  CouponPreview,
  Id,
  Order,
  PaymentConfig,
  PaymentPreference,
  Paginated,
  PaymentType,
  Product,
  PublicTracking,
  Review,
  ReviewEligibility,
  ReviewInput,
  ReviewQuery,
  ReviewSummary,
  Shipment,
  ShipmentMethod,
  ShippingConfig,
  ShippingQuote,
  UserAddress,
  UserAddressInput,
  GoogleReviews,
  Tag,
} from './types';

/**
 * API de la tienda (RTK Query). Endpoints usados (ver colección de Postman):
 *
 *   GET  /product?active&detalle          catálogo completo (se filtra/ordena en el front)
 *   GET  /product/:id                     detalle
 *   GET  /category, /tag, /brand          menús, filtros y footer
 *   POST /cart · GET /cart/me · GET|PUT /cart/:token   carrito de invitado o usuario
 *   POST /order {fromCart}                checkout
 *   GET  /payment/config                  medios online habilitados
 *   POST /payment/order/:id/preference    link de pago de Mercado Pago
 *   POST /payment/order/:id/sync          re-consulta el pago al volver de Mercado Pago
 *   GET  /order/mine · GET|PUT /order/:id mis pedidos / cancelar
 *   GET  /banner/public?placement=        banners administrables (hero, recomendaciones, tiras, anuncio)
 *   GET  /google-review                   puntaje del local y reseñas destacadas de Google
 *   GET  /review · /review/summary        opiniones aprobadas de un producto
 *   GET  /review/eligible · /review/mine · POST|PUT|DELETE /review   opinar sobre lo comprado
 *   GET  /shipment/order/:orderId · /shipment/track/:code             seguimiento de envíos
 *   GET  /shipping/config · GET|PUT /shipping/address · GET /shipping/quote   envío a domicilio
 */

// ---------------------------------------------------------------- Carrito: a quién pertenece

/** Estado mínimo que necesita la API (evita dependencia circular con el store). */
interface CartOwnerState {
  auth: { user: { supertokensId: string } | null };
  cart: { guestToken: string | null };
}

export interface CartKey {
  userId: string | null;
  guest: string | null;
}

export const cartKeyOf = (s: CartOwnerState): CartKey => ({
  userId: s.auth.user?.supertokensId ?? null,
  guest: s.auth.user ? null : s.cart.guestToken,
});

/** Token para `PUT /cart/:token`: supertokensId del usuario o sessionId del invitado. */
const cartToken = (k: CartKey) => k.userId ?? k.guest;

/** Callback que el store registra para guardar el sessionId de un carrito de invitado nuevo. */
let saveGuestToken: (token: string | null) => void = () => {};
export function setGuestTokenHandler(fn: (token: string | null) => void) {
  saveGuestToken = fn;
}

const asError = (e: unknown): QueryError => {
  const err = toApiError(e);
  return { status: err.status, message: err.message, payload: err.payload };
};

async function fetchCart(k: CartKey): Promise<Cart | null> {
  try {
    if (k.userId) return await request<Cart>({ url: '/cart/me' });
    if (k.guest) return await request<Cart>({ url: `/cart/${k.guest}` });
    return null;
  } catch (e) {
    const err = toApiError(e);
    if (err.status === 404) {
      if (!k.userId && k.guest) saveGuestToken(null); // carrito de invitado vencido
      return null;
    }
    throw err;
  }
}

export interface CartUpdate {
  editItem?: CartLineInput[];
  removeItem?: { productVariantId: Id; selectedBulkOption?: number }[];
  clear?: boolean;
}

/** Número de la última edición del carrito (ver `updateCart`). */
let cartUpdateSeq = 0;

// ---------------------------------------------------------------- API

export const shopApi = createApi({
  reducerPath: 'shopApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Catalog', 'Product', 'Category', 'Tag', 'Brand', 'Cart', 'Order', 'Banner', 'GoogleReview', 'Review', 'Shipment', 'Address', 'ShippingQuote'],
  keepUnusedDataFor: 300,
  refetchOnReconnect: true,
  endpoints: (build) => ({
    /** Todo el catálogo activo, con variantes, imágenes, ofertas, tags y categoría. */
    catalog: build.query<Product[], void>({
      query: () => ({ url: '/product', params: { active: true, detalle: true, paginate: false } }),
      transformResponse: (raw: Product[] | Paginated<Product>) => (Array.isArray(raw) ? raw : raw.content ?? []),
      providesTags: ['Catalog'],
      keepUnusedDataFor: 900,
    }),

    /**
     * Catálogo con búsqueda, filtros, orden y paginación del lado del servidor
     * (`GET /catalog`): para la página /productos, que ya no baja todo el catálogo.
     */
    catalogSearch: build.query<CatalogResult, CatalogSearchArgs>({
      query: (args) => ({ url: '/catalog', params: args }),
      providesTags: ['Catalog'],
    }),

    /** "Los más pedidos": productos más ordenados en los últimos 90 días (`GET /catalog/best-sellers`). */
    bestSellers: build.query<Product[], { days?: number; limit?: number } | void>({
      query: (args) => ({ url: '/catalog/best-sellers', params: args ?? {} }),
      transformResponse: (raw: Paginated<Product>) => raw.content ?? [],
      providesTags: ['Catalog'],
    }),

    product: build.query<Product, Id>({
      query: (id) => ({ url: `/product/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Product', id }],
    }),

    categories: build.query<Category[], void>({
      query: () => ({ url: '/category', params: { active: true, detalle: true, paginate: false } }),
      transformResponse: (raw: Category[]) => (Array.isArray(raw) ? raw : []).sort((a, b) => a.name.localeCompare(b.name, 'es')),
      providesTags: ['Category'],
      keepUnusedDataFor: 900,
    }),

    tags: build.query<Tag[], void>({
      query: () => ({ url: '/tag', params: { active: true, paginate: false } }),
      transformResponse: (raw: Tag[]) => (Array.isArray(raw) ? raw : []).sort((a, b) => a.name.localeCompare(b.name, 'es')),
      providesTags: ['Tag'],
      keepUnusedDataFor: 900,
    }),

    brands: build.query<Brand[], void>({
      query: () => ({ url: '/brand', params: { active: true, paginate: false } }),
      transformResponse: (raw: Brand[] | Paginated<Brand>) =>
        (Array.isArray(raw) ? raw : raw.content ?? []).filter((b) => b.active !== false).sort((a, b) => a.name.localeCompare(b.name, 'es')),
      providesTags: ['Brand'],
      keepUnusedDataFor: 900,
    }),

    // ------------------------------------------------------------ Carrito

    cart: build.query<Cart | null, CartKey>({
      queryFn: async (key) => {
        try {
          return { data: await fetchCart(key) };
        } catch (e) {
          return { error: asError(e) };
        }
      },
      providesTags: ['Cart'],
    }),

    /**
     * Agrega líneas. Usuario logueado: `POST /cart` crea o reutiliza su carrito y suma.
     * Invitado: `PUT /cart/:sessionId {addItem}`; si no tiene carrito (o venció) `POST /cart`
     * y se guarda el `sessionId` devuelto.
     */
    addToCart: build.mutation<Cart, CartLineInput[]>({
      queryFn: async (items, { getState }) => {
        const key = cartKeyOf(getState() as unknown as CartOwnerState);
        try {
          if (!key.userId && key.guest) {
            try {
              const cart = await request<Cart>({ url: `/cart/${key.guest}`, method: 'PUT', data: { addItem: items } });
              return { data: cart };
            } catch (e) {
              if (toApiError(e).status !== 404) throw e;
            }
          }
          const cart = await request<Cart>({ url: '/cart', method: 'POST', data: { items } });
          if (!key.userId && cart.sessionId) saveGuestToken(cart.sessionId);
          return { data: cart };
        } catch (e) {
          return { error: asError(e) };
        }
      },
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(shopApi.util.upsertQueryData('cart', cartKeyOf(getState() as unknown as CartOwnerState), data));
        } catch {
          /* el componente muestra el error */
        }
      },
    }),

    /**
     * Editar cantidades (0 = quitar), quitar líneas o vaciar.
     * Las respuestas pueden llegar desordenadas si hay varias en vuelo: solo la
     * última escribe en la cache, para que el carrito no "salte" a un valor viejo.
     */
    updateCart: build.mutation<Cart, CartUpdate>({
      queryFn: async (body, { getState }) => {
        const token = cartToken(cartKeyOf(getState() as unknown as CartOwnerState));
        if (!token) return { error: { status: 404, message: 'Tu carrito está vacío.' } };
        try {
          return { data: await request<Cart>({ url: `/cart/${token}`, method: 'PUT', data: body }) };
        } catch (e) {
          return { error: asError(e) };
        }
      },
      async onQueryStarted(body, { dispatch, getState, queryFulfilled }) {
        const key = cartKeyOf(getState() as unknown as CartOwnerState);
        const seq = ++cartUpdateSeq;
        // Optimista: la línea editada cambia al instante; si falla se revierte.
        const patch = dispatch(
          shopApi.util.updateQueryData('cart', key, (draft) => {
            if (!draft) return;
            for (const e of body.editItem ?? []) {
              const line = draft.items.find(
                (i) => i.productVariantId === e.productVariantId && i.selectedBulkOption === (e.selectedBulkOption ?? 0),
              );
              if (line) line.quantity = e.quantity;
            }
            for (const r of body.removeItem ?? []) {
              draft.items = draft.items.filter(
                (i) =>
                  !(
                    i.productVariantId === r.productVariantId &&
                    (r.selectedBulkOption === undefined || i.selectedBulkOption === r.selectedBulkOption)
                  ),
              );
            }
          }),
        );
        try {
          const { data } = await queryFulfilled;
          if (seq === cartUpdateSeq) dispatch(shopApi.util.upsertQueryData('cart', key, data));
        } catch {
          // Con varios cambios encadenados deshacer solo este parche deja un estado
          // mezclado: se descarta y se vuelve a pedir el carrito real.
          patch.undo();
          dispatch(shopApi.util.invalidateTags(['Cart']));
        }
      },
    }),

    // ------------------------------------------------------------ Órdenes

    /** Con DELIVERY el servidor vuelve a cotizar el envío (es quien define el precio). */
    checkout: build.mutation<Order, { paymentType: PaymentType; shippingMethod: ShipmentMethod; discountCode?: string }>({
      query: ({ paymentType, shippingMethod, discountCode }) => ({
        url: '/order',
        method: 'POST',
        data: { fromCart: true, paymentType, shippingMethod, ...(discountCode ? { discountCode } : {}) },
      }),
      // El checkout descuenta stock: refrescamos catálogo, carrito y pedidos.
      invalidatesTags: (_r, error) => (error ? [] : ['Cart', 'Order', 'Catalog', 'Product']),
    }),

    /** Checkout sin cuenta: retiro en el local y pago al retirar (Efectivo/Transferencia). */
    guestCheckout: build.mutation<
      Order,
      { sessionId: string; guest: { name: string; email: string; phone: string }; paymentType: PaymentType; discountCode?: string }
    >({
      query: ({ sessionId, guest, paymentType, discountCode }) => ({
        url: '/order/guest',
        method: 'POST',
        data: { sessionId, guest, paymentType, shippingMethod: 'PICKUP', ...(discountCode ? { discountCode } : {}) },
      }),
      invalidatesTags: (_r, error) => (error ? [] : ['Cart', 'Order', 'Catalog', 'Product']),
    }),

    /** Vista previa de un cupón sobre el subtotal de productos del carrito. */
    validateCoupon: build.mutation<CouponPreview, { code: string; subtotal: number }>({
      query: ({ code, subtotal }) => ({ url: '/discount-code/validate', method: 'POST', data: { code, subtotal } }),
    }),

    paymentConfig: build.query<PaymentConfig, void>({
      query: () => ({ url: '/payment/config' }),
      keepUnusedDataFor: 900,
    }),

    createPaymentPreference: build.mutation<PaymentPreference, Id>({
      query: (orderId) => ({ url: `/payment/order/${orderId}/preference`, method: 'POST' }),
    }),

    syncPayment: build.mutation<Order, Id>({
      query: (orderId) => ({ url: `/payment/order/${orderId}/sync`, method: 'POST' }),
      invalidatesTags: (_r, error) => (error ? [] : ['Order']),
    }),

    myOrders: build.query<Paginated<Order>, { page: number; perPage?: number }>({
      query: ({ page, perPage = 10 }) => ({
        url: '/order/mine',
        params: { currentPage: page, amountPerPage: perPage },
      }),
      transformResponse: (raw: Paginated<Order>) => {
        const { page = 1, amountPerPage = 10, totalAmount = raw.content?.length ?? 0 } = raw.pagination ?? {};
        return {
          content: raw.content ?? [],
          pagination: { page, amountPerPage, totalAmount, totalPages: Math.max(1, Math.ceil(totalAmount / amountPerPage)) },
        };
      },
      providesTags: ['Order'],
    }),

    order: build.query<Order, Id>({
      query: (id) => ({ url: `/order/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
    }),

    /** El cliente solo puede cancelar mientras la orden está PENDING. */
    cancelOrder: build.mutation<Order, Id>({
      query: (id) => ({ url: `/order/${id}`, method: 'PUT', data: { status: 'CANCELLED' } }),
      invalidatesTags: (_r, error, id) => (error ? [] : ['Order', { type: 'Order', id }, 'Catalog', 'Product']),
    }),

    // ------------------------------------------------------------ Envíos

    /** Envío de un pedido propio. Sin envío (404) → `null`. */
    orderShipment: build.query<Shipment | null, Id>({
      queryFn: async (orderId) => {
        try {
          return { data: await request<Shipment>({ url: `/shipment/order/${orderId}` }) };
        } catch (e) {
          const err = toApiError(e);
          if (err.status === 404) return { data: null };
          return { error: asError(err) };
        }
      },
      providesTags: (_r, _e, orderId) => [{ type: 'Shipment', id: orderId }],
    }),

    /** Seguimiento público por código (404 si no existe). */
    trackShipment: build.query<PublicTracking, string>({
      query: (code) => ({ url: `/shipment/track/${encodeURIComponent(code)}` }),
      providesTags: (_r, _e, code) => [{ type: 'Shipment', id: code }],
      keepUnusedDataFor: 60,
    }),

    /** Zonas activas, departamentos válidos y datos del local para retirar. */
    shippingConfig: build.query<ShippingConfig, void>({
      query: () => ({ url: '/shipping/config' }),
      keepUnusedDataFor: 900,
    }),

    /** Domicilio guardado del usuario (`null` si todavía no cargó uno). */
    myAddress: build.query<UserAddress | null, void>({
      query: () => ({ url: '/shipping/address' }),
      // Sin domicilio guardado: null (nunca un objeto vacío o incompleto)
      transformResponse: (raw: UserAddress | null | undefined) => (raw && raw.street && raw.number ? raw : null),
      providesTags: ['Address'],
    }),

    saveAddress: build.mutation<UserAddress, UserAddressInput>({
      query: (data) => ({ url: '/shipping/address', method: 'PUT', data }),
      invalidatesTags: (_r, error) => (error ? [] : ['Address', 'ShippingQuote']),
    }),

    /** Cotización del envío a domicilio; `value` = total de productos del carrito. */
    shippingQuote: build.query<ShippingQuote, number>({
      query: (value) => ({ url: '/shipping/quote', params: { value } }),
      providesTags: ['ShippingQuote'],
      keepUnusedDataFor: 60,
    }),

    // ------------------------------------------------------------ Banners y reseñas de Google

    /** Banners activos de una ubicación, ordenados por posición. */
    banners: build.query<Banner[], BannerPlacement>({
      query: (placement) => ({ url: '/banner/public', params: { placement } }),
      transformResponse: (raw: Banner[] | Paginated<Banner>) =>
        (Array.isArray(raw) ? raw : raw?.content ?? []).slice().sort((a, b) => a.position - b.position || a.id - b.id),
      providesTags: (_r, _e, placement) => [{ type: 'Banner', id: placement }],
      keepUnusedDataFor: 900,
    }),

    googleReviews: build.query<GoogleReviews, void>({
      query: () => ({ url: '/google-review' }),
      transformResponse: (raw: GoogleReviews) => ({
        place: raw?.place ?? null,
        reviews: (raw?.reviews ?? []).filter((r) => r.active !== false),
      }) as GoogleReviews,
      providesTags: ['GoogleReview'],
      keepUnusedDataFor: 900,
    }),

    // ------------------------------------------------------------ Opiniones de productos

    /** Una página de opiniones aprobadas de un producto. */
    reviews: build.query<Paginated<Review>, ReviewQuery>({
      query: ({ productId, productVariantId, rating, page, perPage = 5, orderBy = 'recent' }) => ({
        url: '/review',
        params: { productId, productVariantId, rating, orderBy, paginate: true, currentPage: page, amountPerPage: perPage },
      }),
      transformResponse: (raw: Paginated<Review> | Review[]) => {
        if (Array.isArray(raw)) {
          return { content: raw, pagination: { page: 1, amountPerPage: raw.length, totalAmount: raw.length, totalPages: 1 } };
        }
        const { page = 1, amountPerPage = 5, totalAmount = raw.content?.length ?? 0 } = raw.pagination ?? {};
        return {
          content: raw.content ?? [],
          pagination: { page, amountPerPage, totalAmount, totalPages: Math.max(1, Math.ceil(totalAmount / (amountPerPage || 1))) },
        };
      },
      providesTags: (_r, _e, q) => [{ type: 'Review', id: `product-${q.productId}` }],
    }),

    reviewSummary: build.query<ReviewSummary, Id>({
      query: (productId) => ({ url: '/review/summary', params: { productId } }),
      providesTags: (_r, _e, productId) => [{ type: 'Review', id: `product-${productId}` }],
    }),

    /** Variantes del producto que el usuario puede opinar (compra entregada) + su opinión si ya existe. */
    reviewEligibility: build.query<ReviewEligibility[], Id>({
      query: (productId) => ({ url: '/review/eligible', params: { productId } }),
      transformResponse: (raw: ReviewEligibility[]) => (Array.isArray(raw) ? raw : []),
      providesTags: ['Review'],
    }),

    myReviews: build.query<Review[], void>({
      query: () => ({ url: '/review/mine' }),
      transformResponse: (raw: Review[]) => (Array.isArray(raw) ? raw : []),
      providesTags: ['Review'],
    }),

    createReview: build.mutation<Review, ReviewInput>({
      query: (data) => ({ url: '/review', method: 'POST', data }),
      invalidatesTags: (_r, error) => (error ? [] : ['Review']),
    }),

    updateReview: build.mutation<Review, { id: Id } & Omit<ReviewInput, 'productVariantId'>>({
      query: ({ id, ...data }) => ({ url: `/review/${id}`, method: 'PUT', data }),
      // Al editarla vuelve a PENDING: deja de mostrarse en el listado público.
      invalidatesTags: (r, error) => (error ? [] : ['Review', ...(r ? [{ type: 'Review' as const, id: `product-${r.productId}` }] : [])]),
    }),

    deleteReview: build.mutation<void, { id: Id; productId: Id }>({
      query: ({ id }) => ({ url: `/review/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, error, { productId }) => (error ? [] : ['Review', { type: 'Review', id: `product-${productId}` }]),
    }),
  }),
});

export const {
  useCatalogQuery,
  useCatalogSearchQuery,
  useBestSellersQuery,
  useLazyCatalogSearchQuery,
  useProductQuery,
  useCategoriesQuery,
  useTagsQuery,
  useBrandsQuery,
  useCartQuery,
  useAddToCartMutation,
  useUpdateCartMutation,
  useCheckoutMutation,
  useGuestCheckoutMutation,
  useValidateCouponMutation,
  usePaymentConfigQuery,
  useCreatePaymentPreferenceMutation,
  useSyncPaymentMutation,
  useMyOrdersQuery,
  useOrderQuery,
  useCancelOrderMutation,
  useOrderShipmentQuery,
  useTrackShipmentQuery,
  useShippingConfigQuery,
  useMyAddressQuery,
  useSaveAddressMutation,
  useShippingQuoteQuery,
  useBannersQuery,
  useGoogleReviewsQuery,
  useReviewsQuery,
  useReviewSummaryQuery,
  useReviewEligibilityQuery,
  useMyReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} = shopApi;
