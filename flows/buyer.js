const session = require('../utils/session');
const storage = require('../utils/storage');
const { msg } = require('../utils/messages');
const { generateEcoId, generateId, timestamp, formatDate, materialEmoji } = require('../utils/helpers');
const { isValidPhone, isValidName, isMenuChoice, getMenuChoice, isPositiveNumber } = require('../utils/validators');
const { viewListings, handleOffer } = require('./marketplace');

const MATERIAL_INTERESTS = ['PET Bottles', 'Aluminum & Metals', 'Nylon & Plastics', 'Paper & Cartons', 'Mixed Recyclables', 'All Materials'];
const VOLUMES = ['0–1 tonne/month', '1–5 tonnes/month', '5–20 tonnes/month', '20+ tonnes/month'];

// ── REGISTRATION ──────────────────────────────────────────────────────────────
async function handleRegistration(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;

  switch (sess.step) {
    case 'buyer_reg_company': {
      if (!isValidName(body)) { await message.reply(msg('invalidName', lang)); return; }
      session.setData(phone, 'buyerCompany', body);
      session.set(phone, { step: 'buyer_reg_contact' });
      await message.reply(lang === 'pid' ? '✅ Wetin be your name (contact person)?' : '✅ Contact person\'s name?');
      return;
    }
    case 'buyer_reg_contact': {
      if (!isValidName(body)) { await message.reply(msg('invalidName', lang)); return; }
      session.setData(phone, 'buyerContact', body);
      session.set(phone, { step: 'buyer_reg_interest' });
      const list = MATERIAL_INTERESTS.map((m, i) => `${i + 1}. ${m}`).join('\n');
      await message.reply(lang === 'pid' ? `✅ Wetin material you dey find?\n\n${list}\n\nReply with number.` : `✅ Material interest?\n\n${list}\n\nReply with number.`);
      return;
    }
    case 'buyer_reg_interest': {
      if (!isMenuChoice(body, MATERIAL_INTERESTS.length)) { await message.reply(msg('invalidChoice', lang)); return; }
      session.setData(phone, 'buyerInterest', MATERIAL_INTERESTS[getMenuChoice(body) - 1]);
      session.set(phone, { step: 'buyer_reg_volume' });
      const vlist = VOLUMES.map((v, i) => `${i + 1}. ${v}`).join('\n');
      await message.reply(lang === 'pid' ? `✅ Monthly volume?\n\n${vlist}\n\nReply with number.` : `✅ Monthly volume needed?\n\n${vlist}\n\nReply with number.`);
      return;
    }
    case 'buyer_reg_volume': {
      if (!isMenuChoice(body, VOLUMES.length)) { await message.reply(msg('invalidChoice', lang)); return; }
      session.setData(phone, 'buyerVolume', VOLUMES[getMenuChoice(body) - 1]);
      session.set(phone, { step: 'buyer_reg_location' });
      await message.reply(lang === 'pid' ? '✅ Enter your company location:' : '✅ Company location / city?');
      return;
    }
    case 'buyer_reg_location': {
      const d = sess.data;
      const ecoId = generateEcoId('buyer');
      const buyer = {
        id: ecoId,
        phone,
        companyName: d.buyerCompany,
        contactPerson: d.buyerContact,
        materialInterest: d.buyerInterest,
        monthlyVolume: d.buyerVolume,
        location: body,
        lang,
        savedCollectors: [],
        verified: false,
        registeredAt: timestamp()
      };
      storage.insert('buyers', buyer);
      session.set(phone, { step: 'buyer_menu' });
      await message.reply(lang === 'pid'
        ? `✅ *Registration Complete!*\n\nBuyer ID: *${ecoId}*\n\nWelcome to EcoSort Marketplace! 🏭`
        : `✅ *Registration Successful!*\n\nBuyer ID: *${ecoId}*\n\nWelcome to EcoSort Marketplace! 🏭`);
      await message.reply(msg('buyerMenu', lang));
      return;
    }
  }
}

// ── 4. MY OFFERS ──────────────────────────────────────────────────────────────
async function viewMyOffers(client, message, phone, sess) {
  const lang = sess.lang;
  const offers = storage.findAll('offers', o => o.buyerPhone === phone);
  if (offers.length === 0) {
    await message.reply(lang === 'pid' ? '📭 You never send any offer yet.' : '📭 No offers yet. Browse listings and make an offer!');
    session.set(phone, { step: 'buyer_menu' });
    await message.reply(msg('buyerMenu', lang));
    return;
  }
  const statusEmoji = { pending: '⏳', accepted: '✅', rejected: '❌', countered: '🔄' };
  const lines = offers.reverse().slice(0, 6).map(o =>
    `• *${o.id}*\n  Listing: ${o.listingId} | ₦${o.offerPrice}/kg\n  ${statusEmoji[o.status] || '⏳'} ${o.status.toUpperCase()} | ${formatDate(o.createdAt)}`
  ).join('\n\n');
  await message.reply(lang === 'pid' ? `📋 *Your Offers:*\n\n${lines}` : `📋 *Your Offers:*\n\n${lines}`);
  session.set(phone, { step: 'buyer_menu' });
  await message.reply(msg('buyerMenu', lang));
}

// ── 5. MY TRANSACTIONS ────────────────────────────────────────────────────────
async function viewTransactions(client, message, phone, sess) {
  const lang = sess.lang;
  const txns = storage.findAll('transactions', t => t.buyerPhone === phone);
  if (txns.length === 0) {
    await message.reply(lang === 'pid' ? '📭 You never do any transaction yet.' : '📭 No transactions yet.');
    session.set(phone, { step: 'buyer_menu' });
    await message.reply(msg('buyerMenu', lang));
    return;
  }
  const lines = [...txns].reverse().slice(0, 5).map(t =>
    `📋 *${t.id}*\n   ${materialEmoji(t.material)} | ${t.quantity}kg | ₦${t.agreedPrice}/kg\n   💵 ₦${(t.totalValue || 0).toLocaleString()} | ✅ ${t.status}\n   📅 ${formatDate(t.createdAt)}`
  ).join('\n\n');
  await message.reply(lang === 'pid' ? `📋 *Your Transactions:*\n\n${lines}` : `📋 *Your Transactions:*\n\n${lines}`);
  session.set(phone, { step: 'buyer_menu' });
  await message.reply(msg('buyerMenu', lang));
}

// ── 6. ESG CERTIFICATES ───────────────────────────────────────────────────────
async function viewCertificates(client, message, phone, sess) {
  const lang = sess.lang;
  const buyer = storage.findOne('buyers', b => b.phone === phone);
  const txns = storage.findAll('transactions', t => t.buyerPhone === phone && t.status === 'confirmed');

  if (txns.length === 0) {
    await message.reply(lang === 'pid'
      ? '📭 No ESG certificate yet. Complete a transaction first!'
      : '📭 No ESG certificates yet. Complete a purchase to generate your certificate!');
    session.set(phone, { step: 'buyer_menu' });
    await message.reply(msg('buyerMenu', lang));
    return;
  }

  const total = txns.reduce((acc, t) => acc + (t.quantity || 0), 0);
  const certLines = txns.slice(0, 3).map(t => {
    const certId = `CERT-${t.id}`;
    const cert = {
      id: certId,
      transactionId: t.id,
      buyerName: buyer ? buyer.companyName : 'Buyer',
      material: t.material,
      quantity: t.quantity,
      agreedPrice: t.agreedPrice,
      gps: t.gps,
      chainOfCustody: [
        { step: 'Collection', actor: 'EcoSort Collector', date: t.createdAt },
        { step: 'Verification', actor: 'EcoSort Platform', date: timestamp() },
        { step: 'Transfer', actor: buyer ? buyer.companyName : 'Buyer', date: timestamp() }
      ],
      verificationCode: `ECO-${certId}`,
      issuedAt: timestamp()
    };
    if (!storage.findOne('certificates', c => c.id === certId)) storage.insert('certificates', cert);
    return `🏅 *${certId}*\n   ${materialEmoji(t.material)} | ${t.quantity}kg | ${formatDate(t.createdAt)}\n   Verify: ECO-${certId}`;
  }).join('\n\n');

  await message.reply(lang === 'pid'
    ? `🌿 *Your ESG Certificates*\n\n${certLines}\n\n📊 Total Material: *${total}kg*\n\n✅ These certificates verify your recycling chain-of-custody for ESG/CSR reporting.`
    : `🌿 *Your ESG Certificates*\n\n${certLines}\n\n📊 Total Sourced: *${total}kg*\n\n✅ Submit these for ESG/CSR reporting.`);

  session.set(phone, { step: 'buyer_menu' });
  await message.reply(msg('buyerMenu', lang));
}

// ── 7. SAVED COLLECTORS ───────────────────────────────────────────────────────
async function handleSavedCollectors(client, message, phone, sess) {
  const lang = sess.lang;
  const body = message.body.trim();

  if (sess.step === 'save_collector_id') {
    const collector = storage.findOne('collectors', c =>
      c.id.toUpperCase() === body.toUpperCase() || c.phone === body);
    if (!collector) {
      await message.reply(lang === 'pid' ? '❌ Collector ID no exist.' : '❌ Collector not found. Check the ID and try again.');
      session.set(phone, { step: 'buyer_menu' });
      await message.reply(msg('buyerMenu', lang));
      return;
    }
    const buyer = storage.findOne('buyers', b => b.phone === phone);
    const saved = buyer ? [...(buyer.savedCollectors || [])] : [];
    if (!saved.includes(collector.id)) {
      saved.push(collector.id);
      storage.update('buyers', b => b.phone === phone, { savedCollectors: saved });
    }
    await message.reply(lang === 'pid'
      ? `✅ *${collector.name}* don saved!\n\nCollector ID: ${collector.id}\nArea: ${collector.area}\nSpecialty: ${collector.specialty}\n⭐ Rating: ${collector.rating || 5.0}/5`
      : `✅ *${collector.name}* saved!\n\nCollector ID: ${collector.id}\nArea: ${collector.area}\nSpecialty: ${collector.specialty}\n⭐ Rating: ${collector.rating || 5.0}/5`);
    session.set(phone, { step: 'buyer_menu' });
    await message.reply(msg('buyerMenu', lang));
    return;
  }

  // Show saved collectors
  const buyer = storage.findOne('buyers', b => b.phone === phone);
  const savedIds = buyer ? (buyer.savedCollectors || []) : [];

  if (savedIds.length === 0) {
    await message.reply(lang === 'pid'
      ? `📭 You never save any collector.\n\nTo save one, enter their Collector ID:\n\nReply with a Collector ID (e.g. ECO-COL-1042) or type *skip* to go back.`
      : `📭 No saved collectors yet.\n\nSave a collector by entering their ID:\n\nReply with Collector ID (e.g. ECO-COL-1042) or type *skip* to go back.`);
    session.set(phone, { step: 'save_collector_id' });
    return;
  }

  const collectors = savedIds.map(id => storage.findOne('collectors', c => c.id === id)).filter(Boolean);
  const lines = collectors.map(c =>
    `⭐ *${c.name}*\n   ID: ${c.id}\n   Area: ${c.area} | ${c.specialty}\n   Rating: ${c.rating || 5.0}/5 | ${c.verified ? '✅ Verified' : 'Unverified'}`
  ).join('\n\n');

  await message.reply(lang === 'pid'
    ? `⭐ *Your Saved Collectors:*\n\n${lines}\n\nReply with a Collector ID to save another, or type *skip* to go back.`
    : `⭐ *Your Saved Collectors:*\n\n${lines}\n\nReply with a Collector ID to add another, or type *skip* to go back.`);
  session.set(phone, { step: 'save_collector_id' });
}

// ── 8. MY PROFILE ─────────────────────────────────────────────────────────────
async function viewProfile(client, message, phone, sess) {
  const lang = sess.lang;
  const buyer = storage.findOne('buyers', b => b.phone === phone);
  if (!buyer) { await message.reply(msg('notRegistered', lang)); return; }
  const verifiedBadge = buyer.verified ? '✅ Verified Buyer' : '⏳ Unverified';
  await message.reply(lang === 'pid'
    ? `👤 *Your Profile*\n\n🆔 ID: ${buyer.id}\n🏢 Company: ${buyer.companyName}\n👤 Contact: ${buyer.contactPerson}\n♻️ Interest: ${buyer.materialInterest}\n📦 Volume: ${buyer.monthlyVolume}\n📍 Location: ${buyer.location}\n${verifiedBadge}\n📅 Joined: ${formatDate(buyer.registeredAt)}`
    : `👤 *Your Profile*\n\n🆔 ID: ${buyer.id}\n🏢 Company: ${buyer.companyName}\n👤 Contact: ${buyer.contactPerson}\n♻️ Material Interest: ${buyer.materialInterest}\n📦 Monthly Volume: ${buyer.monthlyVolume}\n📍 Location: ${buyer.location}\n${verifiedBadge}\n📅 Joined: ${formatDate(buyer.registeredAt)}`);
  session.set(phone, { step: 'buyer_menu' });
  await message.reply(msg('buyerMenu', lang));
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
async function handle(client, message, phone, sess) {
  const body = message.body.trim().toLowerCase();
  const rawBody = message.body.trim();
  const lang = sess.lang;

  if (['buyer_reg_company','buyer_reg_contact','buyer_reg_interest','buyer_reg_volume','buyer_reg_location'].includes(sess.step)) {
    return handleRegistration(client, message, phone, sess);
  }
  if (['offer_listing_id','offer_price','offer_counter'].includes(sess.step)) return handleOffer(client, message, phone, sess);
  if (sess.step === 'save_collector_id') {
    if (body === 'skip') {
      session.set(phone, { step: 'buyer_menu' });
      await message.reply(msg('buyerMenu', lang));
      return;
    }
    return handleSavedCollectors(client, message, phone, sess);
  }

  if (body === 'register') {
    const existing = storage.findOne('buyers', b => b.phone === phone);
    if (existing) {
      await message.reply(lang === 'pid' ? '✅ You don already register!' : '✅ Already registered!');
      session.set(phone, { step: 'buyer_menu' });
      await message.reply(msg('buyerMenu', lang));
      return;
    }
    session.set(phone, { step: 'buyer_reg_company' });
    await message.reply(lang === 'pid' ? '🏭 *Buyer Registration*\n\nWetin be your company name?' : '🏭 *Buyer Registration*\n\nCompany name?');
    return;
  }

  if (sess.step === 'buyer_menu' && isMenuChoice(rawBody, 8)) {
    const choice = getMenuChoice(rawBody);
    switch (choice) {
      case 1: {
        session.set(phone, { step: 'market_search' });
        await message.reply(lang === 'pid'
          ? '🔍 Enter material or location (e.g. PET, Ikeja, Aluminum):'
          : '🔍 Enter material or location to search (e.g. PET, Ikeja, Aluminum):');
        return;
      }
      case 2: {
        await viewListings(client, message, phone, sess);
        session.set(phone, { step: 'buyer_menu' });
        await message.reply(msg('buyerMenu', lang));
        return;
      }
      case 3: {
        session.set(phone, { step: 'offer_listing_id' });
        await message.reply(lang === 'pid' ? '💰 Enter the Listing ID you wan make offer on:' : '💰 Enter the Listing ID to make an offer on:');
        return;
      }
      case 4: return viewMyOffers(client, message, phone, sess);
      case 5: return viewTransactions(client, message, phone, sess);
      case 6: return viewCertificates(client, message, phone, sess);
      case 7: return handleSavedCollectors(client, message, phone, sess);
      case 8: return viewProfile(client, message, phone, sess);
    }
  }

  await message.reply(msg('buyerMenu', lang));
}

module.exports = { handle };
