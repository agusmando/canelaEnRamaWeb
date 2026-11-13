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
}
