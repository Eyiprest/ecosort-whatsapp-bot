const t = {
  welcome: {
    en: `*Welcome to EcoSort!*\n\nTurn your waste into value while keeping your environment clean.\n\nChoose your language:\n\n1️⃣ English\n2️⃣ Pidgin`,
    pid: `*Welcome to EcoSort!*\n\nTurn your waste into value while keeping your environment clean.\n\nChoose your language:\n\n1️⃣ English\n2️⃣ Pidgin`
  },

  roleSelect: {
    en: `What would you like to do today? 👇\n\n1️⃣ Household — request pickups & earn rewards\n2️⃣ Collector — manage pickups & sell materials\n3️⃣ Buyer / Business — source recyclable materials\n\nReply with 1, 2 or 3`,
    pid: `Wetin you wan do today? 👇\n\n1️⃣ Household — request pickup & earn reward\n2️⃣ Collector — manage pickup & sell materials\n3️⃣ Buyer / Business — buy recyclable materials\n\nReply 1, 2 or 3`
  },

  invalidChoice: {
    en: `❌ That option is not valid. Please reply with the number shown in the menu.`,
    pid: `❌ That option no correct. Reply with the number wey dey the menu.`
  },

  invalidPhone: {
    en: `❌ That doesn't look like a valid phone number. Please enter your number again (e.g. 08012345678).`,
    pid: `❌ That number no correct. Enter your number again (e.g. 08012345678).`
  },

  invalidName: {
    en: `❌ Please enter a valid name (at least 2 characters).`,
    pid: `❌ Enter correct name (at least 2 characters).`
  },

  retry: {
    en: `❌ I didn't get that. Please try again.`,
    pid: `❌ I no understand. Try again abeg.`
  },

  registered: {
    en: (id) => `✅ *Registration Successful!*\n\nYour EcoSort ID: *${id}*\n\nKeep this safe — you'll need it for pickups and rewards.\n\nWelcome to the EcoSort family! 🎉`,
    pid: (id) => `✅ *Registration Don Complete!*\n\nYour EcoSort ID: *${id}*\n\nKeep am safe — you go need am for pickup and reward.\n\nWelcome to EcoSort family! 🎉`
  },

  mainMenu: {
    en: `🏠 *Household Dashboard*\n\n1️⃣ Request Pickup\n2️⃣ Track Pickup\n3️⃣ My Rewards\n4️⃣ Learn Recycling\n5️⃣ Quiz Challenge\n6️⃣ My History\n7️⃣ My Profile\n8️⃣ Change Language\n\n_Type *restart* anytime to go back to the start_`,
    pid: `🏠 *Household Dashboard*\n\n1️⃣ Request Pickup\n2️⃣ Track Pickup\n3️⃣ My Rewards\n4️⃣ Learn Recycling\n5️⃣ Quiz Challenge\n6️⃣ My History\n7️⃣ My Profile\n8️⃣ Change Language\n\n_Type *restart* anytime to go back to the start_`
  },

  collectorMenu: {
    en: `🚛 *Collector Dashboard*\n\n1️⃣ Nearby Pickups\n2️⃣ Accept Pickup\n3️⃣ Complete Pickup\n4️⃣ My Route\n5️⃣ My Inventory\n6️⃣ Post Listing\n7️⃣ My Earnings\n8️⃣ My Profile\n\n_Type *restart* anytime to go back to the start_`,
    pid: `🚛 *Collector Dashboard*\n\n1️⃣ Nearby Pickups\n2️⃣ Accept Pickup\n3️⃣ Complete Pickup\n4️⃣ My Route\n5️⃣ My Inventory\n6️⃣ Post Listing\n7️⃣ My Earnings\n8️⃣ My Profile\n\n_Type *restart* anytime to go back to the start_`
  },

  buyerMenu: {
    en: `🏭 *Buyer Dashboard*\n\n1️⃣ Search Listings\n2️⃣ Browse All Listings\n3️⃣ Make an Offer\n4️⃣ My Offers\n5️⃣ My Transactions\n6️⃣ ESG Certificates\n7️⃣ Saved Collectors\n8️⃣ My Profile\n\n_Type *restart* anytime to go back to the start_`,
    pid: `🏭 *Buyer Dashboard*\n\n1️⃣ Search Listings\n2️⃣ Browse All Listings\n3️⃣ Make Offer\n4️⃣ My Offers\n5️⃣ My Transactions\n6️⃣ ESG Certificates\n7️⃣ Saved Collectors\n8️⃣ My Profile\n\n_Type *restart* anytime to go back to the start_`
  },

  notRegistered: {
    en: `⚠️ You are not registered yet.\n\nType *register* to set up your profile.`,
    pid: `⚠️ You never register yet.\n\nType *register* to set up your profile.`
  },

  alreadyRegistered: {
    en: `✅ You're already registered! Welcome back.\n\nType *menu* to see your dashboard.`,
    pid: `✅ You don register before! Welcome back.\n\nType *menu* to see your dashboard.`
  },

  pickupRequested: {
    en: (id) => `✅ *Pickup Requested!*\n\nPickup ID: *${id}*\nStatus: 🟡 Pending\n\nA collector will be assigned shortly. You'll get updates here.\n\nType *menu* to go back.`,
    pid: (id) => `✅ *Pickup Don Request!*\n\nPickup ID: *${id}*\nStatus: 🟡 Pending\n\nCollector go soon assigned. We go update you here.\n\nType *menu* to go back.`
  },

  noPickups: {
    en: `📭 You have no active pickups right now.\n\nType *1* to request one!`,
    pid: `📭 You never request any pickup yet.\n\nType *1* to request one!`
  },

  typeMenu: {
    en: `Type *menu* to return to your dashboard.`,
    pid: `Type *menu* to go back to your dashboard.`
  },

  langChanged: {
    en: `✅ Language changed to English.`,
    pid: `✅ Language don change to Pidgin.`
  }
};

function msg(key, lang, ...args) {
  const l = lang === 'pid' ? 'pid' : 'en';
  const entry = t[key];
  if (!entry) return `[missing: ${key}]`;
  const val = entry[l];
  return typeof val === 'function' ? val(...args) : val;
}

module.exports = { msg, t };
