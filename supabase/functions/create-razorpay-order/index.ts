import { createClient } from 'npm:@supabase/supabase-js@2.46.1';

interface AddressRow {
  id: string;
  buyer_id: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
}

interface NormalizedCartItem {
  productId: string;
  variantId: string;
  quantity: number;
  sellerId: string;
  unitPrice: number;
}

interface CartRow {
  variant_id: string;
  quantity: number;
  variant?: {
    id: string;
    stock: number;
    price_override?: number | null;
    product?: {
      id: string;
      seller_id: string;
      price: number;
      name: string;
    }[] | null;
  }[] | null;
}

interface ProfileRow {
  full_name?: string | null;
  phone?: string | null;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

function getSupabaseClient(req: Request) {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: {
      headers: { Authorization: req.headers.get('Authorization') ?? '' },
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return Response.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const supabase = getSupabaseClient(req);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const addressId: string | undefined = body?.address_id;

  if (!addressId) {
    return Response.json({ error: 'address_id is required' }, { status: 400 });
  }

  const { data: address, error: addressError } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', addressId)
    .eq('buyer_id', user.id)
    .single<AddressRow>();

  if (addressError || !address) {
    return Response.json({ error: 'Address not found' }, { status: 404 });
  }

  const { data: cartRows, error: cartError } = await supabase
    .from('cart_items')
    .select(
      'variant_id, quantity, variant:product_variants(*, product:products(*))',
    )
    .eq('buyer_id', user.id);

  if (cartError) {
    return Response.json({ error: 'Failed to load cart' }, { status: 500 });
  }

  if (!cartRows || cartRows.length === 0) {
    return Response.json({ error: 'Cart is empty' }, { status: 400 });
  }

  const variantIds = cartRows.map(r => r.variant_id);
  
  // Fetch active reservations for these variants
  const { data: reservations } = await supabase
    .from('inventory_reservations')
    .select('variant_id, quantity')
    .in('variant_id', variantIds)
    .gt('expires_at', new Date().toISOString());

  const reservedStockByVariant = (reservations || []).reduce((acc: Record<string, number>, res) => {
    acc[res.variant_id] = (acc[res.variant_id] || 0) + res.quantity;
    return acc;
  }, {});

  let normalized: NormalizedCartItem[];
  try {
    normalized = cartRows.map((row: CartRow) => {
      const variant = row.variant?.[0];
      const product = variant?.product?.[0];

      if (!variant || !product) {
        throw new Error('Variant or product missing for cart item');
      }

      const unitPrice = Number(variant.price_override ?? product.price ?? 0);

      if (unitPrice <= 0) {
        throw new Error('Invalid pricing data');
      }

      const activeReservations = reservedStockByVariant[variant.id] || 0;
      const availableStock = variant.stock - activeReservations;

      if (row.quantity > availableStock) {
        throw new Error('Requested quantity exceeds available stock');
      }

      return {
        productId: product.id,
        variantId: variant.id,
        quantity: row.quantity,
        sellerId: product.seller_id,
        unitPrice,
      };
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }

  // Create reservations for the items in the cart
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
  const reservationPayload = normalized.map(item => ({
    buyer_id: user.id,
    variant_id: item.variantId,
    quantity: item.quantity,
    expires_at: expiresAt,
  }));

  await supabase.from('inventory_reservations').insert(reservationPayload);


  const uniqueSellers = [...new Set(normalized.map((item: NormalizedCartItem) => item.sellerId))];

  const subtotal = normalized.reduce((sum: number, item: NormalizedCartItem) => sum + item.unitPrice * item.quantity, 0);

  if (subtotal <= 0) {
    return Response.json({ error: 'Invalid subtotal' }, { status: 400 });
  }

  const amountPaise = Math.round(subtotal * 100);

  const receipt = `fabzone_${user.id}_${Date.now()}`;
  const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      payment_capture: 1,
      notes: {
        buyer_id: user.id,
        seller_ids: uniqueSellers.join(','),
        address_id: address.id,
      },
    }),
  });

  if (!razorpayRes.ok) {
    const details = await razorpayRes.text();
    return Response.json({ error: 'Failed to create Razorpay order', details }, { status: 502 });
  }

  const razorpayOrder = await razorpayRes.json();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>();

  return Response.json({
    order_id: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    subtotal,
    seller_ids: uniqueSellers,
    receipt,
    prefill: {
      name: address.recipient_name ?? profile?.full_name ?? 'FabZone Buyer',
      email: user.email ?? null,
      contact: address.phone ?? profile?.phone ?? null,
    },
  });
});
