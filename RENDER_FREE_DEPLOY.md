# Deploy EcoSort WhatsApp Bot on Render Free

Render Free can sleep after inactivity. This is okay for testing, but the WhatsApp bot may disconnect while sleeping. The `BAILEYS_AUTH` variable helps it reconnect without scanning a QR code every time.

## 1. Push This Project to GitHub

1. Create a GitHub account if you do not have one.
2. Create a new GitHub repository.
3. Push this project to that repository.

## 2. Create the Render Web Service

1. Go to https://render.com.
2. Sign up or log in.
3. Click **New +**.
4. Click **Web Service**.
5. Connect your GitHub account.
6. Select your EcoSort repository.
7. Fill the form:
   - **Name:** `ecosort-whatsapp-bot`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

## 3. Add Environment Variables

In Render, open the service, then go to **Environment** and add:

```env
NODE_ENV=production
AUTH_DIR=./auth/baileys
DATA_DIR=./data
BOT_NAME=EcoSort
ADMIN_NUMBER=2348012345678
ADMIN_TOKEN=choose-a-secret-password
BAILEYS_AUTH=
```

Replace `ADMIN_NUMBER` with your real WhatsApp number, including country code and no plus sign.

Leave `BAILEYS_AUTH` empty for the first deploy.

## 4. Deploy

1. Click **Create Web Service**.
2. Wait for the deploy to finish.
3. Open the Render service URL.
4. Open `/qr` on that URL, for example:

```text
https://your-service-name.onrender.com/qr
```

5. Scan the QR code using WhatsApp:
   - WhatsApp
   - Settings
   - Linked Devices
   - Link a Device

## 5. Save BAILEYS_AUTH

After scanning, open the Render logs. The bot prints a long base64 value for `BAILEYS_AUTH`.

Copy that value, then:

1. Go to Render service **Environment**.
2. Paste the value into `BAILEYS_AUTH`.
3. Save changes.
4. Render will redeploy.

After this, the bot should reconnect after restarts without needing another QR scan.

## 6. Test

Send a WhatsApp message to the connected bot number:

```text
Hi
```

Also check:

```text
https://your-service-name.onrender.com/health
```

## Important Free Plan Notes

- Render Free may sleep after inactivity.
- Local JSON data in `data/` can reset during redeploys because Free has no persistent disk.
- For a demo or school project, this is fine.
- For a serious always-on production bot, use a VM with persistent storage later.
