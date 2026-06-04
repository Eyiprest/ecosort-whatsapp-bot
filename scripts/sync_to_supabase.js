/**
 * One-time script: push all existing JSON data into Supabase
 * Run once from the bot folder: node scripts/sync_to_supabase.js
 */
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env');
  process.exit(1);
}

const ws = require('ws');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

const DATA_DIR = process.env.DATA_DIR || './data';

const FILES = [
  { file: 'users',        table: 'profiles' },
  { file: 'collectors',   table: 'collectors' },
  { file: 'buyers',       table: 'buyers' },
  { file: 'pickups',      table: 'pickups' },
  { file: 'listings',     table: 'listings' },
  { file: 'offers',       table: 'offers' },
  { file: 'transactions', table: 'transactions' },
  { file: 'certificates', table: 'certificates' },
  { file: 'notifications',table: 'notifications' },
];

async function syncFile({ file, table }) {
  const fp = path.join(DATA_DIR, `${file}.json`);
  if (!fs.existsSync(fp)) { console.log(`  ⏭  ${file}.json not found, skipping`); return; }

  let items = [];
  try { items = JSON.parse(fs.readFileSync(fp, 'utf8')) || []; }
  catch { console.log(`  ⚠️  ${file}.json is empty or invalid`); return; }

  if (!items.length) { console.log(`  ⏭  ${file}.json is empty`); return; }

  const rows = items.map(item => ({
    id:        String(item.id || item.ecoId || item.collectorId || item.buyerId || ('bk-' + Date.now() + Math.random())),
    phone:     item.phone || item.userPhone || null,
    record:    item,
    synced_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error(`  ❌ ${table}: ${error.message}`);
  } else {
    console.log(`  ✅ ${table}: synced ${rows.length} record(s)`);
  }
}

(async () => {
  console.log('\n🚀 EcoSort → Supabase Backfill\n');
  for (const f of FILES) {
    process.stdout.write(`Syncing ${f.file} → ${f.table}... `);
    await syncFile(f);
  }
  console.log('\n✅ Done! Check your Supabase Table Editor.\n');
})();
