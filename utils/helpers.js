const { v4: uuidv4 } = require('uuid');

// ═══════════════════════════════════════════════════════════════════════════════
// STANDARD WASTE CATEGORIES (Official EcoSort Six Categories)
// ═══════════════════════════════════════════════════════════════════════════════

const WASTE_CATEGORIES = [
  { id: 'plastic', name: 'Plastic Waste', emoji: '♻️' },
  { id: 'paper', name: 'Paper Waste', emoji: '📄' },
  { id: 'metal', name: 'Metal Waste', emoji: '🔩' },
  { id: 'glass', name: 'Glass Waste', emoji: '🍾' },
  { id: 'organic', name: 'Organic Waste', emoji: '🌱' },
  { id: 'ewaste', name: 'E-Waste', emoji: '⚡' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// ID GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateId(prefix) {
  const short = uuidv4().split('-')[0].toUpperCase();
  return prefix ? `${prefix}-${short}` : short;
}

// Sequential IDs: ECO-HH-001, ECO-COL-001, ECO-BUY-001
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

function generatePickupId() {
  return `PU-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

function generateOfferId() {
  return `OF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

function generateTransactionId() {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATE & TIME UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function timestamp() {
  return new Date().toISOString();
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-NG', {
    hour: '2-digit', minute: '2-digit'
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHONE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function sanitizePhone(raw) {
  return raw.replace(/\D/g, '');
}

function normalizePhone(phone) {
  let p = sanitizePhone(phone);
  if (p.startsWith('0') && p.length === 11) p = '234' + p.slice(1);
  return p;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS & ENUM UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const PICKUP_STATUSES = {
  pending: '🟡 Pending',
  assigned: '🔵 Collector Assigned',
  scheduled: '🟣 Scheduled',
  on_the_way: '🚗 On The Way',
  arrived: '🏠 Collector Arrived',
  collected: '✅ Collected',
  completed: '🎉 Completed',
  cancelled: '❌ Cancelled'
};

function pickupStatus(status) {
  return PICKUP_STATUSES[status] || status;
}

const OFFER_STATUSES = {
  pending: '⏳ Pending',
  accepted: '✅ Accepted',
  rejected: '❌ Rejected',
  countered: '🔄 Countered',
  completed: '🎉 Completed'
};

function offerStatus(status) {
  return OFFER_STATUSES[status] || status;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['8am - 10am', '10am - 12pm', '12pm - 2pm', '2pm - 4pm'];

function wasteCategoryEmoji(categoryId) {
  const cat = WASTE_CATEGORIES.find(c => c.id === categoryId);
  return cat ? `${cat.emoji} ${cat.name}` : `♻️ Unknown`;
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
  // Constants
  WASTE_CATEGORIES,
  PICKUP_STATUSES,
  OFFER_STATUSES,
  DAYS_OF_WEEK,
  TIME_SLOTS,
  
  // ID Generation
  generateId,
  generateEcoId,
  generatePickupId,
  generateOfferId,
  generateTransactionId,
  
  // Date/Time
  timestamp,
  formatDate,
  formatTime,
  
  // Phone
  sanitizePhone,
  normalizePhone,
  
  // Status & Enums
  pickupStatus,
  offerStatus,
  wasteCategoryEmoji,
  
  // Utilities
  delay,
  plural,
  updateStreak
};

