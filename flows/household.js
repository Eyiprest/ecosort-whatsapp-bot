const session = require('../utils/session');
const storage = require('../utils/storage');
const { msg } = require('../utils/messages');
const { generateEcoId, generateId, timestamp, formatDate, pickupStatus, materialEmoji, updateStreak } = require('../utils/helpers');
const { isValidPhone, isValidName, isMenuChoice, getMenuChoice, isPositiveNumber } = require('../utils/validators');

const WASTE_TYPES = ['PET Bottles', 'Aluminum Cans', 'Nylon/Plastic bags', 'HDPE (Jerry cans)', 'Cartons/Paper', 'Mixed Recyclables'];
const LGAS = ['Alimosho', 'Ajeromi-Ifelodun', 'Kosofe', 'Mushin', 'Oshodi-Isolo', 'Ojo', 'Ikorodu', 'Surulere', 'Agege', 'Ifako-Ijaiye', 'Shomolu', 'Ikeja', 'Lagos Island', 'Lagos Mainland', 'Eti-Osa', 'Badagry', 'Epe', 'Ibeju-Lekki', 'Other'];

// ── REGISTRATION ──────────────────────────────────────────────────────────────
async function handleRegistration(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;

  switch (sess.step) {
    case 'reg_name': {
      if (!isValidName(body)) { await message.reply(msg('invalidName', lang)); return; }
      session.setData(phone, 'regName', body);
      session.set(phone, { step: 'reg_phone' });
      await message.reply(lang === 'pid' ? `✅ Nice name! Now enter your phone number:` : `✅ Got it! Now enter your phone number:`);
      return;
    }
    case 'reg_phone': {
      if (!isValidPhone(body)) { await message.reply(msg('invalidPhone', lang)); return; }
      session.setData(phone, 'regPhone', body);
      session.set(phone, { step: 'reg_lga' });
      const lgaList = LGAS.map((l, i) => `${i + 1}. ${l}`).join('\n');
      await message.reply(lang === 'pid'
        ? `✅ Good! Choose your LGA:\n\n${lgaList}\n\nReply with number.`
        : `✅ Now choose your LGA:\n\n${lgaList}\n\nReply with the number.`);
      return;
    }
    case 'reg_lga': {
      if (!isMenuChoice(body, LGAS.length)) { await message.reply(msg('invalidChoice', lang)); return; }
      const lga = LGAS[getMenuChoice(body) - 1];
      session.setData(phone, 'regLga', lga);
      session.set(phone, { step: 'reg_waste' });
      const wasteList = WASTE_TYPES.map((w, i) => `${i + 1}. ${w}`).join('\n');
      await message.reply(lang === 'pid'
        ? `✅ Good! What kind of waste you usually generate?\n\n${wasteList}\n\nReply with number.`
        : `✅ What type of waste do you usually generate?\n\n${wasteList}\n\nReply with number.`);
      return;
    }
    case 'reg_waste': {
      if (!isMenuChoice(body, WASTE_TYPES.length)) { await message.reply(msg('invalidChoice', lang)); return; }
      const wasteType = WASTE_TYPES[getMenuChoice(body) - 1];
      const d = sess.data;
      const ecoId = generateEcoId('household');
      const user = {
        id: ecoId,
        phone,
        name: d.regName,
        userPhone: d.regPhone,
        lga: d.regLga,
        primaryWaste: wasteType,
        lang,
        points: 0,
        badges: [],
        streak: 0,
        lastActiveDate: null,
        totalPickups: 0,
        verified: false,
        registeredAt: timestamp()
      };
      storage.insert('users', user);
      session.set(phone, { step: 'household_menu', flow: 'household', role: 'household' });
      await message.reply(msg('registered', lang, ecoId));
      await message.reply(msg('mainMenu', lang));
      return;
    }
  }
}

// ── PICKUP REQUEST ────────────────────────────────────────────────────────────
async function handlePickupRequest(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;

  switch (sess.step) {
    case 'pickup_waste': {
      const wasteList = WASTE_TYPES.map((w, i) => `${i + 1}. ${w}`).join('\n');
      if (!isMenuChoice(body, WASTE_TYPES.length)) {
        await message.reply(msg('invalidChoice', lang));
        await message.reply(lang === 'pid' ? `Wetin kind waste?\n\n${wasteList}` : `Choose waste type:\n\n${wasteList}`);
        return;
      }
      session.setData(phone, 'pickupWaste', WASTE_TYPES[getMenuChoice(body) - 1]);
      session.set(phone, { step: 'pickup_bags' });
      await message.reply(lang === 'pid' ? `📦 How many bags you wan drop? (e.g. 3):` : `📦 How many bags/bundles? (e.g. 3):`);
      return;
    }
    case 'pickup_bags': {
      if (!isPositiveNumber(body)) { await message.reply(lang === 'pid' ? '❌ Enter valid number.' : '❌ Please enter a valid number.'); return; }
      session.setData(phone, 'pickupBags', body);
      session.set(phone, { step: 'pickup_address' });
      await message.reply(lang === 'pid' ? `📍 Enter your pickup address:` : `📍 Enter your pickup address or location:`);
      return;
    }
    case 'pickup_address': {
      if (body.length < 5) { await message.reply(lang === 'pid' ? '❌ Enter proper address.' : '❌ Please enter a valid address.'); return; }
      session.setData(phone, 'pickupAddress', body);
      session.set(phone, { step: 'pickup_time' });
      await message.reply(lang === 'pid' ? `⏰ When you wan do pickup? (e.g. Tomorrow 9am, Today 4pm):` : `⏰ Preferred pickup time? (e.g. Tomorrow 9am, Today 4pm):`);
      return;
    }
    case 'pickup_time': {
      const d = sess.data;
      const user = storage.findOne('users', u => u.phone === phone);
      const pickupId = generateId('PKP');
      const collectors = storage.readAll('collectors');
      const assignedCollector = collectors.length > 0 ? collectors[Math.floor(Math.random() * collectors.length)] : null;

      const pickup = {
        id: pickupId,
        userId: user ? user.id : phone,
        userPhone: phone,
        userName: user ? user.name : 'Unknown',
        userLga: user ? user.lga : 'Unknown',
        wasteType: d.pickupWaste,
        bags: d.pickupBags,
        address: d.pickupAddress,
        preferredTime: body,
        status: 'requested',
        collectorId: assignedCollector ? assignedCollector.id : null,
        collectorName: assignedCollector ? assignedCollector.name : null,
        collectorPhone: assignedCollector ? assignedCollector.phone : null,
        createdAt: timestamp(),
        updatedAt: timestamp()
      };
      storage.insert('pickups', pickup);

      if (user) {
        const streak = updateStreak(user);
        storage.update('users', u => u.phone === phone, {
          points: (user.points || 0) + 10,
          totalPickups: (user.totalPickups || 0) + 1,
          streak,
          lastActiveDate: new Date().toDateString()
        });
      }

      if (assignedCollector) {
        try {
          await client.sendMessage(`${assignedCollector.phone}@c.us`,
            lang === 'pid'
              ? `🚛 *New Pickup Request!*\n\nPickup ID: ${pickupId}\nUser: ${user ? user.name : 'User'}\nWaste: ${d.pickupWaste}\nBags: ${d.pickupBags}\nAddress: ${d.pickupAddress}\nTime: ${body}\n\nType *2* from your dashboard to accept.`
              : `🚛 *New Pickup Request!*\n\nPickup ID: ${pickupId}\nUser: ${user ? user.name : 'User'}\nWaste: ${d.pickupWaste}\nBags: ${d.pickupBags}\nAddress: ${d.pickupAddress}\nTime: ${body}\n\nType *2* from your dashboard to accept.`
          );
        } catch (_) {}
      }

      session.set(phone, { step: 'household_menu' });
      await message.reply(msg('pickupRequested', lang, pickupId));
      return;
    }
  }
}

// ── TRACK PICKUP ──────────────────────────────────────────────────────────────
async function handleTrack(client, message, phone, sess) {
  const lang = sess.lang;
  const pickups = storage.findAll('pickups', p => p.userPhone === phone);
  if (pickups.length === 0) {
    await message.reply(msg('noPickups', lang));
    session.set(phone, { step: 'household_menu' });
    await message.reply(msg('mainMenu', lang));
    return;
  }
  const recent = pickups.slice(-3).reverse();
  const lines = recent.map(p =>
    `📦 *${p.id}*\n   Type: ${p.wasteType} | Bags: ${p.bags}\n   ${pickupStatus(p.status)}\n   ${p.collectorName ? `Collector: ${p.collectorName}` : 'Awaiting collector'}\n   📅 ${formatDate(p.createdAt)}`
  ).join('\n\n');
  await message.reply(lang === 'pid' ? `🚗 *Your Recent Pickups:*\n\n${lines}` : `🚗 *Your Recent Pickups:*\n\n${lines}`);
  session.set(phone, { step: 'household_menu' });
  await message.reply(msg('mainMenu', lang));
}

// ── REWARDS ───────────────────────────────────────────────────────────────────
async function handleRewards(client, message, phone, sess) {
  const lang = sess.lang;
  const user = storage.findOne('users', u => u.phone === phone);
  if (!user) { await message.reply(msg('notRegistered', lang)); return; }

  const allUsers = storage.readAll('users');
  const sorted = [...allUsers].sort((a, b) => (b.points || 0) - (a.points || 0));
  const rank = sorted.findIndex(u => u.phone === phone) + 1;
  const topThree = sorted.slice(0, 3).map((u, i) =>
    `${['🥇','🥈','🥉'][i]} ${u.name} — ${u.points || 0} pts`).join('\n');
  const badges = (user.badges || []).length > 0 ? user.badges.join(' ') : (lang === 'pid' ? 'None yet' : 'None yet');
  const streak = user.streak || 0;
  const streakLine = streak > 0
    ? (lang === 'pid' ? `🔥 Streak: *${streak} day${streak === 1 ? '' : 's'}* in a row!` : `🔥 Streak: *${streak} day${streak === 1 ? '' : 's'}* in a row!`)
    : '';

  await message.reply(lang === 'pid'
    ? `🏆 *Your EcoSort Rewards*\n\n⭐ Points: *${user.points || 0}*\n🏅 Rank: *#${rank}*\n${streakLine}\n🎖️ Badges: ${badges}\n\n📊 *Top Recyclers:*\n${topThree}\n\n♻️ Keep recycling to earn more!`
    : `🏆 *Your EcoSort Rewards*\n\n⭐ Points: *${user.points || 0}*\n🏅 Rank: *#${rank}*\n${streakLine}\n🎖️ Badges: ${badges}\n\n📊 *Top Recyclers:*\n${topThree}\n\n♻️ Keep recycling to climb the leaderboard!`);

  session.set(phone, { step: 'household_menu' });
  await message.reply(msg('mainMenu', lang));
}

// ── HISTORY ───────────────────────────────────────────────────────────────────
async function handleHistory(client, message, phone, sess) {
  const lang = sess.lang;
  const pickups = storage.findAll('pickups', p => p.userPhone === phone);
  if (pickups.length === 0) {
    await message.reply(lang === 'pid' ? '📭 You never do any pickup before.' : '📭 No pickup history yet.');
    session.set(phone, { step: 'household_menu' });
    await message.reply(msg('mainMenu', lang));
    return;
  }
  const lines = [...pickups].reverse().map(p =>
    `• ${p.id} | ${p.wasteType} | ${pickupStatus(p.status)} | ${formatDate(p.createdAt)}`
  ).join('\n');
  await message.reply(lang === 'pid' ? `📋 *Your Pickup History:*\n\n${lines}` : `📋 *Your Pickup History:*\n\n${lines}`);
  session.set(phone, { step: 'household_menu' });
  await message.reply(msg('mainMenu', lang));
}

// ── PROFILE ───────────────────────────────────────────────────────────────────
async function handleProfile(client, message, phone, sess) {
  const lang = sess.lang;
  const user = storage.findOne('users', u => u.phone === phone);
  if (!user) { await message.reply(msg('notRegistered', lang)); return; }
  const verifiedBadge = user.verified ? '✅ Verified' : '⏳ Unverified';
  await message.reply(lang === 'pid'
    ? `👤 *Your Profile*\n\n🆔 ID: ${user.id}\n👤 Name: ${user.name}\n📞 Phone: ${user.userPhone}\n📍 LGA: ${user.lga}\n♻️ Primary Waste: ${user.primaryWaste}\n⭐ Points: ${user.points || 0}\n📦 Total Pickups: ${user.totalPickups || 0}\n🔥 Streak: ${user.streak || 0} days\n${verifiedBadge}\n📅 Joined: ${formatDate(user.registeredAt)}`
    : `👤 *Your Profile*\n\n🆔 ID: ${user.id}\n👤 Name: ${user.name}\n📞 Phone: ${user.userPhone}\n📍 LGA: ${user.lga}\n♻️ Primary Waste: ${user.primaryWaste}\n⭐ Points: ${user.points || 0}\n📦 Total Pickups: ${user.totalPickups || 0}\n🔥 Streak: ${user.streak || 0} days\n${verifiedBadge}\n📅 Joined: ${formatDate(user.registeredAt)}`);
  session.set(phone, { step: 'household_menu' });
  await message.reply(msg('mainMenu', lang));
}

// ── CHANGE LANGUAGE ───────────────────────────────────────────────────────────
async function handleChangeLang(client, message, phone, sess) {
  const lang = sess.lang;
  session.set(phone, { step: 'change_lang' });
  await message.reply(lang === 'pid'
    ? `🌐 Change Language:\n\n1️⃣ English\n2️⃣ Pidgin\n\nReply with number.`
    : `🌐 Change Language:\n\n1️⃣ English\n2️⃣ Pidgin\n\nReply with number.`);
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
async function handle(client, message, phone, sess) {
  const body = message.body.trim().toLowerCase();
  const rawBody = message.body.trim();
  const lang = sess.lang;

  // Change language step
  if (sess.step === 'change_lang') {
    if (!isMenuChoice(rawBody, 2)) { await message.reply(msg('invalidChoice', lang)); return; }
    const newLang = getMenuChoice(rawBody) === 2 ? 'pid' : 'en';
    session.set(phone, { lang: newLang, step: 'household_menu' });
    await message.reply(msg('langChanged', newLang));
    await message.reply(msg('mainMenu', newLang));
    return;
  }

  // Registration steps
  if (['reg_name','reg_phone','reg_lga','reg_waste'].includes(sess.step)) {
    return handleRegistration(client, message, phone, sess);
  }

  // Pickup steps
  if (['pickup_waste','pickup_bags','pickup_address','pickup_time'].includes(sess.step)) {
    return handlePickupRequest(client, message, phone, sess);
  }

  // Dashboard menu
  if (sess.step === 'household_menu' && isMenuChoice(rawBody, 8)) {
    const choice = getMenuChoice(rawBody);
    switch (choice) {
      case 1: {
        session.set(phone, { step: 'pickup_waste' });
        const wasteList = WASTE_TYPES.map((w, i) => `${i + 1}. ${w}`).join('\n');
        await message.reply(lang === 'pid'
          ? `♻️ *Request Pickup*\n\nWetin kind waste you wan drop?\n\n${wasteList}\n\nReply with number.`
          : `♻️ *Request Pickup*\n\nWhat type of waste would you like picked up?\n\n${wasteList}\n\nReply with number.`);
        return;
      }
      case 2: return handleTrack(client, message, phone, sess);
      case 3: return handleRewards(client, message, phone, sess);
      case 4: {
        const { handle: eduHandle } = require('./education');
        return eduHandle(client, message, phone, sess, false);
      }
      case 5: {
        const { handle: quizHandle } = require('./education');
        return quizHandle(client, message, phone, sess, true);
      }
      case 6: return handleHistory(client, message, phone, sess);
      case 7: return handleProfile(client, message, phone, sess);
      case 8: return handleChangeLang(client, message, phone, sess);
    }
  }

  // register command
  if (body === 'register') {
    const existing = storage.findOne('users', u => u.phone === phone);
    if (existing) {
      await message.reply(msg('alreadyRegistered', lang));
      session.set(phone, { step: 'household_menu' });
      await message.reply(msg('mainMenu', lang));
      return;
    }
    session.set(phone, { step: 'reg_name' });
    await message.reply(lang === 'pid'
      ? `👤 *Registration*\n\nMake we set up your profile!\n\nWetin be your full name?`
      : `👤 *Registration*\n\nLet's set up your EcoSort profile!\n\nWhat is your full name?`);
    return;
  }

  await message.reply(msg('mainMenu', lang));
}

module.exports = { handle };
