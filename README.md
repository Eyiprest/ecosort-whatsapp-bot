# 🌿 EcoSort WhatsApp Bot

**Turn waste into value — a fully free, conversational WhatsApp recycling platform.**

Built for hackathon MVP validation. Supports households, collectors, and buyers through a real WhatsApp number. No Meta approval. No Twilio. 100% free.

---

## What It Does

| Role | What They Can Do |
|------|-----------------|
| **Household** | Register, request pickups, track status, earn Eco Points, take quizzes, learn recycling |
| **Collector** | Register, accept pickups, complete pickups, manage inventory, post marketplace listings |
| **Buyer/Business** | Register, browse marketplace, make offers, track transactions, get ESG certificates |

---

## Stack

- **Node.js** — runtime
- **whatsapp-web.js** — WhatsApp automation (free, no API approval needed)
- **LocalAuth** — persists session across restarts
- **Express.js** — health check endpoint (required for cloud hosting)
- **JSON files** — local storage (no database needed)
- **Railway / Render / Koyeb** — free cloud hosting

---

## Quick Start (Local)

### Step 1 — Install Node.js
Download from https://nodejs.org (LTS version)

Verify:
```bash
node -v
npm -v
```

### Step 2 — Open Project in VSCode
```bash
cd "ecosort whatsapp"
```

### Step 3 — Install Dependencies
```bash
npm install
```

> **Note:** This installs Puppeteer/Chromium (~170MB). It may take a few minutes.

### Step 4 — Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and set your admin WhatsApp number (optional).

### Step 5 — Start the Bot
```bash
node server.js
```

### Step 6 — Scan QR Code
The terminal will display a QR code like this:

```
📱 Scan the QR code below with WhatsApp...

█████████████████
█ ██ █  ██ ██ █ █
█  ██████ ██  █ █
████ ██ ████ ████
█████████████████

⏳ Waiting for scan...
```

On your phone:
```
WhatsApp → Settings → Linked Devices → Link a Device → Scan QR
```

### Step 7 — Bot is Live
Terminal shows:
```
✅ WhatsApp authenticated! Session saved.
🚀 EcoSort WhatsApp Bot is LIVE and ready!
```

Now anyone can message the number and get an instant reply.

---

## Testing the Bot

From **any phone**, message the EcoSort WhatsApp number:

```
Hi
```

The bot replies:
```
🌿 Welcome to EcoSort!

Turn your waste into value...

1️⃣ English
2️⃣ Pidgin
```

### Test Flow
| Send | Bot Does |
|------|----------|
| `Hi` | Shows welcome + language select |
| `1` | English selected → role menu |
| `1` | Household selected |
| `register` | Starts registration form |
| `menu` | Shows dashboard |
| `restart` | Resets session (for testing) |

---

## Bot Commands (Global)

| Command | Action |
|---------|--------|
| `Hi` / `Hello` / `Start` | Welcome screen |
| `restart` | Reset session to start |
| `menu` | Show current dashboard |
| `0` | Go back to menu |
| `english` | Switch to English |
| `pidgin` | Switch to Pidgin |
| `accept OFFER-ID` | Accept an offer (collector) |
| `reject OFFER-ID` | Reject an offer (collector) |

---

## Session Persistence

This bot uses **LocalAuth** from whatsapp-web.js. The WhatsApp session is saved in the `auth/` directory.

**What this means:**
- ✅ Restart the server → bot reconnects automatically (no QR scan needed)
- ✅ Deploy to cloud → session persists if `auth/` is on persistent storage
- ✅ Power cut, crash, redeploy → reconnects within seconds

**First-time setup:** You must scan the QR code **once**. After that, the session is saved.

---

## Reconnect Handling

The bot handles disconnections automatically:

```
⚠️  Bot disconnected: [reason]
🔄 Reconnecting in 10 seconds...
🔄 Attempting reconnect...
✅ WhatsApp authenticated! Session saved.
```

If the first reconnect fails, it retries after 30 seconds. The session cookie is preserved so no QR scan is needed.

---

## Folder Structure

```
ecosort-whatsapp-bot/
├── server.js              ← Main bot engine + WhatsApp client
├── package.json
├── .env                   ← Environment variables (not committed)
├── .env.example           ← Template
│
├── flows/                 ← Conversation flow modules
│   ├── onboarding.js      ← Language select + role select
│   ├── household.js       ← Household dashboard + pickup flow
│   ├── collector.js       ← Collector dashboard + pickup management
│   ├── buyer.js           ← Buyer dashboard + sourcing
│   ├── marketplace.js     ← Listings + offers + offer responses
│   ├── education.js       ← Recycling tips + quiz engine
│   ├── rewards.js         ← Points + leaderboard
│   └── certificates.js   ← ESG certificate generation
│
├── utils/                 ← Shared utilities
│   ├── storage.js         ← JSON file CRUD operations
│   ├── session.js         ← In-memory session manager
│   ├── helpers.js         ← ID generation, formatting, etc.
│   ├── messages.js        ← Bilingual message templates
│   └── validators.js      ← Input validation
│
├── data/                  ← JSON storage (auto-created)
│   ├── users.json
│   ├── collectors.json
│   ├── buyers.json
│   ├── pickups.json
│   ├── listings.json
│   ├── offers.json
│   ├── transactions.json
│   ├── certificates.json
│   └── notifications.json
│
├── auth/                  ← WhatsApp session (auto-created, gitignored)
├── assets/
│   ├── images/            ← Place product/logo images here
│   └── certificates/      ← Generated ESG certificates
│
├── scripts/
│   └── reset.js           ← Reset all data files
│
├── Procfile               ← Heroku/Railway process file
├── railway.json           ← Railway deployment config
├── render.yaml            ← Render deployment config
├── koyeb.yaml             ← Koyeb deployment config
└── nixpacks.toml          ← Railway build config (Chromium)
```

---

## Local Storage

All data is stored in `data/*.json` files. No database required.

**To view data:** Open any JSON file in VSCode.

**To reset all data** (keeps auth session):
```bash
node scripts/reset.js
```

**To reset WhatsApp session** (forces QR rescan):
```bash
rm -rf auth/
node server.js
```

---

## Deployment Guide

### OPTION A — Railway (Recommended)

Railway gives 500 free hours/month. Best for hackathon.

#### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial EcoSort WhatsApp Bot"
git remote add origin https://github.com/YOUR_USERNAME/ecosort-whatsapp-bot.git
git push -u origin main
```

#### Step 2 — Create Railway Account
Go to https://railway.app → Sign up with GitHub (free)

#### Step 3 — Deploy
1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Choose `ecosort-whatsapp-bot`
4. Railway auto-detects Node.js and deploys

#### Step 4 — Add Persistent Volume (CRITICAL for session)
In Railway project:
1. Go to your service → **Volumes**
2. Add volume:
   - **Mount path:** `/app/auth`
   - **Size:** 1 GB
3. Redeploy

#### Step 5 — Set Environment Variables
In Railway → Variables:
```
NODE_ENV=production
SESSION_NAME=ecosort-session
AUTH_DIR=/app/auth
DATA_DIR=/app/data
PORT=3000
```

#### Step 6 — First QR Scan
1. Open Railway → your service → **Logs**
2. Wait for QR code to appear in logs
3. Scan with WhatsApp on your phone
4. Log shows: `✅ WhatsApp authenticated!`
5. Bot is live 24/7

#### Step 7 — Share with Team
Share your WhatsApp number. Anyone can message it anytime — even with your laptop off.

---

### OPTION B — Render

Render free tier spins down after 15 min inactivity. Use a cron pinger to keep it alive.

#### Step 1 — Push to GitHub (same as Railway Step 1)

#### Step 2 — Create Render Account
Go to https://render.com → Sign up (free)

#### Step 3 — Create Web Service
1. New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Name:** ecosort-whatsapp-bot
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`

#### Step 4 — Add Disk (CRITICAL for session)
In your Render service → **Disks**:
- Name: `ecosort-auth`
- Mount Path: `/opt/render/project/src/auth`
- Size: 1 GB

#### Step 5 — Environment Variables
```
NODE_ENV=production
SESSION_NAME=ecosort-session
AUTH_DIR=/opt/render/project/src/auth
DATA_DIR=/opt/render/project/src/data
```

#### Step 6 — First QR Scan
Open Render → **Logs** → wait for QR → scan with WhatsApp.

#### Step 7 — Keep Alive (Render Free Tier)
Use https://cron-job.org to ping your Render URL every 10 minutes:
```
https://your-app.onrender.com/health
```
This prevents the free tier from sleeping.

---

### OPTION C — Koyeb

Koyeb has a free tier with persistent storage.

#### Step 1 — Push to GitHub (same as above)

#### Step 2 — Create Koyeb Account
Go to https://app.koyeb.com → Sign up (free)

#### Step 3 — Create Service
1. New Service → GitHub
2. Select your repo
3. Build: **Buildpack → Node.js**
4. Run command: `node server.js`
5. Port: `3000`

#### Step 4 — Persistent Storage
In Koyeb → your service → **Volumes**:
- Mount path: `/app/auth`

#### Step 5 — Environment Variables
```
NODE_ENV=production
SESSION_NAME=ecosort-session
AUTH_DIR=/app/auth
```

#### Step 6 — First QR Scan
Koyeb → **Logs** → wait for QR → scan.

---

## How to Reconnect WhatsApp

If the bot disconnects (e.g. WhatsApp Web session expired):

### Option 1 — Automatic (bot handles it)
The bot auto-reconnects in 10–30 seconds with no QR rescan needed.

### Option 2 — Manual (if session is fully expired)
1. Go to your hosting platform logs
2. Watch for the QR code
3. Scan on your phone

### Session Expiry
WhatsApp Web sessions typically last **14–30 days** before requiring a re-scan. After re-scanning, the session persists again.

### Prevent Expiry
- Keep the WhatsApp app installed on a phone that has the account logged in
- The phone doesn't need to be on — the session is maintained on the server

---

## How Teammates Can Test

1. Get the EcoSort WhatsApp number from your team
2. Open WhatsApp on your phone
3. Message the number: `Hi`
4. The bot replies immediately
5. Follow the conversation menus

**No app download. No special setup. Works like messaging a real person.**

---

## WhatsApp Business Profile Setup

For the bot to feel professional:

1. Install **WhatsApp Business** app (not regular WhatsApp)
2. Register with your dedicated SIM
3. Go to **Settings → Business Profile**
4. Set:
   - **Business Name:** EcoSort
   - **Category:** Environmental / Recycling Service
   - **Description:** Turn your waste into value. Request pickups, earn rewards, source recyclables.
   - **Profile Photo:** EcoSort logo (green branding)

Users will see "EcoSort" instead of a random number.

---

## Reset Bot Data

```bash
# Reset all conversation data (keeps WhatsApp session)
node scripts/reset.js

# Full reset (forces QR rescan)
rm -rf auth/ && node scripts/reset.js && node server.js
```

---

## Health Check Endpoints

| URL | What It Shows |
|-----|--------------|
| `GET /` | Bot status + uptime |
| `GET /health` | `{ status: "ok", ready: true/false }` |
| `GET /stats` | User/collector/buyer/pickup counts |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| QR code not appearing | Wait 60 seconds — Chromium is loading |
| Bot authenticated but not replying | Check WhatsApp number format — use full number with country code |
| Session expired | Open logs, scan new QR |
| `puppeteer` errors on deploy | Ensure `nixpacks.toml` is in repo root (Railway) |
| Bot disconnects frequently | Use persistent volume for `auth/` directory |
| Railway/Render/Koyeb crashes | Check memory — Puppeteer needs ~512MB RAM minimum |

---

## Architecture Notes

**Session Management:** In-memory sessions (per user phone number). Sessions survive bot restarts via WhatsApp's LocalAuth, but conversation state resets on restart. For production, move session state to a file or Redis.

**Offer/Accept Flow:** Collectors receive real-time WhatsApp notifications when buyers submit offers. They reply with `accept OFFER-ID` or `reject OFFER-ID` from anywhere in the chat.

**Marketplace Listings:** Published instantly (no delay). Appear in buyer marketplace immediately after collector submits.

**ESG Certificates:** Generated as text certificates from completed transactions. Chain-of-custody logged with GPS simulation. Store in `data/certificates.json`.

---

## Team Demo Script

**For judges / demo day:**

> "Message +234XXXXXXXXXX on WhatsApp and say Hi."

They instantly get:
1. Welcome screen with language selection
2. Role menu (Household / Collector / Buyer)
3. Full operational platform — pickups, marketplace, rewards, ESG certs

No download. No setup. No demo account needed. **Real WhatsApp. Real platform.**

---

## License

MIT — Open source, free to use for hackathons and pilots.

---

*Built with ❤️ for Nigeria. Every pickup makes Lagos cleaner.*
