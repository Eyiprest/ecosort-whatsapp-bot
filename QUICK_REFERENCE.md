/**
 * ECOSORT DEVELOPER QUICK REFERENCE
 * 
 * Fast lookup guide for refactored architecture
 * Use this while implementing flows
 */

# ═══════════════════════════════════════════════════════════════════════════════
# QUICK IMPORTS & SETUP
# ═══════════════════════════════════════════════════════════════════════════════

```javascript
// In your flow file (e.g., flows/household.js)

const session = require('../utils/session');
const storage = require('../utils/storage');
const { screen, errors, confirmation } = require('../utils/messages');
const {
  WASTE_CATEGORIES,
  PICKUP_STATUSES,
  DAYS_OF_WEEK,
  TIME_SLOTS,
  generatePickupId,
  timestamp,
  normalizePhone
} = require('../utils/helpers');
const { isMenuChoice, getMenuChoice, isPositiveNumber, isValidName } = require('../utils/validators');

// From messages.js:
// - onboarding, householdRegistration, householdMenu
// - requestPickup, trackPickups, learnRecycling, quiz, pointsRewards
// - collectorMenu, buyerMenu, errors, confirmation
```

# ═══════════════════════════════════════════════════════════════════════════════
# SESSION OPERATIONS
# ═══════════════════════════════════════════════════════════════════════════════

```javascript
// Get session (auto-loads from disk if exists)
const sess = session.get(phone);

// Update session
session.set(phone, { step: 'household_menu', lang: 'en' });

// Move to next step
session.setStep(phone, 'pickup_waste');

// Get current step
const step = session.getStep(phone);

// Save form data
session.setData(phone, 'pickupWaste', 'plastic');
session.setData(phone, 'pickupQuantity', 15.5);

// Get form data
const waste = session.getData(phone, 'pickupWaste');

// Set role
session.setRole(phone, 'household');

// Check registration
if (session.isRegistered(phone)) { ... }

// Go back
session.goBack(phone);

// Reset completely (keep language)
session.reset(phone);

// Get summary for debugging
const summary = session.getSummary(phone);
console.log(summary);
```

# ═══════════════════════════════════════════════════════════════════════════════
# DISPLAYING SCREENS
# ═══════════════════════════════════════════════════════════════════════════════

```javascript
const lang = sess.lang;  // Get user's language

// Simple screen
await message.reply(screen(householdMenu.main, lang));

// Screen with parameters
const pickupId = 'PU-12345';
const confirmMsg = requestPickup.pickupSubmitted(pickupId);
await message.reply(screen(confirmMsg, lang));

// Build dynamic content
const details = `
Waste: Plastic Waste
Quantity: 15.5kg
Address: 45 Main Street
Day: Monday
Time: 10am - 12pm
`;
const reviewScreen = requestPickup.reviewRequest(details);
await message.reply(screen(reviewScreen, lang));

// Show error
await message.reply(screen(errors.invalidQuantity, lang));
```

# ═══════════════════════════════════════════════════════════════════════════════
# WASTE CATEGORIES
# ═══════════════════════════════════════════════════════════════════════════════

```javascript
// The 6 categories:
// 'plastic', 'paper', 'metal', 'glass', 'organic', 'ewaste'

// Use in screens:
WASTE_CATEGORIES.map((cat, i) => 
  `${i+1}. ${cat.emoji} ${cat.name}`
).join('\n');

// Get emoji + name:
const { wasteCategoryEmoji } = require('../utils/helpers');
console.log(wasteCategoryEmoji('plastic'));  // ♻️ Plastic Waste
```

# ═══════════════════════════════════════════════════════════════════════════════
# VALIDATION
# ═══════════════════════════════════════════════════════════════════════════════

```javascript
// Menu choices
if (!isMenuChoice(body, 8)) {
  await message.reply(screen(errors.invalidChoice, lang));
  return;
}
const choice = getMenuChoice(body);  // Returns 1-8

// Numbers
if (!isPositiveNumber(body)) {
  await message.reply(screen(errors.invalidQuantity, lang));
  return;
}
const qty = parseFloat(body);

// Names
if (!isValidName(body)) {
  await message.reply(screen(errors.invalidName, lang));
  return;
}

// Phone
if (!isValidPhone(body)) {
  await message.reply(screen(errors.invalidPhone, lang));
  return;
}
```

# ═══════════════════════════════════════════════════════════════════════════════
# STORAGE OPERATIONS
# ═══════════════════════════════════════════════════════════════════════════════

```javascript
// Read all
const allPickups = storage.readAll('pickups');

// Find one
const user = storage.findOne('users', u => u.phone === phone);

// Find all
const pickups = storage.findAll('pickups', p => p.userId === userId);

// Insert
const pickup = {
  id: generatePickupId(),
  userId,
  wasteType: 'plastic',
  quantity: 15.5,
  status: 'pending',
  requestedAt: timestamp()
};
storage.insert('pickups', pickup);

// Update
storage.update('pickups', p => p.id === pickupId, {
  status: 'assigned',
  collectorId: collectorId,
  assignedAt: timestamp()
});

// Delete
storage.remove('pickups', p => p.id === pickupId);
```

# ═══════════════════════════════════════════════════════════════════════════════
# COMMON PATTERNS
# ═══════════════════════════════════════════════════════════════════════════════

## Pattern 1: Menu Handler
```javascript
async function handleState(client, message, phone, sess) {
  if (sess.step === 'household_menu') {
    if (!isMenuChoice(message.body, 8)) {
      await message.reply(screen(householdMenu.main, sess.lang));
      return;
    }
    
    const choice = getMenuChoice(message.body);
    const handlers = {
      1: 'pickup_waste',
      2: 'track_pickups',
      3: 'learn_recycling_category',
      // ...
    };
    
    session.setStep(phone, handlers[choice]);
  }
}
```

## Pattern 2: Form Input
```javascript
if (sess.step === 'pickup_quantity') {
  const body = message.body.trim();
  
  if (!isPositiveNumber(body)) {
    await message.reply(screen(errors.invalidQuantity, sess.lang));
    return;
  }
  
  session.setData(phone, 'pickupQuantity', parseFloat(body));
  session.setStep(phone, 'pickup_address');
  await message.reply(screen(requestPickup.addressConfirm, sess.lang));
}
```

## Pattern 3: Create + Notify
```javascript
// Create object
const pickup = {
  id: generatePickupId(),
  userId: session.getUserId(phone),  // Get from user storage
  wasteType: session.getData(phone, 'pickupWaste'),
  quantity: session.getData(phone, 'pickupQuantity'),
  status: 'pending',
  requestedAt: timestamp()
};

// Save
storage.insert('pickups', pickup);

// Clear form
session.setData(phone, {});

// Move to next step
session.setStep(phone, 'household_menu');

// Send confirmation
await message.reply(screen(requestPickup.pickupSubmitted(pickup.id), sess.lang));

// Notify collectors
const collectors = storage.findAll('collectors', c => c.active);
collectors.forEach(col => {
  client.sendMessage(col.phone, { 
    text: `New pickup available:\n${pickupSummary(pickup)}`
  });
});
```

## Pattern 4: Status Update + Notify
```javascript
// Get pickup
const pickup = storage.findOne('pickups', p => p.id === pickupId);

// Update status
storage.update('pickups', p => p.id === pickupId, {
  status: 'on_the_way',
  updatedAt: timestamp()
});

// Notify household
const user = storage.findOne('users', u => u.id === pickup.userId);
const statusMsg = `🚗 ${user.name}, your collector is on the way!`;
await client.sendMessage(user.phone, { text: statusMsg });
```

# ═══════════════════════════════════════════════════════════════════════════════
# STEP FLOW REFERENCE
# ═══════════════════════════════════════════════════════════════════════════════

## Household Registration Flow
```
start
├─ lang_select → set language
├─ role_select → select role
└─ If role = 'household':
   ├─ reg_name → collect name
   ├─ reg_phone → collect phone
   ├─ reg_state → select state
   ├─ reg_lga → select LGA
   ├─ reg_address → collect address
   ├─ reg_household_size → select size
   └─ Create user → household_menu
```

## Household Request Pickup Flow
```
household_menu (choice: 1)
├─ pickup_waste → select waste type
├─ pickup_quantity → enter KG
├─ pickup_address → choose address
├─ pickup_day → select day
├─ pickup_time → select time
├─ pickup_review → review & confirm
└─ pickup_submitted → household_menu
```

## Household Quiz Flow
```
household_menu (choice: 4)
├─ quiz_start → show instructions
├─ quiz_q1 → question 1/5
├─ quiz_q2 → question 2/5
├─ quiz_q3 → question 3/5
├─ quiz_q4 → question 4/5
├─ quiz_q5 → question 5/5
├─ quiz_complete → show score
└─ household_menu
```

# ═══════════════════════════════════════════════════════════════════════════════
# GENERATING IDS
# ═══════════════════════════════════════════════════════════════════════════════

```javascript
// User IDs (auto-incremented)
const ecoId = generateEcoId('household');     // ECO-HH-001
const ecoId = generateEcoId('collector');    // ECO-COL-001
const ecoId = generateEcoId('buyer');        // ECO-BUY-001

// Pickup ID (random)
const pickupId = generatePickupId();         // PU-1748965432-ABC123

// Offer ID (random)
const offerId = generateOfferId();           // OF-1748965432-XYZ789

// Transaction ID (random)
const txnId = generateTransactionId();       // TXN-1748965432-DEF456

// Generic ID
const id = generateId('NOT');                // NOT-a1b2c3d4
```

# ═══════════════════════════════════════════════════════════════════════════════
# STATUS REFERENCE
# ═══════════════════════════════════════════════════════════════════════════════

```javascript
// Pickup Statuses
const PICKUP_STATUSES = {
  pending: '🟡 Pending',
  assigned: '🔵 Collector Assigned',
  scheduled: '🟣 Scheduled',
  on_the_way: '🚗 On The Way',
  arrived: '🏠 Arrived',
  collected: '✅ Collected',
  completed: '🎉 Completed',
  cancelled: '❌ Cancelled'
};

// Offer Statuses
const OFFER_STATUSES = {
  pending: '⏳ Pending',
  accepted: '✅ Accepted',
  rejected: '❌ Rejected',
  countered: '🔄 Countered',
  completed: '🎉 Completed'
};
```

# ═══════════════════════════════════════════════════════════════════════════════
# DEBUGGING
# ═══════════════════════════════════════════════════════════════════════════════

```javascript
// Check session state
const summary = session.getSummary(phone);
console.log('Session:', summary);
// Output: {
//   phone: "2348012345678",
//   role: "household",
//   step: "pickup_waste",
//   flow: "household",
//   lang: "en",
//   dataKeys: ["pickupWaste"],
//   createdAt: "2025-06-02T10:00:00Z",
//   updatedAt: "2025-06-02T10:05:00Z"
// }

// Check user
const user = storage.findOne('users', u => u.phone === phone);
console.log('User:', user);

// Check user pickups
const pickups = storage.findAll('pickups', p => p.userId === user.id);
console.log('Pickups:', pickups);

// Check what's in form data
const qty = session.getData(phone, 'pickupQuantity');
console.log('Quantity:', qty);
```

# ═══════════════════════════════════════════════════════════════════════════════
# COMMON MISTAKES TO AVOID
# ═══════════════════════════════════════════════════════════════════════════════

❌ **WRONG**: Checking step without getting session first
✅ **RIGHT**: const sess = session.get(phone); then use sess.step

❌ **WRONG**: Not saving after every interaction
✅ **RIGHT**: session.set() or session.setStep() after each input

❌ **WRONG**: Clearing all session data on error
✅ **RIGHT**: Keep data, just show error message

❌ **WRONG**: Not validating user input
✅ **RIGHT**: Always validate before saving

❌ **WRONG**: Sending screens without lang parameter
✅ **RIGHT**: Always pass sess.lang to screen()

❌ **WRONG**: Using old message format
✅ **RIGHT**: Use screen() helper with messages.js

❌ **WRONG**: Not checking if registered
✅ **RIGHT**: if (!session.isRegistered(phone)) first

# ═══════════════════════════════════════════════════════════════════════════════
# HELPFUL SNIPPETS
# ═══════════════════════════════════════════════════════════════════════════════

## Get user ID from phone
```javascript
const user = storage.findOne('users', u => u.phone === phone);
const userId = user ? user.id : null;
```

## Get user's active pickups
```javascript
const user = storage.findOne('users', u => u.phone === phone);
const active = storage.findAll('pickups', p => 
  p.userId === user.id && !['completed', 'cancelled'].includes(p.status)
);
```

## List all collectors in area
```javascript
const user = storage.findOne('users', u => u.phone === phone);
const collectors = storage.findAll('collectors', c =>
  c.serviceArea.includes(user.lga)
);
```

## Build pickup summary
```javascript
const pickup = storage.findOne('pickups', p => p.id === pickupId);
const summary = `
♻️ ${pickup.wasteType}
⚖️ ${pickup.quantity}kg
📍 ${pickup.address}
📅 ${pickup.preferredDay} (${pickup.preferredTime})
${pickupStatus(pickup.status)}
`;
```

## Award points for action
```javascript
const user = storage.findOne('users', u => u.phone === phone);
const points = 10;  // base points
storage.update('users', u => u.id === user.id, {
  points: user.points + points,
  pointsMonthly: (user.pointsMonthly || 0) + points,
  pointsLifetime: (user.pointsLifetime || 0) + points
});
```

# ═══════════════════════════════════════════════════════════════════════════════
# FILES REFERENCE
# ═══════════════════════════════════════════════════════════════════════════════

**Data Files** (./data/):
- users.json → Household users
- collectors.json → Collectors
- buyers.json → Buyers
- pickups.json → All pickup requests
- listings.json → Marketplace listings
- offers.json → Offers made
- transactions.json → Completed sales
- certificates.json → ESG certificates
- notifications.json → User notifications
- quiz_progress.json → Quiz state

**Session Files** (./data/_sessions/):
- {phone}.json → Persisted session for each user

**Code Files**:
- utils/helpers.js → Constants, generators, utilities
- utils/messages.js → All screens (50+)
- utils/session.js → Session management
- utils/storage.js → File-based storage
- utils/validators.js → Input validation
- flows/household.js → Household flows
- flows/collector.js → Collector flows
- flows/buyer.js → Buyer flows
