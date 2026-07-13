// @ts-nocheck
/// <reference types="jsr:@supabase/functions-js" />
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

interface CreateOrderPayload {
  address_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

async function verifySignature(orderId: string, paymentId: string, signature: string) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(RAZORPAY_KEY_SECRET);
  const data = encoder.encode(`${orderId}|${paymentId}`);

  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digestBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const digestArray = Array.from(new Uint8Array(digestBuffer));
  const digestHex = digestArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return digestHex === signature;
}

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

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RAZORPAY_KEY_SECRET) {
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

  const body = (await req.json().catch(() => null)) as CreateOrderPayload | null;

  if (!body) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { address_id: addressId, razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId, razorpay_signature: razorpaySignature } = body;

  if (!addressId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const isSignatureValid = await verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

  if (!isSignatureValid) {
    return Response.json({ error: 'Payment signature mismatch' }, { status: 400 });
  }

  const { data: address, error: addressError } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', addressId)
    .eq('buyer_id', user.id)
    .single();

  if (addressError || !address) {
    return Response.json({ error: 'Address not found' }, { status: 404 });
  }

  const { data: cartRows, error: cartError } = await supabase
    .from('cart_items')
    .select('variant_id, quantity, variant:product_variants(*, product:products(*))')
    .eq('buyer_id', user.id);

  if (cartError) {
    return Response.json({ error: 'Failed to load cart' }, { status: 500 });
  }

  if (!cartRows || cartRows.length === 0) {
    return Response.json({ error: 'Cart is empty' }, { status: 400 });
  }

  let normalized;
  try {
    normalized = cartRows.map((row: any) => {
      const variant = row.variant?.[0];
      const product = variant?.product?.[0];

      if (!variant || !product) {
        throw new Error('Variant or product missing for cart item');
      }

      if (row.quantity > variant.stock) {
        throw new Error('Requested quantity exceeds stock');
      }

      const unitPrice = Number(variant.price_override ?? product.price ?? 0);

      if (unitPrice <= 0) {
        throw new Error('Invalid pricing data');
      }

      return {
        productId: product.id,
        variantId: variant.id,
        quantity: row.quantity,
        sellerId: product.seller_id,
        unitPrice,
        productName: product.name,
      };
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }

  const uniqueSellers = [...new Set(normalized.map((item: any) => item.sellerId))];

  if (uniqueSellers.length !== 1) {
    return Response.json({ error: 'Checkout is limited to one seller at a time' }, { status: 422 });
  }

  const subtotal = normalized.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);

  if (subtotal <= 0) {
    return Response.json({ error: 'Invalid subtotal' }, { status: 400 });
  }

  const { data: commissionSetting } = await supabase
    .from('commission_settings')
    .select('commission_percent')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const commissionPercent = Number(commissionSetting?.commission_percent ?? 0);
  const commissionAmount = Number(((subtotal * commissionPercent) / 100).toFixed(2));
  const totalAmount = Number((subtotal + commissionAmount).toFixed(2));

  const orderItemsPayload = normalized.map((item: any) => ({
    product_id: item.productId,
    variant_id: item.variantId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: Number((item.unitPrice * item.quantity).toFixed(2)),
  }));

  const shippingAddress = {
    recipient_name: address.recipient_name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postal_code: address.postal_code,
  };

  const { data: createdOrder, error: createError } = await supabase.rpc('create_order_with_items', {
    p_buyer_id: user.id,
    p_seller_id: uniqueSellers[0],
    p_shipping_address: shippingAddress,
    p_subtotal: Number(subtotal.toFixed(2)),
    p_commission: commissionAmount,
    p_total: totalAmount,
    p_order_items: orderItemsPayload,
    p_razorpay_order_id: razorpayOrderId,
    p_razorpay_payment_id: razorpayPaymentId,
  });

  if (createError || !createdOrder) {
    return Response.json({ error: 'Failed to store order', details: createError?.message }, { status: 500 });
  }

  return Response.json({ order_id: createdOrder });
});
