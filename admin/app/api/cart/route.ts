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
    const body = await request.json();
    const { buyerId, variantId, productId, quantity = 1 } = body;

    if (!buyerId) {
      return NextResponse.json({ error: 'buyerId is required' }, { status: 400, headers: corsHeaders });
    }

    const supabaseAdmin = getSupabaseAdmin();
    let targetVariantId = variantId;

    // Check if variantId is a valid ID in product_variants table
    if (targetVariantId) {
      const { data: existingVariant } = await supabaseAdmin
        .from('product_variants')
        .select('id')
        .eq('id', targetVariantId)
        .maybeSingle();

      if (!existingVariant) {
        // If targetVariantId is not found in product_variants, reset to null
        targetVariantId = null;
      }
    }

    // If targetVariantId is invalid or null, resolve using productId or variantId
    if (!targetVariantId) {
      const targetProdId = productId || variantId;
      if (targetProdId) {
        const { data: variants } = await supabaseAdmin
          .from('product_variants')
          .select('id')
          .eq('product_id', targetProdId);

        if (variants && variants.length > 0) {
          targetVariantId = variants[0].id;
        } else {
          // Insert a default variant for this product
          const { data: newVar } = await supabaseAdmin
            .from('product_variants')
            .insert({ product_id: targetProdId, stock: 10, size: null, color: null })
            .select('id')
            .single();

          if (newVar) {
            targetVariantId = newVar.id;
          }
        }
      }
    }

    if (!targetVariantId) {
      return NextResponse.json({ error: 'Unable to resolve product variant ID' }, { status: 400, headers: corsHeaders });
    }

    // Upsert cart_items
    const { error: upsertErr } = await supabaseAdmin
      .from('cart_items')
      .upsert(
        { buyer_id: buyerId, variant_id: targetVariantId, quantity },
        { onConflict: 'buyer_id,variant_id' }
      );

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, variant_id: targetVariantId }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500, headers: corsHeaders });
  }
}
