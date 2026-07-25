const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const c = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  const r = await c.from('pg_stat_user_tables').select('*', { count: 'exact', head: true });
  console.log(r.error ? 'ERR ' + r.error.message : 'OK count ' + r.count);
})();
