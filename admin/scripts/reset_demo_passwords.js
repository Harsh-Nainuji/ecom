const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load admin .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
for (const line of env.split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue;
  const [k, ...v] = line.split('=');
  if (k) process.env[k.trim()] = v.join('=').trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in admin/.env.local');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const newPasswords = {
  'buyer.demo@fabzone.dev': 'demobuyer1',
  'buyer.second@fabzone.dev': 'demobuyer2',
  'seller.demo@fabzone.dev': 'demoseller1',
  'seller.handloom@fabzone.dev': 'demoseller2',
  'delivery.demo@fabzone.dev': 'demodelivery1',
};

async function main() {
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (listErr) throw listErr;

  for (const user of list?.users || []) {
    const password = newPasswords[user.email];
    if (!password) continue;
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
    if (error) {
      console.error('FAIL', user.email, error.message);
      process.exit(1);
    }
    console.log('OK', user.email, '->', password);
  }

  console.log('\nDemo passwords updated.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
