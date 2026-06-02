/**
 * EcoSort Conversation Screens - Refactored
 * 
 * UX Principles:
 * - One question per screen
 * - Always use buttons/lists (never force typing)
 * - Every screen has Back/Menu/Cancel navigation
 * - No session timeout - all progress is resumable
 * - Auto-save after each step
 * - Show confirmation and next steps
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ONBOARDING & ROLE SELECTION
// ═══════════════════════════════════════════════════════════════════════════════

const onboarding = {
  welcome: {
    en: `♻️ *Welcome to EcoSort!*

Turn waste into value while keeping Nigeria clean.

Choose your language:

1️⃣ English
2️⃣ Pidgin English

_Reply with 1 or 2_`,
    pid: `♻️ *Welcome to EcoSort!*

Turn waste into value while keeping Nigeria clean.

Choose your language:

1️⃣ English
2️⃣ Pidgin English

_Reply with 1 or 2_`
  },

  roleSelect: {
    en: `👋 *Choose Your Role*

What would you like to do?

1️⃣ 🏠 Household — Request pickups & earn rewards
2️⃣ 🚛 Collector — Collect waste & sell materials
3️⃣ 🏭 Buyer — Source recycled materials

_Reply with 1, 2 or 3_`,
    pid: `👋 *Choose Your Role*

Wetin you wan do?

1️⃣ 🏠 Household — Request pickup & earn reward
2️⃣ 🚛 Collector — Collect waste & sell materials
3️⃣ 🏭 Buyer — Buy recycled materials

_Reply with 1, 2 or 3_`
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOUSEHOLD REGISTRATION FLOW
// ═══════════════════════════════════════════════════════════════════════════════

const householdRegistration = {
  namePrompt: {
    en: `📝 *Enter Your Full Name*

Please enter your full name (at least 2 characters)

_Type your name_`,
    pid: `📝 *Enter Your Full Name*

Enter your full name (at least 2 characters)

_Type your name_`
  },

  phonePrompt: {
    en: `📞 *Enter Your Phone Number*

Please enter your WhatsApp phone number

Example: 08012345678 or 2348012345678

_Type your number_`,
    pid: `📞 *Enter Your Phone Number*

Enter your WhatsApp phone number

Example: 08012345678 or 2348012345678

_Type your number_`
  },

  stateSelect: {
    en: `📍 *Select Your State*

Which state are you in?

1️⃣ Lagos
2️⃣ Oyo
3️⃣ Abuja
4️⃣ Rivers
5️⃣ Kano
6️⃣ Other States

_Reply with number_`,
    pid: `📍 *Select Your State*

Which state you dey?

1️⃣ Lagos
2️⃣ Oyo
3️⃣ Abuja
4️⃣ Rivers
5️⃣ Kano
6️⃣ Other States

_Reply with number_`
  },

  lgaSelect: {
    en: `📍 *Select Your LGA*

Choose your Local Government Area:

1️⃣ Alimosho
2️⃣ Ajeromi-Ifelodun
3️⃣ Kosofe
4️⃣ Mushin
5️⃣ Ikeja
6️⃣ Oshodi-Isolo

_Reply with number_`,
    pid: `📍 *Select Your LGA*

Choose your Local Government Area:

1️⃣ Alimosho
2️⃣ Ajeromi-Ifelodun
3️⃣ Kosofe
4️⃣ Mushin
5️⃣ Ikeja
6️⃣ Oshodi-Isolo

_Reply with number_`
  },

  addressPrompt: {
    en: `🏠 *Enter Your Address*

Please enter your full residential address

_Type your address_`,
    pid: `🏠 *Enter Your Address*

Enter your full residential address

_Type your address_`
  },

  householdSizeSelect: {
    en: `👨‍👩‍👧‍👦 *Household Size*

How many people live in your household?

1️⃣ 1 person
2️⃣ 2-3 people
3️⃣ 4-5 people
4️⃣ 6-7 people
5️⃣ 8+ people

_Reply with number_`,
    pid: `👨‍👩‍👧‍👦 *Household Size*

How many people dey your house?

1️⃣ 1 person
2️⃣ 2-3 people
3️⃣ 4-5 people
4️⃣ 6-7 people
5️⃣ 8+ people

_Reply with number_`
  },

  registrationComplete: (ecoId) => ({
    en: `✅ *Registration Complete!*

Welcome to EcoSort, friend! 🎉

Your EcoSort ID: *${ecoId}*
Keep this safe — you'll need it for pickups and rewards.

You can now:
• Request waste pickups
• Earn points
• Unlock rewards
• Learn about recycling

Tap the menu below to get started! 👇`,
    pid: `✅ *Registration Don Complete!*

Welcome to EcoSort, friend! 🎉

Your EcoSort ID: *${ecoId}*
Keep am safe — you go need am for pickup and reward.

You can now:
• Request waste pickup
• Earn points
• Unlock rewards
• Learn about recycling

Tap the menu below to start! 👇`
  })
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOUSEHOLD MAIN MENU
// ═══════════════════════════════════════════════════════════════════════════════

const householdMenu = {
  main: {
    en: `🏠 *Household Dashboard*

What would you like to do?

1️⃣ 🗑️ Request Pickup
2️⃣ 📍 Track Pickups
3️⃣ 📚 Learn Recycling
4️⃣ 🎯 Quiz Challenge
5️⃣ ⭐ My Points
6️⃣ 🎁 Rewards
7️⃣ 👤 My Profile
8️⃣ ❓ Help

_Reply with number (1-8)_`,
    pid: `🏠 *Household Dashboard*

Wetin you wan do?

1️⃣ 🗑️ Request Pickup
2️⃣ 📍 Track Pickups
3️⃣ 📚 Learn Recycling
4️⃣ 🎯 Quiz Challenge
5️⃣ ⭐ My Points
6️⃣ 🎁 Rewards
7️⃣ 👤 My Profile
8️⃣ ❓ Help

_Reply with number (1-8)_`
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST PICKUP FLOW (Step by Step)
// ═══════════════════════════════════════════════════════════════════════════════

const requestPickup = {
  wasteTypeSelect: {
    en: `♻️ *Step 1 of 5: Select Waste Type*

What type of waste would you like to recycle?

1️⃣ ♻️ Plastic Waste
2️⃣ 📄 Paper Waste
3️⃣ 🔩 Metal Waste
4️⃣ 🍾 Glass Waste
5️⃣ 🌱 Organic Waste
6️⃣ ⚡ E-Waste
7️⃣ 🗑️ Mixed Waste

_Reply with number_`,
    pid: `♻️ *Step 1 of 5: Select Waste Type*

Wetin kind waste you go recycle?

1️⃣ ♻️ Plastic Waste
2️⃣ 📄 Paper Waste
3️⃣ 🔩 Metal Waste
4️⃣ 🍾 Glass Waste
5️⃣ 🌱 Organic Waste
6️⃣ ⚡ E-Waste
7️⃣ 🗑️ Mixed Waste

_Reply with number_`
  },

  quantityPrompt: {
    en: `⚖️ *Step 2 of 5: Enter Quantity*

How much waste do you have? (in KG only)

Examples: 5kg, 10kg, 25kg

_Type the quantity (e.g. 10)_`,
    pid: `⚖️ *Step 2 of 5: Enter Quantity*

How much waste you get? (in KG only)

Examples: 5kg, 10kg, 25kg

_Type the quantity (e.g. 10)_`
  },

  addressConfirm: {
    en: `📍 *Step 3 of 5: Pickup Address*

1️⃣ Use Saved Address
2️⃣ Enter New Address

_Reply with 1 or 2_`,
    pid: `📍 *Step 3 of 5: Pickup Address*

1️⃣ Use Saved Address
2️⃣ Enter New Address

_Reply with 1 or 2_`
  },

  daySelect: {
    en: `📅 *Step 4 of 5: Preferred Collection Day*

When should we pick up your waste?

1️⃣ Monday
2️⃣ Tuesday
3️⃣ Wednesday
4️⃣ Thursday
5️⃣ Friday
6️⃣ Saturday

_Reply with number_`,
    pid: `📅 *Step 4 of 5: Preferred Collection Day*

When we should come pick am?

1️⃣ Monday
2️⃣ Tuesday
3️⃣ Wednesday
4️⃣ Thursday
5️⃣ Friday
6️⃣ Saturday

_Reply with number_`
  },

  timeSelect: {
    en: `🕐 *Step 5 of 5: Preferred Collection Time*

What time works best for you?

1️⃣ 8am - 10am
2️⃣ 10am - 12pm
3️⃣ 12pm - 2pm
4️⃣ 2pm - 4pm

_Reply with number_`,
    pid: `🕐 *Step 5 of 5: Preferred Collection Time*

Wetin time good for you?

1️⃣ 8am - 10am
2️⃣ 10am - 12pm
3️⃣ 12pm - 2pm
4️⃣ 2pm - 4pm

_Reply with number_`
  },

  reviewRequest: (details) => ({
    en: `📋 *Review Your Pickup Request*

${details}

Does everything look correct?

1️⃣ ✅ Confirm & Submit
2️⃣ ✏️ Edit Request
3️⃣ ❌ Cancel

_Reply with number_`,
    pid: `📋 *Review Your Pickup Request*

${details}

Everything correct?

1️⃣ ✅ Confirm & Submit
2️⃣ ✏️ Edit Request
3️⃣ ❌ Cancel

_Reply with number_`
  }),

  pickupSubmitted: (pickupId) => ({
    en: `✅ *Pickup Request Submitted!*

Pickup ID: *${pickupId}*
Status: 🟡 Pending

We're finding a collector for you. You'll get updates here.

Next Step: A collector will be assigned within 2 hours.

_Reply: 1 to go back to menu_`,
    pid: `✅ *Pickup Request Don Submit!*

Pickup ID: *${pickupId}*
Status: 🟡 Pending

We dey look for collector for you. We go update you here.

Next Step: Collector go assigned within 2 hours.

_Reply: 1 to go back to menu_`
  })
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRACK PICKUPS
// ═══════════════════════════════════════════════════════════════════════════════

const trackPickups = {
  noPickups: {
    en: `📭 *No Active Pickups*

You don't have any pending pickups right now.

Would you like to:
1️⃣ Request a new pickup
2️⃣ Return to menu

_Reply with 1 or 2_`,
    pid: `📭 *No Active Pickups*

You no get any pending pickup now.

You wan:
1️⃣ Request new pickup
2️⃣ Return to menu

_Reply with 1 or 2_`
  },

  pickupList: (pickups) => ({
    en: `📍 *Your Active Pickups*

${pickups}

Reply with a pickup ID to see details.`,
    pid: `📍 *Your Active Pickups*

${pickups}

Reply with a pickup ID to see details.`
  }),

  pickupDetails: (details) => ({
    en: `📍 *Pickup Details*

${details}

1️⃣ 👁️ View Full Status
2️⃣ ❌ Cancel Pickup (if pending)
3️⃣ ⬅️ Back

_Reply with number_`,
    pid: `📍 *Pickup Details*

${details}

1️⃣ 👁️ View Full Status
2️⃣ ❌ Cancel Pickup (if pending)
3️⃣ ⬅️ Back

_Reply with number_`
  })
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN RECYCLING
// ═══════════════════════════════════════════════════════════════════════════════

const learnRecycling = {
  categorySelect: {
    en: `📚 *Learn Recycling - Pick a Category*

Choose a waste type to learn about:

1️⃣ ♻️ Plastic Waste
2️⃣ 📄 Paper Waste
3️⃣ 🔩 Metal Waste
4️⃣ 🍾 Glass Waste
5️⃣ 🌱 Organic Waste
6️⃣ ⚡ E-Waste

_Reply with number_`,
    pid: `📚 *Learn Recycling - Pick a Category*

Choose waste type to learn about:

1️⃣ ♻️ Plastic Waste
2️⃣ 📄 Paper Waste
3️⃣ 🔩 Metal Waste
4️⃣ 🍾 Glass Waste
5️⃣ 🌱 Organic Waste
6️⃣ ⚡ E-Waste

_Reply with number_`
  },

  plasticWaste: {
    en: `♻️ *Plastic Waste*

*Examples:* Water bottles, bags, containers, toys

*How to Prepare:*
• Rinse bottles & containers
• Remove caps & lids separately
• Flatten bottles to save space
• Keep dry

*Common Mistakes:*
❌ Don't include mixed plastic & paper
❌ Don't leave liquid inside
❌ Don't include plastic bags with food

*Environmental Impact:*
✅ Prevents ocean pollution
✅ Reduces landfill waste
✅ Can be recycled into new products

*Earn: 5 points per KG*

_Reply: 1 to continue learning_`,
    pid: `♻️ *Plastic Waste*

*Examples:* Bottles, bags, containers, toys

*How to Prepare:*
• Rinse bottles & containers
• Remove caps & lids separate
• Flatten bottles to save space
• Keep dry

*Common Mistakes:*
❌ No mix plastic & paper
❌ No leave liquid inside
❌ No plastic bags with food

*Environmental Impact:*
✅ Stop ocean pollution
✅ Reduce landfill waste
✅ Can make new products

*Earn: 5 points per KG*

_Reply: 1 to continue learning_`
  },

  paperWaste: {
    en: `📄 *Paper Waste*

*Examples:* Newspapers, cardboard, magazines, books

*How to Prepare:*
• Keep dry and clean
• Remove plastic/tape from cardboard
• Flatten boxes
• Bundle paper together

*Common Mistakes:*
❌ Don't include wet/soaked paper
❌ Don't mix with plastic coating
❌ Don't include greasy papers

*Environmental Impact:*
✅ Saves trees
✅ Reduces deforestation
✅ Creates jobs in recycling

*Earn: 3 points per KG*

_Reply: 1 to continue learning_`,
    pid: `📄 *Paper Waste*

*Examples:* Newspapers, cardboard, magazines, books

*How to Prepare:*
• Keep dry and clean
• Remove plastic/tape from cardboard
• Flatten boxes
• Bundle paper together

*Common Mistakes:*
❌ No wet/soaked paper
❌ No mix with plastic coating
❌ No greasy papers

*Environmental Impact:*
✅ Save trees
✅ Reduce deforestation
✅ Create jobs in recycling

*Earn: 3 points per KG*

_Reply: 1 to continue learning_`
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ SYSTEM (Resumable)
// ═══════════════════════════════════════════════════════════════════════════════

const quiz = {
  start: {
    en: `🎯 *Recycling Quiz Challenge*

Test your recycling knowledge and earn points!

• 5 questions
• Earn 10 points per correct answer
• Maximum: 50 points
• Can pause and resume anytime

Ready to start?

1️⃣ ✅ Start Quiz
2️⃣ ⬅️ Back to Menu

_Reply with 1 or 2_`,
    pid: `🎯 *Recycling Quiz Challenge*

Test your recycling knowledge and earn points!

• 5 questions
• Earn 10 points per correct answer
• Maximum: 50 points
• Can pause and resume anytime

You ready?

1️⃣ ✅ Start Quiz
2️⃣ ⬅️ Back to Menu

_Reply with 1 or 2_`
  },

  quizQuestion: (qNum, total, question) => ({
    en: `🎯 *Question ${qNum} of ${total}*

${question}

_Reply with your answer number_`,
    pid: `🎯 *Question ${qNum} of ${total}*

${question}

_Reply with your answer number_`
  }),

  quizComplete: (score, total) => ({
    en: `🎉 *Quiz Complete!*

Your Score: *${score}/${total}*
Points Earned: *${score * 10}* 🏆

Great job! Check your points in the menu.

1️⃣ 🔄 Retake Quiz
2️⃣ ⬅️ Back to Menu

_Reply with 1 or 2_`,
    pid: `🎉 *Quiz Complete!*

Your Score: *${score}/${total}*
Points Earned: *${score * 10}* 🏆

Excellent! Check your points in the menu.

1️⃣ 🔄 Retake Quiz
2️⃣ ⬅️ Back to Menu

_Reply with 1 or 2_`
  })
};

// ═══════════════════════════════════════════════════════════════════════════════
// POINTS & REWARDS
// ═══════════════════════════════════════════════════════════════════════════════

const pointsRewards = {
  myPoints: (totalPoints, monthlyPoints, lifetime) => ({
    en: `⭐ *Your Points*

Total Points: *${totalPoints}*
Monthly Points: *${monthlyPoints}*
Lifetime Earned: *${lifetime}*

📈 Ways to Earn:
• Request pickups: 10 points
• Complete pickups: 20 points
• Quiz completion: 50 points
• Refer a friend: 100 points

1️⃣ 🎁 View Rewards
2️⃣ 📊 Leaderboard
3️⃣ ⬅️ Back

_Reply with number_`,
    pid: `⭐ *Your Points*

Total Points: *${totalPoints}*
Monthly Points: *${monthlyPoints}*
Lifetime Earned: *${lifetime}*

📈 Ways to Earn:
• Request pickup: 10 points
• Complete pickup: 20 points
• Quiz completion: 50 points
• Refer friend: 100 points

1️⃣ 🎁 View Rewards
2️⃣ 📊 Leaderboard
3️⃣ ⬅️ Back

_Reply with number_`
  }),

  availableRewards: {
    en: `🎁 *Available Rewards*

500 points = 📱 ₦500 Airtime
1000 points = 📶 Data Bundle (1GB)
2500 points = 🛍️ Shopping Voucher
5000 points = 💳 Premium Membership

You have: 0 points

Which reward interests you?
1️⃣ 500pt Airtime
2️⃣ 1000pt Data
3️⃣ 2500pt Voucher
4️⃣ ⬅️ Back

_Reply with number_`,
    pid: `🎁 *Available Rewards*

500 points = 📱 ₦500 Airtime
1000 points = 📶 Data Bundle (1GB)
2500 points = 🛍️ Shopping Voucher
5000 points = 💳 Premium Membership

You get: 0 points

Wetin reward you want?
1️⃣ 500pt Airtime
2️⃣ 1000pt Data
3️⃣ 2500pt Voucher
4️⃣ ⬅️ Back

_Reply with number_`
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COLLECTOR FLOWS
// ═══════════════════════════════════════════════════════════════════════════════

const collectorMenu = {
  main: {
    en: `🚛 *Collector Dashboard*

What would you like to do?

1️⃣ 📬 Available Pickups
2️⃣ 🎯 My Assigned Pickups
3️⃣ 📦 My Inventory
4️⃣ 🏪 Marketplace
5️⃣ 💰 My Earnings
6️⃣ 👤 My Profile
7️⃣ ❓ Help

_Reply with number (1-7)_`,
    pid: `🚛 *Collector Dashboard*

Wetin you wan do?

1️⃣ 📬 Available Pickups
2️⃣ 🎯 My Assigned Pickups
3️⃣ 📦 My Inventory
4️⃣ 🏪 Marketplace
5️⃣ 💰 My Earnings
6️⃣ 👤 My Profile
7️⃣ ❓ Help

_Reply with number (1-7)_`
  },

  availablePickups: (count) => ({
    en: `📬 *Available Pickups*

${count} pickup(s) available in your area!

New Pickup Alert:
ID: PU-12345
📍 Location: Lekki Phase 1
♻️ Type: Plastic Waste
⚖️ Quantity: 15kg
💰 Estimated: ₦1,500

1️⃣ ✅ Accept
2️⃣ ⏭️ Skip
3️⃣ 🔄 Refresh

_Reply with number_`,
    pid: `📬 *Available Pickups*

${count} pickup(s) available for you!

New Pickup Alert:
ID: PU-12345
📍 Location: Lekki Phase 1
♻️ Type: Plastic Waste
⚖️ Quantity: 15kg
💰 Estimated: ₦1,500

1️⃣ ✅ Accept
2️⃣ ⏭️ Skip
3️⃣ 🔄 Refresh

_Reply with number_`
  })
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUYER FLOWS
// ═══════════════════════════════════════════════════════════════════════════════

const buyerMenu = {
  main: {
    en: `🏭 *Buyer Dashboard*

What would you like to do?

1️⃣ 🔍 Search Materials
2️⃣ 📋 Browse All Listings
3️⃣ 💬 Make an Offer
4️⃣ 📦 My Orders
5️⃣ 📜 ESG Certificates
6️⃣ 👤 My Profile
7️⃣ ❓ Help

_Reply with number (1-7)_`,
    pid: `🏭 *Buyer Dashboard*

Wetin you wan do?

1️⃣ 🔍 Search Materials
2️⃣ 📋 Browse All Listings
3️⃣ 💬 Make Offer
4️⃣ 📦 My Orders
5️⃣ 📜 ESG Certificates
6️⃣ 👤 My Profile
7️⃣ ❓ Help

_Reply with number (1-7)_`
  },

  browseMaterials: {
    en: `📋 *Available Materials*

1️⃣ ♻️ Plastic Waste - 50kg @ ₦50/kg (Collector: COL-001)
2️⃣ 📄 Paper Waste - 100kg @ ₦30/kg (Collector: COL-002)
3️⃣ 🔩 Metal Waste - 75kg @ ₦200/kg (Collector: COL-003)

Reply with number to view details or make offer.`,
    pid: `📋 *Available Materials*

1️⃣ ♻️ Plastic Waste - 50kg @ ₦50/kg (Collector: COL-001)
2️⃣ 📄 Paper Waste - 100kg @ ₦30/kg (Collector: COL-002)
3️⃣ 🔩 Metal Waste - 75kg @ ₦200/kg (Collector: COL-003)

Reply with number to see details or make offer.`
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR & VALIDATION MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════

const errors = {
  invalidChoice: {
    en: `❌ That's not a valid option. Please try again.`,
    pid: `❌ That option no correct. Try again abeg.`
  },

  invalidPhone: {
    en: `❌ That doesn't look like a valid phone number. Try again (e.g. 08012345678).`,
    pid: `❌ That number no correct. Try again (e.g. 08012345678).`
  },

  invalidName: {
    en: `❌ Please enter a valid name (at least 2 characters).`,
    pid: `❌ Enter correct name (at least 2 characters).`
  },

  invalidQuantity: {
    en: `❌ Please enter a valid quantity in KG (e.g. 10, 25.5).`,
    pid: `❌ Enter correct quantity in KG (e.g. 10, 25.5).`
  },

  notRegistered: {
    en: `⚠️ You're not registered yet.

To get started:
1️⃣ Type *register* to create your profile
2️⃣ Choose your role (Household/Collector/Buyer)

_Type: register_`,
    pid: `⚠️ You never register yet.

To start:
1️⃣ Type *register* to create your profile
2️⃣ Choose your role (Household/Collector/Buyer)

_Type: register_`
  },

  alreadyRegistered: {
    en: `✅ Welcome back! You're already registered.

Type *menu* to see your dashboard.`,
    pid: `✅ Welcome back! You don register before.

Type *menu* to see your dashboard.`
  },

  retry: {
    en: `❌ I didn't understand that. Please try again.`,
    pid: `❌ I no understand. Try again abeg.`
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIRMATION & SUCCESS MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════

const confirmation = {
  profileUpdated: {
    en: `✅ Profile updated successfully!`,
    pid: `✅ Profile don update!`
  },

  backToMenu: {
    en: `⬅️ Type *menu* to return to your dashboard.`,
    pid: `⬅️ Type *menu* to go back.`
  },

  mainMenu: (role) => ({
    en: `Type *menu* to see your ${role} dashboard.`,
    pid: `Type *menu* to see your ${role} dashboard.`
  })
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTION TO GET LOCALIZED MESSAGE
// ═══════════════════════════════════════════════════════════════════════════════

function screen(obj, lang, ...args) {
  const l = lang === 'pid' ? 'pid' : 'en';
  if (!obj || !obj[l]) return `[Missing screen]`;
  const content = obj[l];
  return typeof content === 'function' ? content(...args) : content;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVIGATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function addNavigation(message, lang) {
  const nav = lang === 'pid'
    ? `\n\n_Navigation: Type *menu* to go back, *restart* to start over_`
    : `\n\n_Navigation: Type *menu* to return, *restart* to start over_`;
  return message + nav;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  onboarding,
  householdRegistration,
  householdMenu,
  requestPickup,
  trackPickups,
  learnRecycling,
  quiz,
  pointsRewards,
  collectorMenu,
  buyerMenu,
  errors,
  confirmation,
  screen,
  addNavigation
};
