const session = require('../utils/session');
const storage = require('../utils/storage');
const { msg } = require('../utils/messages');
const { generateId, timestamp, formatDate, materialEmoji } = require('../utils/helpers');
const { isMenuChoice, getMenuChoice, isPositiveNumber } = require('../utils/validators');

const MATERIALS = ['PET', 'Aluminum', 'Nylon', 'HDPE', 'Carton', 'Mixed', 'Glass', 'Metal'];

// ── CREATE LISTING ────────────────────────────────────────────────────────────
async function handleCreateListing(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;

  if (sess.step === 'market_list_material') {
    if (!isMenuChoice(body, MATERIALS.length)) { await message.reply(msg('invalidChoice', lang)); return; }
    session.setData(phone, 'listMaterial', MATERIALS[getMenuChoice(body) - 1]);
    session.set(phone, { step: 'market_list_qty' });
    await message.reply(lang === 'pid' ? '✅ How many KG you get? (e.g. 50):' : '✅ How many KG available? (e.g. 50):');
    return;
  }

  if (sess.step === 'market_list_qty') {
    if (!isPositiveNumber(body)) { await message.reply(lang === 'pid' ? '❌ Enter valid number.' : '❌ Enter a valid number.'); return; }
    session.setData(phone, 'listQty', parseFloat(body));
    session.set(phone, { step: 'market_list_price' });
    await message.reply(lang === 'pid' ? '✅ Wetin be your price per KG? (₦, e.g. 150):' : '✅ Price per KG? (₦, e.g. 150):');
    return;
  }

  if (sess.step === 'market_list_price') {
    if (!isPositiveNumber(body)) { await message.reply(lang === 'pid' ? '❌ Enter valid price.' : '❌ Enter a valid price.'); return; }
    session.setData(phone, 'listPrice', parseFloat(body));
    session.set(phone, { step: 'market_list_location' });
    await message.reply(lang === 'pid' ? '✅ Enter your pickup location:' : '✅ Enter your pickup location:');
    return;
  }

  if (sess.step === 'market_list_location') {
    session.setData(phone, 'listLocation', body);
    session.set(phone, { step: 'market_list_notes' });
    await message.reply(lang === 'pid'
      ? '✅ Any extra info? (e.g. "Baled", "Sorted", "Clean") or type *skip*:'
      : '✅ Any additional notes? (e.g. "Baled", "Sorted", "Clean") or type *skip*:');
    return;
  }

  if (sess.step === 'market_list_notes') {
    const d = sess.data;
    const notes = body.toLowerCase() === 'skip' ? '' : body;
    const collector = storage.findOne('collectors', c => c.phone === phone);
    const listingId = generateId('LST');

    const listing = {
      id: listingId,
      collectorPhone: phone,
      collectorName: collector ? collector.name : 'Collector',
      collectorId: collector ? collector.id : phone,
      collectorRating: collector ? (collector.rating || 5.0) : 5.0,
      collectorVerified: collector ? (collector.verified || false) : false,
      material: d.listMaterial,
      quantity: d.listQty,
      pricePerKg: d.listPrice,
      totalValue: d.listQty * d.listPrice,
      location: d.listLocation,
      notes,
      status: 'available',
      createdAt: timestamp(),
      updatedAt: timestamp()
    };

    // Safety check: if collector not FULL_COLLECTOR, require quick guides read
    const badges = (collector && collector.badges) || [];
    if (!badges.includes('FULL_COLLECTOR')) {
      // Save draft temporarily in session and prompt safety confirmation
      session.setData(phone, 'listingDraft', listing);
      session.set(phone, { step: 'market_safety_confirm' });
      await message.reply(`⚠️ Safety check — ${d.listMaterial}\nReply with:\n1. Post Listing\n2. Show me the safety guides`);
      return;
    }

    // Instant save — no freeze
    storage.insert('listings', listing);

    const role = sess.role;
    session.set(phone, { step: role === 'collector' ? 'collector_menu' : 'household_menu' });
    const menuKey = role === 'collector' ? 'collectorMenu' : 'mainMenu';

    await message.reply(lang === 'pid'
      ? `✅ *Listing Published!*\n\n🆔 *${listingId}*\n${materialEmoji(d.listMaterial)}\n📦 ${d.listQty}kg | ₦${d.listPrice}/kg\n💵 Total: ₦${(d.listQty * d.listPrice).toLocaleString()}\n📍 ${d.listLocation}${notes ? `\n📝 ${notes}` : ''}\n\nListing dey live now! Buyers can see am. 🎉`
      : `✅ *Listing Published!*\n\n🆔 *${listingId}*\n${materialEmoji(d.listMaterial)}\n📦 ${d.listQty}kg | ₦${d.listPrice}/kg\n💵 Total: ₦${(d.listQty * d.listPrice).toLocaleString()}\n📍 ${d.listLocation}${notes ? `\n📝 ${notes}` : ''}\n\nListing is live! Buyers can see it now. 🎉`);

    await message.reply(msg(menuKey, lang));
    return;
  }
}

// ── VIEW ALL LISTINGS — numbered, interactive select ──────────────────────────
async function viewListings(client, message, phone, sess) {
  const lang = sess.lang;
  const listings = storage.findAll('listings', l => l.status === 'available');

  if (listings.length === 0) {
    await message.reply(lang === 'pid'
      ? `📭 *No Listings Yet*\n\nNo material listing dey available right now.\n\nCollectors post materials after completing pickups. Check back soon!`
      : `📭 *No Listings Available*\n\nNo materials listed right now.\n\nCollectors post materials after pickups. Check back soon!`);
    return [];
  }

  const shown = listings.slice(0, 8);
  const list = shown.map((l, i) =>
    `*${i + 1}.* ${materialEmoji(l.material)} *${l.material}*  |  ${l.quantity}kg  |  ₦${l.pricePerKg}/kg\n` +
    `   💵 ₦${l.totalValue.toLocaleString()}  |  📍 ${l.location}\n` +
    `   👤 ${l.collectorName} ${l.collectorVerified ? '✅' : ''}  |  ⭐ ${l.collectorRating}/5` +
    (l.notes ? `\n   📝 ${l.notes}` : '')
  ).join('\n\n');

  await message.reply(
    (lang === 'pid'
      ? `🏪 *EcoSort Marketplace* (${listings.length} listing${listings.length !== 1 ? 's' : ''})\n\n`
      : `🏪 *EcoSort Marketplace* (${listings.length} available)\n\n`) +
    list + '\n\n' +
    (lang === 'pid'
      ? `Reply with a number (1–${shown.length}) to make an offer.\nOr *0* to go back.`
      : `Reply with a number (1–${shown.length}) to select a listing and make an offer.\nOr *0* to go back.`)
  );

  // Save listing IDs to session so buyer can select by number
  session.setData(phone, 'listingsInView', shown.map(l => l.id));
  session.set(phone, { step: 'market_browse_select' });
  return shown;
}

// ── SEARCH LISTINGS ───────────────────────────────────────────────────────────
async function handleSearch(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;

  if (sess.step === 'market_search') {
    const keyword = body.toUpperCase();
    const results = storage.findAll('listings', l =>
      l.status === 'available' &&
      (l.material.toUpperCase().includes(keyword) ||
       l.location.toUpperCase().includes(keyword) ||
       (l.collectorName || '').toUpperCase().includes(keyword))
    );

    if (results.length === 0) {
      await message.reply(lang === 'pid'
        ? `📭 No result for "${body}".\n\nTry a different material name or area (e.g. "PET", "Aluminum", "Ikeja").`
        : `📭 No listings found for "${body}".\n\nTry a different material or location (e.g. "PET", "Aluminum", "Ikeja").`);
      // Return to menu on no results
      const role = sess.role;
      session.set(phone, { step: role === 'buyer' ? 'buyer_menu' : role === 'collector' ? 'collector_menu' : 'household_menu' });
      await message.reply(msg(role === 'buyer' ? 'buyerMenu' : role === 'collector' ? 'collectorMenu' : 'mainMenu', lang));
      return;
    }

    const shown = results.slice(0, 5);
    const list = shown.map((l, i) =>
      `*${i + 1}.* ${materialEmoji(l.material)} *${l.material}*  |  ${l.quantity}kg  |  ₦${l.pricePerKg}/kg\n` +
      `   💵 ₦${l.totalValue.toLocaleString()}  |  📍 ${l.location}\n` +
      `   👤 ${l.collectorName} ${l.collectorVerified ? '✅' : ''}  |  ⭐ ${l.collectorRating}/5`
    ).join('\n\n');

    await message.reply(
      `🔍 *Results for "${body}" (${shown.length}):*\n\n${list}\n\n` +
      (lang === 'pid'
        ? `Reply with a number (1–${shown.length}) to make an offer.\nOr *0* to go back.`
        : `Reply with a number (1–${shown.length}) to select and make an offer.\nOr *0* to go back.`)
    );

    // For buyers: flow directly into the offer step
    if (sess.role === 'buyer') {
      session.setData(phone, 'listingsInView', shown.map(l => l.id));
      session.set(phone, { step: 'market_browse_select' });
    } else {
      const role = sess.role;
      session.set(phone, { step: role === 'collector' ? 'collector_menu' : 'household_menu' });
      await message.reply(msg(role === 'collector' ? 'collectorMenu' : 'mainMenu', lang));
    }
  }
}

// Handle safety confirmation step
async function handleSafetyConfirm(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;
  const collector = storage.findOne('collectors', c => c.phone === phone);
  const draft = sess.data.listingDraft;
  if (!draft) { session.set(phone, { step: 'collector_menu' }); await message.reply(msg('collectorMenu', lang)); return; }

  if (body === '1' || body.toLowerCase() === 'post') {
    storage.insert('listings', draft);
    session.set(phone, { step: 'collector_menu' });
    await message.reply(lang === 'pid'
      ? `✅ *Listing Published!*\n\n🆔 *${draft.id}*\n${materialEmoji(draft.material)}\n📦 ${draft.quantity}kg | ₦${draft.pricePerKg}/kg\n\nListing dey live.`
      : `✅ *Listing Published!*\n\n🆔 *${draft.id}*\n${materialEmoji(draft.material)}\n📦 ${draft.quantity}kg | ₦${draft.pricePerKg}/kg\n\nListing is live.`);
    await message.reply(msg('collectorMenu', lang));
    return;
  }

  if (body === '2' || body.toLowerCase().includes('guide')) {
    // Send three short safety guides and award FULL_COLLECTOR badge
    const guides = [
      `⚙️ *Metal Safety*\nUse gloves, avoid sharp edges, keep metals separate.`,
      `🍃 *Organic / Compostable*\nBag organic waste separately; avoid liquids that contaminate recyclables.`,
      `🔌 *E-waste Safety*\nHandle batteries carefully; store leaks in sealed bag and labelled.`
    ];
    for (const g of guides) {
      try { await message.reply(g); } catch (_) {}
    }
    // mark collector safety read
    const badges = (collector.badges || []);
    if (!badges.includes('FULL_COLLECTOR')) {
      const newBadges = [...badges, 'FULL_COLLECTOR'];
      storage.update('collectors', c => c.phone === phone, { badges: newBadges });
    }
    // publish draft
    storage.insert('listings', draft);
    session.set(phone, { step: 'collector_menu' });
    await message.reply(lang === 'pid'
      ? `✅ You don read the guides. FULL_COLLECTOR badge don added. Listing published.`
      : `✅ Guides seen. FULL_COLLECTOR badge added. Listing published.`);
    await message.reply(msg('collectorMenu', lang));
    return;
  }

  await message.reply(msg('invalidChoice', lang));
}

// ── MAKE OFFER ────────────────────────────────────────────────────────────────
async function handleOffer(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;

  if (sess.step === 'offer_listing_id') {
    const listing = storage.findOne('listings', l => l.id.toUpperCase() === body.toUpperCase());
    if (!listing) {
      await message.reply(lang === 'pid' ? '❌ Listing ID no exist. Check again:' : '❌ Listing not found. Check the ID:');
      return;
    }
    if (listing.status !== 'available') {
      await message.reply(lang === 'pid' ? '❌ That listing don sold already.' : '❌ That listing is no longer available.');
      session.set(phone, { step: 'buyer_menu' });
      await message.reply(msg('buyerMenu', lang));
      return;
    }
    // Save listing to session and show the unified action screen (Accept Price / Make Offer)
    session.setData(phone, 'offerListingId', listing.id);
    session.setData(phone, 'offerListingCollectorPhone', listing.collectorPhone);
    session.setData(phone, 'offerOriginalPrice', listing.pricePerKg);
    session.set(phone, { step: 'market_listing_action' });
    await message.reply(
      `${materialEmoji(listing.material)} *${listing.material}*\n\n` +
      `Quantity: *${listing.quantity}kg*\n` +
      `Listed Price: *₦${listing.pricePerKg}/kg*\n` +
      `Total Value: ₦${listing.totalValue.toLocaleString()}\n` +
      `Location: 📍 ${listing.location}\n` +
      `Collector: ${listing.collectorName} ${listing.collectorVerified ? '✅ Verified' : ''}  |  ⭐ ${listing.collectorRating}/5\n` +
      (listing.notes ? `Notes: 📝 ${listing.notes}\n` : '') +
      `\n` +
      (lang === 'pid'
        ? `Wetin you wan do?\n\n1️⃣ Accept Price (₦${listing.pricePerKg}/kg) — Buy Now\n2️⃣ Make Offer — Negotiate Price\n3️⃣ Back\n\nReply with number.`
        : `What would you like to do?\n\n1️⃣ Accept Price (₦${listing.pricePerKg}/kg) — Purchase Now\n2️⃣ Make Offer — Negotiate a Different Price\n3️⃣ Back\n\nReply with number.`)
    );
    return;
  }

  if (sess.step === 'offer_price') {
    if (!isPositiveNumber(body)) { await message.reply(lang === 'pid' ? '❌ Enter valid price.' : '❌ Enter a valid price.'); return; }
    const listingId = sess.data.offerListingId;
    const collectorPhone = sess.data.offerListingCollectorPhone;
    const listing = storage.findOne('listings', l => l.id === listingId);
    const buyer = storage.findOne('buyers', b => b.phone === phone);
    const offerId = generateId('OFR');

    const offer = {
      id: offerId,
      listingId,
      buyerPhone: phone,
      buyerName: buyer ? buyer.companyName : 'Buyer',
      collectorPhone,
      offerPrice: parseFloat(body),
      originalPrice: sess.data.offerOriginalPrice,
      status: 'pending',
      createdAt: timestamp()
    };
    storage.insert('offers', offer);

    const offerPrice = parseFloat(body);
    const mat = listing ? materialEmoji(listing.material) : '';
    const qty = listing ? `${listing.quantity}kg` : '';
    const offerNotice =
      `💰 *New Offer Received!*\n\n` +
      `Offer ID: *${offerId}*\n` +
      `Listing: ${listingId}  ${mat} ${qty}\n` +
      `From: *${buyer ? buyer.companyName : 'Buyer'}*\n` +
      `Their Offer: *₦${offerPrice}/kg*\n` +
      `Listed Price: ₦${sess.data.offerOriginalPrice || '?'}/kg\n\n` +
      `To respond, type ONE of these:\n` +
      `✅  accept ${offerId}\n` +
      `❌  reject ${offerId}\n` +
      `🔄  counter ${offerId} [your price]  (e.g. counter ${offerId} 180)\n\n` +
      `Or go to Marketplace → My Offers to see all pending offers.`;

    // Notify ALL collectors so demo works without a real backend
    const allCols = storage.readAll('collectors');
    for (const col of allCols) {
      try { await client.sendMessage(`${col.phone}@c.us`, offerNotice); } catch (_) {}
    }

    session.set(phone, { step: 'buyer_menu' });
    await message.reply(
      `✅ *Offer Sent!*\n\n` +
      `Offer ID: *${offerId}*\n` +
      `Listing: ${listingId}  ${mat} ${qty}\n` +
      `Your Offer: *₦${offerPrice}/kg*\n\n` +
      (lang === 'pid'
        ? `Collector don receive your offer. You go hear back soon.\n\nCheck your offer status anytime from *My Offers* in your dashboard. 🤝`
        : `The collector has been notified and will respond shortly.\n\nTrack this offer anytime via *My Offers* in your dashboard. 🤝`)
    );
    await message.reply(msg('buyerMenu', lang));
  }
}

// ── OFFER RESPONSE: accept / reject / counter ─────────────────────────────────
async function handleOfferResponse(client, message, phone, sess) {
  const body = message.body.trim();
  const lang = sess.lang;
  const parts = body.toLowerCase().split(' ');
  const action = parts[0];
  const offerId = (parts[1] || '').toUpperCase();
  const counterPrice = parts[2] ? parseFloat(parts[2]) : null;

  const offer = storage.findOne('offers', o => o.id.toUpperCase() === offerId);
  if (!offer) return false;

  if (action === 'accept') {
    storage.update('offers', o => o.id === offer.id, { status: 'accepted', updatedAt: timestamp() });
    const txnId = generateId('TXN');
    const listing = storage.findOne('listings', l => l.id === offer.listingId);
    const mat = listing ? materialEmoji(listing.material) : '';
    const qty = listing ? listing.quantity : 0;
    const agreedPrice = offer.counterPrice || offer.offerPrice;
    const totalValue = qty * agreedPrice;

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
    storage.update('listings', l => l.id === offer.listingId, { status: 'sold', updatedAt: timestamp() });

    // Notify buyer
    try {
      await client.sendMessage(`${offer.buyerPhone}@c.us`,
        `✅ *Offer Accepted — Deal Done!*\n\n` +
        `Transaction ID: *${txnId}*\n` +
        `Offer: ${offerId}\n` +
        `Material: ${mat} ${listing ? listing.material : ''}\n` +
        `Quantity: *${qty}kg*\n` +
        `Agreed Price: *₦${agreedPrice}/kg*\n` +
        `Total Value: *₦${totalValue.toLocaleString()}*\n\n` +
        `Next step: Coordinate pickup/delivery directly with the collector.\n` +
        `Your ESG certificate will be available in your dashboard once complete. 🎉`
      );
    } catch (_) {}

    // Confirm to collector
    await message.reply(
      `✅ *Offer ${offerId} Accepted!*\n\n` +
      `Transaction ID: *${txnId}*\n` +
      `Buyer: ${offer.buyerName}\n` +
      `Agreed Price: *₦${agreedPrice}/kg*\n` +
      `Total Value: *₦${totalValue.toLocaleString()}*\n\n` +
      `Contact the buyer to arrange pickup/delivery. 🤝`
    );
    return true;
  }

  if (action === 'reject') {
    storage.update('offers', o => o.id === offer.id, { status: 'rejected', updatedAt: timestamp() });

    // Notify buyer
    try {
      await client.sendMessage(`${offer.buyerPhone}@c.us`,
        `❌ *Offer Declined*\n\n` +
        `Offer ID: ${offerId} was declined by the collector.\n\n` +
        `You can:\n` +
        `• Make a new offer on this or another listing\n` +
        `• Browse other materials from your Buyer Dashboard`
      );
    } catch (_) {}

    await message.reply(`❌ Offer *${offerId}* declined. The buyer has been notified.`);
    return true;
  }

  // ── COUNTER OFFER ────────────────────────────────────────────────────────────
  if (action === 'counter') {
    if (!counterPrice || isNaN(counterPrice) || counterPrice <= 0) {
      await message.reply(
        `❌ Wrong format. Use:\n\n` +
        `*counter ${offerId} [your price]*\n\n` +
        `Example: counter ${offerId} 180`
      );
      return true;
    }
    storage.update('offers', o => o.id === offer.id, {
      status: 'countered',
      counterPrice,
      updatedAt: timestamp()
    });

    // Notify buyer with clear action prompts
    try {
      await client.sendMessage(`${offer.buyerPhone}@c.us`,
        `🔄 *Counter Offer Received!*\n\n` +
        `Offer ID: *${offerId}*\n` +
        `Your Offer: ₦${offer.offerPrice}/kg\n` +
        `Collector's Counter: *₦${counterPrice}/kg*\n\n` +
        `To respond, type ONE of these:\n` +
        `✅  accept ${offerId}    (agree to ₦${counterPrice}/kg)\n` +
        `❌  reject ${offerId}    (decline and walk away)\n\n` +
        `Check all your offers via *My Offers* in your dashboard.`
      );
    } catch (_) {}

    await message.reply(
      `🔄 Counter offer sent!\n\n` +
      `Offer: ${offerId}\n` +
      `Counter Price: *₦${counterPrice}/kg*\n\n` +
      `Waiting for the buyer's response. You'll be notified when they decide.`
    );
    return true;
  }

  return false;
}

// ── ENTRY: show listing menu (no body processing) ─────────────────────────────
async function startListing(client, message, phone, sess) {
  const lang = sess.lang;
  session.set(phone, { step: 'market_list_material' });
  const matList = MATERIALS.map((m, i) => `${i + 1}. ${materialEmoji(m)}`).join('\n');
  await message.reply(lang === 'pid'
    ? `♻️ *Post Listing*\n\nWetin material you wan sell?\n\n${matList}\n\nReply with number.`
    : `♻️ *Post Listing*\n\nWhat material are you listing?\n\n${matList}\n\nReply with number.`);
}

// ── COLLECTOR: VIEW ALL OFFERS (demo — visible to any collector) ──────────────
async function viewCollectorOffers(client, message, phone, sess) {
  const lang = sess.lang;

  // DEMO MODE: all collectors can see all pending offers so the full
  // negotiation flow can be demonstrated without a per-collector backend.
  const pending  = storage.findAll('offers', o => o.status === 'pending' || o.status === 'countered');
  const myOffers = storage.findAll('offers', o => o.collectorPhone === phone && !['pending','countered'].includes(o.status));
  const offers   = [...pending, ...myOffers].slice(0, 10);

  if (offers.length === 0) {
    await message.reply(lang === 'pid'
      ? `📭 *No Offers Yet*\n\nNo buyer don submit any offer yet.\n\nMake sure you have active listings so buyers can find your materials!`
      : `📭 *No Offers Yet*\n\nNo buyers have submitted offers yet.\n\nMake sure you have active listings so buyers can find your materials!`);
    return;
  }

  const statusEmoji = { pending: '⏳', accepted: '✅', rejected: '❌', countered: '🔄' };

  const lines = offers.map(o => {
    const listing = storage.findOne('listings', l => l.id === o.listingId);
    const mat = listing ? `${materialEmoji(listing.material)} ${listing.material} ${listing.quantity}kg` : o.listingId;
    let line = `${statusEmoji[o.status] || '⏳'} *${o.id}*\n`;
    line += `   ${mat}\n`;
    line += `   From: ${o.buyerName}  |  Offer: *₦${o.offerPrice}/kg*`;
    if (o.counterPrice) line += `\n   Your Counter: ₦${o.counterPrice}/kg`;
    line += `\n   Status: ${o.status.toUpperCase()}`;
    return line;
  }).join('\n\n');

  const needsResponse = offers.filter(o => o.status === 'pending' || o.status === 'countered');
  const actionNote = needsResponse.length > 0
    ? `\n\n⚠️ *${needsResponse.length} offer(s) need a response:*\n\nType one of:\n✅  accept [OFFER-ID]\n❌  reject [OFFER-ID]\n🔄  counter [OFFER-ID] [price]`
    : `\n\n_No pending offers require action._`;

  await message.reply(
    (lang === 'pid' ? `💬 *All Incoming Offers:*\n\n` : `💬 *All Incoming Offers:*\n\n`) +
    lines + actionNote
  );
}

// ── MAIN HANDLE ───────────────────────────────────────────────────────────────
async function handle(client, message, phone, sess) {
  const body = message.body.trim().toLowerCase();
  const lang = sess.lang;

  if (body.startsWith('accept ') || body.startsWith('reject ') || body.startsWith('counter ')) {
    const handled = await handleOfferResponse(client, message, phone, sess);
    if (handled) return;
  }

  if (['market_list_material','market_list_qty','market_list_price','market_list_location','market_list_notes'].includes(sess.step)) {
    return handleCreateListing(client, message, phone, sess);
  }
  if (sess.step === 'market_search') return handleSearch(client, message, phone, sess);
  if (sess.step === 'market_safety_confirm') return handleSafetyConfirm(client, message, phone, sess);
  if (['offer_listing_id','offer_price'].includes(sess.step)) return handleOffer(client, message, phone, sess);
}

module.exports = { handle, startListing, viewListings, handleOffer, handleOfferResponse, viewCollectorOffers };
