const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    process.env[key] = val;
  }
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function check() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, status, created_at, seller:profiles!products_seller_id_fkey(full_name), product_images(count)')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Error fetching products:", error);
  } else {
    console.log("Products retrieved:", JSON.stringify(data, null, 2));
  }
}

check();
