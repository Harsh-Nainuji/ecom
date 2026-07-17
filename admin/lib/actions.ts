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
    orderCount: Array.isArray(row.orders) ? row.orders.length : 0,
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
      productCount: Array.isArray(row.products) ? row.products.length : 0,
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
    imageCount: Array.isArray(row.product_images) ? row.product_images.length : 0,
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
