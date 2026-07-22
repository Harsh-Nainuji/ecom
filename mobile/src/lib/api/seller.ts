import { supabase } from '../supabase';
import type { OrderStatus, Product, ProductVariant } from '../types';

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
  items: {
    id: string;
    productName: string;
    quantity: number;
    totalPrice: number;
  }[];
}

const STATUS_FLOW: OrderStatus[] = ['pending', 'paid', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

export function getNextOrderStatus(current: OrderStatus): OrderStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1] ?? null;
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
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SellerProduct[];
}

export async function upsertSellerProduct(
  sellerId: string,
  payload: {
    id?: string;
    name?: string;
    price?: number;
    description?: string;
    status?: Product['status'];
    category_id?: string | null;
  },
): Promise<string> {
  if (!payload.name && !payload.id) {
    throw new Error('Name is required for new products');
  }

  const base = { ...payload, seller_id: sellerId };
  const { data, error } = await supabase
    .from('products')
    .upsert(base, { onConflict: 'id' })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  const productId = data?.id as string;

  if (!payload.id) {
    await supabase.from('product_variants').insert({ product_id: productId, stock: 0, size: null, color: null });
  }

  return productId;
}

export async function deleteSellerProduct(productId: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);
  if (error) throw new Error(error.message);
}

export async function adjustVariantStock(variantId: string, delta: number) {
  const { data, error } = await supabase
    .from('product_variants')
    .select('stock')
    .eq('id', variantId)
    .single();
  if (error) throw new Error(error.message);
  const nextStock = Math.max(0, Number(data?.stock ?? 0) + delta);
  const { error: updateError } = await supabase.from('product_variants').update({ stock: nextStock }).eq('id', variantId);
  if (updateError) throw new Error(updateError.message);
  return nextStock;
}

export async function fetchSellerOrders(sellerId: string, statusFilter?: OrderStatus) {
  let query = supabase
    .from('orders')
    .select('id, total_amount, order_status, placed_at, shipping_address, order_items(id, quantity, total_price, product:products(name))')
    .eq('seller_id', sellerId)
    .order('placed_at', { ascending: false });

  if (statusFilter && statusFilter !== 'pending') {
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
