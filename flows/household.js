const session = require('../utils/session');
const storage = require('../utils/storage');
const { msg } = require('../utils/messages');
const { generateEcoId, generateId, timestamp, formatDate, pickupStatus, materialEmoji, updateStreak } = require('../utils/helpers');
const crypto = require('crypto');
const { isValidPhone, isValidName, isMenuChoice, getMenuChoice, isPositiveNumber } = require('../utils/validators');

const WASTE_TYPES = ['Plastic Waste', 'Paper Waste', 'Metal Waste', 'Glass Waste', 'Organic Waste', 'E-Waste', 'Mixed Waste'];
const STATES = ['Lagos', 'Oyo', 'Abuja', 'Rivers', 'Kano', 'Other'];
const LGAS = ['Alimosho', 'Ajeromi-Ifelodun', 'Kosofe', 'Mushin', 'Ikeja', 'Oshodi-Isolo'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['8am - 10am', '10am - 12pm', '12pm - 2pm', '2pm - 4pm'];

function buildPickupSummary(data) {
  return `Waste Type: ${data.pickupWaste}
Quantity: ${data.pickupQuantity}kg
Address: ${data.pickupAddress}
Preferred Day: ${data.pickupDay}
Preferred Time: ${data.pickupTime}`;
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
      session.set(phone, { step: 'reg_state' });
      const stateList = STATES.map((s, i) => `${i + 1}. ${s}`).join('\n');
      await message.reply(lang === 'pid'
        ? `✅ Great! Which state you dey?\n\n${stateList}\n\nReply with number.`
        : `✅ Great! Which state are you in?\n\n${stateList}\n\nReply with number.`);
      return;
    }
    case 'reg_state': {
      if (!isMenuChoice(body, STATES.length)) { await message.reply(msg('invalidChoice', lang)); return; }
      const state = STATES[getMenuChoice(body) - 1];
      session.setData(phone, 'regState', state);
      session.set(phone, { step: 'reg_lga' });
      const lgaList = LGAS.map((l, i) => `${i + 1}. ${l}`).join('\n');
      await message.reply(lang === 'pid'
        ? `✅ Nice. Choose your LGA:\n\n${lgaList}\n\nReply with number.`
        : `✅ Nice. Choose your LGA:\n\n${lgaList}\n\nReply with number.`);
      return;
    }
    case 'reg_lga': {
      if (!isMenuChoice(body, LGAS.length)) { await message.reply(msg('invalidChoice', lang)); return; }
      const lga = LGAS[getMenuChoice(body) - 1];
      session.setData(phone, 'regLga', lga);
      session.set(phone, { step: 'reg_address' });
      await message.reply(lang === 'pid'
        ? `✅ Good. Enter your full address now:`
        : `✅ Good. Enter your full address now:`);
      return;
    }
    case 'reg_address': {
      if (body.length < 5) { await message.reply(msg('retry', lang)); return; }
      session.setData(phone, 'regAddress', body);
      session.set(phone, { step: 'reg_household_size' });
      await message.reply(lang === 'pid'
        ? `✅ Almost done! How many people dey your household?\n\n1️⃣ 1 person\n2️⃣ 2-3 people\n3️⃣ 4-5 people\n4️⃣ 6-7 people\n5️⃣ 8+ people\n\nReply with number.`
        : `✅ Almost done! How many people are in your household?\n\n1️⃣ 1 person\n2️⃣ 2-3 people\n3️⃣ 4-5 people\n4️⃣ 6-7 people\n5️⃣ 8+ people\n\nReply with number.`);
      return;
    }
    case 'reg_household_size': {
      if (!isMenuChoice(body, 5)) { await message.reply(msg('invalidChoice', lang)); return; }
      const sizes = ['1 person', '2-3 people', '4-5 people', '6-7 people', '8+ people'];
      const householdSize = sizes[getMenuChoice(body) - 1];
      const d = sess.data;
      const ecoId = generateEcoId('household');
      const user = {
        id: ecoId,
        phone,
        name: d.regName,
        state: d.regState,
        lga: d.regLga,
        address: d.regAddress,
        householdSize,
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
        session.set(phone, { step: 'pickup_day' });
        const dayList = DAYS.map((d, i) => `${i + 1}. ${d}`).join('\n');
        await message.reply(lang === 'pid'
          ? `📅 Choose collection day:\n\n${dayList}`
          : `📅 Choose collection day:\n\n${dayList}`);
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
      session.set(phone, { step: 'pickup_day' });
      const dayList = DAYS.map((d, i) => `${i + 1}. ${d}`).join('\n');
      await message.reply(lang === 'pid'
        ? `📅 Choose collection day:\n\n${dayList}`
        : `📅 Choose collection day:\n\n${dayList}`);
      return;
    }
    case 'pickup_day': {
      if (!isMenuChoice(body, DAYS.length)) { await message.reply(msg('invalidChoice', lang)); return; }
      session.setData(phone, 'pickupDay', DAYS[getMenuChoice(body) - 1]);
      session.set(phone, { step: 'pickup_time' });
      const timeList = TIME_SLOTS.map((t, i) => `${i + 1}. ${t}`).join('\n');
      await message.reply(lang === 'pid'
        ? `🕐 Choose collection time:\n\n${timeList}`
        : `🕐 Choose collection time:\n\n${timeList}`);
      return;
    }
    case 'pickup_time': {
      if (!isMenuChoice(body, TIME_SLOTS.length)) { await message.reply(msg('invalidChoice', lang)); return; }
      session.setData(phone, 'pickupTime', TIME_SLOTS[getMenuChoice(body) - 1]);
      session.set(phone, { step: 'pickup_review' });
      const summary = buildPickupSummary(sess.data);
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
        preferredDay: sess.data.pickupDay,
        preferredTime: sess.data.pickupTime,
        status: 'requested',
        collectorId: assignedCollector ? assignedCollector.id : null,
        collectorName: assignedCollector ? assignedCollector.name : null,
        collectorPhone: assignedCollector ? assignedCollector.phone : null,
        createdAt: timestamp(),
        updatedAt: timestamp()
      };
      try {
        const code = crypto.randomBytes(3).toString('hex').toUpperCase();
        const expiresAt = new Date(Date.now() + (2 * 60 * 60 * 1000)).toISOString();
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
        `📍 ${pickup.address}\n` +
        `⏰ ${pickup.preferredDay}, ${pickup.preferredTime}\n\n` +
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
  if (['reg_name','reg_state','reg_lga','reg_address','reg_household_size'].includes(sess.step)) {
    return handleRegistration(client, message, phone, sess);
  }

  // Pickup steps
  if (['pickup_waste','pickup_quantity','pickup_address_choice','pickup_address_new','pickup_day','pickup_time','pickup_review'].includes(sess.step)) {
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
