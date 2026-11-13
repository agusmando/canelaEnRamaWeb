/**
 * Tipos del dominio tal como los devuelve el backend a la tienda pública.
 * Para invitados y clientes el backend oculta `price` (costo) y `profitMargin`:
 * el precio de venta viene en `finalPrice` (por kg si la medida es KG).
 */

export type Id = number;
export type ISODate = string;

export interface PaginationInfo {
  page: number;
  amountPerPage: number;
  totalAmount: number;
  totalPages: number;
}

export interface Paginated<T> {
  content: T[];
  pagination: PaginationInfo;
}

export type Measure = 'KG' | 'U' | 'L' | 'ML' | 'G';

// ---------------------------------------------------------------- Usuario

export interface User {
  id: Id;
  supertokensId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  roles: string[];
  createdAt: ISODate;
}

// ---------------------------------------------------------------- Catálogo

export interface Category {
  id: Id;
  name: string;
  description: string | null;
  active: boolean;
  products?: Pick<Product, 'id' | 'active'>[];
}

export interface Tag {
  id: Id;
  name: string;
  active: boolean;
}

export interface Brand {
  id: Id;
  name: string;
  description?: string | null;
  active?: boolean;
}

export interface Image {
  id: Id;
  secure_url: string;
}

export type DiscountType =
  | 'PERCENTAGE'
  | 'FIXED'
  | 'BUY_MORE_GET_MORE'
  | 'BUY_ONE_GET_MORE'
  | 'BUY_MORE_GET_DISCOUNT'
  | 'BUY_MORE_GET_FIXED_DISCOUNT';

export interface Offer {
  id: Id;
  productId: Id | null;
  productVariantId: Id | null;
  startTime: ISODate | null;
  finishTime: ISODate | null;
  discountType: DiscountType;
  discountValue: number | null;
  discountQuantity: number | null;
  quantityToGet: number | null;
  stockThreshold: number | null;
  active: boolean;
}

export interface ProductVariant {
  id: Id;
  productId: Id;
  name: string;
  /** Precio de venta por kg (KG) o por unidad. */
  finalPrice?: number;
  /** Gramos si KG, si no unidades. */
  currentStock: number;
  active: boolean;
  contentMeasure: Measure;
  contentAmount: number | null;
  /** Presentaciones (tamaño del paquete en g/u). Vacío = venta suelta. */
  packagingOptions: number[];
  /** Días de demora. */
  requestTime: string;
  stockThreshold: number;
  availableWeb: boolean;
  offers?: Offer[];
  images?: Image[];
  hasComponents?: unknown[];
  product?: Product;
}

export interface Product {
  id: Id;
  name: string;
  description: string | null;
  active: boolean;
  measure: Measure;
  categoryId: Id;
  brandId: Id;
  Category?: Category;
  Brand?: Brand;
  Tags?: Tag[];
  variants?: ProductVariant[];
  offers?: Offer[];
}

// ---------------------------------------------------------------- Carrito

export interface CartItem {
  cartId: Id;
  productVariantId: Id;
  /** Tamaño del paquete (0 = venta suelta). */
  selectedBulkOption: number;
  /** Paquetes si hay presentación; si no gramos/unidades. */
  quantity: number;
  productVariant: ProductVariant & { product?: Product };
  available: boolean;
  enoughStock: boolean;
  quote: { unitPrice: number; total: number; discount: number; offerType: string };
}

export interface Cart {
  id: Id;
  userSuperTokensId: string | null;
  sessionId: string | null;
  items: CartItem[];
  summary: { itemsCount: number; subtotal: number; discount: number; total: number };
}

export interface CartLineInput {
  productVariantId: Id;
  quantity: number;
  selectedBulkOption?: number;
}

// ---------------------------------------------------------------- Órdenes

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type OrderItemStatus = 'FULFILLED' | 'AWAITING_STOCK' | 'PARTIALLY_RETURNED' | 'CANCELLED' | 'RETURNED';
export type PaymentType = 'DEBIT' | 'CREDIT' | 'CASH' | 'TRANSFER' | 'MERCADOPAGO';

export interface OrderItem {
  id: Id;
  productVariantId: Id | null;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  unitPriceSnapshot: number;
  discountAppliedSnapshot: number;
  offerTypeSnapshot: string;
  quantity: number;
  selectedBulkOption: number | null;
  status: OrderItemStatus;
  awaitingStockAt: ISODate | null;
  productVariant?: {
    id: Id;
    name: string;
    contentMeasure: Measure;
    images?: Image[];
    product?: { id: Id; name: string };
  } | null;
}

export interface Order {
  id: Id;
  createdAt: ISODate;
  updatedAt: ISODate;
  totalPrice: number;
  totalItems: number;
  paymentType: PaymentType | string;
  estimatedReadyAt: ISODate | null;
  status: OrderStatus;
  orderItems?: OrderItem[];
  /** Envío asociado (solo en `GET /order/:id` y `/order/mine`). */
  shipment?: Shipment | null;
}

// ---------------------------------------------------------------- Envíos

export type ShipmentMethod = 'DELIVERY' | 'PICKUP';
export type ShipmentStatus =
  | 'PENDING'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'FAILED_ATTEMPT'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED';

export interface ShipmentEvent {
  id: Id;
  shipmentId: Id;
  status: ShipmentStatus;
  description: string | null;
  location: string | null;
  createdAt: ISODate;
}

export interface Shipment {
  id: Id;
  orderId: Id;
  /** Código público de seguimiento, p. ej. "CER-7X4K9P2Q". */
  trackingCode: string;
  method: ShipmentMethod;
  status: ShipmentStatus;
  carrier: string | null;
  carrierTrackingCode: string | null;
  carrierTrackingUrl: string | null;
  recipientName: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  notes: string | null;
  cost: number;
  estimatedDeliveryAt: ISODate | null;
  shippedAt: ISODate | null;
  deliveredAt: ISODate | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  /** Ordenados por fecha ascendente. */
  events: ShipmentEvent[];
}

/** Seguimiento público (`GET /shipment/track/:code`): sin datos personales. */
export interface PublicTracking {
  trackingCode: string;
  orderId: Id;
  method: ShipmentMethod;
  status: ShipmentStatus;
  carrier: string | null;
  carrierTrackingCode: string | null;
  carrierTrackingUrl: string | null;
  city: string | null;
  estimatedDeliveryAt: ISODate | null;
  shippedAt: ISODate | null;
  deliveredAt: ISODate | null;
  createdAt: ISODate;
  events: ShipmentEvent[];
}

// ---------------------------------------------------------------- Opiniones de productos

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ReviewOrder = 'recent' | 'rating_desc' | 'rating_asc';

export interface Review {
  id: Id;
  productId: Id;
  productVariantId: Id;
  /** 1..5 */
  rating: number;
  title: string | null;
  comment: string | null;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  /** Respuesta pública del local. */
  reply: string | null;
  repliedAt: ISODate | null;
  moderatedAt: ISODate | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  /** Nombre público, p. ej. "María G.". */
  authorName: string;
  productVariant?: { id: Id; name: string; images?: Image[]; product?: { id: Id; name: string } };
  rejectionReason?: string | null;
}

export interface ReviewSummary {
  productId: Id;
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  byVariant: { productVariantId: Id; average: number; count: number }[];
}

export interface ReviewEligibility {
  productVariantId: Id;
  variantName: string;
  review: Review | null;
}

export interface ReviewInput {
  productVariantId: Id;
  rating: number;
  /** Al editar, `null` borra el campo. */
  title?: string | null;
  comment?: string | null;
}

export interface ReviewQuery {
  productId: Id;
  productVariantId?: Id;
  rating?: number;
  page: number;
  perPage?: number;
  orderBy?: ReviewOrder;
}

// ---------------------------------------------------------------- Reseñas de Google

export interface GoogleReview {
  id: Id;
  googleId: string;
  authorName: string;
  authorPhotoUrl: string | null;
  authorUrl: string | null;
  rating: number;
  text: string | null;
  language: string | null;
  /** "hace 2 semanas" */
  relativeTime: string | null;
  publishedAt: ISODate | null;
  featured: boolean;
  active: boolean;
  fetchedAt: ISODate;
}

export interface GooglePlaceInfo {
  placeId: string | null;
  name: string | null;
  rating: number | null;
  userRatingCount: number | null;
  googleMapsUri: string | null;
  lastSyncAt: ISODate | null;
  configured: boolean;
  lastError: string | null;
}

export interface GoogleReviews {
  place: GooglePlaceInfo;
  reviews: GoogleReview[];
}

// ---------------------------------------------------------------- Banners

export type BannerPlacement = 'HOME_HERO' | 'HOME_RECOMMENDATION' | 'CATALOG_STRIP' | 'ANNOUNCEMENT_BAR';
export type BannerSize = 'SQUARE' | 'WIDE';

export interface Banner {
  id: Id;
  placement: BannerPlacement;
  /** Nombre interno; también se usa como `alt` de la imagen. */
  name: string;
  eyebrow: string | null;
  headline: string | null;
  text: string | null;
  ctaLabel: string | null;
  /** Ruta interna ("/productos?categoria=x") o URL absoluta. */
  linkUrl: string | null;
  size: BannerSize | null;
  desktopImageUrl: string | null;
  /** Si es null se usa la de escritorio. */
  mobileImageUrl: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  position: number;
  startsAt: ISODate | null;
  endsAt: ISODate | null;
  active: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}
