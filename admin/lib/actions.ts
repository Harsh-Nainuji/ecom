'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from './supabaseAdmin';

export async function listBuyers() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, is_blocked, created_at, orders:orders!orders_buyer_id_fkey(count)')
    .eq('role', 'buyer')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    fullName: row.full_name ?? '—',
    phone: row.phone ?? '—',
    isBlocked: row.is_blocked ?? false,
    orderCount: Array.isArray(row.orders) ? (row.orders[0]?.count ?? 0) : 0,
    createdAt: row.created_at,
  }));
}

export async function listSellers() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, phone, is_blocked, created_at, seller_profiles:seller_profiles!seller_profiles_id_fkey(business_name, mobile, email, gst_number, status, rejected_reason), products:products!products_seller_id_fkey(count)',
    )
    .eq('role', 'seller')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => {
    const sp = Array.isArray(row.seller_profiles) ? row.seller_profiles[0] : row.seller_profiles;
    return {
      id: row.id,
      fullName: row.full_name ?? '—',
      phone: row.phone ?? '—',
      businessName: sp?.business_name ?? '—',
      mobile: sp?.mobile ?? '—',
      email: sp?.email ?? '—',
      gst: sp?.gst_number ?? '—',
      status: sp?.status ?? 'pending',
      rejectedReason: sp?.rejected_reason ?? null,
      isBlocked: row.is_blocked ?? false,
      productCount: Array.isArray(row.products) ? (row.products[0]?.count ?? 0) : 0,
      createdAt: row.created_at,
    };
  });
}

export async function approveSeller(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('seller_profiles')
    .update({ status: 'approved', rejected_reason: null })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/sellers');
}

export async function rejectSeller(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('seller_profiles').update({ status: 'rejected' }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/sellers');
}

export async function suspendSeller(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('seller_profiles').update({ status: 'suspended' }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/sellers');
}

export async function listProducts() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, status, created_at, seller:profiles!products_seller_id_fkey(full_name), product_images(count)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    price: Number(row.price ?? 0),
    status: row.status,
    sellerName: row.seller?.full_name ?? '—',
    imageCount: Array.isArray(row.product_images) ? (row.product_images[0]?.count ?? 0) : 0,
    createdAt: row.created_at,
  }));
}

export async function deleteProduct(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/products');
}

export async function listReviews() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, is_reported, created_at, product:products(name), buyer:profiles!reviews_buyer_id_fkey(full_name)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment ?? '',
    isReported: row.is_reported ?? false,
    productName: row.product?.name ?? '—',
    buyerName: row.buyer?.full_name ?? '—',
    createdAt: row.created_at,
  }));
}

export async function deleteReview(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/reviews');
}

export async function toggleUserBlock(id: string, blocked: boolean) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('profiles').update({ is_blocked: blocked }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/buyers');
  revalidatePath('/sellers');
}

export async function getCommissionPercent() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('commission_settings')
    .select('commission_percent')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? Number(data.commission_percent) : 5.00;
}

export async function updateCommissionPercent(percent: number) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('commission_settings')
    .insert({
      commission_percent: percent
    });
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/revenue');
}

export async function getSponsoredListings() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('sponsored_listings')
    .select('*, product:products(name, price, seller:profiles!products_seller_id_fkey(full_name))')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    packageName: row.package_name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    productName: row.product?.name ?? '—',
    price: Number(row.product?.price ?? 0),
    sellerName: row.product?.seller?.full_name ?? '—',
    createdAt: row.created_at,
  }));
}

export async function createSponsoredListing(productId: string, packageName: string, days: number) {
  const supabase = getSupabaseAdmin();
  const startsAt = new Date();
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + days);

  const { error: insertError } = await supabase
    .from('sponsored_listings')
    .insert({
      product_id: productId,
      package_name: packageName,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    });
  if (insertError) throw new Error(insertError.message);

  const { error: productError } = await supabase
    .from('products')
    .update({ sponsored_until: endsAt.toISOString() })
    .eq('id', productId);
  if (productError) throw new Error(productError.message);

  revalidatePath('/revenue');
}

export async function listOrders() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('orders')
    .select('id, placed_at, total_amount, payment_status, order_status, buyer:profiles!orders_buyer_id_fkey(full_name), seller:profiles!orders_seller_id_fkey(full_name)')
    .order('placed_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    buyerName: row.buyer?.full_name ?? '—',
    sellerName: row.seller?.full_name ?? '—',
    amount: Number(row.total_amount ?? 0),
    paymentStatus: row.payment_status,
    status: row.order_status,
    placedAt: row.placed_at,
  }));
}

export async function listDeliveries() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('orders')
    .select('id, placed_at, order_status, delivery_status, delivery_partner:profiles!orders_delivery_partner_id_fkey(full_name), shipping_address')
    .not('delivery_status', 'is', null)
    .order('placed_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    deliveryPartnerName: row.delivery_partner?.full_name ?? 'Not Assigned',
    address: row.shipping_address,
    orderStatus: row.order_status,
    deliveryStatus: row.delivery_status ?? 'pending',
    placedAt: row.placed_at,
  }));
}
