require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');
const fs = require('fs');
const path = require('path');

let currentQR = null;
let hasConnectedBefore = false;

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

const DATA_DIR = process.env.DATA_DIR || '/data/storage';
const AUTH_DIR = process.env.AUTH_DIR || '/data/auth';
const PORT = process.env.PORT || 3000;

function findChromiumPath() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_BIN,
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome'
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  try {
    const executablePath = puppeteer.executablePath();
    if (executablePath && fs.existsSync(executablePath)) return executablePath;
  } catch (_) {}

  return null;
}

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const chromiumPath = findChromiumPath();

['./assets/images', './assets/certificates', DATA_DIR, AUTH_DIR].forEach(ensureDirectory);

// ── Ensure JSON data files exist ─────────────────────────────────────────────
const dataFiles = ['users', 'collectors', 'buyers', 'pickups', 'listings', 'offers', 'transactions', 'certificates', 'notifications'];
dataFiles.forEach(name => {
  const fp = path.join(DATA_DIR, `${name}.json`);
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

// ── WhatsApp Client Setup ─────────────────────────────────────────────────────
const puppeteerOptions = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu'
  ]
};

if (chromiumPath) {
  puppeteerOptions.executablePath = chromiumPath;
} else {
  console.warn('⚠️ Chromium executable path not detected. Puppeteer will use the default browser path.');
}

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: process.env.SESSION_NAME || 'ecosort-session',
    dataPath: AUTH_DIR
  }),
  puppeteer: puppeteerOptions
});

// ── QR Code ───────────────────────────────────────────────────────────────────
client.on('qr', (qr) => {
  currentQR = qr;
  console.log('📷 QR generated and ready for scan.');
  console.log('\n📱 QR code ready! Open this URL in your browser to scan:\n');
  console.log(`   👉  http://localhost:${PORT}/qr\n`);
  console.log('(Or scan the terminal QR below if you prefer)\n');
  qrcode.generate(qr, { small: true });
  console.log('\n⏳ Waiting for scan...\n');
});

// ── Auth events ───────────────────────────────────────────────────────────────
client.on('authenticated', () => {
  currentQR = null;
  console.log('✅ WhatsApp authenticated! Session saved.');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Auth failure:', msg);
  console.log('🔄 Will retry...');
});

client.on('ready', () => {
  global.botReady = true;
  if (hasConnectedBefore) {
    console.log('\n✅ Reconnected and ready! EcoSort WhatsApp Bot is LIVE again.');
  } else {
    console.log('\n🚀 EcoSort WhatsApp Bot is LIVE and ready!');
    hasConnectedBefore = true;
  }
  console.log('📲 People can now message this number anytime.\n');
});

client.on('reconnecting', () => {
  console.log('🔄 Reconnected event detected — attempting to restore the WhatsApp session.');
});

// ── Disconnection + auto-reconnect ────────────────────────────────────────────
client.on('disconnected', (reason) => {
  global.botReady = false;
  currentQR = null;
  console.log('⚠️  Bot disconnected:', reason);

  if (reason === 'LOGOUT') {
    // LOGOUT means WhatsApp rejected or the session was explicitly ended.
    // Clear the auth folder so a fresh QR is generated on restart.
    console.log('🗑️  Clearing auth session due to LOGOUT...');
    const PORT = process.env.PORT || 3000;
    setTimeout(() => {
      try {
        fs.rmSync(process.env.AUTH_DIR || './auth', { recursive: true, force: true });
        console.log('✅ Auth cleared. Restart the bot with: node server.js');
        console.log(`📷 Then open http://localhost:${PORT}/qr to scan a new QR code`);
      } catch (e) {
        console.log('⚠️  Could not clear auth dir automatically. Delete the auth/ folder manually, then restart.');
      }
      process.exit(0);
    }, 3000);
    return;
  }

  console.log('🔄 Reconnecting in 15 seconds...');
  setTimeout(() => {
    console.log('🔄 Attempting reconnect...');
    client.initialize().catch(err => {
      console.error('❌ Reconnect failed:', err.message);
      console.log('🔄 Retrying in 30 seconds...');
      setTimeout(() => client.initialize().catch(e => {
        console.error('❌ Second reconnect failed. Restart manually: node server.js');
      }), 30000);
    });
  }, 15000);
});

// ── Message Handler ───────────────────────────────────────────────────────────
client.on('message', async (message) => {
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
});

// ── Start Client ──────────────────────────────────────────────────────────────
console.log('\n🌿 Bot starting...');
console.log(`📁 Auth directory: ${AUTH_DIR}`);
console.log(`📦 Storage directory: ${DATA_DIR}`);
if (chromiumPath) {
  console.log(`🧠 Chromium path: ${chromiumPath}`);
} else {
  console.warn('⚠️ Chromium path not found. Puppeteer will attempt its default browser path.');
}

client.initialize().catch(err => {
  console.error('❌ Failed to initialize client:', err);
  process.exit(1);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received — shutting down gracefully...');
  try { await client.destroy(); } catch (_) {}
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Stopping EcoSort bot...');
  try { await client.destroy(); } catch (_) {}
  process.exit(0);
});
