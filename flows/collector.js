const session = require('../utils/session');
const storage = require('../utils/storage');
const { msg } = require('../utils/messages');
const { generateEcoId, generateId, timestamp, formatDate, pickupStatus, materialEmoji } = require('../utils/helpers');
const { isValidPhone, isValidName, isMenuChoice, getMenuChoice, isPositiveNumber } = require('../utils/validators');

const MATERIALS = ['PET', 'Aluminum', 'Nylon', 'HDPE', 'Carton', 'Mixed', 'Glass', 'Metal'];
const VEHICLES  = ['Motorcycle', 'Tricycle (Keke)', 'Pickup Truck', 'Cart/Barrow', 'Van'];
const SPECIALTIES = ['PET Bottles', 'Metals & Aluminum', 'Nylon/Plastics', 'Paper & Cartons', 'Mixed Recyclables', 'All Materials'];

// ── REGISTRATION ──────────────────────────────────────────────────────────────
async function handleRegistration(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;

  switch (sess.step) {
    case 'col_reg_name': {
      if (!isValidName(body)) { await message.reply(msg('invalidName', lang)); return; }
      session.setData(phone, 'colName', body);
      session.set(phone, { step: 'col_reg_phone' });
      await message.reply(lang === 'pid' ? '✅ Enter your phone number:' : '✅ Enter your phone number:');
      return;
    }
    case 'col_reg_phone': {
      if (!isValidPhone(body)) { await message.reply(msg('invalidPhone', lang)); return; }
      session.setData(phone, 'colPhone', body);
      session.set(phone, { step: 'col_reg_area' });
      await message.reply(lang === 'pid' ? '✅ Which area you dey operate? (e.g. Ikeja, Surulere):' : '✅ What is your area of operation? (e.g. Ikeja, Surulere):');
      return;
    }
    case 'col_reg_area': {
      if (body.length < 3) { await message.reply(msg('retry', lang)); return; }
      session.setData(phone, 'colArea', body);
      session.set(phone, { step: 'col_reg_specialty' });
      const list = SPECIALTIES.map((s, i) => `${i + 1}. ${s}`).join('\n');
      await message.reply(lang === 'pid' ? `✅ Wetin be your specialty?\n\n${list}\n\nReply with number.` : `✅ Material specialty?\n\n${list}\n\nReply with number.`);
      return;
    }
    case 'col_reg_specialty': {
      if (!isMenuChoice(body, SPECIALTIES.length)) { await message.reply(msg('invalidChoice', lang)); return; }
      session.setData(phone, 'colSpecialty', SPECIALTIES[getMenuChoice(body) - 1]);
      session.set(phone, { step: 'col_reg_vehicle' });
      const vList = VEHICLES.map((v, i) => `${i + 1}. ${v}`).join('\n');
      await message.reply(lang === 'pid' ? `✅ Vehicle type:\n\n${vList}\n\nReply with number.` : `✅ Vehicle type:\n\n${vList}\n\nReply with number.`);
      return;
    }
    case 'col_reg_vehicle': {
      if (!isMenuChoice(body, VEHICLES.length)) { await message.reply(msg('invalidChoice', lang)); return; }
      const d = sess.data;
      const ecoId = generateEcoId('collector');
      const collector = {
        id: ecoId,
        phone,
        name: d.colName,
        collectorPhone: d.colPhone,
        area: d.colArea,
        specialty: d.colSpecialty,
        vehicle: VEHICLES[getMenuChoice(body) - 1],
        lang,
        inventory: {},
        earnings: 0,
        completedPickups: 0,
        rating: 5.0,
        totalRatings: 0,
        verified: false,
        registeredAt: timestamp()
      };
      storage.insert('collectors', collector);
      session.set(phone, { step: 'collector_menu' });
      await message.reply(lang === 'pid'
        ? `✅ *Registration Complete!*\n\nCollector ID: *${ecoId}*\n\nWelcome! You go receive pickup requests here. 🚛`
        : `✅ *Registration Successful!*\n\nCollector ID: *${ecoId}*\n\nWelcome! You will receive pickup requests here. 🚛`);
      await message.reply(msg('collectorMenu', lang));
      return;
    }
  }
}

// ── 1. NEARBY PICKUPS ────────────────────────────────────────────────────────
async function viewNearbyPickups(client, message, phone, sess) {
  const lang = sess.lang;
  const collector = storage.findOne('collectors', c => c.phone === phone);
  const requests = storage.findAll('pickups', p => p.status === 'requested');

  if (requests.length === 0) {
    await message.reply(lang === 'pid' ? '📭 No pickup request dey available now.' : '📭 No pickup requests available right now.');
    session.set(phone, { step: 'collector_menu' });
    await message.reply(msg('collectorMenu', lang));
    return;
  }

  const list = requests.slice(0, 5).map((p, i) =>
    `*${i + 1}. ${p.id}*\n👤 ${p.userName} | ♻️ ${p.wasteType}\n📦 ${p.bags} bags | 📍 ${p.address}\n⏰ ${p.preferredTime}`
  ).join('\n\n');

  await message.reply(lang === 'pid'
    ? `📋 *Available Pickups:*\n\n${list}\n\nType *2* from menu to accept a pickup.`
    : `📋 *Available Pickup Requests:*\n\n${list}\n\nType *2* from menu to accept a pickup.`);

  session.set(phone, { step: 'collector_menu' });
  await message.reply(msg('collectorMenu', lang));
}

// ── 2. ACCEPT PICKUP ─────────────────────────────────────────────────────────
async function handleAcceptPickup(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;

  if (sess.step === 'col_accept_id') {
    const pickup = storage.findOne('pickups', p => p.id.toUpperCase() === body.toUpperCase());
    if (!pickup) {
      await message.reply(lang === 'pid' ? '❌ Pickup ID no exist. Enter correct ID:' : '❌ Pickup ID not found. Try again:');
      return;
    }
    if (pickup.status !== 'requested') {
      await message.reply(lang === 'pid' ? '❌ That pickup don already accepted.' : '❌ That pickup has already been accepted.');
      session.set(phone, { step: 'collector_menu' });
      await message.reply(msg('collectorMenu', lang));
      return;
    }
    const collector = storage.findOne('collectors', c => c.phone === phone);
    storage.update('pickups', p => p.id === pickup.id, {
      status: 'assigned',
      collectorId: collector ? collector.id : phone,
      collectorName: collector ? collector.name : 'Collector',
      collectorPhone: phone,
      updatedAt: timestamp()
    });

    try {
      await client.sendMessage(`${pickup.userPhone}@c.us`,
        lang === 'pid'
          ? `🚛 *Collector Assigned!*\n\nPickup ID: ${pickup.id}\nCollector: ${collector ? collector.name : 'Collector'}\nStatus: 🔵 Assigned\n\nYour collector don accept your pickup!`
          : `🚛 *Collector Assigned!*\n\nPickup ID: ${pickup.id}\nCollector: ${collector ? collector.name : 'Collector'}\nStatus: 🔵 Assigned\n\nYour pickup has been accepted!`
      );
    } catch (_) {}

    await message.reply(lang === 'pid'
      ? `✅ You don accept Pickup *${pickup.id}*!\n\n👤 ${pickup.userName}\n📍 ${pickup.address}\n⏰ ${pickup.preferredTime}\n\nType *3* to complete when done.`
      : `✅ Pickup *${pickup.id}* accepted!\n\n👤 ${pickup.userName}\n📍 ${pickup.address}\n⏰ ${pickup.preferredTime}\n\nType *3* when you're ready to complete.`);

    session.set(phone, { step: 'collector_menu' });
    await message.reply(msg('collectorMenu', lang));
  }
}

// ── 3. COMPLETE PICKUP ────────────────────────────────────────────────────────
async function handleCompletePickup(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;

  if (sess.step === 'col_complete_id') {
    const pickup = storage.findOne('pickups', p =>
      p.id.toUpperCase() === body.toUpperCase() && p.collectorPhone === phone);
    if (!pickup) {
      await message.reply(lang === 'pid' ? '❌ That Pickup ID no match your active pickups.' : '❌ Pickup ID not found in your active pickups.');
      session.set(phone, { step: 'collector_menu' });
      await message.reply(msg('collectorMenu', lang));
      return;
    }
    session.setData(phone, 'completePickupId', pickup.id);
    session.set(phone, { step: 'col_complete_material' });
    const matList = MATERIALS.map((m, i) => `${i + 1}. ${materialEmoji(m)}`).join('\n');
    await message.reply(lang === 'pid'
      ? `✅ Good! Wetin material you collect?\n\n${matList}\n\nReply with number.`
      : `✅ What material did you collect?\n\n${matList}\n\nReply with number.`);
    return;
  }

  if (sess.step === 'col_complete_material') {
    if (!isMenuChoice(body, MATERIALS.length)) { await message.reply(msg('invalidChoice', lang)); return; }
    session.setData(phone, 'completeMaterial', MATERIALS[getMenuChoice(body) - 1]);
    session.set(phone, { step: 'col_complete_weight' });
    await message.reply(lang === 'pid' ? '✅ How many KG you collect? (e.g. 15):' : '✅ How many KG collected? (e.g. 15):');
    return;
  }

  if (sess.step === 'col_complete_weight') {
    if (!isPositiveNumber(body)) { await message.reply(lang === 'pid' ? '❌ Enter valid number.' : '❌ Enter a valid number.'); return; }
    const pickupId = sess.data.completePickupId;
    const material = sess.data.completeMaterial;
    const weight = parseFloat(body);
    const pickup = storage.findOne('pickups', p => p.id === pickupId);

    storage.update('pickups', p => p.id === pickupId, {
      status: 'completed', material, weight, completedAt: timestamp(), updatedAt: timestamp()
    });

    const collector = storage.findOne('collectors', c => c.phone === phone);
    if (collector) {
      const inv = { ...(collector.inventory || {}) };
      inv[material] = (inv[material] || 0) + weight;
      const earned = Math.round(weight * 50);
      storage.update('collectors', c => c.phone === phone, {
        inventory: inv,
        earnings: (collector.earnings || 0) + earned,
        completedPickups: (collector.completedPickups || 0) + 1,
        verified: (collector.completedPickups || 0) >= 4
      });
    }

    if (pickup) {
      const user = storage.findOne('users', u => u.phone === pickup.userPhone);
      if (user) {
        const pts = Math.round(weight * 5) + 20;
        const newPoints = (user.points || 0) + pts;
        const badges = [...(user.badges || [])];
        if (newPoints >= 100 && !badges.includes('♻️ Recycler')) badges.push('♻️ Recycler');
        if (newPoints >= 500 && !badges.includes('🌿 Eco Warrior')) badges.push('🌿 Eco Warrior');
        if ((user.totalPickups || 0) >= 9 && !badges.includes('⭐ Champion')) badges.push('⭐ Champion');
        storage.update('users', u => u.phone === pickup.userPhone, {
          points: newPoints, badges, verified: newPoints >= 200
        });
        try {
          await client.sendMessage(`${pickup.userPhone}@c.us`,
            lang === 'pid'
              ? `✅ *Pickup Completed!*\n\nPickup ID: ${pickupId}\nMaterial: ${material}\nWeight: ${weight}kg\n\n+${pts} EcoPoints earned! 🌟\nTotal: ${newPoints} pts`
              : `✅ *Pickup Completed!*\n\nPickup ID: ${pickupId}\nMaterial: ${material}\nWeight: ${weight}kg\n\nYou earned +${pts} EcoPoints! 🌟\nTotal: ${newPoints} pts`
          );
        } catch (_) {}
      }
    }

    await message.reply(lang === 'pid'
      ? `✅ *Pickup ${pickupId} Complete!*\n\nMaterial: ${material}\nWeight: ${weight}kg\n♻️ Inventory updated! 💪`
      : `✅ *Pickup ${pickupId} Completed!*\n\nMaterial: ${material}\nWeight: ${weight}kg\n♻️ Inventory updated! 💪`);

    session.set(phone, { step: 'collector_menu' });
    await message.reply(msg('collectorMenu', lang));
  }
}

// ── 4. MY ROUTE ───────────────────────────────────────────────────────────────
async function viewMyRoute(client, message, phone, sess) {
  const lang = sess.lang;
  const assigned = storage.findAll('pickups', p =>
    p.collectorPhone === phone && (p.status === 'assigned' || p.status === 'on_the_way'));

  if (assigned.length === 0) {
    await message.reply(lang === 'pid'
      ? '📭 You no get any active pickup on your route.\n\nType *2* to accept new pickups.'
      : '📭 No active pickups on your route.\n\nType *2* to accept new pickups.');
    session.set(phone, { step: 'collector_menu' });
    await message.reply(msg('collectorMenu', lang));
    return;
  }

  const lines = assigned.map((p, i) =>
    `*Stop ${i + 1}: ${p.id}*\n👤 ${p.userName}\n📍 ${p.address}\n♻️ ${p.wasteType} | ${p.bags} bags\n⏰ ${p.preferredTime}\n${pickupStatus(p.status)}`
  ).join('\n\n');

  await message.reply(lang === 'pid'
    ? `🗺️ *Your Route (${assigned.length} pickup${assigned.length > 1 ? 's' : ''}):*\n\n${lines}\n\nType *3* to complete a pickup.`
    : `🗺️ *Your Route (${assigned.length} pickup${assigned.length > 1 ? 's' : ''}):*\n\n${lines}\n\nType *3* to mark a pickup as complete.`);

  session.set(phone, { step: 'collector_menu' });
  await message.reply(msg('collectorMenu', lang));
}

// ── 5. INVENTORY ──────────────────────────────────────────────────────────────
async function viewInventory(client, message, phone, sess) {
  const lang = sess.lang;
  const collector = storage.findOne('collectors', c => c.phone === phone);
  if (!collector || !collector.inventory || Object.keys(collector.inventory).length === 0) {
    await message.reply(lang === 'pid' ? '📭 Your inventory dey empty. Complete pickups to add materials!' : '📭 Your inventory is empty. Complete pickups to add materials!');
    session.set(phone, { step: 'collector_menu' });
    await message.reply(msg('collectorMenu', lang));
    return;
  }
  const lines = Object.entries(collector.inventory)
    .map(([mat, kg]) => `${materialEmoji(mat)}: *${kg}kg*`).join('\n');
  const verifiedBadge = collector.verified ? '✅ Verified Collector' : '⏳ Unverified';
  await message.reply(lang === 'pid'
    ? `📦 *Your Inventory:*\n\n${lines}\n\n✅ Completed Pickups: ${collector.completedPickups || 0}\n${verifiedBadge}`
    : `📦 *Your Inventory:*\n\n${lines}\n\n✅ Completed Pickups: ${collector.completedPickups || 0}\n${verifiedBadge}`);
  session.set(phone, { step: 'collector_menu' });
  await message.reply(msg('collectorMenu', lang));
}

// ── 7. EARNINGS ───────────────────────────────────────────────────────────────
async function viewEarnings(client, message, phone, sess) {
  const lang = sess.lang;
  const collector = storage.findOne('collectors', c => c.phone === phone);
  if (!collector) { await message.reply(msg('notRegistered', lang)); return; }
  await message.reply(lang === 'pid'
    ? `💰 *Your Earnings*\n\nTotal: ₦${(collector.earnings || 0).toLocaleString()}\nPickups Done: ${collector.completedPickups || 0}\nArea: ${collector.area}\n⭐ Rating: ${collector.rating || 5.0}/5\n\nKeep grinding! 💪`
    : `💰 *Your Earnings*\n\nTotal Earned: ₦${(collector.earnings || 0).toLocaleString()}\nPickups Completed: ${collector.completedPickups || 0}\nArea: ${collector.area}\n⭐ Rating: ${collector.rating || 5.0}/5\n\nKeep up the great work! 💪`);
  session.set(phone, { step: 'collector_menu' });
  await message.reply(msg('collectorMenu', lang));
}

// ── 8. MY PROFILE ─────────────────────────────────────────────────────────────
async function viewProfile(client, message, phone, sess) {
  const lang = sess.lang;
  const collector = storage.findOne('collectors', c => c.phone === phone);
  if (!collector) { await message.reply(msg('notRegistered', lang)); return; }
  const verifiedBadge = collector.verified ? '✅ Verified Collector' : '⏳ Not Yet Verified (complete 5 pickups)';
  await message.reply(lang === 'pid'
    ? `👤 *Your Profile*\n\n🆔 ID: ${collector.id}\n👤 Name: ${collector.name}\n📞 Phone: ${collector.collectorPhone}\n📍 Area: ${collector.area}\n🚛 Vehicle: ${collector.vehicle}\n🌟 Specialty: ${collector.specialty}\n✅ Pickups Done: ${collector.completedPickups || 0}\n💰 Earnings: ₦${(collector.earnings || 0).toLocaleString()}\n⭐ Rating: ${collector.rating || 5.0}/5\n${verifiedBadge}`
    : `👤 *Your Profile*\n\n🆔 ID: ${collector.id}\n👤 Name: ${collector.name}\n📞 Phone: ${collector.collectorPhone}\n📍 Area: ${collector.area}\n🚛 Vehicle: ${collector.vehicle}\n🌟 Specialty: ${collector.specialty}\n✅ Pickups Completed: ${collector.completedPickups || 0}\n💰 Earnings: ₦${(collector.earnings || 0).toLocaleString()}\n⭐ Rating: ${collector.rating || 5.0}/5\n${verifiedBadge}`);
  session.set(phone, { step: 'collector_menu' });
  await message.reply(msg('collectorMenu', lang));
}

// ── HELP CENTER ───────────────────────────────────────────────────────────────
async function handleHelp(client, message, phone, sess) {
  const lang = sess.lang;
  const body = message.body.trim();

  if (sess.step === 'col_help_menu') {
    if (!isMenuChoice(body, 6)) {
      await message.reply(msg('invalidChoice', lang));
      await message.reply(msg('collectorHelp.main', lang));
      return;
    }
    const choice = getMenuChoice(body);
    const topicMap = {
      1: 'collectorHelp.acceptPickups',
      2: 'collectorHelp.completePickups',
      3: 'collectorHelp.earningsWork',
      4: 'collectorHelp.marketplaceWork',
      5: 'collectorHelp.contactSupport'
    };
    if (choice === 6) {
      session.set(phone, { step: 'collector_menu' });
      await message.reply(msg('collectorMenu', lang));
      return;
    }
    await message.reply(msg(topicMap[choice], lang));
    session.set(phone, { step: 'col_help_topic' });
    return;
  }

  if (sess.step === 'col_help_topic') {
    if (body === '1' || body === '1️⃣') {
      await message.reply(msg('collectorHelp.main', lang));
      session.set(phone, { step: 'col_help_menu' });
      return;
    }
    await message.reply(msg('invalidChoice', lang));
    await message.reply(msg('collectorHelp.main', lang));
    session.set(phone, { step: 'col_help_menu' });
    return;
  }

  await message.reply(msg('collectorHelp.main', lang));
  session.set(phone, { step: 'col_help_menu' });
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
async function handle(client, message, phone, sess) {
  const body = message.body.trim().toLowerCase();
  const rawBody = message.body.trim();
  const lang = sess.lang;

  if (['col_reg_name','col_reg_phone','col_reg_area','col_reg_specialty','col_reg_vehicle'].includes(sess.step)) {
    return handleRegistration(client, message, phone, sess);
  }
  if (sess.step === 'col_accept_id') return handleAcceptPickup(client, message, phone, sess);
  if (['col_complete_id','col_complete_material','col_complete_weight'].includes(sess.step)) {
    return handleCompletePickup(client, message, phone, sess);
  }
  if (['col_help_menu','col_help_topic'].includes(sess.step)) return handleHelp(client, message, phone, sess);

  // ── MARKETPLACE SUB-MENU ─────────────────────────────────────────────────────
  if (sess.step === 'marketplace_sub') {
    if (!isMenuChoice(rawBody, 3)) {
      await message.reply(msg('invalidChoice', lang));
      await message.reply(lang === 'pid'
        ? `🛒 *Marketplace*\n\n1️⃣ Post New Listing\n2️⃣ My Incoming Offers\n3️⃣ Back\n\nReply with number.`
        : `🛒 *Marketplace*\n\n1️⃣ Post New Listing\n2️⃣ My Incoming Offers\n3️⃣ Back\n\nReply with number.`);
      return;
    }
    const mChoice = getMenuChoice(rawBody);
    if (mChoice === 1) {
      const { startListing } = require('./marketplace');
      return startListing(client, message, phone, sess);
    }
    if (mChoice === 2) {
      const { viewCollectorOffers } = require('./marketplace');
      await viewCollectorOffers(client, message, phone, sess);
      session.set(phone, { step: 'collector_menu' });
      await message.reply(msg('collectorMenu', lang));
      return;
    }
    session.set(phone, { step: 'collector_menu' });
    await message.reply(msg('collectorMenu', lang));
    return;
  }

  if (body === 'register') {
    const existing = storage.findOne('collectors', c => c.phone === phone);
    if (existing) {
      await message.reply(lang === 'pid' ? '✅ You don already register!' : '✅ Already registered!');
      session.set(phone, { step: 'collector_menu' });
      await message.reply(msg('collectorMenu', lang));
      return;
    }
    session.set(phone, { step: 'col_reg_name' });
    await message.reply(lang === 'pid' ? '🚛 *Collector Registration*\n\nEnter your full name:' : '🚛 *Collector Registration*\n\nWhat is your full name?');
    return;
  }

  if (sess.step === 'collector_menu') {
    if (!isMenuChoice(rawBody, 9)) {
      await message.reply(msg('invalidChoice', lang));
      await message.reply(msg('collectorMenu', lang));
      return;
    }
    const choice = getMenuChoice(rawBody);
    switch (choice) {
      case 1: return viewNearbyPickups(client, message, phone, sess);
      case 2: {
        session.set(phone, { step: 'col_accept_id' });
        await message.reply(lang === 'pid' ? '🔢 Enter the Pickup ID you wan accept:' : '🔢 Enter the Pickup ID to accept:');
        return;
      }
      case 3: {
        session.set(phone, { step: 'col_complete_id' });
        await message.reply(lang === 'pid' ? '🔢 Enter the Pickup ID to complete:' : '🔢 Enter the Pickup ID to mark complete:');
        return;
      }
      case 4: return viewMyRoute(client, message, phone, sess);
      case 5: return viewInventory(client, message, phone, sess);
      case 6: {
        session.set(phone, { step: 'marketplace_sub' });
        await message.reply(lang === 'pid'
          ? `🛒 *Marketplace*\n\n1️⃣ Post New Listing\n2️⃣ My Incoming Offers\n3️⃣ Back\n\nReply with number.`
          : `🛒 *Marketplace*\n\n1️⃣ Post New Listing\n2️⃣ My Incoming Offers\n3️⃣ Back\n\nReply with number.`);
        return;
      }
      case 7: return viewEarnings(client, message, phone, sess);
      case 8: return viewProfile(client, message, phone, sess);
      case 9: return handleHelp(client, message, phone, sess);
    }
  }

  await message.reply(msg('collectorMenu', lang));
}

module.exports = { handle };
