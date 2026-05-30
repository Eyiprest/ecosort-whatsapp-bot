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

// ── VIEW ALL LISTINGS ─────────────────────────────────────────────────────────
async function viewListings(client, message, phone, sess) {
  const lang = sess.lang;
  const listings = storage.findAll('listings', l => l.status === 'available');

  if (listings.length === 0) {
    await message.reply(lang === 'pid' ? '📭 No listing dey available now.' : '📭 No listings available right now.');
    return listings;
  }

  const list = listings.slice(0, 8).map((l, i) =>
    `*${i + 1}. ${l.id}*\n   ${materialEmoji(l.material)} | ${l.quantity}kg | ₦${l.pricePerKg}/kg\n   💵 ₦${l.totalValue.toLocaleString()} | 📍 ${l.location}\n   👤 ${l.collectorName} ${l.collectorVerified ? '✅' : ''} | ⭐ ${l.collectorRating}/5${l.notes ? `\n   📝 ${l.notes}` : ''}`
  ).join('\n\n');

  await message.reply(lang === 'pid'
    ? `🏪 *EcoSort Marketplace* (${listings.length} listings)\n\n${list}`
    : `🏪 *EcoSort Marketplace* (${listings.length} available)\n\n${list}`);

  return listings;
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
        ? `📭 No result for "${body}". Try another material or area name.`
        : `📭 No listings found for "${body}". Try a different material or location.`);
    } else {
      const list = results.slice(0, 5).map((l, i) =>
        `*${i + 1}. ${l.id}*\n   ${materialEmoji(l.material)} | ${l.quantity}kg | ₦${l.pricePerKg}/kg\n   📍 ${l.location} | ${l.collectorName} ${l.collectorVerified ? '✅' : ''}`
      ).join('\n\n');
      await message.reply(lang === 'pid'
        ? `🔍 *Results for "${body}":*\n\n${list}`
        : `🔍 *Results for "${body}":*\n\n${list}`);
    }

    const role = sess.role;
    session.set(phone, { step: role === 'buyer' ? 'buyer_menu' : role === 'collector' ? 'collector_menu' : 'household_menu' });
    await message.reply(msg(role === 'buyer' ? 'buyerMenu' : role === 'collector' ? 'collectorMenu' : 'mainMenu', lang));
  }
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
    session.setData(phone, 'offerListingId', listing.id);
    session.setData(phone, 'offerListingCollectorPhone', listing.collectorPhone);
    session.setData(phone, 'offerOriginalPrice', listing.pricePerKg);
    session.set(phone, { step: 'offer_price' });
    await message.reply(lang === 'pid'
      ? `✅ Listing found!\n\n${materialEmoji(listing.material)} | ${listing.quantity}kg\nCollector: ${listing.collectorName} ${listing.collectorVerified ? '✅' : ''}\nAsking: ₦${listing.pricePerKg}/kg\n📍 ${listing.location}${listing.notes ? `\n📝 ${listing.notes}` : ''}\n\nWetin be your offer price per kg? (₦):`
      : `✅ Listing found!\n\n${materialEmoji(listing.material)} | ${listing.quantity}kg\nCollector: ${listing.collectorName} ${listing.collectorVerified ? '✅' : ''}\nAsking Price: ₦${listing.pricePerKg}/kg\n📍 ${listing.location}${listing.notes ? `\n📝 ${listing.notes}` : ''}\n\nYour offer price per kg? (₦):`);
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

    try {
      await client.sendMessage(`${collectorPhone}@c.us`,
        lang === 'pid'
          ? `💰 *New Offer!*\n\nOffer ID: ${offerId}\nListing: ${listingId}\nFrom: ${buyer ? buyer.companyName : 'Buyer'}\nOffer: ₦${parseFloat(body)}/kg\n\nReply:\n✅ *accept ${offerId}*\n❌ *reject ${offerId}*\n🔄 *counter ${offerId} [price]*`
          : `💰 *New Offer Received!*\n\nOffer ID: ${offerId}\nListing: ${listingId}\nFrom: ${buyer ? buyer.companyName : 'Buyer'}\nOffer: ₦${parseFloat(body)}/kg\n\nReply:\n✅ *accept ${offerId}*\n❌ *reject ${offerId}*\n🔄 *counter ${offerId} [price]* to counter-offer`
      );
    } catch (_) {}

    session.set(phone, { step: 'buyer_menu' });
    await message.reply(lang === 'pid'
      ? `✅ *Offer Sent!*\n\nOffer ID: *${offerId}*\nPrice: ₦${parseFloat(body)}/kg\n\nCollector don receive your offer. You go hear back soon. 🤝`
      : `✅ *Offer Sent!*\n\nOffer ID: *${offerId}*\nPrice: ₦${parseFloat(body)}/kg\n\nCollector has been notified. You'll hear back shortly. 🤝`);
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
    storage.insert('transactions', {
      id: txnId,
      offerId: offer.id,
      listingId: offer.listingId,
      buyerPhone: offer.buyerPhone,
      collectorPhone: phone,
      material: listing ? listing.material : 'Unknown',
      quantity: listing ? listing.quantity : 0,
      agreedPrice: offer.offerPrice,
      totalValue: listing ? listing.quantity * offer.offerPrice : 0,
      status: 'confirmed',
      gps: `6.${Math.floor(Math.random() * 9999)}, 3.${Math.floor(Math.random() * 9999)}`,
      createdAt: timestamp()
    });
    storage.update('listings', l => l.id === offer.listingId, { status: 'sold', updatedAt: timestamp() });

    try {
      await client.sendMessage(`${offer.buyerPhone}@c.us`,
        lang === 'pid'
          ? `✅ *Offer Accepted!*\n\nOffer ID: ${offerId}\nTransaction ID: ${txnId}\nAgreed Price: ₦${offer.offerPrice}/kg\n\nContact the collector to arrange the exchange. 🎉`
          : `✅ *Offer Accepted!*\n\nOffer ID: ${offerId}\nTransaction ID: ${txnId}\nAgreed Price: ₦${offer.offerPrice}/kg\n\nCoordinate with the collector to complete the exchange. 🎉`
      );
    } catch (_) {}

    await message.reply(lang === 'pid'
      ? `✅ Offer accepted! Transaction ID: *${txnId}*\n\nContact the buyer to arrange everything.`
      : `✅ Offer accepted! Transaction ID: *${txnId}*\n\nReach out to the buyer to coordinate.`);
    return true;
  }

  if (action === 'reject') {
    storage.update('offers', o => o.id === offer.id, { status: 'rejected', updatedAt: timestamp() });
    try {
      await client.sendMessage(`${offer.buyerPhone}@c.us`,
        lang === 'pid'
          ? `❌ Your offer *${offerId}* don rejected.\n\nTry make another offer or find another listing.`
          : `❌ Your offer *${offerId}* was declined.\n\nTry another offer or browse other listings.`
      );
    } catch (_) {}
    await message.reply(lang === 'pid' ? '✅ Offer rejected.' : '✅ Offer declined.');
    return true;
  }

  // ── COUNTER OFFER ────────────────────────────────────────────────────────────
  if (action === 'counter') {
    if (!counterPrice || isNaN(counterPrice) || counterPrice <= 0) {
      await message.reply(lang === 'pid'
        ? '❌ Format: *counter OFFER-ID price*\n\nExample: counter OFR-ABC123 180'
        : '❌ Format: *counter OFFER-ID price*\n\nExample: counter OFR-ABC123 180');
      return true;
    }
    storage.update('offers', o => o.id === offer.id, {
      status: 'countered',
      counterPrice,
      updatedAt: timestamp()
    });
    try {
      await client.sendMessage(`${offer.buyerPhone}@c.us`,
        lang === 'pid'
          ? `🔄 *Counter Offer!*\n\nOffer ID: ${offerId}\nYour Offer: ₦${offer.offerPrice}/kg\nCounter Offer: ₦${counterPrice}/kg\n\nReply:\n✅ *accept ${offerId}* to accept the counter\n❌ *reject ${offerId}* to decline`
          : `🔄 *Counter Offer!*\n\nOffer ID: ${offerId}\nYour Offer: ₦${offer.offerPrice}/kg\nCounter Offer: ₦${counterPrice}/kg\n\nReply:\n✅ *accept ${offerId}* to accept the counter\n❌ *reject ${offerId}* to decline`
      );
    } catch (_) {}
    await message.reply(lang === 'pid'
      ? `🔄 Counter offer sent! ₦${counterPrice}/kg\n\nWaiting for buyer response.`
      : `🔄 Counter offer sent! ₦${counterPrice}/kg\n\nWaiting for buyer's response.`);
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
  if (['offer_listing_id','offer_price'].includes(sess.step)) return handleOffer(client, message, phone, sess);
}

module.exports = { handle, startListing, viewListings, handleOffer, handleOfferResponse };
