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

// ── 1. AVAILABLE PICKUPS — numbered list, pick by number ─────────────────────
async function viewNearbyPickups(client, message, phone, sess) {
  const lang = sess.lang;
  const requests = storage.findAll('pickups', p => p.status === 'requested');

  if (requests.length === 0) {
    await message.reply(lang === 'pid'
      ? `📭 *No Pickups Available*\n\nNo pickup request dey right now.\n\nCheck back later or type *menu* to return.`
      : `📭 *No Pickups Available*\n\nThere are no pickup requests right now.\n\nCheck back later or type *menu* to return.`);
    session.set(phone, { step: 'collector_menu' });
    return;
  }

  const shown = requests.slice(0, 6);
  const list = shown.map((p, i) => {
    const kg = p.quantityKg || p.bags || 0;
    return (
      `*${i + 1}.* ♻️ ${p.wasteType}  |  ⚖️ ${kg}kg\n` +
      `   👤 ${p.userName || 'Household'}  |  📍 ${p.address}\n` +
      `   ⏰ ${p.preferredDay || ''} ${p.preferredTime || ''}`.trim()
    );
  }).join('\n\n');

  await message.reply(
    (lang === 'pid'
      ? `📋 *Available Pickups (${shown.length}):*`
      : `📋 *Available Pickup Requests (${shown.length}):*`) +
    `\n\n${list}\n\n` +
    (lang === 'pid'
      ? `Reply with a number (1–${shown.length}) to select a pickup.\nOr *0* to go back.`
      : `Reply with a number (1–${shown.length}) to view details and accept.\nOr *0* to go back.`)
  );

  session.setData(phone, 'availablePickupIds', shown.map(p => p.id));
  session.set(phone, { step: 'col_pickup_select' });
}

// ── 1b. PICKUP SELECTED — show detail + confirm ───────────────────────────────
async function handlePickupSelect(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;
  const pickupIds = (sess.data && sess.data.availablePickupIds) || [];

  if (body === '0') {
    session.set(phone, { step: 'collector_menu' });
    await message.reply(msg('collectorMenu', lang));
    return;
  }

  const idx = parseInt(body, 10);
  if (isNaN(idx) || idx < 1 || idx > pickupIds.length) {
    await message.reply(lang === 'pid'
      ? `❌ Reply with a number between 1 and ${pickupIds.length}, or 0 to go back.`
      : `❌ Please reply with a number between 1 and ${pickupIds.length}, or 0 to go back.`);
    return;
  }

  const pickupId = pickupIds[idx - 1];
  const pickup = storage.findOne('pickups', p => p.id === pickupId);

  if (!pickup || pickup.status !== 'requested') {
    await message.reply(lang === 'pid'
      ? '⚠️ That pickup don already taken by another collector. Refreshing list...'
      : '⚠️ That pickup was just taken. Refreshing the list...');
    return viewNearbyPickups(client, message, phone, sess);
  }

  const kg = pickup.quantityKg || pickup.bags || 0;
  const estimatedEarnings = Math.round(kg * 50);

  session.setData(phone, 'selectedPickupId', pickupId);
  session.set(phone, { step: 'col_pickup_confirm' });

  await message.reply(
    `📋 *Pickup Details*\n\n` +
    `♻️ *${pickup.wasteType}*\n` +
    `⚖️ Quantity: ${kg}kg\n` +
    `👤 Household: ${pickup.userName || 'Household User'}\n` +
    `📍 Address: ${pickup.address}\n` +
    `⏰ Preferred: ${pickup.preferredDay || 'TBD'}, ${pickup.preferredTime || 'TBD'}\n` +
    `💰 Est. Earnings: ₦${estimatedEarnings.toLocaleString()}\n\n` +
    (lang === 'pid'
      ? `1️⃣ Accept this Pickup\n2️⃣ Skip — see next\n3️⃣ Back to menu\n\nReply with number.`
      : `1️⃣ Accept this Pickup\n2️⃣ Skip — view next\n3️⃣ Back to menu\n\nReply with number.`)
  );
}

// ── 1c. PICKUP CONFIRM — accept / skip / back ─────────────────────────────────
async function handlePickupConfirm(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;

  if (!isMenuChoice(body, 3)) {
    await message.reply(msg('invalidChoice', lang));
    return;
  }

  const choice = getMenuChoice(body);
  const pickupId = sess.data && sess.data.selectedPickupId;

  if (choice === 2) {
    // Skip — show remaining available pickups
    return viewNearbyPickups(client, message, phone, sess);
  }
  if (choice === 3) {
    session.set(phone, { step: 'collector_menu' });
    await message.reply(msg('collectorMenu', lang));
    return;
  }

  // Accept
  const pickup = storage.findOne('pickups', p => p.id === pickupId);
  if (!pickup || pickup.status !== 'requested') {
    await message.reply(lang === 'pid'
      ? '⚠️ That pickup don already taken. Showing updated list...'
      : '⚠️ That pickup was just claimed. Showing updated list...');
    return viewNearbyPickups(client, message, phone, sess);
  }

  const collector = storage.findOne('collectors', c => c.phone === phone);
  storage.update('pickups', p => p.id === pickup.id, {
    status: 'assigned',
    collectorId: collector ? collector.id : phone,
    collectorName: collector ? collector.name : 'Collector',
    collectorPhone: phone,
    updatedAt: timestamp()
  });

  // Notify household
  try {
    await client.sendMessage(`${pickup.userPhone}@c.us`,
      lang === 'pid'
        ? `🚛 *Collector Assigned!*\n\nPickup ID: *${pickup.id}*\nCollector: *${collector ? collector.name : 'Collector'}*\nStatus: 🔵 On the way\n\nYour collector don accept your pickup! They go reach you soon at your preferred time.`
        : `🚛 *Collector Assigned!*\n\nPickup ID: *${pickup.id}*\nCollector: *${collector ? collector.name : 'Collector'}*\nStatus: 🔵 On the way\n\nYour pickup has been accepted! Your collector will arrive at the scheduled time.`
    );
  } catch (_) {}

  const kg = pickup.quantityKg || pickup.bags || 0;

  await message.reply(
    `✅ *Pickup Accepted!*\n\n` +
    `ID: *${pickup.id}*\n` +
    `♻️ ${pickup.wasteType}  |  ⚖️ ${kg}kg\n` +
    `👤 ${pickup.userName || 'Household'}\n` +
    `📍 ${pickup.address}\n` +
    `⏰ ${pickup.preferredDay || 'TBD'}, ${pickup.preferredTime || 'TBD'}\n\n` +
    (lang === 'pid'
      ? `Household don get notification. Check your route from menu. 🗺️`
      : `Household has been notified. Check your route from the menu. 🗺️`)
  );

  session.set(phone, { step: 'collector_menu' });
  await message.reply(msg('collectorMenu', lang));
}

// ── 2. ACCEPT PICKUP by ID (fallback — for direct ID entry) ───────────────────
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

    const kg = pickup.quantityKg || pickup.bags || 0;
    await message.reply(lang === 'pid'
      ? `✅ You don accept Pickup *${pickup.id}*!\n\n👤 ${pickup.userName}\n📍 ${pickup.address}\n⚖️ ${kg}kg\n\nType *3* to complete when done.`
      : `✅ Pickup *${pickup.id}* accepted!\n\n👤 ${pickup.userName}\n📍 ${pickup.address}\n⚖️ ${kg}kg\n\nUse *Complete Pickup* when you're done.`);

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
    session.setData(phone, 'completeMaterial', pickup.wasteType || 'Mixed Waste');
    session.set(phone, { step: 'col_complete_weight' });
    await message.reply(lang === 'pid'
      ? `✅ *${pickup.wasteType || 'Mixed Waste'}* — How many KG you collect? (e.g. 15):`
      : `✅ *${pickup.wasteType || 'Mixed Waste'}* — How many KG collected? (e.g. 15):`);
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

// ── OFFER SELECT — collector picks an offer by number ────────────────────────
async function handleColOfferSelect(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;
  const offerIds = (sess.data && sess.data.collectorOfferIds) || [];

  if (body === '0') {
    session.set(phone, { step: 'collector_menu' });
    await message.reply(msg('collectorMenu', lang));
    return;
  }

  const idx = parseInt(body, 10);
  if (isNaN(idx) || idx < 1 || idx > offerIds.length) {
    await message.reply(lang === 'pid'
      ? `❌ Reply with a number between 1 and ${offerIds.length}, or 0 to go back.`
      : `❌ Reply with a number between 1 and ${offerIds.length}, or 0 to go back.`);
    return;
  }

  const offerId = offerIds[idx - 1];
  const offer   = storage.findOne('offers', o => o.id === offerId);

  if (!offer) {
    await message.reply(lang === 'pid' ? '⚠️ Offer no dey. Refreshing...' : '⚠️ Offer not found. Refreshing...');
    const { viewCollectorOffers } = require('./marketplace');
    await viewCollectorOffers(client, message, phone, sess);
    return;
  }

  const listing     = storage.findOne('listings', l => l.id === offer.listingId);
  const canRespond  = ['pending', 'countered'].includes(offer.status);

  session.setData(phone, 'selectedOfferId', offerId);
  session.set(phone, { step: 'col_offer_action' });

  const details =
    `💬 *Offer Details*\n\n` +
    `Offer ID: *${offer.id}*\n` +
    (listing ? `${materialEmoji(listing.material)} ${listing.material}  |  ${listing.quantity}kg\n` : '') +
    `From: *${offer.buyerName}*\n` +
    `Their Offer: *₦${offer.offerPrice}/kg*\n` +
    (listing ? `Your Listed Price: ₦${listing.pricePerKg}/kg\n` : '') +
    (offer.counterPrice ? `Your Previous Counter: ₦${offer.counterPrice}/kg\n` : '') +
    `Status: ${offer.status.toUpperCase()}\n\n`;

  if (canRespond) {
    await message.reply(details +
      (lang === 'pid'
        ? `Wetin you wan do?\n\n1️⃣ Accept Offer (₦${offer.offerPrice}/kg)\n2️⃣ Reject Offer\n3️⃣ Counter with Different Price\n4️⃣ Back\n\nReply with number.`
        : `What would you like to do?\n\n1️⃣ Accept Offer (₦${offer.offerPrice}/kg)\n2️⃣ Reject Offer\n3️⃣ Counter with Different Price\n4️⃣ Back\n\nReply with number.`)
    );
  } else {
    await message.reply(details +
      (lang === 'pid'
        ? `This offer don already *${offer.status}*.\n\n1️⃣ Back to Offers\n\nReply with 1.`
        : `This offer has already been *${offer.status}*.\n\n1️⃣ Back to Offers\n\nReply with 1.`)
    );
  }
}

// ── OFFER ACTION — accept / reject / counter ──────────────────────────────────
async function handleColOfferAction(client, message, phone, sess) {
  const body    = message.body.trim();
  const lang    = sess.lang;
  const offerId = sess.data && sess.data.selectedOfferId;
  const offer   = storage.findOne('offers', o => o.id === offerId);

  if (!offer) {
    session.set(phone, { step: 'collector_menu' });
    await message.reply(msg('collectorMenu', lang));
    return;
  }

  const canRespond = ['pending', 'countered'].includes(offer.status);
  const listing    = storage.findOne('listings', l => l.id === offer.listingId);

  // Already responded — only option is "Back"
  if (!canRespond) {
    if (body === '1') {
      const { viewCollectorOffers } = require('./marketplace');
      await viewCollectorOffers(client, message, phone, sess);
      return;
    }
    await message.reply(msg('invalidChoice', lang));
    return;
  }

  if (!isMenuChoice(body, 4)) {
    await message.reply(msg('invalidChoice', lang));
    return;
  }

  const choice = getMenuChoice(body);

  if (choice === 4) {
    const { viewCollectorOffers } = require('./marketplace');
    await viewCollectorOffers(client, message, phone, sess);
    return;
  }

  if (choice === 3) {
    session.set(phone, { step: 'col_offer_counter_price' });
    await message.reply(lang === 'pid'
      ? `🔄 *Counter Offer*\n\nEnter your counter price per kg (₦):\n_e.g. 180_\n\nOr *0* to go back.`
      : `🔄 *Counter Offer*\n\nEnter your counter price per kg (₦):\n_e.g. 180_\n\nOr *0* to go back.`);
    return;
  }

  if (choice === 2) {
    // ── REJECT ────────────────────────────────────────────────────────────────
    storage.update('offers', o => o.id === offer.id, { status: 'rejected', updatedAt: timestamp() });
    try {
      await client.sendMessage(`${offer.buyerPhone}@c.us`,
        `❌ *Offer Declined*\n\n` +
        `Offer ID: *${offer.id}* was declined by the collector.\n\n` +
        `You can make a new offer or browse other listings from your Buyer Dashboard.`
      );
    } catch (_) {}

    await message.reply(
      `❌ *Offer Rejected*\n\n` +
      `Offer: ${offer.id}\n` +
      `The buyer has been notified.`
    );
    session.set(phone, { step: 'collector_menu' });
    await message.reply(msg('collectorMenu', lang));
    return;
  }

  // ── ACCEPT (choice === 1) ──────────────────────────────────────────────────
  const agreedPrice = offer.counterPrice || offer.offerPrice;
  const qty         = listing ? listing.quantity : 0;
  const totalValue  = qty * agreedPrice;
  const txnId       = generateId('TXN');

  storage.update('offers', o => o.id === offer.id, { status: 'accepted', updatedAt: timestamp() });
  storage.insert('transactions', {
    id: txnId,
    offerId: offer.id,
    listingId: offer.listingId,
    buyerPhone: offer.buyerPhone,
    collectorPhone: phone,
    material: listing ? listing.material : 'Unknown',
    quantity: qty,
    agreedPrice,
    totalValue,
    status: 'confirmed',
    gps: `6.${Math.floor(Math.random() * 9999)}, 3.${Math.floor(Math.random() * 9999)}`,
    createdAt: timestamp()
  });
  if (listing) {
    storage.update('listings', l => l.id === listing.id, { status: 'sold', updatedAt: timestamp() });
  }

  // Generate ESG certificate
  const { generateCertificate } = require('./certificates');
  const buyer = storage.findOne('buyers', b => b.phone === offer.buyerPhone);
  generateCertificate(
    { id: txnId, offerId: offer.id, listingId: offer.listingId, buyerPhone: offer.buyerPhone,
      collectorPhone: phone, material: listing ? listing.material : 'Unknown', quantity: qty,
      agreedPrice, totalValue, status: 'confirmed',
      gps: `6.0000, 3.0000`, createdAt: new Date().toISOString() },
    buyer ? buyer.companyName : 'Buyer'
  );

  // Notify buyer
  const mat = listing ? `${materialEmoji(listing.material)} ${listing.material}` : '';
  try {
    await client.sendMessage(`${offer.buyerPhone}@c.us`,
      `✅ *Offer Accepted — Deal Done!*\n\n` +
      `Transaction ID: *${txnId}*\n` +
      `${mat}  |  ${qty}kg\n` +
      `Agreed Price: *₦${agreedPrice}/kg*\n` +
      `Total Value: *₦${totalValue.toLocaleString()}*\n\n` +
      `Check *My Transactions* in your dashboard.\n` +
      `Your ESG Certificate is now ready to download from *ESG Certificates*. 🎉`
    );
  } catch (_) {}

  await message.reply(
    `✅ *Offer Accepted!*\n\n` +
    `Transaction ID: *${txnId}*\n` +
    `Buyer: ${offer.buyerName}\n` +
    `${mat}  |  ${qty}kg\n` +
    `Agreed Price: *₦${agreedPrice}/kg*\n` +
    `Total: *₦${totalValue.toLocaleString()}*\n\n` +
    `The buyer has been notified. Arrange pickup/delivery with them. 🤝`
  );
  session.set(phone, { step: 'collector_menu' });
  await message.reply(msg('collectorMenu', lang));
}

// ── OFFER COUNTER PRICE — collector enters their counter price ─────────────────
async function handleColOfferCounter(client, message, phone, sess) {
  const body    = message.body.trim();
  const lang    = sess.lang;
  const offerId = sess.data && sess.data.selectedOfferId;

  if (body === '0') {
    // Back to offer detail
    session.set(phone, { step: 'col_offer_select' });
    const offerIds = (sess.data && sess.data.collectorOfferIds) || [];
    const idx = offerIds.indexOf(offerId);
    await message.reply(lang === 'pid'
      ? `Reply with a number (1–${offerIds.length}) to select an offer, or 0 to go back.`
      : `Reply with a number (1–${offerIds.length}) to select an offer, or 0 to go back.`);
    return;
  }

  if (!isPositiveNumber(body)) {
    await message.reply(lang === 'pid' ? '❌ Enter valid price in ₦ (e.g. 180):' : '❌ Enter a valid price in ₦ (e.g. 180):');
    return;
  }

  const counterPrice = parseFloat(body);
  const offer        = storage.findOne('offers', o => o.id === offerId);

  if (!offer) {
    session.set(phone, { step: 'collector_menu' });
    await message.reply(msg('collectorMenu', lang));
    return;
  }

  storage.update('offers', o => o.id === offer.id, {
    status: 'countered',
    counterPrice,
    updatedAt: timestamp()
  });

  // Notify buyer
  try {
    await client.sendMessage(`${offer.buyerPhone}@c.us`,
      `🔄 *Counter Offer Received!*\n\n` +
      `Offer ID: *${offer.id}*\n` +
      `Your Offer: ₦${offer.offerPrice}/kg\n` +
      `Collector's Counter: *₦${counterPrice}/kg*\n\n` +
      `To respond, type:\n` +
      `✅  accept ${offer.id}    (agree to ₦${counterPrice}/kg)\n` +
      `❌  reject ${offer.id}    (decline)\n\n` +
      `Or check *My Offers* in your dashboard to respond.`
    );
  } catch (_) {}

  await message.reply(
    `🔄 *Counter Offer Sent!*\n\n` +
    `Offer: *${offer.id}*\n` +
    `Counter Price: *₦${counterPrice}/kg*\n\n` +
    `The buyer has been notified and will respond shortly.\n` +
    `Check *My Offers* in Marketplace to track the response.`
  );
  session.set(phone, { step: 'collector_menu' });
  await message.reply(msg('collectorMenu', lang));
}

// ── MY LISTINGS ───────────────────────────────────────────────────────────────
async function viewMyListings(client, message, phone, sess) {
  const lang = sess.lang;
  const listings = storage.findAll('listings', l => l.collectorPhone === phone);

  if (listings.length === 0) {
    await message.reply(lang === 'pid'
      ? `📭 *No Listings Yet*\n\nYou never post any listing.\n\nGo to *Post New Listing* to list your materials for buyers!`
      : `📭 *No Listings Yet*\n\nYou haven't posted any listings.\n\nGo to *Post New Listing* to list your collected materials for buyers!`);
    return;
  }

  const statusEmoji = { available: '🟢', sold: '✅', inactive: '⏸️', expired: '❌' };
  const sorted = [...listings].reverse().slice(0, 8);

  const lines = sorted.map((l, i) =>
    `*${i + 1}.* ${materialEmoji(l.material)} *${l.material}*\n` +
    `   ${l.quantity}kg  |  ₦${l.pricePerKg}/kg  |  💵 ₦${l.totalValue.toLocaleString()}\n` +
    `   📍 ${l.location}  |  ${statusEmoji[l.status] || '⚪'} ${l.status.toUpperCase()}\n` +
    `   🆔 ${l.id}`
  ).join('\n\n');

  const active = listings.filter(l => l.status === 'available').length;
  const sold   = listings.filter(l => l.status === 'sold').length;

  await message.reply(
    (lang === 'pid' ? `📋 *Your Listings:*\n\n` : `📋 *Your Listings:*\n\n`) +
    lines +
    `\n\n📊 Active: *${active}*  |  Sold: *${sold}*  |  Total: ${listings.length}`
  );
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
  if (sess.step === 'col_pickup_select') return handlePickupSelect(client, message, phone, sess);
  if (sess.step === 'col_pickup_confirm') return handlePickupConfirm(client, message, phone, sess);
  if (sess.step === 'col_accept_id') return handleAcceptPickup(client, message, phone, sess);
  if (sess.step === 'col_offer_select') return handleColOfferSelect(client, message, phone, sess);
  if (sess.step === 'col_offer_action') return handleColOfferAction(client, message, phone, sess);
  if (sess.step === 'col_offer_counter_price') return handleColOfferCounter(client, message, phone, sess);
  if (['col_complete_id','col_complete_weight'].includes(sess.step)) {
    return handleCompletePickup(client, message, phone, sess);
  }
  if (['col_help_menu','col_help_topic'].includes(sess.step)) return handleHelp(client, message, phone, sess);

  // ── MARKETPLACE SUB-MENU ─────────────────────────────────────────────────────
  if (sess.step === 'marketplace_sub') {
    if (!isMenuChoice(rawBody, 4)) {
      await message.reply(msg('invalidChoice', lang));
      await message.reply(lang === 'pid'
        ? `🛒 *Marketplace*\n\n1️⃣ Post New Listing\n2️⃣ My Listings\n3️⃣ My Incoming Offers\n4️⃣ Back\n\nReply with number.`
        : `🛒 *Marketplace*\n\n1️⃣ Post New Listing\n2️⃣ My Listings\n3️⃣ My Incoming Offers\n4️⃣ Back\n\nReply with number.`);
      return;
    }
    const mChoice = getMenuChoice(rawBody);
    if (mChoice === 1) {
      const { startListing } = require('./marketplace');
      return startListing(client, message, phone, sess);
    }
    if (mChoice === 2) {
      await viewMyListings(client, message, phone, sess);
      session.set(phone, { step: 'collector_menu' });
      await message.reply(msg('collectorMenu', lang));
      return;
    }
    if (mChoice === 3) {
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
        // Accept by ID — fallback if user already knows the pickup ID
        session.set(phone, { step: 'col_accept_id' });
        await message.reply(lang === 'pid'
          ? `📥 *Accept Pickup by ID*\n\nEnter the Pickup ID:\n(e.g. PU-XXXXXX)\n\nOr type *0* to go back.`
          : `📥 *Accept Pickup by ID*\n\nEnter the Pickup ID:\n(e.g. PU-XXXXXX)\n\nOr type *0* to go back.`);
        return;
      }
      case 3: {
        session.set(phone, { step: 'col_complete_id' });
        await message.reply(lang === 'pid'
          ? `📤 *Complete Pickup*\n\nEnter the Pickup ID to mark complete:\n(e.g. PU-XXXXXX)\n\nOr type *0* to go back.`
          : `📤 *Complete Pickup*\n\nEnter the Pickup ID to mark complete:\n(e.g. PU-XXXXXX)\n\nOr type *0* to go back.`);
        return;
      }
      case 4: return viewMyRoute(client, message, phone, sess);
      case 5: return viewInventory(client, message, phone, sess);
      case 6: {
        session.set(phone, { step: 'marketplace_sub' });
        await message.reply(lang === 'pid'
          ? `🛒 *Marketplace*\n\n1️⃣ Post New Listing\n2️⃣ My Listings\n3️⃣ My Incoming Offers\n4️⃣ Back\n\nReply with number.`
          : `🛒 *Marketplace*\n\n1️⃣ Post New Listing\n2️⃣ My Listings\n3️⃣ My Incoming Offers\n4️⃣ Back\n\nReply with number.`);
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
