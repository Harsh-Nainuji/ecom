import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { buyerId, addressId } = await request.json();

    if (!buyerId || !addressId) {
      return NextResponse.json({ error: 'buyerId and addressId are required' }, { status: 400, headers: corsHeaders });
    }

    const razorpayKeyId = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_demo';
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch buyer cart items with product price details
    const { data: cartData, error: cartError } = await supabaseAdmin
      .from('cart_items')
      .select('id, quantity, product_variant:product_variants(*, product:products(*))')
      .eq('buyer_id', buyerId);

    if (cartError || !cartData || cartData.length === 0) {
      return NextResponse.json({ error: 'Cart is empty or could not be loaded' }, { status: 400, headers: corsHeaders });
    }

    let subtotal = 0;
    for (const item of cartData) {
      let variantObj = Array.isArray(item.product_variant) ? item.product_variant[0] : item.product_variant;
      let productObj = variantObj?.product ? (Array.isArray(variantObj.product) ? variantObj.product[0] : variantObj.product) : null;
      
      const stock = variantObj?.stock ?? 10;
      if (stock <= 0) {
        return NextResponse.json(
          { error: `Item "${productObj?.name || 'Product'}" is currently out of stock.` },
          { status: 400, headers: corsHeaders }
        );
      }
      if (item.quantity > stock) {
        return NextResponse.json(
          { error: `Quantity for "${productObj?.name || 'Product'}" exceeds available stock (${stock} available).` },
          { status: 400, headers: corsHeaders }
        );
      }

      const unitPrice = variantObj?.price_override ?? productObj?.price ?? 0;
      subtotal += Number(unitPrice) * item.quantity;
    }

    const deliveryFee = subtotal >= 499 ? 0 : 49;
    const totalAmount = subtotal + deliveryFee;
    const amountInPaise = Math.round(totalAmount * 100);

    // 2. Fetch address and profile prefill details
    const [{ data: address }, { data: profile }] = await Promise.all([
      supabaseAdmin.from('addresses').select('*').eq('id', addressId).maybeSingle(),
      supabaseAdmin.from('profiles').select('*').eq('id', buyerId).maybeSingle(),
    ]);

    const prefill = {
      name: profile?.full_name ?? address?.recipient_name ?? '',
      contact: profile?.phone ?? address?.phone ?? '',
    };

    // 3. Create order on Razorpay API if secret exists
    if (razorpayKeySecret) {
      try {
        const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64')}`,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
            notes: { buyer_id: buyerId, address_id: addressId },
          }),
        });

        if (razorpayRes.ok) {
          const razorpayOrder = await razorpayRes.json();
          return NextResponse.json(
            {
              order_id: razorpayOrder.id,
              amount: razorpayOrder.amount,
              currency: razorpayOrder.currency,
              prefill,
            },
            { headers: corsHeaders }
          );
        }
      } catch (e) {
        console.warn('Razorpay API fetch notice:', e);
      }
    }

    // Dev Fallback mode if RAZORPAY_KEY_SECRET is not provided or test keys used
    const mockOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return NextResponse.json(
      {
        order_id: mockOrderId,
        amount: amountInPaise,
        currency: 'INR',
        prefill,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500, headers: corsHeaders });
  }
}
