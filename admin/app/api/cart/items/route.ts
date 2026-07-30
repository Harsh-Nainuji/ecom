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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const buyerId = searchParams.get('buyerId');

  if (!buyerId) {
    return NextResponse.json({ error: 'buyerId is required' }, { status: 400, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .select('id, buyer_id, quantity, variant_id, product_variant:product_variants(*, product:products(*, product_images(*)))')
      .eq('buyer_id', buyerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    type CartRow = {
      id: string;
      buyer_id: string;
      quantity: number;
      variant_id: string;
      product_variant?: any;
    };

    const items = ((data as CartRow[] | null) || []).map((item) => {
      let variantObj = null;
      if (Array.isArray(item.product_variant)) {
        variantObj = item.product_variant[0] || null;
      } else {
        variantObj = item.product_variant || null;
      }

      if (variantObj && Array.isArray(variantObj.product)) {
        variantObj.product = variantObj.product[0] || null;
      }

      return {
        id: item.id,
        quantity: item.quantity,
        variant_id: item.variant_id,
        product_variant: variantObj,
      };
    });

    return NextResponse.json({ items }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500, headers: corsHeaders });
  }
}
