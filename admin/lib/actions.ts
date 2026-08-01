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
  if (error) {
    const isFkeyViolation = error.code === '23503' || 
                            error.message.toLowerCase().includes('foreign key') || 
                            error.message.toLowerCase().includes('violates');
    if (isFkeyViolation) {
      // Fallback: Soft-delete by setting status to 'inactive' so historical order logs remain intact
      const { error: updateError } = await supabase
        .from('products')
        .update({ status: 'inactive' })
        .eq('id', id);
      if (updateError) throw new Error(updateError.message);
    } else {
      throw new Error(error.message);
    }
  }
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

export async function listDeliveryPartners() {
  const supabase = getSupabaseAdmin();
  let response = await supabase
    .from('profiles')
    .select('id, full_name, phone, is_blocked, created_at, delivery_accounts(code, phone, vehicle_details, status, account_status)')
    .eq('role', 'delivery')
    .order('created_at', { ascending: false });

  if (response.error) {
    const msg = response.error.message.toLowerCase();
    if (msg.includes('column') && msg.includes('account_status')) {
      // Fallback: query without the account_status column until the migration is applied
      response = await supabase
        .from('profiles')
        .select('id, full_name, phone, is_blocked, created_at, delivery_accounts(code, phone, vehicle_details, status)')
        .eq('role', 'delivery')
        .order('created_at', { ascending: false });
    }
  }

  if (response.error) throw new Error(response.error.message);
  
  return (response.data ?? []).map((row: any) => {
    const da = Array.isArray(row.delivery_accounts) ? row.delivery_accounts[0] : row.delivery_accounts;
    return {
      id: row.id,
      fullName: row.full_name ?? '—',
      phone: row.phone ?? da?.phone ?? '—',
      code: da?.code ?? '—',
      vehicleDetails: da?.vehicle_details ?? '—',
      status: da?.status ?? 'unassigned',
      accountStatus: da?.account_status ?? 'approved', // Default to approved if column not present yet
      isBlocked: row.is_blocked ?? false,
      createdAt: row.created_at,
    };
  });
}

export async function updateDeliveryPartnerStatus(id: string, status: 'approved' | 'rejected' | 'suspended') {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('delivery_accounts')
    .update({ account_status: status })
    .eq('profile_id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/deliveries');
}

export async function createDeliveryPartner(payload: {
  fullName: string;
  email: string;
  phone: string;
  vehicleDetails?: string;
}) {
  const supabase = getSupabaseAdmin();
  const tempPassword = `Fz${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 100)}!`;

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: payload.email.trim().toLowerCase(),
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: payload.fullName, role: 'delivery' },
  });
  if (authError || !authData?.user) {
    throw new Error(authError?.message ?? 'Failed to create auth user');
  }

  const userId = authData.user.id;

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      full_name: payload.fullName,
      phone: payload.phone,
      role: 'delivery',
    },
    { onConflict: 'id' },
  );
  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    throw new Error(profileError.message);
  }

  const code = `DP${Math.floor(1000 + Math.random() * 9000)}`;
  const { error: accountError } = await supabase.from('delivery_accounts').upsert({
    profile_id: userId,
    code,
    phone: payload.phone,
    vehicle_details: payload.vehicleDetails ?? null,
    status: 'unassigned',
    account_status: 'approved',
  }, { onConflict: 'profile_id' });
  if (accountError) {
    await supabase.auth.admin.deleteUser(userId);
    throw new Error(accountError.message);
  }

  revalidatePath('/deliveries');
  return { email: payload.email, tempPassword, code };
}

export async function blockDeliveryPartner(id: string, block: boolean) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('profiles').update({ is_blocked: block }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/deliveries');
}

export async function deleteDeliveryPartner(id: string) {
  const supabase = getSupabaseAdmin();
  const { error: authError } = await supabase.auth.admin.deleteUser(id);
  if (authError) throw new Error(authError.message);
  revalidatePath('/deliveries');
}

export async function listBanners() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('home_banners')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) {
    // Gracefully handle the table not existing until the migration is applied.
    const message = String(error.message).toLowerCase();
    if (message.includes('relation') || message.includes('does not exist') || message.includes('could not find') || message.includes('schema cache')) {
      console.warn('home_banners table not found; return empty list until migration is applied.');
      return [];
    }
    throw new Error(error.message);
  }
  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title ?? '',
    imageUrl: row.image_url,
    linkUrl: row.link_url ?? '',
    active: row.active ?? true,
    displayOrder: row.display_order ?? 0,
    createdAt: row.created_at,
  }));
}

export async function createBanner(formData: FormData) {
  const supabase = getSupabaseAdmin();
  const title = String(formData.get('title') ?? '');
  const linkUrl = String(formData.get('linkUrl') ?? '');
  const displayOrder = Number(formData.get('displayOrder') ?? 0);
  const active = formData.get('active') === 'true';
  const image = formData.get('image') as File | null;

  if (!image || image.size === 0) {
    throw new Error('Please select an image.');
  }
  if (image.size > 5 * 1024 * 1024) {
    throw new Error('Image must be smaller than 5 MB.');
  }
  if (!image.type.startsWith('image/')) {
    throw new Error('Only image files are allowed.');
  }

  const extension = image.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${Date.now()}_banner.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from('home-banners')
    .upload(path, image, { contentType: image.type, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { data: publicUrlData } = supabase.storage.from('home-banners').getPublicUrl(path);

  const { error: insertError } = await supabase.from('home_banners').insert({
    title,
    image_url: publicUrlData.publicUrl,
    link_url: linkUrl || null,
    display_order: displayOrder,
    active,
  });
  if (insertError) throw new Error(insertError.message);

  revalidatePath('/banners');
}

export async function deleteBanner(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('home_banners').select('image_url').eq('id', id).single();
  if (error) throw new Error(error.message);

  try {
    if (data?.image_url) {
      const url = new URL(data.image_url);
      const pathParts = url.pathname.split('/home-banners/');
      if (pathParts.length > 1) {
        await supabase.storage.from('home-banners').remove([pathParts[1]]);
      }
    }
  } catch {
    // Best-effort cleanup
  }

  const { error: deleteError } = await supabase.from('home_banners').delete().eq('id', id);
  if (deleteError) throw new Error(deleteError.message);
  revalidatePath('/banners');
}

export async function toggleBannerActive(id: string, active: boolean) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('home_banners').update({ active }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/banners');
}

export async function getDatabaseUsage() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc('get_database_size_bytes');
  if (error) throw new Error(error.message);
  const usedBytes = Number(data ?? 0);
  const totalBytes = 500 * 1024 * 1024; // 500 MB Supabase free-tier reference
  return {
    usedBytes,
    totalBytes,
    usedPercent: totalBytes > 0 ? Math.min(100, Math.round((usedBytes / totalBytes) * 1000) / 10) : 0,
    remainingBytes: Math.max(0, totalBytes - usedBytes),
  };
}
