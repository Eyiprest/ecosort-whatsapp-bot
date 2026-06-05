const session = require('../utils/session');
const storage = require('../utils/storage');
const { msg } = require('../utils/messages');
const { generateEcoId, generateId, timestamp, formatDate, pickupStatus, materialEmoji, updateStreak } = require('../utils/helpers');
const crypto = require('crypto');
const { isValidPhone, isValidName, isMenuChoice, getMenuChoice, isPositiveNumber } = require('../utils/validators');

const WASTE_TYPES = ['Plastic Waste', 'Paper Waste', 'Metal Waste', 'Glass Waste', 'Organic Waste', 'E-Waste', 'Mixed Waste'];
// LGAs currently active on EcoSort (matches mobile app)
const ECOSORT_LGAS = ['Agege', 'Alimosho', 'Bariga', 'Ikeja', 'Lagos Island', 'Mushin / Yaba', 'Surulere'];

// All known Lagos LGAs and major areas — used to validate user-typed entries
const ALL_LAGOS_AREAS = [
  'agege', 'ajeromi', 'alimosho', 'amuwo', 'apapa', 'badagry', 'epe',
  'eti-osa', 'eti osa', 'ibeju', 'lekki', 'ifako', 'ijaiye', 'ikeja',
  'ikorodu', 'kosofe', 'lagos island', 'lagos mainland', 'lagos', 'mushin',
  'ojo', 'oshodi', 'isolo', 'shomolu', 'somolu', 'surulere', 'bariga', 'yaba',
  'victoria island', 'ajah', 'festac', 'gbagada', 'ketu', 'ojota', 'ojodu',
  'berger', 'magodo', 'maryland', 'ikoyi', 'onikan', 'ojokoro', 'onigbongbo',
  'iganmu', 'orile', 'coker', 'ipaja', 'ayobo', 'egbe', 'idimu', 'imota',
  'ikosi', 'isheri', 'agboyi', 'mile 2', 'mile 12', 'ifelodun', 'ijede',
  'igbogbo', 'ogijo', 'ibeju', 'iganmu', 'apapa-iganmu'
];

function isValidLagosArea(input) {
  const lower = input.toLowerCase().trim();
  return ALL_LAGOS_AREAS.some(area => lower.includes(area));
}

function buildPickupSummary(data) {
  return `Waste Type: ${data.pickupWaste}
Quantity: ${data.pickupQuantity}kg
Address: ${data.pickupAddress}`;
}

function getUserAddress(user) {
  return user && user.address ? user.address : null;
}

// ── REGISTRATION ──────────────────────────────────────────────────────────────
async function handleRegistration(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;

  switch (sess.step) {
    case 'reg_name': {
      if (!isValidName(body)) { await message.reply(msg('invalidName', lang)); return; }
      session.setData(phone, 'regName', body);
      session.set(phone, { step: 'reg_lga' });
      const lgaList = ECOSORT_LGAS.map((l, i) => `${i + 1}. ${l}`).join('\n');
      await message.reply(lang === 'pid'
        ? `✅ Thanks, ${body}!\n\n📍 *Choose Your LGA (Lagos)*\n\n${lgaList}\n${ECOSORT_LGAS.length + 1}. My LGA is not listed — I'll type it\n\nReply with number.`
        : `✅ Thanks, ${body}!\n\n📍 *Select Your Local Government Area (Lagos)*\n\n${lgaList}\n${ECOSORT_LGAS.length + 1}. My LGA is not listed — I'll type it\n\nReply with number.`);
      return;
    }
    case 'reg_lga': {
      const maxLga = ECOSORT_LGAS.length + 1;
      if (!isMenuChoice(body, maxLga)) { await message.reply(msg('invalidChoice', lang)); return; }
      const lgaChoice = getMenuChoice(body);
      if (lgaChoice === maxLga) {
        session.set(phone, { step: 'reg_lga_custom' });
        await message.reply(lang === 'pid'
          ? `📍 Type your Local Government Area name:\n\n_Or reply *0* to go back to the list._`
          : `📍 Type your Local Government Area name:\n\n_Or reply *0* to go back to the list._`);
        return;
      }
      session.setData(phone, 'regLga', ECOSORT_LGAS[lgaChoice - 1]);
      session.set(phone, { step: 'reg_address' });
      await message.reply(lang === 'pid'
        ? `✅ Enter your full residential address:`
        : `✅ Enter your full residential address:`);
      return;
    }
    case 'reg_lga_custom': {
      if (body === '0') {
        session.set(phone, { step: 'reg_lga' });
        const lgaList = ECOSORT_LGAS.map((l, i) => `${i + 1}. ${l}`).join('\n');
        await message.reply(lang === 'pid'
          ? `📍 *Choose Your LGA (Lagos)*\n\n${lgaList}\n${ECOSORT_LGAS.length + 1}. My LGA is not listed — I'll type it\n\nReply with number.`
          : `📍 *Select Your Local Government Area (Lagos)*\n\n${lgaList}\n${ECOSORT_LGAS.length + 1}. My LGA is not listed — I'll type it\n\nReply with number.`);
        return;
      }
      if (body.length < 3) { await message.reply(msg('retry', lang)); return; }
      if (!isValidLagosArea(body)) {
        await message.reply(lang === 'pid'
          ? `❌ *"${body}"* no look like any Lagos LGA.\n\nPlease enter a valid Lagos Local Government Area (e.g. Ikorodu, Apapa, Eti-Osa).\n\n_Or reply *0* to go back to the list._`
          : `❌ *"${body}"* doesn't appear to be a Lagos Local Government Area.\n\nPlease enter a valid Lagos LGA name (e.g. Ikorodu, Apapa, Eti-Osa).\n\n_Or reply *0* to go back to the list._`);
        return;
      }
      session.setData(phone, 'regLgaCustom', body);
      session.set(phone, { step: 'reg_lga_waitlist' });
      await message.reply(lang === 'pid'
        ? `📍 *${body}* no dey cover by EcoSort yet.\n\nWe dey expand fast! Join our waitlist and we go notify you when we reach *${body}*.\n\n1️⃣ Yes, add me to the waitlist\n2️⃣ Choose a different LGA\n3️⃣ Go back to start\n\nReply with number.`
        : `📍 *${body}* is not yet covered by EcoSort.\n\nWe're expanding rapidly! Join our waitlist and we'll notify you as soon as EcoSort arrives in *${body}*.\n\n1️⃣ Yes, add me to the waitlist\n2️⃣ Choose a different LGA instead\n3️⃣ Go back to the start\n\nReply with number.`);
      return;
    }
    case 'reg_lga_waitlist': {
      if (!isMenuChoice(body, 3)) { await message.reply(msg('invalidChoice', lang)); return; }
      const wChoice = getMenuChoice(body);
      if (wChoice === 3) {
        session.set(phone, { step: 'start' });
        await message.reply(lang === 'pid'
          ? `Okay! Type *hi* or *hello* to start anytime. ♻️`
          : `No problem! Type *hi* or *hello* to start over anytime. ♻️`);
        return;
      }
      if (wChoice === 2) {
        session.set(phone, { step: 'reg_lga' });
        const lgaList = ECOSORT_LGAS.map((l, i) => `${i + 1}. ${l}`).join('\n');
        await message.reply(lang === 'pid'
          ? `📍 *Choose Your LGA (Lagos)*\n\n${lgaList}\n${ECOSORT_LGAS.length + 1}. My LGA is not listed — I'll type it\n\nReply with number.`
          : `📍 *Select Your Local Government Area (Lagos)*\n\n${lgaList}\n${ECOSORT_LGAS.length + 1}. My LGA is not listed — I'll type it\n\nReply with number.`);
        return;
      }
      // wChoice === 1: join waitlist
      const lgaName = sess.data.regLgaCustom || 'your area';
      try {
        storage.insert('waitlist', {
          phone,
          name: sess.data.regName || 'Unknown',
          lga: lgaName,
          joinedAt: timestamp()
        });
      } catch (_) {}
      session.set(phone, { step: 'start' });
      await message.reply(lang === 'pid'
        ? `✅ *You don join our waitlist!*\n\nWe go send you message as soon as EcoSort reach *${lgaName}*. Thank you for your patience! ♻️\n\n_Type *hi* or *hello* anytime to check again._`
        : `✅ *You're on the waitlist!*\n\nWe'll notify you as soon as EcoSort expands to *${lgaName}*. Thank you for your interest! ♻️\n\n_Type *hi* or *hello* anytime to check back._`);
      return;
    }
    case 'reg_address': {
      if (body.length < 5) { await message.reply(msg('retry', lang)); return; }
      const d = sess.data;
      const ecoId = generateEcoId('household');
      const user = {
        id: ecoId,
        phone,
        name: d.regName,
        state: 'Lagos',
        lga: d.regLga,
        address: body,
        lang,
        points: 0,
        monthlyPoints: 0,
        lifetimePoints: 0,
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
  const user = storage.findOne('users', u => u.phone === phone);

  switch (sess.step) {
    case 'pickup_waste': {
      const wasteList = WASTE_TYPES.map((w, i) => `${i + 1}. ${w}`).join('\n');
      if (!isMenuChoice(body, WASTE_TYPES.length)) {
        await message.reply(msg('invalidChoice', lang));
        await message.reply(lang === 'pid'
          ? `♻️ Wetin kind waste you wan drop?\n\n${wasteList}`
          : `♻️ Which waste type should we pick up?\n\n${wasteList}`);
        return;
      }
      session.setData(phone, 'pickupWaste', WASTE_TYPES[getMenuChoice(body) - 1]);
      session.set(phone, { step: 'pickup_quantity' });
      await message.reply(msg('requestPickup.quantityPrompt', lang));
      return;
    }
    case 'pickup_quantity': {
      if (!isPositiveNumber(body)) { await message.reply(msg('errors.invalidQuantity', lang)); return; }
      session.setData(phone, 'pickupQuantity', parseFloat(body));
      if (user && user.address) {
        session.set(phone, { step: 'pickup_address_choice' });
        await message.reply(msg('requestPickup.addressConfirm', lang));
      } else {
        session.set(phone, { step: 'pickup_address_new' });
        await message.reply(lang === 'pid'
          ? `📍 Enter your pickup address now:`
          : `📍 Enter your pickup address now:`);
      }
      return;
    }
    case 'pickup_address_choice': {
      if (!isMenuChoice(body, 2)) { await message.reply(msg('invalidChoice', lang)); return; }
      if (getMenuChoice(body) === 1) {
        session.setData(phone, 'pickupAddress', user.address);
        session.set(phone, { step: 'pickup_review' });
        const summary = buildPickupSummary({ ...sess.data, pickupAddress: user.address });
        await message.reply(msg('requestPickup.reviewRequest', lang, summary));
      } else {
        session.set(phone, { step: 'pickup_address_new' });
        await message.reply(lang === 'pid'
          ? `📍 Enter your full pickup address:`
          : `📍 Enter your full pickup address:`);
      }
      return;
    }
    case 'pickup_address_new': {
      if (body.length < 5) { await message.reply(msg('retry', lang)); return; }
      session.setData(phone, 'pickupAddress', body);
      session.set(phone, { step: 'pickup_review' });
      const summary = buildPickupSummary({ ...sess.data, pickupAddress: body });
      await message.reply(msg('requestPickup.reviewRequest', lang, summary));
      return;
    }
    case 'pickup_review': {
      if (!isMenuChoice(body, 3)) { await message.reply(msg('invalidChoice', lang)); return; }
      const choice = getMenuChoice(body);
      if (choice === 2) {
        session.set(phone, { step: 'pickup_waste' });
        const wasteList = WASTE_TYPES.map((w, i) => `${i + 1}. ${w}`).join('\n');
        await message.reply(lang === 'pid'
          ? `♻️ Choose waste type again:\n\n${wasteList}`
          : `♻️ Choose waste type again:\n\n${wasteList}`);
        return;
      }
      if (choice === 3) {
        session.set(phone, { step: 'household_menu' });
        await message.reply(lang === 'pid' ? '❌ Pickup request cancelled. Type *menu* to continue.' : '❌ Pickup request cancelled. Type *menu* to continue.');
        return;
      }

      const pickupId = generateId('PU');
      const collectors = storage.readAll('collectors');
      const assignedCollector = collectors.length > 0 ? collectors[Math.floor(Math.random() * collectors.length)] : null;
      const pickup = {
        id: pickupId,
        userId: user ? user.id : phone,
        userPhone: phone,
        userName: user ? user.name : 'Household User',
        userLga: user ? user.lga : 'Unknown',
        wasteType: sess.data.pickupWaste,
        quantityKg: sess.data.pickupQuantity,
        address: sess.data.pickupAddress,
        status: 'requested',
        collectorId: assignedCollector ? assignedCollector.id : null,
        collectorName: assignedCollector ? assignedCollector.name : null,
        collectorPhone: assignedCollector ? assignedCollector.phone : null,
        createdAt: timestamp(),
        updatedAt: timestamp()
      };
      try {
        const code = crypto.randomBytes(3).toString('hex').toUpperCase();
        const expiresAt = new Date(Date.now() + (4 * 60 * 60 * 1000)).toISOString();
        pickup.confirmation = { code, expiresAt };
      } catch (_) {}
      storage.insert('pickups', pickup);

      if (user) {
        const update = {
          points: (user.points || 0) + 15,
          lifetimePoints: (user.lifetimePoints || 0) + 15,
          monthlyPoints: (user.monthlyPoints || 0) + 15,
          totalPickups: (user.totalPickups || 0) + 1,
          lastActiveDate: new Date().toDateString()
        };
        update.streak = updateStreak(user);
        storage.update('users', u => u.phone === phone, update);
      }

      // Notify ALL registered collectors so demo works without a backend
      const allCollectors = storage.readAll('collectors');
      const pickupNotice =
        `🚛 *New Pickup Request!*\n\n` +
        `Pickup ID: *${pickupId}*\n` +
        `♻️ ${pickup.wasteType}  |  ⚖️ ${pickup.quantityKg}kg\n` +
        `📍 ${pickup.address}\n\n` +
        `Go to *Available Pickups* from your menu to accept.`;
      for (const col of allCollectors) {
        try { await client.sendMessage(`${col.phone}@c.us`, pickupNotice); } catch (_) {}
      }

      if (pickup.confirmation) {
        await message.reply(`🔐 Confirmation code: *${pickup.confirmation.code}*\nKeep it safe for the pickup.`);
      }
      session.set(phone, { step: 'household_menu' });
      await message.reply(msg('requestPickup.pickupSubmitted', lang, pickupId));
      return;
    }
  }
}

// ── TRACK PICKUP ──────────────────────────────────────────────────────────────
async function handleTrack(client, message, phone, sess) {
  const lang = sess.lang;
  const pickups = storage.findAll('pickups', p => p.userPhone === phone);
  if (pickups.length === 0) {
    await message.reply(msg('trackPickups.noPickups', lang));
    session.set(phone, { step: 'household_menu' });
    await message.reply(msg('mainMenu', lang));
    return;
  }

  const lines = pickups.slice(-5).reverse().map(p =>
    `*${p.id}* | ${p.wasteType} | ${pickupStatus(p.status)} | ${p.quantityKg || p.bags || '–'}kg`
  ).join('\n\n');

  await message.reply(msg('trackPickups.pickupList', lang, lines));
  session.set(phone, { step: 'track_select' });
}

async function handleTrackSelection(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;

  if (body === '1') {
    session.set(phone, { step: 'pickup_waste' });
    const wasteList = WASTE_TYPES.map((w, i) => `${i + 1}. ${w}`).join('\n');
    await message.reply(lang === 'pid'
      ? `♻️ *Request Pickup*\n\nWetin kind waste you wan drop?\n\n${wasteList}`
      : `♻️ *Request Pickup*\n\nWhich waste type should we pick up?\n\n${wasteList}`);
    return;
  }

  if (body === '2') {
    session.set(phone, { step: 'household_menu' });
    await message.reply(msg('mainMenu', lang));
    return;
  }

  const pickup = storage.findOne('pickups', p => p.id.toUpperCase() === body.toUpperCase() && p.userPhone === phone);
  if (!pickup) {
    await message.reply(msg('invalidChoice', lang));
    return handleTrack(client, message, phone, sess);
  }

  session.setData(phone, 'trackPickupId', pickup.id);
  session.set(phone, { step: 'track_detail_choice' });
  const details = `ID: ${pickup.id}\nStatus: ${pickupStatus(pickup.status)}\nType: ${pickup.wasteType}\nQuantity: ${pickup.quantityKg || pickup.bags || '–'}kg\nAddress: ${pickup.address}\nPreferred: ${pickup.preferredDay || pickup.preferredTime || 'Not set'}\nCollector: ${pickup.collectorName || 'Waiting'}`;
  await message.reply(msg('trackPickups.pickupDetails', lang, details));
}

async function handleTrackDetail(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;
  const pickupId = sess.data.trackPickupId;
  const pickup = storage.findOne('pickups', p => p.id === pickupId && p.userPhone === phone);

  if (!pickup) {
    session.set(phone, { step: 'household_menu' });
    await message.reply(msg('mainMenu', lang));
    return;
  }

  if (sess.step === 'track_cancel_confirm') {
    if (!isMenuChoice(body, 2)) { await message.reply(msg('invalidChoice', lang)); return; }
    if (getMenuChoice(body) === 1) {
      storage.update('pickups', p => p.id === pickup.id, { status: 'cancelled', updatedAt: timestamp() });
      session.set(phone, { step: 'household_menu' });
      await message.reply(msg('trackPickups.cancelled', lang));
      await message.reply(msg('mainMenu', lang));
      return;
    }
    session.set(phone, { step: 'track_select' });
    await handleTrack(client, message, phone, sess);
    return;
  }

  if (body === '1') {
    await message.reply(`📊 *Pickup Status*\n\n${pickupStatus(pickup.status)}\n\nType *menu* to return to your dashboard.`);
    return;
  }

  if (body === '2') {
    if (!['requested', 'assigned', 'scheduled'].includes(pickup.status)) {
      await message.reply(lang === 'pid'
        ? '❌ You no fit cancel this pickup again.'
        : '❌ You cannot cancel this pickup at this stage.');
      return;
    }
    session.set(phone, { step: 'track_cancel_confirm' });
    await message.reply(msg('trackPickups.cancelConfirm', lang));
    return;
  }

  if (body === '3') {
    return handleTrack(client, message, phone, sess);
  }
}

async function handleMyPoints(client, message, phone, sess) {
  const lang = sess.lang;
  const user = storage.findOne('users', u => u.phone === phone);
  if (!user) {
    await message.reply(msg('notRegistered', lang));
    return;
  }
  const total = user.points || 0;
  const monthly = user.monthlyPoints || 0;
  const lifetime = user.lifetimePoints || 0;
  await message.reply(msg('pointsRewards.myPoints', lang, total, monthly, lifetime));
  session.set(phone, { step: 'points_sub' });
}

async function handlePointsSub(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;
  if (!isMenuChoice(body, 3)) {
    await message.reply(msg('invalidChoice', lang));
    const user = storage.findOne('users', u => u.phone === phone);
    const total = user ? (user.points || 0) : 0;
    const monthly = user ? (user.monthlyPoints || 0) : 0;
    const lifetime = user ? (user.lifetimePoints || 0) : 0;
    await message.reply(msg('pointsRewards.myPoints', lang, total, monthly, lifetime));
    return;
  }
  const choice = getMenuChoice(body);
  if (choice === 1) return handleRewardsList(client, message, phone, sess);
  if (choice === 2) return handleLeaderboard(client, message, phone, sess);
  session.set(phone, { step: 'household_menu' });
  await message.reply(msg('mainMenu', lang));
}

async function handleLeaderboard(client, message, phone, sess) {
  const lang = sess.lang;
  const allUsers = storage.readAll('users');
  if (allUsers.length === 0) {
    await message.reply(msg('leaderboard.empty', lang));
    session.set(phone, { step: 'household_menu' });
    return;
  }
  const sorted = [...allUsers].sort((a, b) => (b.points || 0) - (a.points || 0));
  const medals = ['🥇', '🥈', '🥉'];
  const entries = sorted.slice(0, 10).map((u, i) => {
    const prefix = i < 3 ? medals[i] : `${i + 1}.`;
    return `${prefix} ${u.name || 'Recycler'} — ${u.points || 0} pts`;
  }).join('\n');
  const userRank = sorted.findIndex(u => u.phone === phone) + 1;
  await message.reply(msg('leaderboard.board', lang, entries, userRank));
  session.set(phone, { step: 'leaderboard_sub' });
}

async function handleLeaderboardSub(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;
  if (!isMenuChoice(body, 2)) {
    await message.reply(msg('invalidChoice', lang));
    return handleLeaderboard(client, message, phone, sess);
  }
  if (getMenuChoice(body) === 1) return handleMyPoints(client, message, phone, sess);
  session.set(phone, { step: 'household_menu' });
  await message.reply(msg('mainMenu', lang));
}

async function handleRewardsList(client, message, phone, sess) {
  const lang = sess.lang;
  const user = storage.findOne('users', u => u.phone === phone);
  if (!user) { await message.reply(msg('notRegistered', lang)); return; }
  await message.reply(msg('pointsRewards.availableRewards', lang, user.points || 0));
  session.set(phone, { step: 'rewards_redeem' });
}

async function handleRewardsRedeem(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;
  const user = storage.findOne('users', u => u.phone === phone);
  if (!user) { await message.reply(msg('notRegistered', lang)); return; }

  if (!isMenuChoice(body, 4)) {
    await message.reply(msg('invalidChoice', lang));
    await message.reply(msg('pointsRewards.availableRewards', lang, user.points || 0));
    return;
  }

  const choice = getMenuChoice(body);
  if (choice === 4) {
    session.set(phone, { step: 'household_menu' });
    await message.reply(msg('mainMenu', lang));
    return;
  }

  const pointCosts = { 1: 500, 2: 1000, 3: 2500 };
  const rewardNames = {
    1: '₦500 Airtime',
    2: '1GB Data Bundle',
    3: '₦2,500 Shopping Voucher'
  };
  const requiredPoints = pointCosts[choice];
  const currentPoints = user.points || 0;

  if (currentPoints < requiredPoints) {
    const shortfall = requiredPoints - currentPoints;
    await message.reply(lang === 'pid'
      ? `❌ *Not Enough Points*\n\nYou get *${currentPoints}* points but need *${requiredPoints}* points.\n\nYou need ${shortfall} more points.\n\nKeep recycling to earn more! ♻️`
      : `❌ *Not Enough Points*\n\nYou have *${currentPoints}* points but need *${requiredPoints}* points.\n\nEarn ${shortfall} more points to unlock this reward.\n\nKeep recycling! ♻️`);
    session.set(phone, { step: 'household_menu' });
    await message.reply(msg('mainMenu', lang));
    return;
  }

  storage.update('users', u => u.phone === phone, { points: currentPoints - requiredPoints });
  try {
    storage.insert('redemptions', {
      userPhone: phone,
      userName: user.name,
      reward: rewardNames[choice],
      pointsCost: requiredPoints,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  } catch (_) {}

  await message.reply(msg('rewards.redeemed', lang));
  session.set(phone, { step: 'household_menu' });
  await message.reply(msg('mainMenu', lang));
}

async function handleHelp(client, message, phone, sess) {
  const lang = sess.lang;
  const body = message.body.trim();

  if (sess.step === 'help_menu') {
    if (!isMenuChoice(body, 6)) {
      await message.reply(msg('invalidChoice', lang));
      await message.reply(msg('helpCenter.main', lang));
      return;
    }
    const choice = getMenuChoice(body);
    switch (choice) {
      case 1:
        await message.reply(msg('helpCenter.pickupsWork', lang));
        session.set(phone, { step: 'help_topic' });
        return;
      case 2:
        await message.reply(msg('helpCenter.pointsWork', lang));
        session.set(phone, { step: 'help_topic' });
        return;
      case 3:
        await message.reply(msg('helpCenter.rewardsWork', lang));
        session.set(phone, { step: 'help_topic' });
        return;
      case 4:
        await message.reply(msg('helpCenter.sellingWorks', lang));
        session.set(phone, { step: 'help_topic' });
        return;
      case 5:
        await message.reply(msg('helpCenter.contactSupport', lang));
        session.set(phone, { step: 'help_topic' });
        return;
      case 6:
        session.set(phone, { step: 'household_menu' });
        await message.reply(msg('mainMenu', lang));
        return;
    }
  }

  if (sess.step === 'help_topic') {
    if (body === '1' || body === '1️⃣') {
      await message.reply(msg('helpCenter.backToHelp', lang));
      session.set(phone, { step: 'help_menu' });
      return;
    }
    await message.reply(msg('invalidChoice', lang));
    await message.reply(msg('helpCenter.backToHelp', lang));
    session.set(phone, { step: 'help_menu' });
    return;
  }

  // Initial help call
  const lang2 = sess.lang;
  await message.reply(msg('helpCenter.main', lang2));
  session.set(phone, { step: 'help_menu' });
}

// ── REWARDS (redemption list) ─────────────────────────────────────────────────
async function handleRewards(client, message, phone, sess) {
  return handleRewardsList(client, message, phone, sess);
}

// ── ACHIEVEMENTS (badges + leaderboard summary) ───────────────────────────────
async function handleAchievements(client, message, phone, sess) {
  const lang = sess.lang;
  const user = storage.findOne('users', u => u.phone === phone);
  if (!user) { await message.reply(msg('notRegistered', lang)); return; }

  const allUsers = storage.readAll('users');
  const sorted = [...allUsers].sort((a, b) => (b.points || 0) - (a.points || 0));
  const rank = sorted.findIndex(u => u.phone === phone) + 1;
  const topThree = sorted.slice(0, 3).map((u, i) =>
    `${['🥇', '🥈', '🥉'][i]} ${u.name} — ${u.points || 0} pts`).join('\n');
  const badges = (user.badges || []).length > 0 ? user.badges.join(' ') : (lang === 'pid' ? 'None yet' : 'None yet');
  const streak = user.streak || 0;
  const streakLine = streak > 0
    ? `🔥 Streak: *${streak} day${streak === 1 ? '' : 's'}* in a row!`
    : '';

  await message.reply(lang === 'pid'
    ? `🏆 *Your Achievements*\n\n⭐ Points: *${user.points || 0}*\n🏅 Rank: *#${rank}*\n${streakLine}\n🎖️ Badges: ${badges}\n\n📊 *Top Recyclers:*\n${topThree}\n\n♻️ Keep recycling to earn more!\n\n1️⃣ Redeem Rewards\n2️⃣ Back to Menu\n\nReply with number.`
    : `🏆 *Your Achievements*\n\n⭐ Points: *${user.points || 0}*\n🏅 Rank: *#${rank}*\n${streakLine}\n🎖️ Badges: ${badges}\n\n📊 *Top Recyclers:*\n${topThree}\n\n♻️ Keep recycling to climb the leaderboard!\n\n1️⃣ Redeem Rewards\n2️⃣ Back to Menu\n\nReply with number.`);

  session.set(phone, { step: 'achievements_sub' });
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
    ? `👤 *Your Profile*\n\n🆔 ID: ${user.id}\n👤 Name: ${user.name}\n📞 Phone: ${user.phone}\n📍 State: ${user.state || 'N/A'}\n📍 LGA: ${user.lga || 'N/A'}\n🏠 Address: ${user.address || 'N/A'}\n👨‍👩‍👧‍👦 Household: ${user.householdSize || 'N/A'}\n⭐ Points: ${user.points || 0}\n🔥 Streak: ${user.streak || 0} days\n${verifiedBadge}\n📅 Joined: ${formatDate(user.registeredAt)}\n\nType *switch role* to update your role or *menu* to return.`
    : `👤 *Your Profile*\n\n🆔 ID: ${user.id}\n👤 Name: ${user.name}\n📞 Phone: ${user.phone}\n📍 State: ${user.state || 'N/A'}\n📍 LGA: ${user.lga || 'N/A'}\n🏠 Address: ${user.address || 'N/A'}\n👨‍👩‍👧‍👦 Household: ${user.householdSize || 'N/A'}\n⭐ Points: ${user.points || 0}\n🔥 Streak: ${user.streak || 0} days\n${verifiedBadge}\n📅 Joined: ${formatDate(user.registeredAt)}\n\nType *switch role* to update your role or *menu* to return.`);
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
  if (['reg_name','reg_lga','reg_lga_custom','reg_lga_waitlist','reg_address'].includes(sess.step)) {
    return handleRegistration(client, message, phone, sess);
  }

  // Pickup steps
  if (['pickup_waste','pickup_quantity','pickup_address_choice','pickup_address_new','pickup_review'].includes(sess.step)) {
    return handlePickupRequest(client, message, phone, sess);
  }

  // Track pickup flow
  if (['track_select','track_detail_choice','track_cancel_confirm'].includes(sess.step)) {
    if (sess.step === 'track_select') return handleTrackSelection(client, message, phone, sess);
    return handleTrackDetail(client, message, phone, sess);
  }

  // Points sub-flow
  if (sess.step === 'points_sub') return handlePointsSub(client, message, phone, sess);
  if (sess.step === 'leaderboard_sub') return handleLeaderboardSub(client, message, phone, sess);

  // Rewards sub-flow
  if (sess.step === 'rewards_redeem') return handleRewardsRedeem(client, message, phone, sess);
  if (sess.step === 'achievements_sub') {
    const body = message.body.trim();
    const lang = sess.lang;
    if (!isMenuChoice(body, 2)) {
      await message.reply(msg('invalidChoice', lang));
      return handleAchievements(client, message, phone, sess);
    }
    if (getMenuChoice(body) === 1) return handleRewardsList(client, message, phone, sess);
    session.set(phone, { step: 'household_menu' });
    await message.reply(msg('mainMenu', lang));
    return;
  }

  // Help center flow
  if (['help_menu', 'help_topic'].includes(sess.step)) {
    return handleHelp(client, message, phone, sess);
  }

  // Dashboard menu
  if (sess.step === 'household_menu') {
    if (!isMenuChoice(rawBody, 8)) {
      await message.reply(msg('invalidChoice', lang));
      await message.reply(msg('mainMenu', lang));
      return;
    }
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
      case 3: {
        const { handle: eduHandle } = require('./education');
        return eduHandle(client, message, phone, sess, false);
      }
      case 4: {
        const { handle: quizHandle } = require('./education');
        return quizHandle(client, message, phone, sess, true);
      }
      case 5: return handleMyPoints(client, message, phone, sess);
      case 6: return handleRewards(client, message, phone, sess);
      case 7: return handleProfile(client, message, phone, sess);
      case 8: return handleHelp(client, message, phone, sess);
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
