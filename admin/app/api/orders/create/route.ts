import { NextResponse } from 'next/server';
import crypto from 'crypto';
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
    const { buyerId, addressId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!buyerId || !addressId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required order placement fields' }, { status: 400, headers: corsHeaders });
    }

    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (razorpayKeySecret) {
      const generatedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid Razorpay payment signature' }, { status: 400, headers: corsHeaders });
      }
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch shipping address
    const { data: address, error: addressError } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('id', addressId)
      .single();

    if (addressError || !address) {
      return NextResponse.json({ error: 'Shipping address not found' }, { status: 400, headers: corsHeaders });
    }

    // 2. Fetch cart items with full variant & product details
    const { data: cartData, error: cartError } = await supabaseAdmin
      .from('cart_items')
      .select('id, quantity, variant_id, product_variant:product_variants(*, product:products(*))')
      .eq('buyer_id', buyerId);

    if (cartError || !cartData || cartData.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400, headers: corsHeaders });
    }

    // 2.5 Validate stock for every item in cart
    for (const item of cartData) {
      let variantObj = Array.isArray(item.product_variant) ? item.product_variant[0] : item.product_variant;
      let productObj = variantObj?.product ? (Array.isArray(variantObj.product) ? variantObj.product[0] : variantObj.product) : null;
      const currentStock = variantObj?.stock ?? 10;

      if (currentStock <= 0) {
        return NextResponse.json(
          { error: `Item "${productObj?.name || 'Product'}" is out of stock!` },
          { status: 400, headers: corsHeaders }
        );
      }
      if (item.quantity > currentStock) {
        return NextResponse.json(
          { error: `Requested quantity for "${productObj?.name || 'Product'}" exceeds available stock (${currentStock} left).` },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // 3. Group items by seller_id
    const sellerGroups = new Map<string, any[]>();
    for (const item of cartData) {
      let variantObj = Array.isArray(item.product_variant) ? item.product_variant[0] : item.product_variant;
      let productObj = variantObj?.product ? (Array.isArray(variantObj.product) ? variantObj.product[0] : variantObj.product) : null;

      if (!productObj || !productObj.seller_id) {
        continue;
      }

      const sellerId = productObj.seller_id;
      if (!sellerGroups.has(sellerId)) {
        sellerGroups.set(sellerId, []);
      }

      const unitPrice = Number(variantObj?.price_override ?? productObj.price ?? 0);
      sellerGroups.get(sellerId)!.push({
        product_id: productObj.id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: unitPrice * item.quantity,
      });
    }

    // Fetch active commission rate from settings
    const { data: commSetting } = await supabaseAdmin
      .from('commission_settings')
      .select('commission_percent')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    const flatPercent = commSetting ? Number(commSetting.commission_percent) : 5.00;

    // 4. Execute atomic order creation for each seller group
    const createdOrderIds: string[] = [];

    for (const [sellerId, items] of sellerGroups.entries()) {
      const subtotal = items.reduce((acc, i) => acc + i.total_price, 0);
      const deliveryFee = subtotal >= 499 ? 0 : 49;
      const totalAmount = subtotal + deliveryFee;

      // Calculate commission for the items in the order based on the active rule
      let calculatedCommission = 0;
      if (flatPercent === 0) {
        // Tiered Slab Rules active
        for (const item of items) {
          let itemCommRate = 5;
          if (item.unit_price < 1000) {
            itemCommRate = 15;
          } else if (item.unit_price >= 1000 && item.unit_price <= 10000) {
            itemCommRate = 10;
          }
          calculatedCommission += item.total_price * (itemCommRate / 100);
        }
      } else {
        // Universal flat percentage cut
        calculatedCommission = subtotal * (flatPercent / 100);
      }

      const { data: orderId, error: rpcError } = await supabaseAdmin.rpc('create_order_with_items', {
        p_buyer_id: buyerId,
        p_seller_id: sellerId,
        p_shipping_address: address,
        p_subtotal: subtotal,
        p_commission: calculatedCommission,
        p_total: totalAmount,
        p_order_items: items,
        p_razorpay_order_id: razorpay_order_id,
        p_razorpay_payment_id: razorpay_payment_id,
      });

      if (rpcError) {
        return NextResponse.json({ error: `Order creation failed: ${rpcError.message}` }, { status: 500, headers: corsHeaders });
      }

      if (orderId) {
        createdOrderIds.push(orderId);

        // Atomically decrement stock for placed items
        for (const item of items) {
          const { data: vCurrent } = await supabaseAdmin
            .from('product_variants')
            .select('stock')
            .eq('id', item.variant_id)
            .maybeSingle();

          if (vCurrent && vCurrent.stock !== null) {
            const newStock = Math.max(0, vCurrent.stock - item.quantity);
            await supabaseAdmin
              .from('product_variants')
              .update({ stock: newStock })
              .eq('id', item.variant_id);
          }
        }
      }
    }

    return NextResponse.json(
      {
        order_id: createdOrderIds[0] ?? null,
        order_ids: createdOrderIds,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500, headers: corsHeaders });
  }
}
