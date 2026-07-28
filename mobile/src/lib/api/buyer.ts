import { supabase } from '../supabase';
import type {
  Address,
  CartItemWithProduct,
  Category,
  HomeBanner,
  OrderDetail,
  OrderSummary,
  Product,
  ProductVariant,
  RazorpayOrderIntent,
} from '../types';

const FEATURED_LIMIT = 8;

export async function fetchFeaturedProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*), product_variants(*)')
    .eq('status', 'active')
    .order('sponsored_until', { ascending: false, nullsFirst: false })
    .limit(FEATURED_LIMIT);

  if (error) throw new Error(error.message);
  return data as Product[];
}

export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw new Error(error.message);
  return data as Category[];
}

export async function fetchHomeBanners() {
  const { data, error } = await supabase
    .from('home_banners')
    .select('*')
    .eq('active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as HomeBanner[];
}

export async function searchProducts(query: string, categoryId?: string | null) {
  let request = supabase
    .from('products')
    .select('*, product_images(*), product_variants(*)')
    .eq('status', 'active');

  if (query) {
    request = request.ilike('name', `%${query}%`);
  }
  if (categoryId) {
    request = request.eq('category_id', categoryId);
  }

  const { data, error } = await request.limit(30);
  if (error) throw new Error(error.message);
  return data as Product[];
}

export async function fetchProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*), product_variants(*), reviews(count)')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Product;
}

export async function toggleWishlist(buyerId: string, productId: string) {
  const { data: existing } = await supabase
    .from('wishlists')
    .select('*')
    .eq('buyer_id', buyerId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('product_id', productId)
      .eq('buyer_id', buyerId);
    if (error) throw new Error(error.message);
    return { added: false };
  }

  const { error } = await supabase.from('wishlists').insert({ buyer_id: buyerId, product_id: productId });
  if (error) throw new Error(error.message);
  return { added: true };
}

export async function fetchWishlist(buyerId: string) {
  const { data, error } = await supabase
    .from('wishlists')
    .select('product_id, product:products(*, product_images(*))')
    .eq('buyer_id', buyerId);
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchCart(buyerId: string) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('id, buyer_id, quantity, variant_id, product_variant:product_variants(*, product:products(*, product_images(*)))')
    .eq('buyer_id', buyerId);
  if (error) throw new Error(error.message);
  type CartRow = {
    id: string;
    buyer_id: string;
    quantity: number;
    variant_id: string;
    product_variant?: (ProductVariant & { product: Product })[] | null;
  };

  return (data as CartRow[] | null)?.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    variant_id: item.variant_id,
    product_variant: item.product_variant?.[0] ?? null,
  })) as CartItemWithProduct[];
}

export async function updateCartItem(buyerId: string, variantId: string, quantity: number) {
  const payload = { buyer_id: buyerId, variant_id: variantId, quantity };
  const { error } = await supabase
    .from('cart_items')
    .upsert(payload, { onConflict: 'buyer_id,variant_id' });
  if (error) throw new Error(error.message);
}

export async function removeCartItem(buyerId: string, variantId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('variant_id', variantId)
    .eq('buyer_id', buyerId);
  if (error) throw new Error(error.message);
}

export async function fetchAddresses(buyerId: string) {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Address[];
}

export async function upsertAddress(
  buyerId: string,
  payload: Partial<Address> & { id?: string },
) {
  const basePayload = { ...payload, buyer_id: buyerId };
  const query = payload.id
    ? supabase.from('addresses').update(basePayload).eq('id', payload.id)
    : supabase.from('addresses').insert(basePayload);
  const { data, error } = await query.select('*').single();
  if (error) throw new Error(error.message);
  return data as Address;
}

export async function deleteAddress(buyerId: string, id: string) {
  const { error } = await supabase.from('addresses').delete().eq('id', id).eq('buyer_id', buyerId);
  if (error) throw new Error(error.message);
}

export async function setDefaultAddress(buyerId: string, id: string) {
  const { error: clearError } = await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('buyer_id', buyerId);
  if (clearError) throw new Error(clearError.message);
  const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', id).eq('buyer_id', buyerId);
  if (error) throw new Error(error.message);
}

export async function fetchOrders(buyerId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, total_amount, order_status, placed_at')
    .eq('buyer_id', buyerId)
    .order('placed_at', { ascending: false })
    .limit(30);

  if (error) throw new Error(error.message);
  return data as OrderSummary[];
}

export async function fetchOrderDetail(buyerId: string, id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, product:products(*), variant:product_variants(*)), delivery_otps(*)')
    .eq('id', id)
    .eq('buyer_id', buyerId)
    .single();
  if (error) throw new Error(error.message);
  // Normalize delivery_otps — Supabase may return an array; pick first entry
  const otps = data.delivery_otps;
  const normalizedOtp = Array.isArray(otps) ? (otps[0] ?? null) : (otps ?? null);
  // Normalize order_items — product join may return array
  const normalizedItems = (data.order_items ?? []).map((item: any) => ({
    ...item,
    product: Array.isArray(item.product) ? (item.product[0] ?? item.product) : item.product,
    variant: Array.isArray(item.variant) ? (item.variant[0] ?? null) : (item.variant ?? null),
  }));
  return { ...data, delivery_otps: normalizedOtp, order_items: normalizedItems } as OrderDetail;
}

export async function createRazorpayOrder(addressId: string) {
  const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: { address_id: addressId },
  });
  if (error) throw new Error(error.message);
  return data as RazorpayOrderIntent;
}

export async function createOrder(payload: {
  address_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const { data, error } = await supabase.functions.invoke('create-order', {
    body: payload,
  });
  if (error) throw new Error(error.message);
  return data as { order_id: string; order_ids: string[] };
}

export async function cancelOrder(buyerId: string, orderId: string) {
  const { error } = await supabase
    .from('orders')
    .update({ order_status: 'cancelled' })
    .eq('id', orderId)
    .eq('buyer_id', buyerId)
    .in('order_status', ['pending', 'paid']);
  if (error) throw new Error(error.message);
}

export async function createReview(payload: {
  orderId: string;
  productId: string;
  buyerId: string;
  rating: number;
  comment: string;
}) {
  const { error } = await supabase.from('reviews').insert({
    order_id: payload.orderId,
    product_id: payload.productId,
    buyer_id: payload.buyerId,
    rating: payload.rating,
    comment: payload.comment,
  });
  if (error) throw new Error(error.message);
}

export async function fetchReviews(productId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, buyer:profiles!reviews_buyer_id_fkey(full_name)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment ?? '',
    createdAt: row.created_at,
    buyerName: row.buyer?.full_name ?? '—',
  }));
}
