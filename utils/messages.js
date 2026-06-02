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

1️⃣ Request Pickup
2️⃣ Track Pickups
3️⃣ Learn Recycling
4️⃣ Quiz Challenge
5️⃣ My Points
6️⃣ Rewards
7️⃣ My Profile
8️⃣ Help

_Reply with number (1-8)_`,
    pid: `🏠 *Household Dashboard*

Wetin you wan do?

1️⃣ Request Pickup
2️⃣ Track Pickups
3️⃣ Learn Recycling
4️⃣ Quiz Challenge
5️⃣ My Points
6️⃣ Rewards
7️⃣ My Profile
8️⃣ Help

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
    en: `*Step 2 of 5: Enter Quantity*

How much waste do you have? (in KG only)

Examples: 5kg, 10kg, 25kg

_Type the quantity (e.g. 10)_`,
    pid: `*Step 2 of 5: Enter Quantity*

How much waste you get? (in KG only)

Examples: 5kg, 10kg, 25kg

_Type the quantity (e.g. 10)_`
  },

  addressConfirm: {
    en: `*Step 3 of 5: Pickup Address*

1️⃣ Use Saved Address
2️⃣ Enter New Address

_Reply with 1 or 2_`,
    pid: `*Step 3 of 5: Pickup Address*

1️⃣ Use Saved Address
2️⃣ Enter New Address

_Reply with 1 or 2_`
  },

  daySelect: {
    en: `*Step 4 of 5: Preferred Collection Day*

When should we pick up your waste?

1️⃣ Monday
2️⃣ Tuesday
3️⃣ Wednesday
4️⃣ Thursday
5️⃣ Friday
6️⃣ Saturday

_Reply with number_`,
    pid: `*Step 4 of 5: Preferred Collection Day*

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
    en: `*Step 5 of 5: Preferred Collection Time*

What time works best for you?

1️⃣ 8am - 10am
2️⃣ 10am - 12pm
3️⃣ 12pm - 2pm
4️⃣ 2pm - 4pm

_Reply with number_`,
    pid: `*Step 5 of 5: Preferred Collection Time*

Wetin time good for you?

1️⃣ 8am - 10am
2️⃣ 10am - 12pm
3️⃣ 12pm - 2pm
4️⃣ 2pm - 4pm

_Reply with number_`
  },

  reviewRequest: (details) => ({
    en: `*Review Your Pickup Request*

${details}

Does everything look correct?

1️⃣ ✅ Confirm & Submit
2️⃣ Edit Request
3️⃣ ❌ Cancel

_Reply with number_`,
    pid: `*Review Your Pickup Request*

${details}

Everything correct?

1️⃣ ✅ Confirm & Submit
2️⃣ Edit Request
3️⃣ ❌ Cancel

_Reply with number_`
  }),

  pickupSubmitted: (pickupId) => ({
    en: `✅ *Pickup Request Submitted!*

Pickup ID: *${pickupId}*
Status: 🟡 Pending

We've saved your request and will update you as soon as a collector is assigned.

Next Step: Wait for updates here or type *menu* to return to your dashboard.
`,
    pid: `✅ *Pickup Request Don Submit!* \n\nPickup ID: *${pickupId}*\nStatus: 🟡 Pending\n\nWe don save your request. We go update you once collector don accept am.\n\nNext Step: Wait for update here or type *menu* to return to your dashboard.\n`
  })
};

const trackPickups = {
  noPickups: {
    en: `*No Active Pickups*

You don't have any pending pickups right now.

What would you like to do?
1️⃣ Request a new pickup
2️⃣ Return to menu

_Reply with 1 or 2_`,
    pid: `*No Active Pickups*

You no get pending pickup now.

Wetin you want do?
1️⃣ Request new pickup
2️⃣ Return to menu

_Reply with 1 or 2_`
  },

  pickupList: (pickups) => ({
    en: `*Your Active Pickups*

${pickups}

Reply with a pickup ID to see details or type *menu* to return.`,
    pid: `*Your Active Pickups*

${pickups}

Reply with a pickup ID to see details or type *menu* to return.`
  }),

  pickupDetails: (details) => ({
    en: `*Pickup Details*

${details}

1️⃣ View Status
2️⃣ ❌ Cancel Pickup
3️⃣ Back

_Reply with number_`,
    pid: `*Pickup Details*

${details}

1️⃣ View Status
2️⃣ ❌ Cancel Pickup
3️⃣ Back

_Reply with number_`
  }),

  cancelConfirm: {
    en: `*Cancel Pickup*

Are you sure you want to cancel this pickup?

1️⃣ Yes, cancel it
2️⃣ No, keep it

_Reply with number_`,
    pid: `*Cancel Pickup*

You sure say you wan cancel this pickup?

1️⃣ Yes, cancel am
2️⃣ No, make e continue

_Reply with number_`
  },

  cancelled: {
    en: `✅ *Pickup Cancelled*

The pickup request has been cancelled.

Type *menu* to return to your dashboard.`,
    pid: `✅ *Pickup Cancelled*

The pickup request don cancel.

Type *menu* to return to your dashboard.`
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN RECYCLING
// ═══════════════════════════════════════════════════════════════════════════════

const learnRecycling = {
  categorySelect: {
    en: `*Learn Recycling - Pick a Category*

Choose a waste category to learn about:

1️⃣ ♻️ Plastic Waste
2️⃣ 📄 Paper Waste
3️⃣ 🔩 Metal Waste
4️⃣ 🍾 Glass Waste
5️⃣ 🌱 Organic Waste
6️⃣ ⚡ E-Waste

_Reply with number_`,
    pid: `*Learn Recycling - Pick a Category*

Choose waste category to learn about:

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

*Examples:* PET bottles, jerry cans, containers, buckets

*How to Prepare:*
• Rinse and dry containers
• Remove caps and lids
• Flatten bottles and jerry cans
• Keep plastics separate from paper

*Common Mistakes:*
❌ Don’t mix plastics with food waste or dirty paper
❌ Don’t leave liquids inside bottles
❌ Don’t include nylon bags or films with hard plastics

*Environmental Benefits:*
✅ Keeps streets and waterways clean
✅ Saves energy when recycled
✅ Turns waste into value for your home

*Points Earned:* 5 points per KG

_Reply with 1 to return to categories_`,
    pid: `♻️ *Plastic Waste*

*Examples:* PET bottle, jerry can, container, bucket

*How to Prepare:*
• Wash and dry am
• Remove cap and lid
• Flatten bottle and jerry can
• Keep plastic separate from paper

*Common Mistakes:*
❌ No mix plastic with food waste or dirty paper
❌ No leave water inside bottle
❌ No put nylon bag with hard plastic

*Environmental Benefits:*
✅ Keep road and water clean
✅ Save energy when recycle
✅ Turn waste to value for your house

*Points Earned:* 5 points per KG

_Reply with 1 to return to categories_`
  },

  paperWaste: {
    en: `📄 *Paper Waste*

*Examples:* Cardboard, newspapers, notebooks, office paper

*How to Prepare:*
• Keep paper dry and clean
• Remove tape and plastic from boxes
• Flatten cartons and bundle paper
• Keep paper away from wet waste

*Common Mistakes:*
❌ Don’t include soaked or greasy paper
❌ Don’t mix with plastic-coated items
❌ Don’t bundle paper with food waste

*Environmental Benefits:*
✅ Saves trees and water
✅ Reduces landfill pressure
✅ Supports local recycling businesses

*Points Earned:* 4 points per KG

_Reply with 1 to return to categories_`,
    pid: `📄 *Paper Waste*

*Examples:* Cardboard, newspaper, notebook, office paper

*How to Prepare:*
• Keep paper dry and clean
• Remove tape and plastic from box
• Flatten carton and bundle paper
• Keep paper away from wet waste

*Common Mistakes:*
❌ No soak or greasy paper
❌ No mix with plastic-coated thing
❌ No put paper with food waste

*Environmental Benefits:*
✅ Save tree and water
✅ Reduce landfill wahala
✅ Support local recycling business

*Points Earned:* 4 points per KG

_Reply with 1 to return to categories_`
  },

  metalWaste: {
    en: `🔩 *Metal Waste*

*Examples:* Aluminum cans, steel tins, wires, scrap metal

*How to Prepare:*
• Rinse cans and tins
• Remove non-metal parts
• Keep metals separate by type when possible

*Common Mistakes:*
❌ Don’t recycle oily or dirty metal
❌ Don’t mix metals with plastic or glass
❌ Don’t include batteries or electronics

*Environmental Benefits:*
✅ Saves natural resources
✅ Reduces mining and landfill waste
✅ Creates stronger recycled products

*Points Earned:* 7 points per KG

_Reply with 1 to return to categories_`,
    pid: `🔩 *Metal Waste*

*Examples:* Aluminum can, steel tin, wire, scrap metal

*How to Prepare:*
• Wash can and tin
• Remove non-metal part
• Keep metal separate by type if you fit

*Common Mistakes:*
❌ No recycle oily or dirty metal
❌ No mix metal with plastic or glass
❌ No put battery or electronic inside

*Environmental Benefits:*
✅ Save natural resource
✅ Reduce mining and landfill waste
✅ Make stronger recycled products

*Points Earned:* 7 points per KG

_Reply with 1 to return to categories_`
  },

  glassWaste: {
    en: `🍾 *Glass Waste*

*Examples:* Bottles, jars, glass containers, broken glass

*How to Prepare:*
• Rinse and dry glass containers
• Remove caps and lids
• Keep broken glass separate and wrapped
• Sort clear and colored glass when possible

*Common Mistakes:*
❌ Don’t mix glass with metal or plastic
❌ Don’t include ceramics or mirrors
❌ Don’t package broken shards loosely

*Environmental Benefits:*
✅ Saves sand and energy
✅ Reduces injuries at recycling centers
✅ Keeps neighborhoods safer

*Points Earned:* 6 points per KG

_Reply with 1 to return to categories_`,
    pid: `🍾 *Glass Waste*

*Examples:* Bottle, jar, glass container, broken glass

*How to Prepare:*
• Wash and dry glass container
• Remove cap and lid
• Keep broken glass separate and wrap am
• Sort clear and coloured glass if you fit

*Common Mistakes:*
❌ No mix glass with metal or plastic
❌ No include ceramic or mirror
❌ No package broken glass loosely

*Environmental Benefits:*
✅ Save sand and energy
✅ Reduce injury for recycling center
✅ Keep area safer

*Points Earned:* 6 points per KG

_Reply with 1 to return to categories_`
  },

  organicWaste: {
    en: `🌱 *Organic Waste*

*Examples:* Fruit peels, vegetable scraps, food leftovers, garden clippings

*How to Prepare:*
• Keep organic waste separate
• Remove plastics and metals
• Use a compost bin or paper bag
• Chop large items for faster breakdown

*Common Mistakes:*
❌ Don’t mix organics with plastics or metal
❌ Don’t put cooked oil or chemicals in compost
❌ Don’t leave organic waste in black bags

*Environmental Benefits:*
✅ Feeds soil and gardens
✅ Reduces methane from landfills
✅ Makes nutrient-rich compost

*Points Earned:* 4 points per KG

_Reply with 1 to return to categories_`,
    pid: `🌱 *Organic Waste*

*Examples:* Fruit peel, vegetable scrap, food leftovers, garden clippings

*How to Prepare:*
• Keep organic waste separate
• Remove plastic and metal
• Use compost bin or paper bag
• Chop big thing for faster breakdown

*Common Mistakes:*
❌ No mix organic with plastic or metal
❌ No put cooked oil or chemical for compost
❌ No leave organic waste for long for black bag

*Environmental Benefits:*
✅ Feed soil and garden
✅ Reduce methane for landfill
✅ Make rich compost

*Points Earned:* 4 points per KG

_Reply with 1 to return to categories_`
  },

  eWaste: {
    en: `⚡ *E-Waste*

*Examples:* Old phones, batteries, cables, chargers, electronics

*How to Prepare:*
• Keep electronics dry and safe
• Separate batteries and chargers
• Remove non-electronic parts
• Do not break devices open

*Common Mistakes:*
❌ Don’t throw e-waste in the regular trash
❌ Don’t mix batteries with other waste
❌ Don’t crush or burn electronics

*Environmental Benefits:*
✅ Prevents toxic chemicals from leaking
✅ Saves metals and rare materials
✅ Supports safer recycling jobs

*Points Earned:* 8 points per KG

_Reply with 1 to return to categories_`,
    pid: `⚡ *E-Waste*

*Examples:* Old phone, battery, cable, charger, electronics

*How to Prepare:*
• Keep electronics dry and safe
• Separate battery and charger
• Remove non-electronic part
• No break device open

*Common Mistakes:*
❌ No throw e-waste for regular trash
❌ No mix battery with other waste
❌ No crush or burn electronics

*Environmental Benefits:*
✅ Prevent toxic chemical leak
✅ Save metal and rare materials
✅ Support safe recycling jobs

*Points Earned:* 8 points per KG

_Reply with 1 to return to categories_`
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ SYSTEM (Resumable)
// ═══════════════════════════════════════════════════════════════════════════════

const quiz = {
  start: {
    en: `*Recycling Quiz Challenge*

Test your recycling knowledge and earn points!

• 5 questions
• Earn 10 points per correct answer
• Maximum: 50 points
• Can pause and resume anytime

Ready to start?

1️⃣ ✅ Start Quiz
2️⃣ Back to Menu

_Reply with 1 or 2_`,
    pid: `*Recycling Quiz Challenge*

Test your recycling knowledge and earn points!

• 5 questions
• Earn 10 points per correct answer
• Maximum: 50 points
• Can pause and resume anytime

You ready?

1️⃣ ✅ Start Quiz
2️⃣ Back to Menu

_Reply with 1 or 2_`
  },

  quizQuestion: (qNum, total, question) => ({
    en: `*Question ${qNum} of ${total}*

${question}

_Reply with your answer number_`,
    pid: `*Question ${qNum} of ${total}*

${question}

_Reply with your answer number_`
  }),

  quizComplete: (score, total) => ({
    en: `🎉 *Quiz Complete!*

Your Score: *${score}/${total}*
Points Earned: *${score * 10}* 🏆

Great job! Check your points in the menu.

1️⃣ Retake Quiz
2️⃣ Back to Menu

_Reply with 1 or 2_`,
    pid: `🎉 *Quiz Complete!*

Your Score: *${score}/${total}*
Points Earned: *${score * 10}* 🏆

Excellent! Check your points in the menu.

1️⃣ Retake Quiz
2️⃣ Back to Menu

_Reply with 1 or 2_`
  })
};

// ═══════════════════════════════════════════════════════════════════════════════
// POINTS & REWARDS
// ═══════════════════════════════════════════════════════════════════════════════

const pointsRewards = {
  myPoints: (totalPoints, monthlyPoints, lifetime) => ({
    en: `*Your Points*

Total Points: *${totalPoints}*
Monthly Points: *${monthlyPoints}*
Lifetime Points: *${lifetime}*

Ways to Earn:
• Request pickups: 10 points
• Complete pickups: 20 points
• Quiz completion: 50 points
• Community actions: 20 points

1️⃣ View Rewards
2️⃣ Leaderboard
3️⃣ Back

_Reply with number_`,
    pid: `*Your Points*

Total Points: *${totalPoints}*
Monthly Points: *${monthlyPoints}*
Lifetime Points: *${lifetime}*

Ways to Earn:
• Request pickup: 10 points
• Complete pickup: 20 points
• Quiz completion: 50 points
• Community actions: 20 points

1️⃣ View Rewards
2️⃣ Leaderboard
3️⃣ Back

_Reply with number_`
  }),

  availableRewards: (currentPoints) => ({
    en: `*Available Rewards*

500 points = ₦500 Airtime
1000 points = Data Bundle (1GB)
2500 points = Shopping Voucher
5000 points = Premium Membership

You have: *${currentPoints}* points

Which reward would you like to redeem?
1️⃣ 500pt Airtime
2️⃣ 1000pt Data
3️⃣ 2500pt Voucher
4️⃣ Back

_Reply with number_`,
    pid: `*Available Rewards*

500 points = ₦500 Airtime
1000 points = Data Bundle (1GB)
2500 points = Shopping Voucher
5000 points = Premium Membership

You get: *${currentPoints}* points

Wetin reward you want?
1️⃣ 500pt Airtime
2️⃣ 1000pt Data
3️⃣ 2500pt Voucher
4️⃣ Back

_Reply with number_`
  })
};

const helpCenter = {
  main: {
    en: `*EcoSort Help Center*

How can we help?

1️⃣ How pickups work
2️⃣ How points work
3️⃣ How rewards work
4️⃣ How selling works
5️⃣ Contact support
6️⃣ Back to menu

_Reply with number_`,
    pid: `*EcoSort Help Center*

How I fit help you?

1️⃣ How pickups work
2️⃣ How points work
3️⃣ How rewards work
4️⃣ How selling works
5️⃣ Contact support
6️⃣ Back to menu

_Reply with number_`
  },

  pickupsWork: {
    en: `*How Pickups Work*

Step-by-step:
1. Request a pickup from your dashboard
2. Select waste type and quantity
3. Choose preferred day and time
4. A collector will be assigned
5. Get notification when they're on the way
6. Pickup completed and points earned!

You get 10 points per pickup request and 20 points when completed.

Reply with:
1️⃣ Back to help

_Reply with 1_`,
    pid: `*How Pickups Work*

Step by step:
1. Request pickup from your dashboard
2. Select waste type and quantity
3. Choose preferred day and time
4. We go assign collector for you
5. Get notification when collector coming
6. Pickup don finish and you earn points!

You get 10 points per pickup request and 20 points when finish.

Reply with:
1️⃣ Back to help

_Reply with 1_`
  },

  pointsWork: {
    en: `*How Points Work*

Earn points by:
• Request pickup: 10 points
• Complete pickup: 20 points
• Quiz completion: 50 points
• Refer a friend: 25 points
• Community actions: 20 points

Monthly bonuses:
• Top 10 users get extra 100 points
• Active streak (3+ days): +10 points/day

Use points to get rewards!
No expiry date.

Reply with:
1️⃣ Back to help

_Reply with 1_`,
    pid: `*How Points Work*

Earn points by:
• Request pickup: 10 points
• Complete pickup: 20 points
• Quiz completion: 50 points
• Refer friend: 25 points
• Community actions: 20 points

Monthly bonus:
• Top 10 users get extra 100 points
• Active streak (3+ days): +10 points/day

Use points to get rewards!
No expiry.

Reply with:
1️⃣ Back to help

_Reply with 1_`
  },

  rewardsWork: {
    en: `*How Rewards Work*

Redeem your points for:
✓ 500 points = ₦500 Airtime
✓ 1000 points = 1GB Data Bundle
✓ 2500 points = ₦2,500 Voucher
✓ 5000 points = Premium Membership

How to redeem:
1. Go to Rewards from menu
2. Select reward you want
3. Submit request
4. We process within 24 hours
5. You receive reward on WhatsApp

No waiting list — first come, first served!

Reply with:
1️⃣ Back to help

_Reply with 1_`,
    pid: `*How Rewards Work*

Redeem your points for:
✓ 500 points = ₦500 Airtime
✓ 1000 points = 1GB Data Bundle
✓ 2500 points = ₦2,500 Voucher
✓ 5000 points = Premium Membership

How to redeem:
1. Go to Rewards from menu
2. Select reward you want
3. Submit request
4. We process within 24 hours
5. You get reward on WhatsApp

No waiting list — first come, first served!

Reply with:
1️⃣ Back to help

_Reply with 1_`
  },

  sellingWorks: {
    en: `*How Selling Works (Collectors)*

As a collector you can:
• Accept available pickups
• Collect waste from households
• Sell materials to buyers
• Build inventory

Commission rates:
• 15% on each pickup completed
• 10% when selling to marketplace
• Bonus for quality (clean materials)

Your earnings:
• View anytime from dashboard
• Withdraw weekly via bank transfer
• Instant payouts on verified account

Reply with:
1️⃣ Back to help

_Reply with 1_`,
    pid: `*How Selling Works (Collectors)*

As collector you fit:
• Accept available pickup
• Collect waste from house
• Sell materials to buyer
• Build your inventory

Commission rates:
• 15% on each pickup done
• 10% when selling to marketplace
• Bonus for clean materials

Your earnings:
• Check anytime from dashboard
• Withdraw weekly via bank transfer
• Instant payout on verified account

Reply with:
1️⃣ Back to help

_Reply with 1_`
  },

  contactSupport: {
    en: `*Contact Support*

We're here to help!

📧 Email: support@ecosort.com
📱 WhatsApp: +2348012345678
🕐 Hours: 8am - 6pm (Mon-Fri)

Common issues:
• Pickup not arriving? Reply with photo
• Points not showing? We'll investigate
• Rewards not received? Contact support

Or reply here and we'll respond within 1 hour.

Reply with:
1️⃣ Back to help

_Reply with 1_`,
    pid: `*Contact Support*

We dey for you!

📧 Email: support@ecosort.com
📱 WhatsApp: +2348012345678
🕐 Hours: 8am - 6pm (Mon-Fri)

Common issues:
• Pickup no show? Reply with photo
• Points no show? We go check am
• Reward no arrive? Contact support

Or reply here and we go respond within 1 hour.

Reply with:
1️⃣ Back to help

_Reply with 1_`
  },

  backToHelp: {
    en: `📚 *EcoSort Help Center*

How can we help?

1️⃣ How pickups work
2️⃣ How points work
3️⃣ How rewards work
4️⃣ How selling works
5️⃣ Contact support
6️⃣ Back to menu

_Reply with number_`,
    pid: `📚 *EcoSort Help Center*

How I fit help you?

1️⃣ How pickups work
2️⃣ How points work
3️⃣ How rewards work
4️⃣ How selling works
5️⃣ Contact support
6️⃣ Back to menu

_Reply with number_`
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COLLECTOR FLOWS
// ═══════════════════════════════════════════════════════════════════════════════

const rewards = {
  list: {
    en: `🎁 *Available Rewards*

500 points = 📱 ₦500 Airtime
1000 points = 📶 1GB Data Bundle
2500 points = 🛍️ ₦2,500 Shopping Voucher
5000 points = 💳 Premium Membership

Select a reward to redeem:
1️⃣ 500pt Airtime
2️⃣ 1000pt Data
3️⃣ 2500pt Voucher
4️⃣ 5000pt Premium
5️⃣ ⬅️ Back

_Reply with number_`,
    pid: `🎁 *Available Rewards*

500 points = 📱 ₦500 Airtime
1000 points = 📶 1GB Data Bundle
2500 points = 🛍️ ₦2,500 Shopping Voucher
5000 points = 💳 Premium Membership

Choose reward wey you want redeem:
1️⃣ 500pt Airtime
2️⃣ 1000pt Data
3️⃣ 2500pt Voucher
4️⃣ 5000pt Premium
5️⃣ ⬅️ Back

_Reply with number_`
  },

  redeemed: {
    en: `✅ *Reward Redemption Requested!*

Your reward request has been received.

We will review and process it within 24 hours.

Type *menu* to return to your dashboard.`,
    pid: `✅ *Reward Redemption Requested!*

We don receive your reward request.

We go process am within 24 hours.

Type *menu* to return to your dashboard.`
  }
};

const collectorMenu = {
  main: {
    en: `🚛 *Collector Dashboard*

What would you like to do?

1️⃣ 📋 Available Pickups
2️⃣ 📥 Accept Pickup
3️⃣ 📤 Complete Pickup
4️⃣ 🗺️ My Route
5️⃣ 📦 My Inventory
6️⃣ 🛒 Marketplace
7️⃣ 💰 My Earnings
8️⃣ 👤 My Profile
9️⃣ ❓ Help

_Reply with number (1-9)_`,
    pid: `🚛 *Collector Dashboard*

Wetin you wan do?

1️⃣ 📋 Available Pickups
2️⃣ 📥 Accept Pickup
3️⃣ 📤 Complete Pickup
4️⃣ 🗺️ My Route
5️⃣ 📦 My Inventory
6️⃣ 🛒 Marketplace
7️⃣ 💰 My Earnings
8️⃣ 👤 My Profile
9️⃣ ❓ Help

_Reply with number (1-9)_`
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
4️⃣ 📦 My Offers
5️⃣ 📊 My Transactions
6️⃣ 🌿 ESG Certificates
7️⃣ ⭐ Saved Collectors
8️⃣ 👤 My Profile
9️⃣ ❓ Help

_Reply with number (1-9)_`,
    pid: `🏭 *Buyer Dashboard*

Wetin you wan do?

1️⃣ 🔍 Search Materials
2️⃣ 📋 Browse All Listings
3️⃣ 💬 Make an Offer
4️⃣ 📦 My Offers
5️⃣ 📊 My Transactions
6️⃣ 🌿 ESG Certificates
7️⃣ ⭐ Saved Collectors
8️⃣ 👤 My Profile
9️⃣ ❓ Help

_Reply with number (1-9)_`
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
// COLLECTOR REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════════

const collectorRegistration = {
  namePrompt: {
    en: `🚛 *Collector Registration*

Step 1 of 5: Full Name

What is your full name?

_Type your name_`,
    pid: `🚛 *Collector Registration*

Step 1 of 5: Full Name

Wetin be your full name?

_Type your name_`
  },

  phonePrompt: {
    en: `📞 *Your Phone Number*

Step 2 of 5: Contact Number

Enter your active WhatsApp phone number.

Example: 08012345678

_Type your number_`,
    pid: `📞 *Your Phone Number*

Step 2 of 5: Contact Number

Enter your WhatsApp phone number.

Example: 08012345678

_Type your number_`
  },

  areaPrompt: {
    en: `📍 *Area of Operation*

Step 3 of 5: Your Zone

Which area do you operate in?

Examples: Ikeja, Surulere, Lekki, Oshodi

_Type your area_`,
    pid: `📍 *Area of Operation*

Step 3 of 5: Your Zone

Which area you dey operate?

Examples: Ikeja, Surulere, Lekki, Oshodi

_Type your area_`
  },

  specialtySelect: {
    en: `♻️ *Material Specialty*

Step 4 of 5: What do you collect?

1️⃣ PET Bottles
2️⃣ Metals & Aluminum
3️⃣ Nylon & Plastics
4️⃣ Paper & Cartons
5️⃣ Mixed Recyclables
6️⃣ All Materials

_Reply with number_`,
    pid: `♻️ *Material Specialty*

Step 4 of 5: Wetin you dey collect?

1️⃣ PET Bottles
2️⃣ Metals & Aluminum
3️⃣ Nylon & Plastics
4️⃣ Paper & Cartons
5️⃣ Mixed Recyclables
6️⃣ All Materials

_Reply with number_`
  },

  vehicleSelect: {
    en: `🚛 *Vehicle Type*

Step 5 of 5: How do you move waste?

1️⃣ Motorcycle
2️⃣ Tricycle (Keke)
3️⃣ Pickup Truck
4️⃣ Cart/Barrow
5️⃣ Van

_Reply with number_`,
    pid: `🚛 *Vehicle Type*

Step 5 of 5: Wetin vehicle you dey use?

1️⃣ Motorcycle
2️⃣ Tricycle (Keke)
3️⃣ Pickup Truck
4️⃣ Cart/Barrow
5️⃣ Van

_Reply with number_`
  },

  registrationComplete: (ecoId) => ({
    en: `✅ *Registration Complete!*

Welcome to EcoSort! 🎉

Your Collector ID: *${ecoId}*
Keep this safe — buyers use it to find you.

You can now:
• View and accept pickup requests
• Complete pickups and update inventory
• List materials on the marketplace
• Track your earnings

Type *menu* to open your dashboard. 🚛`,
    pid: `✅ *Registration Don Complete!*

Welcome to EcoSort! 🎉

Your Collector ID: *${ecoId}*
Keep am safe — buyers go use am to find you.

You fit now:
• View and accept pickup requests
• Complete pickups and update inventory
• List materials for marketplace
• Track your earnings

Type *menu* to open your dashboard. 🚛`
  })
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUYER REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════════

const buyerRegistration = {
  companyPrompt: {
    en: `🏭 *Buyer Registration*

Step 1 of 5: Company Name

What is your company or organisation name?

_Type your company name_`,
    pid: `🏭 *Buyer Registration*

Step 1 of 5: Company Name

Wetin be your company or organisation name?

_Type your company name_`
  },

  contactPrompt: {
    en: `👤 *Contact Person*

Step 2 of 5: Your Name

What is the contact person's full name?

_Type contact name_`,
    pid: `👤 *Contact Person*

Step 2 of 5: Your Name

Wetin be your full name (contact person)?

_Type contact name_`
  },

  interestSelect: {
    en: `♻️ *Material Interest*

Step 3 of 5: What do you buy?

1️⃣ PET Bottles
2️⃣ Aluminum & Metals
3️⃣ Nylon & Plastics
4️⃣ Paper & Cartons
5️⃣ Mixed Recyclables
6️⃣ All Materials

_Reply with number_`,
    pid: `♻️ *Material Interest*

Step 3 of 5: Wetin material you dey find?

1️⃣ PET Bottles
2️⃣ Aluminum & Metals
3️⃣ Nylon & Plastics
4️⃣ Paper & Cartons
5️⃣ Mixed Recyclables
6️⃣ All Materials

_Reply with number_`
  },

  volumeSelect: {
    en: `📦 *Monthly Volume*

Step 4 of 5: How much do you need?

1️⃣ 0–1 tonne/month
2️⃣ 1–5 tonnes/month
3️⃣ 5–20 tonnes/month
4️⃣ 20+ tonnes/month

_Reply with number_`,
    pid: `📦 *Monthly Volume*

Step 4 of 5: How much material you need per month?

1️⃣ 0–1 tonne/month
2️⃣ 1–5 tonnes/month
3️⃣ 5–20 tonnes/month
4️⃣ 20+ tonnes/month

_Reply with number_`
  },

  locationPrompt: {
    en: `📍 *Company Location*

Step 5 of 5: Where are you based?

Enter your company city or area.

Example: Lagos Island, Apapa, Kano

_Type your location_`,
    pid: `📍 *Company Location*

Step 5 of 5: Where your company dey?

Enter your company city or area.

Example: Lagos Island, Apapa, Kano

_Type your location_`
  },

  registrationComplete: (ecoId) => ({
    en: `✅ *Registration Complete!*

Welcome to EcoSort Marketplace! 🎉

Your Buyer ID: *${ecoId}*
Keep this safe for your records.

You can now:
• Browse and search material listings
• Make offers to collectors
• Track your purchases and transactions
• Download ESG sustainability certificates

Type *menu* to open your dashboard. 🏭`,
    pid: `✅ *Registration Don Complete!*

Welcome to EcoSort Marketplace! 🎉

Your Buyer ID: *${ecoId}*
Keep am safe for your records.

You fit now:
• Browse and search material listings
• Make offer to collectors
• Track your transactions
• Get ESG sustainability certificates

Type *menu* to open your dashboard. 🏭`
  })
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════════════

const leaderboard = {
  board: (entries, userRank) => ({
    en: `🏆 *EcoSort Leaderboard*

Top Recyclers This Month:

${entries}

Your Rank: *#${userRank}*

Keep recycling to climb higher! ♻️

1️⃣ Back to Points
2️⃣ Back to Menu

_Reply with number_`,
    pid: `🏆 *EcoSort Leaderboard*

Top Recyclers This Month:

${entries}

Your Rank: *#${userRank}*

Keep recycling to reach top! ♻️

1️⃣ Back to Points
2️⃣ Back to Menu

_Reply with number_`
  }),

  empty: {
    en: `🏆 *Leaderboard*

No rankings yet — be the first!

Start recycling to earn points and appear on the leaderboard.

1️⃣ Back to Menu

_Reply with 1_`,
    pid: `🏆 *Leaderboard*

No ranking yet — be the first!

Start recycling to earn points and appear here.

1️⃣ Back to Menu

_Reply with 1_`
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COLLECTOR HELP CENTER
// ═══════════════════════════════════════════════════════════════════════════════

const collectorHelp = {
  main: {
    en: `🚛 *Collector Help Center*

How can we help?

1️⃣ How to accept pickups
2️⃣ How to complete pickups
3️⃣ How earnings work
4️⃣ How marketplace works
5️⃣ Contact support
6️⃣ Back to menu

_Reply with number_`,
    pid: `🚛 *Collector Help Center*

How I fit help you?

1️⃣ How to accept pickup
2️⃣ How to complete pickup
3️⃣ How earnings work
4️⃣ How marketplace work
5️⃣ Contact support
6️⃣ Back to menu

_Reply with number_`
  },

  acceptPickups: {
    en: `📥 *How to Accept Pickups*

Step-by-step:
1. Select "Available Pickups" to see open requests
2. Note the Pickup ID of the one you want
3. Select "Accept Pickup" from the menu
4. Type the Pickup ID to claim it
5. Navigate to the address at the agreed time
6. Complete the pickup when done

You can also reply *accept PU-XXXXXX* at any time.

1️⃣ Back to help

_Reply with 1_`,
    pid: `📥 *How to Accept Pickup*

Step by step:
1. Select "Available Pickups" to see open requests
2. Note the Pickup ID wey you want
3. Select "Accept Pickup" from menu
4. Type the Pickup ID to claim am
5. Go to the address at the agreed time
6. Complete the pickup when you done

You fit also reply *accept PU-XXXXXX* anywhere.

1️⃣ Back to help

_Reply with 1_`
  },

  completePickups: {
    en: `📤 *How to Complete Pickups*

Step-by-step:
1. Select "Complete Pickup" from the menu
2. Enter the Pickup ID you collected
3. Select the material type
4. Enter the weight in KG
5. Pickup is marked complete!

Your earnings and inventory update automatically.
The household gets a completion notification.

1️⃣ Back to help

_Reply with 1_`,
    pid: `📤 *How to Complete Pickup*

Step by step:
1. Select "Complete Pickup" from menu
2. Enter the Pickup ID wey you collect
3. Choose the material type
4. Enter weight in KG
5. Pickup don complete!

Your earnings and inventory go update automatically.
The household go get notification.

1️⃣ Back to help

_Reply with 1_`
  },

  earningsWork: {
    en: `💰 *How Earnings Work*

You earn:
• ₦50 per KG of material collected
• Bonus rates for verified collectors

Payouts:
• View your total from the dashboard
• Withdraw weekly via bank transfer
• Instant payout on verified accounts

To get verified:
• Complete 5 pickups
• Maintain 4+ star rating

1️⃣ Back to help

_Reply with 1_`,
    pid: `💰 *How Earnings Work*

You go earn:
• ₦50 per KG of material wey you collect
• Bonus rates for verified collector

Payout:
• Check your total from dashboard
• Withdraw weekly via bank transfer
• Instant payout on verified account

To get verified:
• Complete 5 pickups
• Maintain 4+ star rating

1️⃣ Back to help

_Reply with 1_`
  },

  marketplaceWork: {
    en: `🛒 *How Marketplace Works*

Step-by-step:
1. Collect materials from pickups
2. Sort by type (PET, Metal, etc.)
3. Go to Marketplace → Post Listing
4. Enter material, quantity, and price/kg
5. Buyers browse and send offers
6. Accept, reject, or counter their offer
7. Arrange exchange and complete the deal

Commands (from anywhere in chat):
• *accept OFFER-ID* to accept an offer
• *reject OFFER-ID* to decline
• *counter OFFER-ID price* to counter-offer

1️⃣ Back to help

_Reply with 1_`,
    pid: `🛒 *How Marketplace Work*

Step by step:
1. Collect materials from pickups
2. Sort by type (PET, Metal, etc.)
3. Go to Marketplace → Post Listing
4. Enter material, quantity, and price/kg
5. Buyers go browse and send offer
6. Accept, reject, or counter their offer
7. Arrange exchange and complete the deal

Commands (from anywhere in chat):
• *accept OFFER-ID* to accept offer
• *reject OFFER-ID* to decline
• *counter OFFER-ID price* to counter

1️⃣ Back to help

_Reply with 1_`
  },

  contactSupport: {
    en: `📞 *Contact Support*

We're here to help!

📧 Email: support@ecosort.com
📱 WhatsApp: +2348012345678
🕐 Hours: 8am - 6pm (Mon-Fri)

Common issues:
• Pickup dispute? Reply with details
• Payment not received? Contact us
• Account issue? We'll sort it out

Or reply here and we'll respond within 1 hour.

1️⃣ Back to help

_Reply with 1_`,
    pid: `📞 *Contact Support*

We dey for you!

📧 Email: support@ecosort.com
📱 WhatsApp: +2348012345678
🕐 Hours: 8am - 6pm (Mon-Fri)

Common issues:
• Pickup dispute? Reply with details
• Payment no arrive? Contact us
• Account wahala? We go sort am

Or reply here and we go respond within 1 hour.

1️⃣ Back to help

_Reply with 1_`
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUYER HELP CENTER
// ═══════════════════════════════════════════════════════════════════════════════

const buyerHelp = {
  main: {
    en: `🏭 *Buyer Help Center*

How can we help?

1️⃣ How to find materials
2️⃣ How to make offers
3️⃣ How transactions work
4️⃣ How ESG certificates work
5️⃣ Contact support
6️⃣ Back to menu

_Reply with number_`,
    pid: `🏭 *Buyer Help Center*

How I fit help you?

1️⃣ How to find materials
2️⃣ How to make offer
3️⃣ How transactions work
4️⃣ How ESG certificate work
5️⃣ Contact support
6️⃣ Back to menu

_Reply with number_`
  },

  findMaterials: {
    en: `🔍 *How to Find Materials*

Two ways to find what you need:

1. *Search Materials* — filter by material type or location (e.g. "PET", "Ikeja")
2. *Browse All Listings* — see everything available on the marketplace

Each listing shows:
• Material type and quantity (kg)
• Price per kg and total value
• Collector name, rating, and verified status
• Pickup location

Note the Listing ID to make an offer.

1️⃣ Back to help

_Reply with 1_`,
    pid: `🔍 *How to Find Materials*

Two ways to find wetin you need:

1. *Search Materials* — filter by material or location (e.g. "PET", "Ikeja")
2. *Browse All Listings* — see everything available

Each listing show:
• Material type and quantity (kg)
• Price per kg and total value
• Collector name, rating, and verified status
• Pickup location

Note the Listing ID to make offer.

1️⃣ Back to help

_Reply with 1_`
  },

  makeOffers: {
    en: `💬 *How to Make Offers*

Step-by-step:
1. Find a listing you want
2. Select "Make an Offer" from your menu
3. Enter the Listing ID
4. Enter your price per KG (₦)
5. Collector is notified immediately
6. They can accept, reject, or counter

Offer commands (from anywhere in chat):
• *accept OFFER-ID* — accept a counter-offer
• *reject OFFER-ID* — decline an offer

Check "My Offers" to track all negotiations.

1️⃣ Back to help

_Reply with 1_`,
    pid: `💬 *How to Make Offer*

Step by step:
1. Find listing wey you want
2. Select "Make an Offer" from your menu
3. Enter the Listing ID
4. Enter your price per KG (₦)
5. Collector go get notification immediately
6. They fit accept, reject, or counter

Offer commands (from anywhere):
• *accept OFFER-ID* — accept counter-offer
• *reject OFFER-ID* — decline offer

Check "My Offers" to track all negotiations.

1️⃣ Back to help

_Reply with 1_`
  },

  howTransactions: {
    en: `📊 *How Transactions Work*

A transaction is created when a collector accepts your offer.

1. You make an offer on a listing
2. Collector accepts → transaction created
3. You receive a Transaction ID
4. Coordinate pickup/delivery directly
5. Confirm the exchange
6. ESG certificate is generated automatically

View all transactions in "My Transactions" on your dashboard.

1️⃣ Back to help

_Reply with 1_`,
    pid: `📊 *How Transactions Work*

Transaction go create when collector accept your offer.

1. You make offer on listing
2. Collector accept → transaction create
3. You go receive Transaction ID
4. Coordinate pickup/delivery directly
5. Confirm the exchange
6. ESG certificate go generate automatically

Check all transactions in "My Transactions" on dashboard.

1️⃣ Back to help

_Reply with 1_`
  },

  esgCertificates: {
    en: `🌿 *How ESG Certificates Work*

Every completed transaction generates a certificate.

Your certificate includes:
• Material type and quantity (kg)
• Full chain of custody
  — Collection → Platform verification → Buyer
• Unique verification code (ECO-CERT-XXXX)
• GPS coordinates of collection point
• Date and transaction details

Use for:
• ESG / CSR annual reports
• Sustainability audits
• Compliance documentation
• Investor reporting

1️⃣ Back to help

_Reply with 1_`,
    pid: `🌿 *How ESG Certificate Work*

Every completed transaction go generate certificate.

Your certificate include:
• Material type and quantity (kg)
• Full chain of custody
  — Collection → Platform → Buyer
• Unique verification code (ECO-CERT-XXXX)
• GPS coordinates of collection
• Date and transaction details

Use am for:
• ESG / CSR reports
• Sustainability audit
• Compliance documentation
• Investor reporting

1️⃣ Back to help

_Reply with 1_`
  },

  contactSupport: {
    en: `📞 *Contact Support*

We're here to help!

📧 Email: support@ecosort.com
📱 WhatsApp: +2348012345678
🕐 Hours: 8am - 6pm (Mon-Fri)

Common issues:
• Collector not responding? Contact us
• Certificate not generated? We'll fix it
• Payment dispute? Our team will mediate

Or reply here and we'll respond within 1 hour.

1️⃣ Back to help

_Reply with 1_`,
    pid: `📞 *Contact Support*

We dey for you!

📧 Email: support@ecosort.com
📱 WhatsApp: +2348012345678
🕐 Hours: 8am - 6pm (Mon-Fri)

Common issues:
• Collector no dey respond? Contact us
• Certificate no generate? We go fix am
• Payment dispute? Our team go mediate

Or reply here and we go respond within 1 hour.

1️⃣ Back to help

_Reply with 1_`
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTION TO GET LOCALIZED MESSAGE
// ═══════════════════════════════════════════════════════════════════════════════

const welcome = onboarding.welcome;
const roleSelect = onboarding.roleSelect;
const mainMenu = householdMenu.main;
const collectorMenuAlias = collectorMenu.main;
const buyerMenuAlias = buyerMenu.main;
const registered = householdRegistration.registrationComplete;
const langChanged = {
  en: `✅ Language switched to English.`,
  pid: `✅ Language switched to Pidgin.`
};

// Flat shortcuts so flow files can call msg('retry', lang) without the 'errors.' prefix
const invalidChoice = errors.invalidChoice;
const invalidPhone = errors.invalidPhone;
const invalidName = errors.invalidName;
const invalidQuantity = errors.invalidQuantity;
const notRegistered = errors.notRegistered;
const alreadyRegistered = errors.alreadyRegistered;
const retry = errors.retry;

const allScreens = {
  onboarding,
  welcome,
  roleSelect,
  householdRegistration,
  collectorRegistration,
  buyerRegistration,
  householdMenu,
  mainMenu,
  requestPickup,
  trackPickups,
  learnRecycling,
  quiz,
  pointsRewards,
  rewards,
  leaderboard,
  helpCenter,
  collectorHelp,
  buyerHelp,
  collectorMenu: collectorMenuAlias,
  buyerMenu: buyerMenuAlias,
  errors,
  confirmation,
  registered,
  langChanged,
  // flat error shortcuts
  invalidChoice,
  invalidPhone,
  invalidName,
  invalidQuantity,
  notRegistered,
  alreadyRegistered,
  retry
};

function screen(obj, lang, ...args) {
  const l = lang === 'pid' ? 'pid' : 'en';
  if (typeof obj === 'function') {
    obj = obj(...args);
  }
  if (!obj || !obj[l]) return `[Missing screen]`;
  const content = obj[l];
  return typeof content === 'function' ? content(...args) : content;
}

function msg(path, lang, ...args) {
  const keys = String(path).split('.');
  let obj = allScreens;
  for (const key of keys) {
    if (!obj) return `[Missing screen ${path}]`;
    obj = obj[key];
  }
  return screen(obj, lang, ...args);
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
  collectorRegistration,
  buyerRegistration,
  householdMenu,
  requestPickup,
  trackPickups,
  learnRecycling,
  quiz,
  pointsRewards,
  rewards,
  leaderboard,
  helpCenter,
  collectorHelp,
  buyerHelp,
  collectorMenu,
  buyerMenu,
  errors,
  confirmation,
  msg,
  screen,
  addNavigation
};
