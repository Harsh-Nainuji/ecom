import { supabase } from '../supabase';
import { getApiBaseUrl } from '../config';
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
  const product = data as Product;
  if (!product.product_variants || product.product_variants.length === 0) {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/variants?productId=${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.variants && json.variants.length > 0) {
          product.product_variants = json.variants;
        }
      }
    } catch {
      // Fall through
    }
  }
  if (!product.product_variants || product.product_variants.length === 0) {
    product.product_variants = [
      {
        id: product.id,
        size: null,
        color: null,
        stock: 10,
        price_override: null,
      },
    ];
  }
  return product;
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
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/cart/items?buyerId=${buyerId}`);
    if (res.ok) {
      const json = await res.json();
      if (json.items && Array.isArray(json.items)) {
        return json.items as CartItemWithProduct[];
      }
    }
  } catch {
    // Backend API offline, fallback to Supabase client
  }

  const { data, error } = await supabase
    .from('cart_items')
    .select('id, buyer_id, quantity, variant_id, product_variant:product_variants(*, product:products(*, product_images(*)))')
    .eq('buyer_id', buyerId);

  if (!error && data) {
    const items = await Promise.all(
      (data || []).map(async (item: any) => {
        let variantObj = Array.isArray(item.product_variant) ? item.product_variant[0] : item.product_variant;
        let productObj = variantObj?.product ? (Array.isArray(variantObj.product) ? variantObj.product[0] : variantObj.product) : null;

        // Fallback: If product_variant join returned null, resolve by variant_id or product_id
        if (!productObj && item.variant_id) {
          // 1. Check product_variants by id = item.variant_id
          const { data: vRecord } = await supabase
            .from('product_variants')
            .select('*, product:products(*, product_images(*))')
            .eq('id', item.variant_id)
            .maybeSingle();

          if (vRecord) {
            variantObj = vRecord;
            productObj = Array.isArray(vRecord.product) ? vRecord.product[0] : vRecord.product;
          } else {
            // 2. Check product_variants by product_id = item.variant_id
            const { data: vByProd } = await supabase
              .from('product_variants')
              .select('*, product:products(*, product_images(*))')
              .eq('product_id', item.variant_id)
              .maybeSingle();

            if (vByProd) {
              variantObj = vByProd;
              productObj = Array.isArray(vByProd.product) ? vByProd.product[0] : vByProd.product;
            } else {
              // 3. Check products directly by id = item.variant_id
              const { data: directProd } = await supabase
                .from('products')
                .select('*, product_images(*)')
                .eq('id', item.variant_id)
                .maybeSingle();

              if (directProd) {
                productObj = directProd;
                variantObj = {
                  id: item.variant_id,
                  product_id: directProd.id,
                  size: null,
                  color: null,
                  stock: 10,
                  price_override: null,
                  product: directProd,
                };
              }
            }
          }
        }

        if (productObj) {
          productObj = {
            ...productObj,
            price: Number(productObj.price ?? 0),
            product_images: Array.isArray(productObj.product_images) ? productObj.product_images : [],
          };
          if (variantObj) {
            variantObj.product = productObj;
          }
        }

        return {
          id: item.id,
          quantity: item.quantity,
          variant_id: item.variant_id,
          product_variant: variantObj,
        };
      })
    );

    return items as CartItemWithProduct[];
  }

  if (error) throw new Error(error.message);
  return [];
}

export async function updateCartItem(buyerId: string, variantId: string, quantity: number, productId?: string) {
  let targetVariantId = variantId;
  const targetProductId = productId || variantId;

  // 1. Check if targetVariantId is a valid variant ID
  const { data: vCheck } = await supabase
    .from('product_variants')
    .select('id')
    .eq('id', targetVariantId)
    .maybeSingle();

  if (vCheck) {
    targetVariantId = vCheck.id;
  } else {
    // 2. Resolve variant by product_id
    const { data: existingVariants } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', targetProductId)
      .limit(1);

    if (existingVariants && existingVariants.length > 0) {
      targetVariantId = existingVariants[0].id;
    } else {
      targetVariantId = ''; // Requires backend API to auto-create variant
    }
  }

  // 3. Direct Supabase client upsert if variant ID is valid
  if (targetVariantId && targetVariantId !== targetProductId) {
    const payload = { buyer_id: buyerId, variant_id: targetVariantId, quantity };
    const { error } = await supabase
      .from('cart_items')
      .upsert(payload, { onConflict: 'buyer_id,variant_id' });

    if (!error) return;
  }

  // 4. API endpoint fallback to create variant and upsert cart item via service role
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyerId, variantId: targetVariantId || variantId, productId: targetProductId, quantity }),
    });
    if (res.ok) return;
    const json = await res.json().catch(() => ({}));
    if (json.error) throw new Error(json.error);
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch')) {
      throw err;
    }
  }
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

export async function createRazorpayOrder(addressId: string, buyerId?: string) {
  const user = buyerId ?? (await supabase.auth.getUser()).data.user?.id;
  const res = await fetch(`${getApiBaseUrl()}/api/orders/razorpay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buyerId: user, addressId }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || 'Failed to initialize payment');
  }

  return (await res.json()) as RazorpayOrderIntent;
}

export async function createOrder(payload: {
  address_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  buyer_id?: string;
}) {
  const user = payload.buyer_id ?? (await supabase.auth.getUser()).data.user?.id;
  const res = await fetch(`${getApiBaseUrl()}/api/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerId: user,
      addressId: payload.address_id,
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_signature: payload.razorpay_signature,
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || 'Failed to complete order placement');
  }

  return (await res.json()) as { order_id: string; order_ids: string[] };
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
