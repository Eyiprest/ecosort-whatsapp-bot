const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

let supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth:     { persistSession: false },
      realtime: { transport: ws },
    }
  );
  console.log('[Supabase] Client created ✅ —', process.env.SUPABASE_URL);

  /* Quick connectivity test — logs clearly if something is wrong */
  supabase.from('profiles').select('id', { count: 'exact', head: true })
    .then(({ count, error }) => {
      if (error) console.error('[Supabase] Connection test FAILED:', error.message);
      else console.log('[Supabase] Connection OK ✅ — profiles rows:', count);
    });
} else {
  console.warn('[Supabase] Keys not found in .env — running on JSON files only');
}

module.exports = supabase;
