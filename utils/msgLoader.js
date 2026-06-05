/**
 * msgLoader.js
 *
 * Loads all bot messages from the Supabase bot_messages table.
 * Falls back to hardcoded messages.js if Supabase is unavailable.
 * Refreshes from Supabase every 5 minutes so dashboard edits take effect without restart.
 */
const supabase = require('./supabase');

/* In-memory cache: { 'english:welcome': 'Hello...' } */
let _cache = {};
let _lastLoad = 0;
const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

/*
 * Maps admin-dashboard key → bot key when the two differ beyond snake/camel case.
 * When caching a message stored under an admin key, we also store it under the
 * alias so the bot's msg() lookups (which use camelCase bot keys) find it.
 */
const ADMIN_TO_BOT_ALIAS = {
  hh_complete:      'registered',
  household_main:   'mainMenu',
  collector_main:   'collectorMenu',
  buyer_main:       'buyerMenu',
  available:        'availableRewards',
  submitted:        'pickupSubmitted',
  lang_changed_en:  'langChanged',
};

async function loadFromSupabase() {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from('bot_messages')
      .select('language, key, message, active')
      .eq('active', true);
    if (error) throw error;
    const next = {};
    for (const row of data ?? []) {
      const cacheKey = `${row.language}:${row.key}`;
      next[cacheKey] = row.message;
      // Store a camelCase alias so bot calls like msg('roleSelect') find
      // admin-dashboard keys saved as snake_case (e.g. 'role_select')
      const camel = row.key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (camel !== row.key) {
        next[`${row.language}:${camel}`] = row.message;
      }
      // Store explicit alias for keys whose names differ beyond casing
      const botAlias = ADMIN_TO_BOT_ALIAS[row.key];
      if (botAlias) {
        next[`${row.language}:${botAlias}`] = row.message;
      }
    }
    _cache = next;
    _lastLoad = Date.now();
    console.log(`[msgLoader] Loaded ${Object.keys(next).length} messages from Supabase`);
    return true;
  } catch (e) {
    console.warn('[msgLoader] Could not load from Supabase:', e.message);
    return false;
  }
}

/* Initial load — called once when bot starts */
async function init() {
  await loadFromSupabase();
}

/* Auto-refresh in background */
setInterval(async () => {
  if (Date.now() - _lastLoad >= REFRESH_MS) {
    await loadFromSupabase();
  }
}, REFRESH_MS);

/**
 * Get a message by key and language.
 * Language: 'en' → maps to 'english', 'pid' → maps to 'pidgin'
 * Falls back to the other language, then to a placeholder.
 *
 * @param {string} key     - message key (e.g. 'welcome', 'hh_complete')
 * @param {string} lang    - 'en' or 'pid'
 * @param {object} vars    - optional substitution variables { ecoId: 'ES12345', ... }
 */
function getMsg(key, lang, vars = {}) {
  const langFull  = lang === 'pid' ? 'pidgin' : 'english';
  const fallback  = lang === 'pid' ? 'english' : 'pidgin';
  const cacheKey  = `${langFull}:${key}`;
  const fbKey     = `${fallback}:${key}`;

  let template = _cache[cacheKey] || _cache[fbKey];

  /* If not in Supabase, msgLoader returns null and caller uses hardcoded msg() */
  if (!template) return null;

  /* Replace {{variable}} placeholders */
  return template.replace(/\{\{(\w+)\}\}/g, (_, v) => vars[v] ?? `{{${v}}}`);
}

/** How many messages are currently cached */
function cacheSize() { return Object.keys(_cache).length; }

module.exports = { init, getMsg, loadFromSupabase, cacheSize };
