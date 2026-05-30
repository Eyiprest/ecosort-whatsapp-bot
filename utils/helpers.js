const { v4: uuidv4 } = require('uuid');

function generateId(prefix) {
  const short = uuidv4().split('-')[0].toUpperCase();
  return prefix ? `${prefix}-${short}` : short;
}

// Short sequential IDs: HH-001, COL-001, BUY-001
function generateEcoId(role) {
  const fs = require('fs');
  const path = require('path');
  const dataDir = process.env.DATA_DIR || './data';
  const fileMap = { household: 'users', collector: 'collectors', buyer: 'buyers' };
  const prefixMap = { household: 'HH', collector: 'COL', buyer: 'BUY' };
  const prefix = prefixMap[role] || 'USR';
  const file = fileMap[role] || 'users';
  try {
    const raw = fs.readFileSync(path.join(dataDir, `${file}.json`), 'utf8');
    const count = (JSON.parse(raw) || []).length + 1;
    return `ECO-${prefix}-${String(count).padStart(3, '0')}`;
  } catch {
    return `ECO-${prefix}-001`;
  }
}

function timestamp() {
  return new Date().toISOString();
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function sanitizePhone(raw) {
  return raw.replace(/\D/g, '');
}

function normalizePhone(phone) {
  let p = sanitizePhone(phone);
  if (p.startsWith('0') && p.length === 11) p = '234' + p.slice(1);
  return p;
}

function pickupStatus(status) {
  const map = {
    requested:  '🟡 Pending',
    assigned:   '🔵 Collector Assigned',
    on_the_way: '🚗 On The Way',
    completed:  '✅ Completed',
    cancelled:  '❌ Cancelled'
  };
  return map[status] || status;
}

function materialEmoji(type) {
  const map = {
    PET:      '♻️ PET Bottles',
    Aluminum: '🥫 Aluminum',
    Nylon:    '🛍️ Nylon/Plastics',
    HDPE:     '🧴 HDPE (Jerry cans)',
    Carton:   '📦 Cartons/Paper',
    Mixed:    '🗂️ Mixed Recyclables',
    Glass:    '🍾 Glass',
    Metal:    '🔩 Metal Scraps'
  };
  return map[type] || `♻️ ${type}`;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function updateStreak(user) {
  const today = new Date().toDateString();
  const lastActive = user.lastActiveDate;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  let streak = user.streak || 0;
  if (lastActive === today) return streak;
  if (lastActive === yesterday) streak += 1;
  else streak = 1;
  return streak;
}

module.exports = {
  generateId, generateEcoId, timestamp, formatDate,
  sanitizePhone, normalizePhone, pickupStatus,
  materialEmoji, delay, plural, updateStreak
};
