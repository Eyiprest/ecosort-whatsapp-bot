/**
 * Session Management - Refactored for Resumability
 * 
 * Key Features:
 * - In-memory session store (fast, since Render restarts are infrequent)
 * - Persistent user state stored in JSON files
 * - Auto-save after each interaction
 * - Full flow recovery on reconnect
 * - No session timeout
 */

const fs = require('fs');
const path = require('path');

const sessions = {};
const DATA_DIR = process.env.DATA_DIR || './data';

// Ensure sessions directory exists
const SESSIONS_DIR = path.join(DATA_DIR, '_sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════════════

function getSessionFile(phone) {
  return path.join(SESSIONS_DIR, `${phone}.json`);
}

function loadSessionFromDisk(phone) {
  const fp = getSessionFile(phone);
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSessionToDisk(phone, session) {
  const fp = getSessionFile(phone);
  try {
    fs.writeFileSync(fp, JSON.stringify(session, null, 2), 'utf8');
  } catch (e) {
    console.error(`Failed to save session for ${phone}:`, e.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// IN-MEMORY SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get or create session
 * First tries in-memory, then checks disk, then creates new
 */
function get(phone) {
  // Check in-memory first
  if (sessions[phone]) {
    return sessions[phone];
  }

  // Try to load from disk
  const saved = loadSessionFromDisk(phone);
  if (saved) {
    sessions[phone] = saved;
    return saved;
  }

  // Create new session
  const newSession = {
    phone,
    step: 'start',
    flow: null,
    role: null,
    lang: 'en',
    data: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  sessions[phone] = newSession;
  saveSessionToDisk(phone, newSession);
  return newSession;
}

/**
 * Update session and persist
 */
function set(phone, updates) {
  const session = get(phone);
  Object.assign(session, updates, {
    updatedAt: new Date().toISOString()
  });
  saveSessionToDisk(phone, session);
  return session;
}

/**
 * Reset session (keep language preference)
 */
function reset(phone) {
  const current = get(phone);
  const lang = current ? current.lang : 'en';
  
  const newSession = {
    phone,
    step: 'start',
    flow: null,
    role: null,
    lang,
    data: {},
    createdAt: current?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    previousSteps: current?.previousSteps || [] // Keep history for reference
  };

  sessions[phone] = newSession;
  saveSessionToDisk(phone, newSession);
  return newSession;
}

/**
 * Set nested data
 */
function setData(phone, key, value) {
  const session = get(phone);
  session.data[key] = value;
  session.updatedAt = new Date().toISOString();
  saveSessionToDisk(phone, session);
  return session;
}

/**
 * Get nested data
 */
function getData(phone, key) {
  const session = get(phone);
  return session.data ? session.data[key] : undefined;
}

/**
 * Set step (for flow navigation)
 */
function setStep(phone, step) {
  const session = get(phone);
  const prevStep = session.step;
  
  // Keep history of steps for recovery
  if (!session.previousSteps) session.previousSteps = [];
  session.previousSteps.push({
    step: prevStep,
    timestamp: session.updatedAt
  });
  
  session.step = step;
  session.updatedAt = new Date().toISOString();
  saveSessionToDisk(phone, session);
  return session;
}

/**
 * Get current step
 */
function getStep(phone) {
  const session = get(phone);
  return session.step;
}

/**
 * Go back to previous step
 */
function goBack(phone) {
  const session = get(phone);
  if (!session.previousSteps || session.previousSteps.length === 0) {
    setStep(phone, 'start');
    return get(phone);
  }
  
  const prevRecord = session.previousSteps.pop();
  setStep(phone, prevRecord.step);
  return get(phone);
}

/**
 * Set role and role-specific data
 */
function setRole(phone, role) {
  const session = set(phone, {
    role,
    flow: role // flow = role for now
  });
  return session;
}

/**
 * Get role
 */
function getRole(phone) {
  const session = get(phone);
  return session.role;
}

/**
 * Check if registered (has a role)
 */
function isRegistered(phone) {
  const session = get(phone);
  return !!session.role;
}

/**
 * Get session summary for debugging
 */
function getSummary(phone) {
  const session = get(phone);
  return {
    phone,
    role: session.role,
    step: session.step,
    flow: session.flow,
    lang: session.lang,
    dataKeys: Object.keys(session.data || {}),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}

/**
 * Clean up old sessions (optional maintenance)
 * Removes sessions not accessed in 30 days
 */
function cleanupOldSessions(daysOld = 30) {
  try {
    const files = fs.readdirSync(SESSIONS_DIR);
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

    files.forEach(file => {
      const fp = path.join(SESSIONS_DIR, file);
      const stat = fs.statSync(fp);
      if (stat.mtimeMs < cutoffTime) {
        fs.unlinkSync(fp);
      }
    });
  } catch (e) {
    console.error('Session cleanup error:', e.message);
  }
}

module.exports = {
  get,
  set,
  reset,
  setData,
  getData,
  setStep,
  getStep,
  goBack,
  setRole,
  getRole,
  isRegistered,
  getSummary,
  cleanupOldSessions
};
