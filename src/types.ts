export type Occasion = 'Wedding' | 'Festive' | 'Party Wear' | 'Everyday Wear';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'cod' | 'online';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  isFeatured: boolean;
}

export interface ProductColorVariant {
  id: string;
  name: string;
  hex: string;
  images: string[];
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  categoryId: string;
  categoryName: string;
  occasions: string[];
  fabric: string;
  careInstructions: string;
  price: number;
  discountPercent: number;
  salePrice: number;
  sizes: string[];
  variants: ProductColorVariant[];
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  totalStock: number;
  ratingAverage: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  productSlug: string;
  productName: string;
  categoryName: string;
  variantId: string;
  colorName: string;
  colorHex: string;
  size: string;
  imageUrl: string;
  price: number;
  salePrice: number;
  quantity: number;
  maxStock: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  variantId: string;
  colorName: string;
  size: string;
  imageUrl: string;
  unitPrice: number;
  unitSalePrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

export interface CustomerSummary {
  email: string;
  name: string;
  phone: string;
  city: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

export interface AdminOverview {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  totalCustomers: number;
}

export interface PaymentGatewayConfig {
  provider: string;
  onlineEnabled: boolean;
  mode: 'live' | 'configurable_test';
  freeShippingThreshold: number;
  standardShippingFee: number;
}
