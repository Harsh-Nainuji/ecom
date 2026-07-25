import { supabase } from './supabase';

const PRODUCT_IMAGES_BUCKET = 'product-images';

export function getProductImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(imageUrl);
  return data.publicUrl;
}

export function pickPrimaryImage(product?: { product_images?: { image_url: string; sort_order?: number }[] | null } | null) {
  if (!product?.product_images?.length) return null;
  const sorted = [...product.product_images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return getProductImageUrl(sorted[0].image_url);
}

export async function uploadProductImage(productId: string, base64Image: string, fileName: string, mimeType: string) {
  const path = `${productId}/${Date.now()}_${fileName}`;
  const arrayBuffer = decodeBase64(base64Image);
  
  try {
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, arrayBuffer, { contentType: mimeType, upsert: false });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }

    const { data, error: insertError } = await supabase
      .from('product_images')
      .insert({ product_id: productId, image_url: path })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to save image record: ${insertError.message}`);
    }
    
    return data;
  } catch (err) {
    console.error('uploadProductImage error:', err);
    throw err;
  }
}

function decodeBase64(base64: string) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Uint8Array(byteNumbers);
}
