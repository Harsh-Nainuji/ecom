import { supabase } from './supabase';

const PRODUCT_IMAGES_BUCKET = 'product-images';

export function getProductImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return null;
  const cleanUrl = imageUrl.trim();
  if (!cleanUrl) return null;

  if (
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://') ||
    cleanUrl.startsWith('file://') ||
    cleanUrl.startsWith('content://') ||
    cleanUrl.startsWith('data:')
  ) {
    return cleanUrl;
  }

  const normalizedPath = cleanUrl.replace(/^\/+/, '');
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(normalizedPath);
  return data.publicUrl;
}

export function pickPrimaryImage(product?: any) {
  if (!product) return null;

  let images: any[] = [];
  if (Array.isArray(product.product_images)) {
    images = product.product_images;
  } else if (product.product_images && typeof product.product_images === 'object') {
    images = [product.product_images];
  } else if (Array.isArray(product.images)) {
    images = product.images;
  } else if (product.images && typeof product.images === 'object') {
    images = [product.images];
  } else if (product.image_url) {
    images = [{ image_url: product.image_url }];
  } else if (product.product_image) {
    images = Array.isArray(product.product_image) ? product.product_image : [product.product_image];
  }

  if (images.length === 0) return null;

  const sorted = [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const first = sorted[0];
  if (!first) return null;

  const rawUrl =
    typeof first === 'string'
      ? first
      : first.image_url || first.url || first.path || first.uri || null;

  if (!rawUrl) return null;

  return getProductImageUrl(rawUrl);
}

export async function uploadProductImage(productId: string, base64Image: string, fileName: string, mimeType: string) {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${productId}/${Date.now()}_${sanitizedFileName}`;
  const arrayBuffer = decodeBase64(base64Image);
  
  try {
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, arrayBuffer, { contentType: mimeType, upsert: true });

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

function decodeBase64(base64: string): Uint8Array {
  // 1. Strip data URI prefix if present (e.g. "data:image/jpeg;base64,")
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  
  // 2. Use browser/environment atob if available
  if (typeof atob === 'function') {
    try {
      const binaryString = atob(base64Data.trim());
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch {
      // Fallback manual decoding
    }
  }

  // 3. Fallback manual decoder
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i += 1) {
    lookup[chars.charCodeAt(i)] = i;
  }
  
  const cleanBase64 = base64Data.replace(/[^A-Za-z0-9+/]/g, '');
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
