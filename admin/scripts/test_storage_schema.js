const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'storage' },
});

async function main() {
  console.log('Testing storage schema access...\n');

  const { data: buckets, error: bucketErr } = await supabase.from('buckets').select('*').limit(5);
  console.log('buckets:', bucketErr ? `ERROR ${bucketErr.message}` : `OK ${buckets.length} rows`, buckets?.map(b => b.id));

  const { data: policies, error: policyErr } = await supabase.from('policies').select('*').limit(5);
  console.log('policies:', policyErr ? `ERROR ${policyErr.message}` : `OK ${policies.length} rows`, policies?.map(p => `${p.name} on ${p.table}`));
}

main().catch(err => { console.error(err); process.exit(1); });
