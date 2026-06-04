const fs = require('fs');
const path = require('path');
const supabase = require('./supabase');

const DATA_DIR = process.env.DATA_DIR || './data';

const TABLE_MAP = {
  users:         'profiles',
  collectors:    'collectors',
  buyers:        'buyers',
  pickups:       'pickups',
  listings:      'listings',
  offers:        'offers',
  transactions:  'transactions',
  certificates:  'certificates',
  notifications: 'notifications',
};

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readAll(name) {
  try {
    const raw = fs.readFileSync(filePath(name), 'utf8');
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function writeAll(name, data) {
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2), 'utf8');
}

function findOne(name, predicate) {
  return readAll(name).find(predicate) || null;
}

function findAll(name, predicate) {
  const items = readAll(name);
  return predicate ? items.filter(predicate) : items;
}

function syncToSupabase(table, item, operation) {
  if (!supabase || !TABLE_MAP[table]) return;
  const t = TABLE_MAP[table];
  const row = {
    id: String(item.id || item.ecoId || item.collectorId || item.buyerId || ('rec-' + Date.now())),
    phone: item.phone || item.userPhone || null,
    record: item,
    synced_at: new Date().toISOString(),
  };
  if (operation === 'insert') {
    supabase.from(t).upsert(row).then(() => {}).catch(e => console.error('[Supabase]', t, e.message));
  } else if (operation === 'update') {
    supabase.from(t).update({ record: item, synced_at: new Date().toISOString() })
      .eq('id', row.id).then(() => {}).catch(e => console.error('[Supabase]', t, e.message));
  }
}

function insert(name, item) {
  const items = readAll(name);
  items.push(item);
  writeAll(name, items);
  syncToSupabase(name, item, 'insert');
  return item;
}

function update(name, predicate, changes) {
  const items = readAll(name);
  let updated = null;
  const next = items.map(item => {
    if (predicate(item)) {
      updated = Object.assign({}, item, changes);
      return updated;
    }
    return item;
  });
  writeAll(name, next);
  if (updated) syncToSupabase(name, updated, 'update');
  return updated;
}

function remove(name, predicate) {
  const items = readAll(name);
  const next = items.filter(item => !predicate(item));
  writeAll(name, next);
}

module.exports = { readAll, writeAll, findOne, findAll, insert, update, remove };
