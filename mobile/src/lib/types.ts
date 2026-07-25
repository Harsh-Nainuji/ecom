export type UserRole = 'buyer' | 'seller' | 'delivery' | 'admin';

export interface Category {
  id: string;
  name: string;
  icon?: string | null;
}

export interface ProductImage {
  id: string;
  image_url: string;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  size?: string | null;
  color?: string | null;
  stock: number;
  price_override?: number | null;
}

export interface Product {
  id: string;
  seller_id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  price: number;
  status: 'draft' | 'active' | 'inactive';
  sponsored_until?: string | null;
  commission_rate: number;
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
  reviews_aggregate?: { avg?: number | null; count?: number };
}

export interface WishlistEntry {
  product_id: string;
}

export interface HomeBanner {
  id: string;
  title?: string | null;
  image_url: string;
  link_url?: string | null;
  active: boolean;
  display_order: number;
  created_at: string;
}

export interface CartItemWithProduct {
  id: string;
  quantity: number;
  variant_id: string;
  product_variant?: (ProductVariant & { product: Product }) | null;
}

export interface Address {
  id: string;
  label?: string | null;
  recipient_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderSummary {
  id: string;
  total_amount: number;
  order_status: OrderStatus;
  placed_at: string;
}

export interface OrderDetail extends OrderSummary {
  shipping_address: {
    recipient_name: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postal_code: string;
  };
  order_items: {
    id: string;
    product: Product;
    variant?: ProductVariant | null;
    quantity: number;
    total_price: number;
  }[];
  delivery_otps?: {
    otp_code: string;
    expires_at: string;
  } | null;
}

export type DeliveryState = 'unassigned' | 'assigned' | 'out_for_delivery' | 'completed' | 'failed';

export interface DeliveryAssignmentSummary {
  id: string;
  order_status: OrderStatus;
  delivery_status: DeliveryState;
  buyer_name: string;
  phone?: string;
  address: string;
  total_amount: number;
  items_label: string;
  placed_at: string;
}

export interface DeliveryOrderDetail extends OrderDetail {
  delivery_status: DeliveryState;
  delivery_partner_id?: string | null;
}

export interface RazorpayPrefill {
  name?: string | null;
  email?: string | null;
  contact?: string | null;
}

export interface RazorpayOrderIntent {
  order_id: string;
  amount: number;
  currency: string;
  subtotal: number;
  seller_id: string;
  receipt: string;
  prefill?: RazorpayPrefill | null;
}
