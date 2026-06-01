require('dotenv').config();
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const pino = require('pino');
const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const fs = require('fs');
const path = require('path');

let currentQR = null;

const sessionMgr = require('./utils/session');
const storage = require('./utils/storage');
const { msg } = require('./utils/messages');
const { normalizePhone } = require('./utils/helpers');

const onboarding = require('./flows/onboarding');
const household = require('./flows/household');
const collector = require('./flows/collector');
const buyer = require('./flows/buyer');
const marketplace = require('./flows/marketplace');
const education = require('./flows/education');

// ── Ensure data + auth directories exist ─────────────────────────────────────
['./data', './auth', './assets/images', './assets/certificates'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Ensure JSON data files exist ─────────────────────────────────────────────
const dataFiles = ['users', 'collectors', 'buyers', 'pickups', 'listings', 'offers', 'transactions', 'certificates', 'notifications'];
dataFiles.forEach(name => {
  const fp = path.join('./data', `${name}.json`);
  if (!fs.existsSync(fp)) fs.writeFileSync(fp, '[]', 'utf8');
});

// ── Express health check (required for Railway/Render/Koyeb) ─────────────────
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'running',
    bot: 'EcoSort WhatsApp Bot',
    version: '1.0.0',
    clientReady: global.botReady || false,
    uptime: Math.floor(process.uptime()) + 's'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', ready: global.botReady || false });
});

app.get('/stats', (req, res) => {
  res.json({
    users: storage.readAll('users').length,
    collectors: storage.readAll('collectors').length,
    buyers: storage.readAll('buyers').length,
    pickups: storage.readAll('pickups').length,
    listings: storage.readAll('listings').length,
    transactions: storage.readAll('transactions').length
  });
});

// Return the current BAILEYS_AUTH base64 for easy copy into Render env.
// Protected by ADMIN_TOKEN env var: ?token=YOUR_ADMIN_TOKEN
app.get('/auth', (req, res) => {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) return res.status(403).send('Admin token not configured');
  if (req.query.token !== adminToken) return res.status(403).send('Forbidden');
  try {
    const packed = packAuthDir(AUTH_DIR);
    return res.json({ auth: Buffer.from(JSON.stringify(packed), 'utf8').toString('base64') });
  } catch (e) {
    return res.status(500).json({ error: 'No auth data available yet' });
  }
});

// ── QR Code browser page ──────────────────────────────────────────────────────
app.get('/qr', async (req, res) => {
  if (global.botReady) {
    return res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px">
      <h2 style="color:green">✅ Bot is already connected!</h2>
      <p>EcoSort WhatsApp Bot is live and ready to receive messages.</p>
    </body></html>`);
  }
  if (!currentQR) {
    return res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px">
      <h2>⏳ QR code not ready yet</h2>
      <p>Please wait a few seconds and <a href="/qr">refresh this page</a>.</p>
      <script>setTimeout(()=>location.reload(), 4000)</script>
    </body></html>`);
  }
  try {
    const qrImageUrl = await QRCode.toDataURL(currentQR, { width: 300, margin: 2 });
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>EcoSort – Scan QR</title>
  <meta http-equiv="refresh" content="25">
  <style>
    body { font-family: sans-serif; text-align: center; padding: 40px; background: #f0f9f0; }
    h1 { color: #2d6a4f; }
    img { border: 4px solid #2d6a4f; border-radius: 12px; margin: 20px auto; display: block; }
    .hint { color: #555; font-size: 14px; max-width: 320px; margin: 0 auto; }
    .refresh { color: #888; font-size: 12px; margin-top: 16px; }
  </style>
</head>
<body>
  <h1>🌿 EcoSort WhatsApp Bot</h1>
  <p>Scan this QR code with WhatsApp to connect the bot</p>
  <img src="${qrImageUrl}" width="280" height="280" alt="WhatsApp QR Code"/>
  <p class="hint">
    On your phone:<br>
    <strong>WhatsApp → Settings → Linked Devices → Link a Device</strong><br>
    then point camera at the QR above
  </p>
  <p class="refresh">⏳ This page auto-refreshes every 25 seconds with a new QR code</p>
</body>
</html>`);
  } catch (err) {
    res.status(500).send('Error generating QR: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 EcoSort health server running on port ${PORT}`);
  console.log(`📷 Open http://localhost:${PORT}/qr in your browser to scan the QR code`);
});

// ── Baileys (WebSocket) Client Setup ──────────────────────────────────────────
// Support seeding auth from environment (process.env.BAILEYS_AUTH) which should be
// a base64-encoded JSON object representing the auth directory state for Baileys.
const AUTH_DIR = process.env.AUTH_DIR || './auth/baileys';
let authState = null;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeAuthKeyDir(baseDir, keys) {
  ensureDir(baseDir);
  for (const [name, value] of Object.entries(keys)) {
    const nextPath = path.join(baseDir, name);
    if (typeof value === 'string') {
      ensureDir(path.dirname(nextPath));
      fs.writeFileSync(nextPath, value, 'utf8');
    } else {
      writeAuthKeyDir(nextPath, value);
    }
  }
}

function writeAuthStateFromEnv(authDir, base64String) {
  const payload = JSON.parse(Buffer.from(base64String, 'base64').toString('utf8'));
  ensureDir(authDir);
  if (payload.files) {
    for (const [name, value] of Object.entries(payload.files)) {
      const nextPath = path.join(authDir, name);
      ensureDir(path.dirname(nextPath));
      fs.writeFileSync(nextPath, value, 'utf8');
    }
    return;
  }

  if (payload.creds) {
    fs.writeFileSync(path.join(authDir, 'creds.json'), JSON.stringify(payload.creds, null, 2), 'utf8');
  }
  if (payload.keys) {
    const keysDir = path.join(authDir, 'keys');
    fs.rmSync(keysDir, { recursive: true, force: true });
    writeAuthKeyDir(keysDir, payload.keys);
  }
}

function packAuthDir(authDir) {
  const result = { files: {} };
  if (!fs.existsSync(authDir)) return result;

  for (const name of fs.readdirSync(authDir)) {
    const nextPath = path.join(authDir, name);
    if (fs.statSync(nextPath).isFile()) {
      result.files[name] = fs.readFileSync(nextPath, 'utf8');
    }
  }

  const credsPath = path.join(authDir, 'creds.json');
  if (fs.existsSync(credsPath)) {
    result.creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
  }
  const keysDir = path.join(authDir, 'keys');
  function packDir(dir) {
    const output = {};
    if (!fs.existsSync(dir)) return output;
    for (const name of fs.readdirSync(dir)) {
      const nextPath = path.join(dir, name);
      if (fs.statSync(nextPath).isDirectory()) output[name] = packDir(nextPath);
      else output[name] = fs.readFileSync(nextPath, 'utf8');
    }
    return output;
  }
  result.keys = packDir(keysDir);
  return result;
}

async function ensureAuthState() {
  ensureDir(AUTH_DIR);
  const authDirContents = fs.readdirSync(AUTH_DIR).filter(name => name !== '.' && name !== '..');
  const authDirHasAuthFiles = fs.existsSync(path.join(AUTH_DIR, 'creds.json')) && fs.existsSync(path.join(AUTH_DIR, 'keys'));
  if (authDirContents.length > 0 && !authDirHasAuthFiles) {
    console.warn(`⚠️ Auth directory ${AUTH_DIR} exists but does not appear to contain valid Baileys auth state. Use a clean directory or set AUTH_DIR to a dedicated auth path.`);
  }

  if (process.env.BAILEYS_AUTH) {
    try {
      writeAuthStateFromEnv(AUTH_DIR, process.env.BAILEYS_AUTH);
      console.log('✅ Seeded Baileys auth from BAILEYS_AUTH env var');
    } catch (e) {
      console.warn('⚠️  Failed to seed BAILEYS_AUTH env var:', e.message);
    }
  }
  authState = await useMultiFileAuthState(AUTH_DIR);
}

let sock = null;
let client = null; // compatibility wrapper used by flow modules
let reconnectTimer = null;

const waLogger = pino({ level: process.env.WA_LOG_LEVEL || 'silent' });

function scheduleReconnect(delayMs = 5000) {
  if (reconnectTimer) return;
  console.log(`🔄 Reconnecting WhatsApp socket in ${Math.round(delayMs / 1000)} seconds...`);
  reconnectTimer = setTimeout(() => {
    startSock().catch(err => {
      console.error('❌ Reconnect failed:', err.message);
      reconnectTimer = null;
      scheduleReconnect(10000);
    });
  }, delayMs);
}

async function startSock() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 2204, 13] }));
  await ensureAuthState();
  sock = makeWASocket({ logger: waLogger, printQRInTerminal: false, auth: authState.state, version });

  // Expose a minimal `client` API used by existing flows (sendMessage)
  client = {
    sendMessage: async (toWithAtCUs, content) => {
      const jid = toWithAtCUs.endsWith('@c.us') ? `${toWithAtCUs.replace('@c.us','')}@s.whatsapp.net` : toWithAtCUs;
      return sock.sendMessage(jid, content);
    },
    // keep socket reference for advanced uses
    _sock: () => sock
  };

  sock.ev.on('creds.update', async () => {
    try {
      await authState.saveCreds();
    } catch (e) {}
    // Also print out a base64 copy of the auth directory state to paste into Render env
    try {
      const packed = packAuthDir(AUTH_DIR);
      console.log('\n📦 Copy and paste this value into the BAILEYS_AUTH environment variable (base64):\n');
      console.log(Buffer.from(JSON.stringify(packed), 'utf8').toString('base64'));
      console.log('\n🔐 (This string holds your bot authentication state)\n');
    } catch (e) {
      console.error('⚠️ Failed to print BAILEYS_AUTH auth state:', e.message);
    }
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      currentQR = qr;
      const PORT = process.env.PORT || 3000;
      console.log('\n📱 QR code ready! Open this URL in your browser to scan:\n');
      console.log(`   👉  http://localhost:${PORT}/qr\n`);
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      currentQR = null;
      global.botReady = true;
      console.log('\n🚀 EcoSort WhatsApp Bot is LIVE and ready!');
    }

    if (connection === 'close') {
      global.botReady = false;
      currentQR = null;
      const reason = (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output) ? lastDisconnect.error.output.statusCode : 'unknown';
      console.log('⚠️  Bot disconnected:', reason);
      // Let Baileys attempt automatic reconnects; if the disconnect was a logout
      // we clear the auth file so a fresh QR is required next start.
      const isLogout = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode === DisconnectReason.loggedOut;
      if (isLogout) {
        console.log('🗑️  Logged out. Clearing local auth state; restart to generate a new QR.');
        try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch (_) {}
      }

      scheduleReconnect(5000);
    }
  });

  // Incoming messages (compat layer)
  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;
    for (const msg of m.messages) {
      if (!msg.message) continue;
      if (msg.key && msg.key.fromMe) {
        console.log('↩️ Ignoring message sent from the bot WhatsApp account');
        continue;
      }
      if (msg.key && msg.key.remoteJid && msg.key.participant === undefined && !msg.key.fromMe) {
        const jid = msg.key.remoteJid; // e.g., 234812...@s.whatsapp.net
        // Extract textual content from various message types
        let text = '';
        const messageContent = msg.message;
        if (messageContent.conversation) text = messageContent.conversation;
        else if (messageContent.extendedTextMessage && messageContent.extendedTextMessage.text) text = messageContent.extendedTextMessage.text;
        else if (messageContent.imageMessage && messageContent.imageMessage.caption) text = messageContent.imageMessage.caption;
        else if (messageContent.videoMessage && messageContent.videoMessage.caption) text = messageContent.videoMessage.caption;

        const phone = jid.split('@')[0];
        const compatMsg = {
          from: `${phone}@c.us`,
          body: (text || '').trim(),
          fromMe: false,
          reply: async (txt) => {
            try { await client.sendMessage(`${phone}@c.us`, { text: txt }); } catch (e) { console.error('Reply failed', e.message); }
          }
        };

        // Call the existing message handling logic by emitting a synthetic event
        try { await handleIncomingMessage(compatMsg); } catch (e) { console.error('Handler error:', e); }
      }
    }
  });

}

// ── Message Handler (compat) ────────────────────────────────────────────────
async function handleIncomingMessage(message) {
  try {
    // Ignore group messages, status updates, and self-messages
    if (message.from === 'status@broadcast') return;
    if (message.from.includes('@g.us')) return;
    if (message.fromMe) return;

    const rawPhone = message.from.replace('@c.us', '');
    const phone = normalizePhone(rawPhone);
    const body = (message.body || '').trim();

    if (!body) return;

    console.log(`📩 [${new Date().toLocaleTimeString()}] ${phone}: ${body}`);

    const sess = sessionMgr.get(phone);

    // ── Global shortcuts ──────────────────────────────────────────────────────
    const lBody = body.toLowerCase();

    // Hard reset
    if (lBody === 'restart' || lBody === '/restart') {
      sessionMgr.reset(phone);
      await message.reply(`🔄 Session reset. Send *Hi* to start over.`);
      return;
    }

    // Language switch
    if (lBody === 'english' || lBody === 'en') {
      sessionMgr.set(phone, { lang: 'en' });
      await message.reply('✅ Language switched to English.');
      return;
    }
    if (lBody === 'pidgin' || lBody === 'pid') {
      sessionMgr.set(phone, { lang: 'pid' });
      await message.reply('✅ Language switched to Pidgin.');
      return;
    }

    // Offer accept/reject from anywhere (collector workflow)
    if (lBody.startsWith('accept ') || lBody.startsWith('reject ')) {
      const handled = await marketplace.handleOfferResponse(client, message, phone, sess);
      if (handled) return;
    }

    // Confirm pickup by code: `confirm CODE`
    if (lBody.startsWith('confirm ')) {
      const parts = lBody.split(' ');
      const code = (parts[1] || '').toUpperCase();
      if (!code) { await message.reply('❌ Please provide the confirmation code. Format: confirm CODE'); return; }
      const pickup = storage.findOne('pickups', p => p.confirmation && p.confirmation.code === code);
      if (!pickup) { await message.reply('❌ Confirmation code not found.'); return; }
      const now = new Date();
      const exp = new Date(pickup.confirmation.expiresAt);
      if (now > exp) { await message.reply('❌ This confirmation code has expired. Please request a new pickup.'); return; }
      // mark confirmed
      storage.update('pickups', p => p.id === pickup.id, { status: 'confirmed', updatedAt: new Date().toISOString() });
      await message.reply(`✅ Pickup ${pickup.id} confirmed. A collector will be notified.`);
      // notify collector if assigned
      if (pickup.collectorPhone) {
        try { await client.sendMessage(`${pickup.collectorPhone}@c.us`, `✅ Pickup *${pickup.id}* confirmed by user. Proceed to collect.`); } catch (_) {}
      }
      return;
    }

    const role = sess.role;
    const lang = sess.lang;

    // ── Global commands — work at ANY step ───────────────────────────────────
    if (lBody === 'menu' || lBody === '0') {
      if (role === 'collector') {
        sessionMgr.set(phone, { step: 'collector_menu' });
        await message.reply(msg('collectorMenu', lang));
      } else if (role === 'buyer') {
        sessionMgr.set(phone, { step: 'buyer_menu' });
        await message.reply(msg('buyerMenu', lang));
      } else if (role === 'household') {
        sessionMgr.set(phone, { step: 'household_menu' });
        await message.reply(msg('mainMenu', lang));
      } else {
        sessionMgr.set(phone, { step: 'role_select' });
        await message.reply(msg('roleSelect', lang));
      }
      return;
    }

    if (lBody === 'register') {
      if (role === 'household') return household.handle(client, message, phone, sess);
      if (role === 'collector') return collector.handle(client, message, phone, sess);
      if (role === 'buyer') return buyer.handle(client, message, phone, sess);
      sessionMgr.set(phone, { step: 'role_select' });
      await message.reply(msg('roleSelect', lang));
      return;
    }

    // ── START / WELCOME ───────────────────────────────────────────────────────
    const isGreeting = ['hi', 'hello', 'hey', 'start', '/start', 'helo', 'hii', 'hy', 'howdy', 'ecosort'].includes(lBody);
    if (isGreeting || sess.step === 'start' || sess.step === 'lang_select') {
      if (isGreeting && sess.step !== 'lang_select') {
        sessionMgr.reset(phone);
        await message.reply(msg('welcome', 'en'));
        sessionMgr.set(phone, { step: 'lang_select' });
        return;
      }
      return onboarding.handle(client, message, phone, sessionMgr.get(phone));
    }

    // ── ROLE SELECTION ────────────────────────────────────────────────────────
    if (sess.step === 'role_select' || sess.step === 'role_entry') {
      return onboarding.handle(client, message, phone, sess);
    }

    // ── ROUTE TO CORRECT FLOW ─────────────────────────────────────────────────
    const step = sess.step;

    // Education & quiz (accessible from household + collector)
    if (step === 'edu_topic' || step === 'quiz_answer') {
      return education.handle(client, message, phone, sess);
    }

    // Marketplace search
    if (step === 'market_search') {
      return marketplace.handle(client, message, phone, sess);
    }

    // Marketplace listing creation steps
    if (['market_list_material', 'market_list_qty', 'market_list_price', 'market_list_location', 'market_list_notes'].includes(step)) {
      return marketplace.handle(client, message, phone, sess);
    }

    // Offer flow
    if (['offer_listing_id', 'offer_price', 'offer_counter', 'save_collector_id'].includes(step)) {
      return marketplace.handle(client, message, phone, sess);
    }

    // Household flow
    if (role === 'household') {
      return household.handle(client, message, phone, sess);
    }

    // Collector flow
    if (role === 'collector') {
      return collector.handle(client, message, phone, sess);
    }

    // Buyer flow
    if (role === 'buyer') {
      return buyer.handle(client, message, phone, sess);
    }

    // ── Fallback: no role yet, run onboarding ─────────────────────────────────
    if (!role) {
      return onboarding.handle(client, message, phone, sess);
    }

    // ── Default: show appropriate menu ────────────────────────────────────────
    const menuKey = role === 'collector' ? 'collectorMenu' : role === 'buyer' ? 'buyerMenu' : 'mainMenu';
    await message.reply(msg(menuKey, sess.lang));

  } catch (err) {
    console.error('❌ Message handler error:', err);
    try {
      await message.reply(`⚠️ Sorry, something went wrong. Please type *Hi* to restart.`);
    } catch (_) {}
  }
}

// ── Start Client ──────────────────────────────────────────────────────────────
console.log('\n🌿 Starting EcoSort WhatsApp Bot...');
console.log('🔐 Auth directory:', AUTH_DIR);
console.log('📦 Data directory:', process.env.DATA_DIR || './data');

startSock().catch(err => {
  console.error('❌ Failed to start Baileys socket:', err);
  scheduleReconnect(10000);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received — shutting down gracefully...');
  try { if (sock && sock.end) await sock.end(); } catch (_) {}
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Stopping EcoSort bot...');
  try { if (sock && sock.end) await sock.end(); } catch (_) {}
  process.exit(0);
});

// Export for testing harnesses
module.exports = { startSock, handleIncomingMessage };
