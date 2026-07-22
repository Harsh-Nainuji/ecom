const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
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

if (!url || !key) {
  console.error("Missing URL or Key in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false }
});

async function testQueries() {
  const queries = [
    {
      name: "orders select",
      fn: () => supabase.from('orders').select('total_amount')
    },
    {
      name: "profiles count (buyer)",
      fn: () => supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'buyer')
    },
    {
      name: "seller_profiles count pending",
      fn: () => supabase.from('seller_profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    },
    {
      name: "recent orders join profiles and order_items",
      fn: () => supabase
        .from('orders')
        .select('id, total_amount, order_status, placed_at, shipping_address, profiles!orders_buyer_id_fkey(full_name), order_items(count)')
        .limit(8)
    },
    {
      name: "seller_profiles list",
      fn: () => supabase
        .from('seller_profiles')
        .select('id, business_name, status, created_at')
        .limit(5)
    },
    {
      name: "product_variants low stock with products join",
      fn: () => supabase
        .from('product_variants')
        .select('id, stock, products!inner(name, seller_id), size, color')
        .lte('stock', 5)
        .gt('stock', 0)
        .limit(10)
    },
    {
      name: "profiles count and role group",
      fn: () => supabase.from('profiles').select('role', { count: 'exact' })
    },
    {
      name: "listSellers action query",
      fn: () => supabase
        .from('profiles')
        .select(
          'id, full_name, phone, is_blocked, created_at, seller_profiles:seller_profiles!seller_profiles_id_fkey(business_name, mobile, email, gst_number, status, rejected_reason), products:products!products_seller_id_fkey(count)',
        )
        .eq('role', 'seller')
    }
  ];

  for (const q of queries) {
    console.log(`Running: ${q.name}...`);
    try {
      const { data, error } = await q.fn();
      if (error) {
        console.error(`❌ Failed: ${q.name}`);
        console.error(error.message);
      } else {
        console.log(`✅ Success: ${q.name}`);
      }
    } catch (err) {
      console.error(`❌ Threw exception: ${q.name}`, err);
    }
    console.log("-----------------------------------------");
  }
}

testQueries();
