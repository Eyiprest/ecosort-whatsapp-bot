/**
 * Seeds ALL bot messages from messages.js into Supabase bot_messages table.
 * Run ONCE: node scripts/seed_bot_messages.js
 * After seeding, every message is editable from the Admin Dashboard → Bot Messages.
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

/* ── Flatten all messages into rows ─────────────────────────────────── */
const rows = [
  /* ONBOARDING */
  { language: 'english', category: 'onboarding', key: 'welcome',     message: `♻️ *Welcome to EcoSort!*\n\nTurn waste into value while keeping Nigeria clean.\n\nChoose your language:\n\n1️⃣ English\n2️⃣ Pidgin English\n\n_Reply with 1 or 2_` },
  { language: 'pidgin',  category: 'onboarding', key: 'welcome',     message: `♻️ *Welcome to EcoSort!*\n\nTurn waste into value while keeping Nigeria clean.\n\nChoose your language:\n\n1️⃣ English\n2️⃣ Pidgin English\n\n_Reply with 1 or 2_` },
  { language: 'english', category: 'onboarding', key: 'role_select', message: `👋 *Choose Your Role*\n\nWhat would you like to do?\n\n1️⃣ 🏠 Household — Request pickups & earn rewards\n2️⃣ 🚛 Collector — Collect waste & sell materials\n3️⃣ 🏭 Buyer — Source recycled materials\n\n_Reply with 1, 2 or 3_` },
  { language: 'pidgin',  category: 'onboarding', key: 'role_select', message: `👋 *Choose Your Role*\n\nWetin you wan do?\n\n1️⃣ 🏠 Household — Request pickup & earn reward\n2️⃣ 🚛 Collector — Collect waste & sell materials\n3️⃣ 🏭 Buyer — Buy recycled materials\n\n_Reply with 1, 2 or 3_` },

  /* HOUSEHOLD REGISTRATION */
  { language: 'english', category: 'registration', key: 'hh_name_prompt',    message: `📝 *Enter Your Full Name*\n\nPlease enter your full name (at least 2 characters)\n\n_Type your name_` },
  { language: 'pidgin',  category: 'registration', key: 'hh_name_prompt',    message: `📝 *Enter Your Full Name*\n\nEnter your full name (at least 2 characters)\n\n_Type your name_` },
  { language: 'english', category: 'registration', key: 'hh_phone_prompt',   message: `📞 *Enter Your Phone Number*\n\nPlease enter your WhatsApp phone number\n\nExample: 08012345678 or 2348012345678\n\n_Type your number_` },
  { language: 'pidgin',  category: 'registration', key: 'hh_phone_prompt',   message: `📞 *Enter Your Phone Number*\n\nEnter your WhatsApp phone number\n\nExample: 08012345678 or 2348012345678\n\n_Type your number_` },
  { language: 'english', category: 'registration', key: 'hh_state_select',   message: `📍 *Select Your State*\n\nWhich state are you in?\n\n1️⃣ Lagos\n2️⃣ Oyo\n3️⃣ Abuja\n4️⃣ Rivers\n5️⃣ Kano\n6️⃣ Other States\n\n_Reply with number_` },
  { language: 'pidgin',  category: 'registration', key: 'hh_state_select',   message: `📍 *Select Your State*\n\nWhich state you dey?\n\n1️⃣ Lagos\n2️⃣ Oyo\n3️⃣ Abuja\n4️⃣ Rivers\n5️⃣ Kano\n6️⃣ Other States\n\n_Reply with number_` },
  { language: 'english', category: 'registration', key: 'hh_lga_select',     message: `📍 *Select Your LGA*\n\nChoose your Local Government Area:\n\n1️⃣ Alimosho\n2️⃣ Ajeromi-Ifelodun\n3️⃣ Kosofe\n4️⃣ Mushin\n5️⃣ Ikeja\n6️⃣ Oshodi-Isolo\n\n_Reply with number_` },
  { language: 'pidgin',  category: 'registration', key: 'hh_lga_select',     message: `📍 *Select Your LGA*\n\nChoose your Local Government Area:\n\n1️⃣ Alimosho\n2️⃣ Ajeromi-Ifelodun\n3️⃣ Kosofe\n4️⃣ Mushin\n5️⃣ Ikeja\n6️⃣ Oshodi-Isolo\n\n_Reply with number_` },
  { language: 'english', category: 'registration', key: 'hh_address_prompt', message: `🏠 *Enter Your Address*\n\nPlease enter your full residential address\n\n_Type your address_` },
  { language: 'pidgin',  category: 'registration', key: 'hh_address_prompt', message: `🏠 *Enter Your Address*\n\nEnter your full residential address\n\n_Type your address_` },
  { language: 'english', category: 'registration', key: 'hh_size_select',    message: `👨‍👩‍👧‍👦 *Household Size*\n\nHow many people live in your household?\n\n1️⃣ 1 person\n2️⃣ 2-3 people\n3️⃣ 4-5 people\n4️⃣ 6-7 people\n5️⃣ 8+ people\n\n_Reply with number_` },
  { language: 'pidgin',  category: 'registration', key: 'hh_size_select',    message: `👨‍👩‍👧‍👦 *Household Size*\n\nHow many people dey your house?\n\n1️⃣ 1 person\n2️⃣ 2-3 people\n3️⃣ 4-5 people\n4️⃣ 6-7 people\n5️⃣ 8+ people\n\n_Reply with number_` },
  { language: 'english', category: 'registration', key: 'hh_complete',       message: `✅ *Registration Complete!*\n\nWelcome to EcoSort, friend! 🎉\n\nYour EcoSort ID: *{{ecoId}}*\nKeep this safe — you'll need it for pickups and rewards.\n\nYou can now:\n• Request waste pickups\n• Earn points\n• Unlock rewards\n• Learn about recycling\n\nTap the menu below to get started! 👇`, variables: 'ecoId' },
  { language: 'pidgin',  category: 'registration', key: 'hh_complete',       message: `✅ *Registration Don Complete!*\n\nWelcome to EcoSort, friend! 🎉\n\nYour EcoSort ID: *{{ecoId}}*\nKeep am safe — you go need am for pickup and reward.\n\nYou can now:\n• Request waste pickup\n• Earn points\n• Unlock rewards\n• Learn about recycling\n\nTap the menu below to start! 👇`, variables: 'ecoId' },

  /* HOUSEHOLD MENU */
  { language: 'english', category: 'menu', key: 'household_main', message: `🏠 *Household Dashboard*\n\nWhat would you like to do?\n\n1️⃣ Request Pickup\n2️⃣ Track Pickups\n3️⃣ Learn Recycling\n4️⃣ Quiz Challenge\n5️⃣ My Points\n6️⃣ Rewards\n7️⃣ My Profile\n8️⃣ Help\n\n_Reply with number (1-8)_` },
  { language: 'pidgin',  category: 'menu', key: 'household_main', message: `🏠 *Household Dashboard*\n\nWetin you wan do?\n\n1️⃣ Request Pickup\n2️⃣ Track Pickups\n3️⃣ Learn Recycling\n4️⃣ Quiz Challenge\n5️⃣ My Points\n6️⃣ Rewards\n7️⃣ My Profile\n8️⃣ Help\n\n_Reply with number (1-8)_` },
  { language: 'english', category: 'menu', key: 'collector_main', message: `🚛 *Collector Dashboard*\n\nWhat would you like to do?\n\n1️⃣ 📋 Available Pickups\n2️⃣ 📥 Accept Pickup\n3️⃣ 📤 Complete Pickup\n4️⃣ 🗺️ My Route\n5️⃣ 📦 My Inventory\n6️⃣ 🛒 Marketplace\n7️⃣ 💰 My Earnings\n8️⃣ 👤 My Profile\n9️⃣ ❓ Help\n\n_Reply with number (1-9)_` },
  { language: 'pidgin',  category: 'menu', key: 'collector_main', message: `🚛 *Collector Dashboard*\n\nWetin you wan do?\n\n1️⃣ 📋 Available Pickups\n2️⃣ 📥 Accept Pickup\n3️⃣ 📤 Complete Pickup\n4️⃣ 🗺️ My Route\n5️⃣ 📦 My Inventory\n6️⃣ 🛒 Marketplace\n7️⃣ 💰 My Earnings\n8️⃣ 👤 My Profile\n9️⃣ ❓ Help\n\n_Reply with number (1-9)_` },
  { language: 'english', category: 'menu', key: 'buyer_main',     message: `🏭 *Buyer Dashboard*\n\nWhat would you like to do?\n\n1️⃣ 🔍 Search Materials\n2️⃣ 📋 Browse All Listings\n3️⃣ 💬 Make an Offer\n4️⃣ 📦 My Offers\n5️⃣ 📊 My Transactions\n6️⃣ 🌿 ESG Certificates\n7️⃣ ⭐ Saved Collectors\n8️⃣ 👤 My Profile\n9️⃣ ❓ Help\n\n_Reply with number (1-9)_` },
  { language: 'pidgin',  category: 'menu', key: 'buyer_main',     message: `🏭 *Buyer Dashboard*\n\nWetin you wan do?\n\n1️⃣ 🔍 Search Materials\n2️⃣ 📋 Browse All Listings\n3️⃣ 💬 Make an Offer\n4️⃣ 📦 My Offers\n5️⃣ 📊 My Transactions\n6️⃣ 🌿 ESG Certificates\n7️⃣ ⭐ Saved Collectors\n8️⃣ 👤 My Profile\n9️⃣ ❓ Help\n\n_Reply with number (1-9)_` },

  /* PICKUP FLOW */
  { language: 'english', category: 'pickup', key: 'waste_type_select',  message: `♻️ *Step 1 of 5: Select Waste Type*\n\nWhat type of waste would you like to recycle?\n\n1️⃣ ♻️ Plastic Waste\n2️⃣ 📄 Paper Waste\n3️⃣ 🔩 Metal Waste\n4️⃣ 🍾 Glass Waste\n5️⃣ 🌱 Organic Waste\n6️⃣ ⚡ E-Waste\n7️⃣ 🗑️ Mixed Waste\n\n_Reply with number_` },
  { language: 'pidgin',  category: 'pickup', key: 'waste_type_select',  message: `♻️ *Step 1 of 5: Select Waste Type*\n\nWetin kind waste you go recycle?\n\n1️⃣ ♻️ Plastic Waste\n2️⃣ 📄 Paper Waste\n3️⃣ 🔩 Metal Waste\n4️⃣ 🍾 Glass Waste\n5️⃣ 🌱 Organic Waste\n6️⃣ ⚡ E-Waste\n7️⃣ 🗑️ Mixed Waste\n\n_Reply with number_` },
  { language: 'english', category: 'pickup', key: 'quantity_prompt',    message: `*Step 2 of 5: Enter Quantity*\n\nHow much waste do you have? (in KG only)\n\nExamples: 5kg, 10kg, 25kg\n\n_Type the quantity (e.g. 10)_` },
  { language: 'pidgin',  category: 'pickup', key: 'quantity_prompt',    message: `*Step 2 of 5: Enter Quantity*\n\nHow much waste you get? (in KG only)\n\nExamples: 5kg, 10kg, 25kg\n\n_Type the quantity (e.g. 10)_` },
  { language: 'english', category: 'pickup', key: 'day_select',         message: `*Step 4 of 5: Preferred Collection Day*\n\nWhen should we pick up your waste?\n\n1️⃣ Monday\n2️⃣ Tuesday\n3️⃣ Wednesday\n4️⃣ Thursday\n5️⃣ Friday\n6️⃣ Saturday\n\n_Reply with number_` },
  { language: 'pidgin',  category: 'pickup', key: 'day_select',         message: `*Step 4 of 5: Preferred Collection Day*\n\nWhen we should come pick am?\n\n1️⃣ Monday\n2️⃣ Tuesday\n3️⃣ Wednesday\n4️⃣ Thursday\n5️⃣ Friday\n6️⃣ Saturday\n\n_Reply with number_` },
  { language: 'english', category: 'pickup', key: 'time_select',        message: `*Step 5 of 5: Preferred Collection Time*\n\nWhat time works best for you?\n\n1️⃣ 8am - 10am\n2️⃣ 10am - 12pm\n3️⃣ 12pm - 2pm\n4️⃣ 2pm - 4pm\n\n_Reply with number_` },
  { language: 'pidgin',  category: 'pickup', key: 'time_select',        message: `*Step 5 of 5: Preferred Collection Time*\n\nWetin time good for you?\n\n1️⃣ 8am - 10am\n2️⃣ 10am - 12pm\n3️⃣ 12pm - 2pm\n4️⃣ 2pm - 4pm\n\n_Reply with number_` },
  { language: 'english', category: 'pickup', key: 'submitted',          message: `✅ *Pickup Request Submitted!*\n\nPickup ID: *{{pickupId}}*\nStatus: 🟡 Pending\n\nWe've saved your request and will update you as soon as a collector is assigned.\n\nType *menu* to return to your dashboard.`, variables: 'pickupId' },
  { language: 'pidgin',  category: 'pickup', key: 'submitted',          message: `✅ *Pickup Request Don Submit!*\n\nPickup ID: *{{pickupId}}*\nStatus: 🟡 Pending\n\nWe don save your request. We go update you once collector don accept am.\n\nType *menu* to return to your dashboard.`, variables: 'pickupId' },
  { language: 'english', category: 'pickup', key: 'no_pickups',         message: `*No Active Pickups*\n\nYou don't have any pending pickups right now.\n\n1️⃣ Request a new pickup\n2️⃣ Return to menu\n\n_Reply with 1 or 2_` },
  { language: 'pidgin',  category: 'pickup', key: 'no_pickups',         message: `*No Active Pickups*\n\nYou no get pending pickup now.\n\n1️⃣ Request new pickup\n2️⃣ Return to menu\n\n_Reply with 1 or 2_` },
  { language: 'english', category: 'pickup', key: 'cancel_confirm',     message: `*Cancel Pickup*\n\nAre you sure you want to cancel this pickup?\n\n1️⃣ Yes, cancel it\n2️⃣ No, keep it\n\n_Reply with number_` },
  { language: 'pidgin',  category: 'pickup', key: 'cancel_confirm',     message: `*Cancel Pickup*\n\nYou sure say you wan cancel this pickup?\n\n1️⃣ Yes, cancel am\n2️⃣ No, make e continue\n\n_Reply with number_` },
  { language: 'english', category: 'pickup', key: 'cancelled',          message: `✅ *Pickup Cancelled*\n\nThe pickup request has been cancelled.\n\nType *menu* to return to your dashboard.` },
  { language: 'pidgin',  category: 'pickup', key: 'cancelled',          message: `✅ *Pickup Cancelled*\n\nThe pickup request don cancel.\n\nType *menu* to return to your dashboard.` },

  /* QUIZ */
  { language: 'english', category: 'quiz', key: 'start',    message: `*Recycling Quiz Challenge*\n\nTest your recycling knowledge and earn points!\n\n• 5 questions\n• Earn 10 points per correct answer\n• Maximum: 50 points\n• Can pause and resume anytime\n\nReady to start?\n\n1️⃣ ✅ Start Quiz\n2️⃣ Back to Menu\n\n_Reply with 1 or 2_` },
  { language: 'pidgin',  category: 'quiz', key: 'start',    message: `*Recycling Quiz Challenge*\n\nTest your recycling knowledge and earn points!\n\n• 5 questions\n• Earn 10 points per correct answer\n• Maximum: 50 points\n• Can pause and resume anytime\n\nYou ready?\n\n1️⃣ ✅ Start Quiz\n2️⃣ Back to Menu\n\n_Reply with 1 or 2_` },
  { language: 'english', category: 'quiz', key: 'complete', message: `🎉 *Quiz Complete!*\n\nYour Score: *{{score}}/{{total}}*\nPoints Earned: *{{points}}* 🏆\n\nGreat job! Check your points in the menu.\n\n1️⃣ Retake Quiz\n2️⃣ Back to Menu\n\n_Reply with 1 or 2_`, variables: 'score,total,points' },
  { language: 'pidgin',  category: 'quiz', key: 'complete', message: `🎉 *Quiz Complete!*\n\nYour Score: *{{score}}/{{total}}*\nPoints Earned: *{{points}}* 🏆\n\nExcellent! Check your points in the menu.\n\n1️⃣ Retake Quiz\n2️⃣ Back to Menu\n\n_Reply with 1 or 2_`, variables: 'score,total,points' },

  /* REWARDS */
  { language: 'english', category: 'rewards', key: 'available', message: `🎁 *Available Rewards*\n\n500 points = 📱 ₦500 Airtime\n1000 points = 📶 1GB Data Bundle\n2500 points = 🛍️ ₦2,500 Shopping Voucher\n5000 points = 💳 Premium Membership\n\nYou have: *{{points}}* points\n\nSelect a reward to redeem:\n1️⃣ 500pt Airtime\n2️⃣ 1000pt Data\n3️⃣ 2500pt Voucher\n4️⃣ 5000pt Premium\n5️⃣ ⬅️ Back\n\n_Reply with number_`, variables: 'points' },
  { language: 'pidgin',  category: 'rewards', key: 'available', message: `🎁 *Available Rewards*\n\n500 points = 📱 ₦500 Airtime\n1000 points = 📶 1GB Data Bundle\n2500 points = 🛍️ ₦2,500 Shopping Voucher\n5000 points = 💳 Premium Membership\n\nYou get: *{{points}}* points\n\nChoose reward wey you want redeem:\n1️⃣ 500pt Airtime\n2️⃣ 1000pt Data\n3️⃣ 2500pt Voucher\n4️⃣ 5000pt Premium\n5️⃣ ⬅️ Back\n\n_Reply with number_`, variables: 'points' },
  { language: 'english', category: 'rewards', key: 'redeemed', message: `✅ *Reward Redemption Requested!*\n\nYour reward request has been received.\n\nWe will review and process it within 24 hours.\n\nType *menu* to return to your dashboard.` },
  { language: 'pidgin',  category: 'rewards', key: 'redeemed', message: `✅ *Reward Redemption Requested!*\n\nWe don receive your reward request.\n\nWe go process am within 24 hours.\n\nType *menu* to return to your dashboard.` },

  /* POINTS */
  { language: 'english', category: 'points', key: 'my_points', message: `*Your Points*\n\nTotal Points: *{{total}}*\nMonthly Points: *{{monthly}}*\nLifetime Points: *{{lifetime}}*\n\nWays to Earn:\n• Request pickups: 10 points\n• Complete pickups: 20 points\n• Quiz completion: 50 points\n• Community actions: 20 points\n\n1️⃣ View Rewards\n2️⃣ Leaderboard\n3️⃣ Back\n\n_Reply with number_`, variables: 'total,monthly,lifetime' },
  { language: 'pidgin',  category: 'points', key: 'my_points', message: `*Your Points*\n\nTotal Points: *{{total}}*\nMonthly Points: *{{monthly}}*\nLifetime Points: *{{lifetime}}*\n\nWays to Earn:\n• Request pickup: 10 points\n• Complete pickup: 20 points\n• Quiz completion: 50 points\n• Community actions: 20 points\n\n1️⃣ View Rewards\n2️⃣ Leaderboard\n3️⃣ Back\n\n_Reply with number_`, variables: 'total,monthly,lifetime' },

  /* HELP CENTER */
  { language: 'english', category: 'help', key: 'main',            message: `*EcoSort Help Center*\n\nHow can we help?\n\n1️⃣ How pickups work\n2️⃣ How points work\n3️⃣ How rewards work\n4️⃣ How selling works\n5️⃣ Contact support\n6️⃣ Back to menu\n\n_Reply with number_` },
  { language: 'pidgin',  category: 'help', key: 'main',            message: `*EcoSort Help Center*\n\nHow I fit help you?\n\n1️⃣ How pickups work\n2️⃣ How points work\n3️⃣ How rewards work\n4️⃣ How selling works\n5️⃣ Contact support\n6️⃣ Back to menu\n\n_Reply with number_` },
  { language: 'english', category: 'help', key: 'contact_support', message: `*Contact Support*\n\nWe're here to help!\n\n📧 Email: support@ecosort.ng\n📱 WhatsApp: +234 800 000 0000\n🕐 Hours: 8am - 6pm (Mon-Fri)\n\nOr reply here and we'll respond within 1 hour.\n\n1️⃣ Back to help\n\n_Reply with 1_` },
  { language: 'pidgin',  category: 'help', key: 'contact_support', message: `*Contact Support*\n\nWe dey for you!\n\n📧 Email: support@ecosort.ng\n📱 WhatsApp: +234 800 000 0000\n🕐 Hours: 8am - 6pm (Mon-Fri)\n\nOr reply here and we go respond within 1 hour.\n\n1️⃣ Back to help\n\n_Reply with 1_` },
  { language: 'english', category: 'help', key: 'pickups_work',    message: `*How Pickups Work*\n\nStep-by-step:\n1. Request a pickup from your dashboard\n2. Select waste type and quantity\n3. Choose preferred day and time\n4. A collector will be assigned\n5. Get notification when they're on the way\n6. Pickup completed and points earned!\n\n1️⃣ Back to help\n\n_Reply with 1_` },
  { language: 'pidgin',  category: 'help', key: 'pickups_work',    message: `*How Pickups Work*\n\nStep by step:\n1. Request pickup from your dashboard\n2. Select waste type and quantity\n3. Choose preferred day and time\n4. We go assign collector for you\n5. Get notification when collector coming\n6. Pickup don finish and you earn points!\n\n1️⃣ Back to help\n\n_Reply with 1_` },
  { language: 'english', category: 'help', key: 'points_work',     message: `*How Points Work*\n\nEarn points by:\n• Request pickup: 10 points\n• Complete pickup: 20 points\n• Quiz completion: 50 points\n• Refer a friend: 25 points\n• Community actions: 20 points\n\nNo expiry date.\n\n1️⃣ Back to help\n\n_Reply with 1_` },
  { language: 'pidgin',  category: 'help', key: 'points_work',     message: `*How Points Work*\n\nEarn points by:\n• Request pickup: 10 points\n• Complete pickup: 20 points\n• Quiz completion: 50 points\n• Refer friend: 25 points\n• Community actions: 20 points\n\nNo expiry.\n\n1️⃣ Back to help\n\n_Reply with 1_` },
  { language: 'english', category: 'help', key: 'rewards_work',    message: `*How Rewards Work*\n\nRedeem your points for:\n✓ 500 points = ₦500 Airtime\n✓ 1000 points = 1GB Data Bundle\n✓ 2500 points = ₦2,500 Voucher\n✓ 5000 points = Premium Membership\n\nHow to redeem:\n1. Go to Rewards from menu\n2. Select reward you want\n3. We process within 24 hours\n\n1️⃣ Back to help\n\n_Reply with 1_` },
  { language: 'pidgin',  category: 'help', key: 'rewards_work',    message: `*How Rewards Work*\n\nRedeem your points for:\n✓ 500 points = ₦500 Airtime\n✓ 1000 points = 1GB Data Bundle\n✓ 2500 points = ₦2,500 Voucher\n✓ 5000 points = Premium Membership\n\nHow to redeem:\n1. Go to Rewards from menu\n2. Select reward you want\n3. We go process am within 24 hours\n\n1️⃣ Back to help\n\n_Reply with 1_` },

  /* ERROR MESSAGES */
  { language: 'english', category: 'error', key: 'invalid_choice',    message: `❌ That's not a valid option. Please try again.` },
  { language: 'pidgin',  category: 'error', key: 'invalid_choice',    message: `❌ That option no correct. Try again abeg.` },
  { language: 'english', category: 'error', key: 'invalid_phone',     message: `❌ That doesn't look like a valid phone number. Try again (e.g. 08012345678).` },
  { language: 'pidgin',  category: 'error', key: 'invalid_phone',     message: `❌ That number no correct. Try again (e.g. 08012345678).` },
  { language: 'english', category: 'error', key: 'invalid_name',      message: `❌ Please enter a valid name (at least 2 characters).` },
  { language: 'pidgin',  category: 'error', key: 'invalid_name',      message: `❌ Enter correct name (at least 2 characters).` },
  { language: 'english', category: 'error', key: 'invalid_quantity',  message: `❌ Please enter a valid quantity in KG (e.g. 10, 25.5).` },
  { language: 'pidgin',  category: 'error', key: 'invalid_quantity',  message: `❌ Enter correct quantity in KG (e.g. 10, 25.5).` },
  { language: 'english', category: 'error', key: 'not_registered',    message: `⚠️ You're not registered yet.\n\nTo get started:\n1️⃣ Type *register* to create your profile\n2️⃣ Choose your role (Household/Collector/Buyer)\n\n_Type: register_` },
  { language: 'pidgin',  category: 'error', key: 'not_registered',    message: `⚠️ You never register yet.\n\nTo start:\n1️⃣ Type *register* to create your profile\n2️⃣ Choose your role (Household/Collector/Buyer)\n\n_Type: register_` },
  { language: 'english', category: 'error', key: 'already_registered', message: `✅ Welcome back! You're already registered.\n\nType *menu* to see your dashboard.` },
  { language: 'pidgin',  category: 'error', key: 'already_registered', message: `✅ Welcome back! You don register before.\n\nType *menu* to see your dashboard.` },
  { language: 'english', category: 'error', key: 'retry',             message: `❌ I didn't understand that. Please try again.` },
  { language: 'pidgin',  category: 'error', key: 'retry',             message: `❌ I no understand. Try again abeg.` },

  /* CONFIRMATION */
  { language: 'english', category: 'confirmation', key: 'back_to_menu',     message: `⬅️ Type *menu* to return to your dashboard.` },
  { language: 'pidgin',  category: 'confirmation', key: 'back_to_menu',     message: `⬅️ Type *menu* to go back.` },
  { language: 'english', category: 'confirmation', key: 'profile_updated',  message: `✅ Profile updated successfully!` },
  { language: 'pidgin',  category: 'confirmation', key: 'profile_updated',  message: `✅ Profile don update!` },

  /* COLLECTOR REGISTRATION */
  { language: 'english', category: 'registration', key: 'col_name_prompt',    message: `🚛 *Collector Registration*\n\nStep 1 of 5: Full Name\n\nWhat is your full name?\n\n_Type your name_` },
  { language: 'pidgin',  category: 'registration', key: 'col_name_prompt',    message: `🚛 *Collector Registration*\n\nStep 1 of 5: Full Name\n\nWetin be your full name?\n\n_Type your name_` },
  { language: 'english', category: 'registration', key: 'col_specialty',      message: `♻️ *Material Specialty*\n\nStep 4 of 5: What do you collect?\n\n1️⃣ PET Bottles\n2️⃣ Metals & Aluminum\n3️⃣ Nylon & Plastics\n4️⃣ Paper & Cartons\n5️⃣ Mixed Recyclables\n6️⃣ All Materials\n\n_Reply with number_` },
  { language: 'pidgin',  category: 'registration', key: 'col_specialty',      message: `♻️ *Material Specialty*\n\nStep 4 of 5: Wetin you dey collect?\n\n1️⃣ PET Bottles\n2️⃣ Metals & Aluminum\n3️⃣ Nylon & Plastics\n4️⃣ Paper & Cartons\n5️⃣ Mixed Recyclables\n6️⃣ All Materials\n\n_Reply with number_` },
  { language: 'english', category: 'registration', key: 'col_complete',       message: `✅ *Registration Complete!*\n\nWelcome to EcoSort! 🎉\n\nYour Collector ID: *{{ecoId}}*\nKeep this safe — buyers use it to find you.\n\nType *menu* to open your dashboard. 🚛`, variables: 'ecoId' },
  { language: 'pidgin',  category: 'registration', key: 'col_complete',       message: `✅ *Registration Don Complete!*\n\nWelcome to EcoSort! 🎉\n\nYour Collector ID: *{{ecoId}}*\nKeep am safe — buyers go use am to find you.\n\nType *menu* to open your dashboard. 🚛`, variables: 'ecoId' },

  /* BUYER REGISTRATION */
  { language: 'english', category: 'registration', key: 'buyer_company_prompt', message: `🏭 *Buyer Registration*\n\nStep 1 of 5: Company Name\n\nWhat is your company or organisation name?\n\n_Type your company name_` },
  { language: 'pidgin',  category: 'registration', key: 'buyer_company_prompt', message: `🏭 *Buyer Registration*\n\nStep 1 of 5: Company Name\n\nWetin be your company or organisation name?\n\n_Type your company name_` },
  { language: 'english', category: 'registration', key: 'buyer_complete',        message: `✅ *Registration Complete!*\n\nWelcome to EcoSort Marketplace! 🎉\n\nYour Buyer ID: *{{ecoId}}*\nKeep this safe for your records.\n\nType *menu* to open your dashboard. 🏭`, variables: 'ecoId' },
  { language: 'pidgin',  category: 'registration', key: 'buyer_complete',        message: `✅ *Registration Don Complete!*\n\nWelcome to EcoSort Marketplace! 🎉\n\nYour Buyer ID: *{{ecoId}}*\nKeep am safe for your records.\n\nType *menu* to open your dashboard. 🏭`, variables: 'ecoId' },

  /* NOTIFICATION */
  { language: 'english', category: 'notification', key: 'pickup_assigned',    message: `🔔 *Pickup Assigned!*\n\nA collector has been assigned to your pickup {{pickupId}}.\nThey'll contact you shortly.\n\nType *menu* to track your pickup.`, variables: 'pickupId' },
  { language: 'pidgin',  category: 'notification', key: 'pickup_assigned',    message: `🔔 *Pickup Assigned!*\n\nCollector don accept your pickup {{pickupId}}.\nThey go contact you soon.\n\nType *menu* to track your pickup.`, variables: 'pickupId' },
  { language: 'english', category: 'notification', key: 'pickup_completed',   message: `✅ *Pickup Completed!*\n\nYour pickup {{pickupId}} has been completed.\nPoints earned: *{{points}}*\n\nType *menu* to see your points.`, variables: 'pickupId,points' },
  { language: 'pidgin',  category: 'notification', key: 'pickup_completed',   message: `✅ *Pickup Don Complete!*\n\nYour pickup {{pickupId}} don finish.\nPoints earned: *{{points}}*\n\nType *menu* to see your points.`, variables: 'pickupId,points' },
  { language: 'english', category: 'notification', key: 'lang_changed_en',    message: `✅ Language switched to English.` },
  { language: 'pidgin',  category: 'notification', key: 'lang_changed_pid',   message: `✅ Language switched to Pidgin.` },
];

/* ── Seed all rows ───────────────────────────────────────────────── */
async function seed() {
  console.log(`\n🌱 Seeding ${rows.length} bot messages into Supabase...\n`);

  /* Add active flag and timestamps */
  const toInsert = rows.map(r => ({
    language:   r.language,
    category:   r.category,
    key:        r.key,
    message:    r.message,
    variables:  r.variables || '',
    active:     true,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('bot_messages')
    .upsert(toInsert, { onConflict: 'language,key' });

  if (error) {
    console.error('❌ Seed failed:', error.message);
    console.error('   Details:', error.details || error.hint || '');
    process.exit(1);
  }

  console.log(`✅ Seeded ${toInsert.length} messages successfully!`);
  console.log('\nYou can now edit ALL bot messages in the Admin Dashboard → WhatsApp Bot → Bot Messages\n');
}

seed();
