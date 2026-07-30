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
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: variants, error } = await supabaseAdmin
      .from('product_variants')
      .select('*')
      .eq('product_id', productId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    if (!variants || variants.length === 0) {
      // Create default variant with stock = 10
      const { data: newVariant, error: createError } = await supabaseAdmin
        .from('product_variants')
        .insert({ product_id: productId, stock: 10, size: null, color: null })
        .select('*')
        .single();

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500, headers: corsHeaders });
      }

      return NextResponse.json({ variants: [newVariant] }, { headers: corsHeaders });
    }

    return NextResponse.json({ variants }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500, headers: corsHeaders });
  }
}
