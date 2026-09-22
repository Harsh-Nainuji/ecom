import { supabase } from '../supabase';
import type { OrderStatus, Product, ProductStatus, ProductVariant } from '../types';

export type SellerProduct = Product & { product_variants?: ProductVariant[] };

export interface SellerDashboardStats {
  totalOrders: number;
  revenue: number;
  liveProducts: number;
  lowStockSkus: number;
  recentOrders: SellerOrder[];
}

export interface SellerOrder {
  id: string;
  total_amount: number;
  order_status: OrderStatus;
  placed_at: string;
  buyer_name: string;
  shipping_city?: string;
  payment_method?: 'cod' | 'online';
  payment_confirmed_at?: string | null;
  shipping_type?: 'retail' | 'wholesale';
  transporter_name?: string | null;
  vehicle_number?: string | null;
  lr_number?: string | null;
  items: {
    id: string;
    productName: string;
    quantity: number;
    totalPrice: number;
  }[];
}


const STATUS_FLOW: OrderStatus[] = ['pending', 'paid', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

export function getNextOrderStatus(current: OrderStatus): OrderStatus | null {
  const advanceable: OrderStatus[] = ['pending', 'paid', 'packed', 'shipped', 'out_for_delivery'];
  const idx = advanceable.indexOf(current);
  if (idx === -1) return null;
  const flowFull: OrderStatus[] = ['pending', 'paid', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
  return flowFull[idx + 1] ?? null;
}

export async function fetchSellerDashboardStats(sellerId: string): Promise<SellerDashboardStats> {
  const [{ data: orders, error: ordersError }, { data: products, error: productsError }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total_amount, order_status, placed_at, shipping_address')
      .eq('seller_id', sellerId)
      .order('placed_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, status, product_variants(id, stock)')
      .eq('seller_id', sellerId),
  ]);

  if (ordersError) throw new Error(ordersError.message);
  if (productsError) throw new Error(productsError.message);

  const totalOrders = orders?.length ?? 0;
  const revenue = orders?.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0) ?? 0;
  const liveProducts = products?.filter((p) => p.status === 'active').length ?? 0;
  const lowStockSkus =
    products?.reduce(
      (count, product) =>
        count + (product.product_variants?.filter((variant) => (variant.stock ?? 0) <= 5).length ?? 0),
      0,
    ) ?? 0;

  const recentOrders = (orders ?? []).slice(0, 4).map((order) => ({
    id: order.id,
    total_amount: Number(order.total_amount ?? 0),
    order_status: order.order_status as OrderStatus,
    placed_at: order.placed_at,
    buyer_name: (order.shipping_address as Record<string, string> | null)?.recipient_name ?? 'Buyer',
    shipping_city: (order.shipping_address as Record<string, string> | null)?.city ?? undefined,
    items: [],
  }));

  return {
    totalOrders,
    revenue,
    liveProducts,
    lowStockSkus,
    recentOrders,
  };
}

export async function fetchSellerProducts(sellerId: string): Promise<SellerProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(*), product_images(*)')
    .eq('seller_id', sellerId)
    .neq('status', 'inactive')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as SellerProduct[];
}

export async function upsertSellerProduct(
  sellerId: string,
  payload: {
    id?: string;
    category_id?: string | null;
    name?: string;
    description?: string;
    price?: number;
    status?: ProductStatus;
  },
): Promise<string> {
  if (!payload.name && !payload.id) {
    throw new Error('Name is required for new products');
  }

  const base = { ...payload, seller_id: sellerId };
  let productId: string;

  if (payload.id) {
    // Update existing product
    const { id, ...updateFields } = base;
    const { error } = await supabase
      .from('products')
      .update(updateFields)
      .eq('id', payload.id)
      .eq('seller_id', sellerId);
    if (error) throw new Error(error.message);
    productId = payload.id;
  } else {
    // Insert new product
    const { data, error } = await supabase
      .from('products')
      .insert(base)
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    productId = data.id as string;
    // Create default variant for new product with 0 stock
    await supabase.from('product_variants').insert({ product_id: productId, stock: 0, size: null, color: null });
  }

  return productId;
}

export async function deleteSellerProduct(productId: string): Promise<void> {
  // 1. Clean up cart items and images
  try {
    await supabase.from('cart_items').delete().eq('product_id', productId);
  } catch {
    // Ignore cleanup error
  }
  try {
    await supabase.from('product_images').delete().eq('product_id', productId);
  } catch {
    // Ignore cleanup error
  }

  // 2. Attempt hard delete from products table
  const { error } = await supabase.from('products').delete().eq('id', productId);
  
  if (error) {
    // 3. Fallback: If product is referenced in existing orders, archive/soft-delete it
    const { error: archiveError } = await supabase
      .from('products')
      .update({ status: 'inactive' })
      .eq('id', productId);
      
    if (archiveError) throw new Error(archiveError.message);
  }
}

export async function adjustVariantStock(variantId: string, delta: number) {
  const { data, error } = await supabase
    .rpc('increment_stock', { p_variant_id: variantId, p_delta: delta });

  if (error) throw new Error(error.message);
  
  return data as number; // Returns the new stock value
}

export async function fetchSellerOrders(sellerId: string, statusFilter?: OrderStatus): Promise<SellerOrder[]> {
  let query = supabase
    .from('orders')
    .select('id, total_amount, order_status, placed_at, shipping_address, payment_method, payment_confirmed_at, shipping_type, transporter_name, vehicle_number, lr_number, order_items(id, quantity, total_price, product:products(name))')
    .eq('seller_id', sellerId)
    .order('placed_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('order_status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((order) => ({
    id: order.id,
    total_amount: Number(order.total_amount ?? 0),
    order_status: order.order_status as OrderStatus,
    placed_at: order.placed_at,
    buyer_name: (order.shipping_address as Record<string, string> | null)?.recipient_name ?? 'Buyer',
    shipping_city: (order.shipping_address as Record<string, string> | null)?.city ?? undefined,
    payment_method: order.payment_method,
    payment_confirmed_at: order.payment_confirmed_at,
    shipping_type: order.shipping_type || 'retail',
    transporter_name: order.transporter_name,
    vehicle_number: order.vehicle_number,
    lr_number: order.lr_number,
    items:
      order.order_items?.map((item: any) => ({
        id: item.id,
        productName: item.product?.[0]?.name ?? 'Product',
        quantity: item.quantity,
        totalPrice: Number(item.total_price ?? 0),
      })) ?? [],
  }));
}

export async function updateOrderStatus(orderId: string, nextStatus: OrderStatus) {
  const { error } = await supabase.from('orders').update({ order_status: nextStatus }).eq('id', orderId);
  if (error) throw new Error(error.message);
}

export async function updateSellerProfile(sellerId: string, payload: any) {
  const { error } = await supabase.from('seller_profiles').update(payload).eq('id', sellerId);
  if (error) throw new Error(error.message);
}

export interface SellerPendingPayout {
  id: string;
  amount: number;
  status?: 'pending' | 'paid';
  created_at: string;
  paid_at?: string;
  payment_proof_url?: string;
  order_id: string;
  payment_confirmed_at: string;
}

export async function fetchSellerPendingPayouts(sellerId: string): Promise<SellerPendingPayout[]> {
  const { data, error } = await supabase
    .from('payouts')
    .select('id, amount, status, created_at, paid_at, payment_proof_url, order_id, orders!payouts_order_id_fkey(payment_confirmed_at)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    amount: Number(row.amount ?? 0),
    status: row.status,
    created_at: row.created_at,
    paid_at: row.paid_at,
    payment_proof_url: row.payment_proof_url,
    order_id: row.order_id,
    payment_confirmed_at: row.orders?.payment_confirmed_at || row.created_at,
  }));
}

