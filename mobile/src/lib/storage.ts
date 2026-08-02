import { supabase } from './supabase';

const PRODUCT_IMAGES_BUCKET = 'product-images';

export function getProductImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return null;
  if (
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://') ||
    imageUrl.startsWith('file://') ||
    imageUrl.startsWith('content://')
  ) {
    return imageUrl;
  }

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
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i += 1) {
    lookup[chars.charCodeAt(i)] = i;
  }
  
  const cleanBase64 = base64.replace(/=/g, '');
  const len = cleanBase64.length;
  const bufferLength = Math.floor(len * 0.75);
  const bytes = new Uint8Array(bufferLength);
  
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = lookup[cleanBase64.charCodeAt(i) || 0];
    const encoded2 = lookup[cleanBase64.charCodeAt(i + 1) || 0];
    const encoded3 = lookup[cleanBase64.charCodeAt(i + 2) || 0];
    const encoded4 = lookup[cleanBase64.charCodeAt(i + 3) || 0];
    
    bytes[p] = (encoded1 << 2) | (encoded2 >> 4);
    p += 1;
    if (p < bufferLength) {
      bytes[p] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      p += 1;
    }
    if (p < bufferLength) {
      bytes[p] = ((encoded3 & 3) << 6) | (encoded4 & 63);
      p += 1;
    }
  }
  return bytes;
}
