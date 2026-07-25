const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const c = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  const { data, error } = await c.from('pg_stat_user_tables').select('relname, n_live_tup').limit(5);
  console.log('ERR:', error ? error.message : 'none');
  console.log('DATA:', JSON.stringify(data));
})();
