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

  const authUsersMap: Record<string, string> = {};
  try {
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authData?.users) {
      authData.users.forEach((u: any) => {
        if (u.email) authUsersMap[u.id] = u.email;
      });
    }
  } catch (err) {
    console.warn('Could not fetch auth users for emails', err);
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    fullName: row.full_name ?? '—',
    phone: row.phone ?? '—',
    email: authUsersMap[row.id] || '—',
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
      'id, full_name, phone, is_blocked, created_at, seller_profiles:seller_profiles!seller_profiles_id_fkey(business_name, mobile, email, gst_number, pan_number, business_address, bank_account_number, bank_ifsc, bank_account_name, status, rejected_reason), products:products!products_seller_id_fkey(count)',
    )
    .eq('role', 'seller')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const authUsersMap: Record<string, string> = {};
  try {
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authData?.users) {
      authData.users.forEach((u: any) => {
        if (u.email) authUsersMap[u.id] = u.email;
      });
    }
  } catch (err) {
    console.warn('Could not fetch auth users for emails', err);
  }


  return (data ?? []).map((row: any) => {
    const sp = Array.isArray(row.seller_profiles) ? row.seller_profiles[0] : row.seller_profiles;
    return {
      id: row.id,
      fullName: row.full_name ?? '—',
      phone: row.phone ?? '—',
      businessName: sp?.business_name ?? '—',
      mobile: sp?.mobile || row.phone || '—',
      email: sp?.email || authUsersMap[row.id] || '—',
      gst: sp?.gst_number ?? '—',
      pan: sp?.pan_number ?? '—',
      address: sp?.business_address ?? '—',
      bankAccount: sp?.bank_account_number ?? '—',
      bankIfsc: sp?.bank_ifsc ?? '—',
      bankName: sp?.bank_account_name ?? '—',
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

export async function toggleUserBlock(userId: string, isBlocked: boolean) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('profiles')
    .update({ is_blocked: isBlocked })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/buyers');
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

export async function listOrders() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, total_amount, order_status, placed_at, payment_method, payment_confirmed_at,
      shipping_type, transporter_name, vehicle_number, lr_number, lr_image_url, package_image_url, pod_image_url, estimated_delivery_at,
      buyer:profiles!orders_buyer_id_fkey(full_name),
      seller:profiles!orders_seller_id_fkey(full_name, seller_profiles(business_name))
    `)
    .order('placed_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => {
    const sp = Array.isArray(row.seller?.seller_profiles) ? row.seller?.seller_profiles[0] : row.seller?.seller_profiles;
    return {
      id: row.id,
      amount: Number(row.total_amount ?? 0),
      status: row.order_status,
      placedAt: row.placed_at,
      paymentMethod: row.payment_method || 'online',
      paymentConfirmedAt: row.payment_confirmed_at,
      shippingType: row.shipping_type || 'retail',
      transporterName: row.transporter_name,
      vehicleNumber: row.vehicle_number,
      lrNumber: row.lr_number,
      lrImageUrl: row.lr_image_url,
      packageImageUrl: row.package_image_url,
      podImageUrl: row.pod_image_url,
      estimatedDeliveryAt: row.estimated_delivery_at,
      buyerName: row.buyer?.full_name ?? 'Customer',
      sellerName: sp?.business_name || row.seller?.full_name || 'Seller',
    };
  });
}

export async function updateOrderWholesaleDetails(
  orderId: string,
  details: {
    order_status?: string;
    shipping_type?: 'retail' | 'wholesale';
    transporter_name?: string;
    vehicle_number?: string;
    lr_number?: string;
    lr_image_url?: string;
    package_image_url?: string;
    pod_image_url?: string;
    estimated_delivery_at?: string;
  }
) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('orders')
    .update({
      ...details,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) throw new Error(error.message);
  revalidatePath('/orders');
  revalidatePath('/deliveries');
}

export async function listDeliveries() {
  const supabase = getSupabaseAdmin();
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, order_status, delivery_status, total_amount, placed_at, shipping_address,
        shipping_type, transporter_name, vehicle_number, lr_number, lr_image_url, package_image_url, pod_image_url, estimated_delivery_at,
        delivery_partner:delivery_partners(id, name, phone)
      `)
      .order('placed_at', { ascending: false });

    if (error) {
      console.warn('listDeliveries warning:', error.message);
      const { data: simpleData } = await supabase
        .from('orders')
        .select('*')
        .order('placed_at', { ascending: false });

      return (simpleData ?? []).map((row: any) => ({
        id: row.id,
        orderStatus: row.order_status,
        deliveryStatus: row.delivery_status || 'unassigned',
        totalAmount: Number(row.total_amount ?? 0),
        placedAt: row.placed_at,
        address: row.shipping_address,
        shippingType: row.shipping_type || 'retail',
        transporterName: row.transporter_name,
        vehicleNumber: row.vehicle_number,
        lrNumber: row.lr_number,
        lrImageUrl: row.lr_image_url,
        packageImageUrl: row.package_image_url,
        podImageUrl: row.pod_image_url,
        estimatedDeliveryAt: row.estimated_delivery_at,
        assignedPartner: null,
      }));
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      orderStatus: row.order_status,
      deliveryStatus: row.delivery_status || 'unassigned',
      totalAmount: Number(row.total_amount ?? 0),
      placedAt: row.placed_at,
      address: row.shipping_address,
      shippingType: row.shipping_type || 'retail',
      transporterName: row.transporter_name,
      vehicleNumber: row.vehicle_number,
      lrNumber: row.lr_number,
      lrImageUrl: row.lr_image_url,
      packageImageUrl: row.package_image_url,
      podImageUrl: row.pod_image_url,
      estimatedDeliveryAt: row.estimated_delivery_at,
      assignedPartner: row.delivery_partner ? {
        id: row.delivery_partner.id,
        name: row.delivery_partner.name,
        phone: row.delivery_partner.phone,
      } : null,
    }));
  } catch (err: any) {
    console.error('listDeliveries error:', err);
    return [];
  }
}

export async function listDeliveryPartners() {
  const supabase = getSupabaseAdmin();
  try {
    const { data, error } = await supabase
      .from('delivery_partners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('listDeliveryPartners warning:', error.message);
      return [];
    }
    return data ?? [];
  } catch (err: any) {
    console.error('listDeliveryPartners error:', err);
    return [];
  }
}


export async function createDeliveryPartner(
  input: FormData | { fullName?: string; name?: string; email?: string; phone?: string; vehicleDetails?: string; vehicle_type?: string }
) {
  const supabase = getSupabaseAdmin();
  let name = '';
  let phone = '';
  let vehicle = '';

  if (input instanceof FormData) {
    name = String(input.get('name') ?? input.get('fullName') ?? '');
    phone = String(input.get('phone') ?? '');
    vehicle = String(input.get('vehicle') ?? input.get('vehicleDetails') ?? '');
  } else {
    name = input.fullName || input.name || '';
    phone = input.phone || '';
    vehicle = input.vehicleDetails || input.vehicle_type || '';
  }

  const { data, error } = await supabase
    .from('delivery_partners')
    .insert({
      name,
      phone,
      vehicle_type: vehicle,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/deliveries');
  return {
    email: `${phone}@partner.fabzone.internal`,
    tempPassword: 'Partner@123',
    code: data?.id ? data.id.slice(0, 8).toUpperCase() : 'AGENT',
  };
}

export async function blockDeliveryPartner(id: string, isBlocked: boolean) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('delivery_partners')
    .update({ status: isBlocked ? 'blocked' : 'active' })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/deliveries');
}

export async function deleteDeliveryPartner(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('delivery_partners').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/deliveries');
}

export async function updateDeliveryPartnerStatus(id: string, status: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('delivery_partners')
    .update({ status })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/deliveries');
}

export async function assignDeliveryPartner(orderId: string, partnerId: string | null) {
  const supabase = getSupabaseAdmin();
  const deliveryStatus = partnerId ? 'assigned' : 'unassigned';
  const { error } = await supabase
    .from('orders')
    .update({
      delivery_partner_id: partnerId || null,
      delivery_status: deliveryStatus,
    })
    .eq('id', orderId);
  if (error) throw new Error(error.message);
  revalidatePath('/deliveries');
}

export async function listReviews() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id, rating, comment, is_reported, created_at,
      product:products(name),
      buyer:profiles!reviews_buyer_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    rating: row.rating ?? 5,
    comment: row.comment ?? '',
    isReported: row.is_reported ?? false,
    createdAt: row.created_at,
    productName: row.product?.name ?? 'Product',
    buyerName: row.buyer?.full_name ?? 'Buyer',
  }));
}

export async function deleteReview(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/reviews');
}

export async function listBanners() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('home_banners')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw new Error(error.message);
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

  if (!image || image.size === 0) throw new Error('Please select an image.');
  if (image.size > 5 * 1024 * 1024) throw new Error('Image must be smaller than 5 MB.');
  if (!image.type.startsWith('image/')) throw new Error('Only image files are allowed.');

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
  const { error } = await supabase.from('home_banners').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/banners');
}

export async function toggleBannerActive(id: string, active: boolean) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('home_banners').update({ active }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/banners');
}

export async function listCategories() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    slug: row.slug || row.name.toLowerCase().replace(/\s+/g, '-'),
    iconUrl: row.icon_url,
    displayOrder: row.display_order ?? 0,
    createdAt: row.created_at,
  }));
}

export async function createCategory(formData: FormData) {
  const supabase = getSupabaseAdmin();
  const name = String(formData.get('name') ?? '').trim();
  const displayOrder = Number(formData.get('displayOrder') ?? 0);
  if (!name) throw new Error('Category name is required.');

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const image = formData.get('image') as File | null;
  let iconUrl: string | null = null;

  if (image && image.size > 0) {
    const extension = image.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `category_${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('home-banners')
      .upload(path, image, { contentType: image.type, upsert: true });
    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('home-banners').getPublicUrl(path);
      iconUrl = publicUrlData.publicUrl;
    }
  }

  const { error } = await supabase.from('categories').insert({
    name,
    slug,
    icon_url: iconUrl,
    display_order: displayOrder,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/categories');
  revalidatePath('/products');
}

export async function deleteCategory(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/categories');
  revalidatePath('/products');
}


export async function getCommissionSettings() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('commission_settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') console.error(error);

  const percent = Number(data?.commission_percent ?? 5.0);
  const mode = (data?.commission_mode || 'flat') as 'flat' | 'tiered';

  return {
    commission_percent: percent,
    commission_mode: mode,
    percent,
    mode,
  };
}

export async function updateCommissionPercent(percent: number) {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from('commission_settings')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('commission_settings')
      .update({ commission_percent: percent })
      .eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('commission_settings')
      .insert({ commission_percent: percent });
    if (error) throw new Error(error.message);
  }
  revalidatePath('/revenue');
}

export async function listCommissionSlabs() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('commission_slabs')
    .select('*')
    .order('min_price', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createCommissionSlab(minPrice: number, maxPrice: number | null, percent: number) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('commission_slabs')
    .insert({
      min_price: minPrice,
      max_price: maxPrice,
      percent: percent,
    });
  if (error) throw new Error(error.message);
  revalidatePath('/revenue');
}

export async function deleteCommissionSlab(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('commission_slabs').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/revenue');
}

export async function updateCommissionMode(mode: 'flat' | 'tiered') {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from('commission_settings')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('commission_settings')
      .update({ commission_mode: mode })
      .eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('commission_settings')
      .insert({ commission_mode: mode });
    if (error) throw new Error(error.message);
  }
  revalidatePath('/revenue');
}

export async function getSponsoredListings() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sponsored_until, seller:profiles!products_seller_id_fkey(full_name)')
    .not('sponsored_until', 'is', null)
    .gte('sponsored_until', new Date().toISOString())
    .order('sponsored_until', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    productName: row.name,
    sellerName: row.seller?.full_name ?? 'Seller',
    endsAt: row.sponsored_until,
  }));
}


export async function createSponsoredListing(productId: string, packageTypeOrDays?: any, numDays?: number) {
  const supabase = getSupabaseAdmin();
  const days = typeof numDays === 'number' ? numDays : (typeof packageTypeOrDays === 'number' ? packageTypeOrDays : 30);
  const until = new Date();
  until.setDate(until.getDate() + days);

  const { error } = await supabase
    .from('products')
    .update({ sponsored_until: until.toISOString() })
    .eq('id', productId);

  if (error) throw new Error(error.message);
  revalidatePath('/revenue');
}

export async function getAdminPayoutStats() {
  const supabase = getSupabaseAdmin();
  const { data: onlineData } = await supabase
    .from('orders')
    .select('total_amount, commission_amount')
    .eq('payment_method', 'online')
    .neq('order_status', 'cancelled');
  
  const { data: codData } = await supabase
    .from('orders')
    .select('total_amount, commission_amount')
    .eq('payment_method', 'cod')
    .neq('order_status', 'cancelled');

  const { data: pendingPayoutsData } = await supabase
    .from('payouts')
    .select('amount')
    .eq('status', 'pending');

  const { data: paidPayoutsData } = await supabase
    .from('payouts')
    .select('amount')
    .eq('status', 'paid');

  const onlineTotal = (onlineData ?? []).reduce((acc: number, o: any) => acc + Number(o.total_amount ?? 0), 0);
  const codTotal = (codData ?? []).reduce((acc: number, o: any) => acc + Number(o.total_amount ?? 0), 0);
  const totalCommission = (onlineData ?? []).concat(codData ?? []).reduce((acc: number, o: any) => acc + Number(o.commission_amount ?? 0), 0);
  const pendingPayoutsTotal = (pendingPayoutsData ?? []).reduce((acc: number, p: any) => acc + Number(p.amount ?? 0), 0);
  const paidPayoutsTotal = (paidPayoutsData ?? []).reduce((acc: number, p: any) => acc + Number(p.amount ?? 0), 0);

  return { onlineTotal, codTotal, totalCommission, pendingPayoutsTotal, paidPayoutsTotal };
}

export async function listPendingPayouts() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('payouts')
    .select('id, amount, status, created_at, notes, payment_proof_url, seller:profiles!payouts_seller_id_fkey(id, full_name, seller_profiles(business_name, bank_account_number, bank_ifsc, bank_account_name)), order:orders!payouts_order_id_fkey(id, subtotal_amount, commission_amount, total_amount, payment_method, placed_at, payment_confirmed_at)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => {
    const sp = Array.isArray(row.seller?.seller_profiles) ? row.seller?.seller_profiles[0] : row.seller?.seller_profiles;
    return {
      id: row.id,
      amount: Number(row.amount ?? 0),
      status: row.status,
      createdAt: row.created_at,
      sellerId: row.seller?.id ?? '',
      sellerName: sp?.business_name || row.seller?.full_name || 'Seller',
      bankAccount: sp?.bank_account_number || '—',
      bankIfsc: sp?.bank_ifsc || '—',
      bankName: sp?.bank_account_name || '—',
      orderId: row.order?.id ?? '',
      subtotalAmount: Number(row.order?.subtotal_amount ?? 0),
      commissionAmount: Number(row.order?.commission_amount ?? 0),
      totalAmount: Number(row.order?.total_amount ?? 0),
      paymentMethod: row.order?.payment_method ?? 'online',
      orderPlacedAt: row.order?.placed_at ?? '',
      paymentConfirmedAt: row.order?.payment_confirmed_at ?? '',
    };
  });
}


export async function markPayoutAsPaid(payoutId: string, paymentProofUrl?: string) {
  const supabase = getSupabaseAdmin();
  const { data: adminUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  const payload: any = {
    status: 'paid',
    paid_at: new Date().toISOString(),
    marked_by_admin: adminUser?.id || null,
  };
  if (paymentProofUrl) {
    payload.payment_proof_url = paymentProofUrl;
  }

  const { error } = await supabase
    .from('payouts')
    .update(payload)
    .eq('id', payoutId);

  if (error) throw new Error(error.message);
  revalidatePath('/revenue');
}

export async function markSellerPayoutsAsPaid(sellerId: string, paymentProofUrl?: string) {
  const supabase = getSupabaseAdmin();
  const { data: adminUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  const payload: any = {
    status: 'paid',
    paid_at: new Date().toISOString(),
    marked_by_admin: adminUser?.id || null,
  };
  if (paymentProofUrl) {
    payload.payment_proof_url = paymentProofUrl;
  }

  const { error } = await supabase
    .from('payouts')
    .update(payload)
    .eq('seller_id', sellerId)
    .eq('status', 'pending');

  if (error) throw new Error(error.message);
  revalidatePath('/revenue');
}

export async function getSystemSettings() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to fetch system settings', error);
  }

  return {
    razorpay_live_key_id: data?.razorpay_live_key_id || '',
    razorpay_live_key_secret: data?.razorpay_live_key_secret || '',
    admin_bank_account_name: data?.admin_bank_account_name || '',
    admin_bank_account_number: data?.admin_bank_account_number || '',
    admin_bank_ifsc: data?.admin_bank_ifsc || '',
    admin_bank_name: data?.admin_bank_name || '',
  };
}

export async function updateSystemSettings(settings: {
  razorpay_live_key_id: string;
  razorpay_live_key_secret: string;
  admin_bank_account_name: string;
  admin_bank_account_number: string;
  admin_bank_ifsc: string;
  admin_bank_name: string;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('system_settings')
    .upsert({
      id: 1,
      ...settings,
      updated_at: new Date().toISOString(),
    });

  if (error) throw new Error(error.message);
  revalidatePath('/settings');
  revalidatePath('/revenue');
}

export async function uploadPayoutProof(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  const supabase = getSupabaseAdmin();
  const fileExt = file.name.split('.').pop() || 'jpg';
  const filePath = `proof_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from('payout-receipts')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from('payout-receipts')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function getDatabaseUsage() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc('get_database_size_bytes');
  if (error && !error.message.includes('function') && !error.message.includes('does not exist')) {
    console.error(error);
  }
  const usedBytes = Number(data ?? 0);
  const totalBytes = 500 * 1024 * 1024;
  return {
    usedBytes,
    totalBytes,
    usedPercent: totalBytes > 0 ? Math.min(100, Math.round((usedBytes / totalBytes) * 1000) / 10) : 0,
    remainingBytes: Math.max(0, totalBytes - usedBytes),
  };
}
