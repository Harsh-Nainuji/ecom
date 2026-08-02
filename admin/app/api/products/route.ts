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
  const productId = searchParams.get('id');
  const query = searchParams.get('query');
  const categoryId = searchParams.get('categoryId');
  const limit = parseInt(searchParams.get('limit') || '30', 10);

  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (productId) {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*, product_images(*), product_variants(*)')
        .eq('id', productId)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404, headers: corsHeaders });
      }
      return NextResponse.json({ product: data }, { headers: corsHeaders });
    }

    let req = supabaseAdmin
      .from('products')
      .select('*, product_images(*), product_variants(*)')
      .eq('status', 'active')
      .order('sponsored_until', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (query) {
      req = req.ilike('name', `%${query}%`);
    }
    if (categoryId) {
      req = req.eq('category_id', categoryId);
    }

    const { data, error } = await req;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ products: data ?? [] }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
