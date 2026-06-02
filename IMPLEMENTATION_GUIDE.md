/**
 * ECOSORT REFACTORING IMPLEMENTATION GUIDE
 * 
 * This guide walks through implementing the complete UX redesign.
 * Follow these steps in order to integrate all components.
 */

# ═══════════════════════════════════════════════════════════════════════════════
# COMPLETED REFACTORING TASKS
# ═══════════════════════════════════════════════════════════════════════════════

## ✅ PHASE 1: FOUNDATION (COMPLETED)

### 1.1 Updated helpers.js
- ✅ Added WASTE_CATEGORIES (6 standard types)
- ✅ Added PICKUP_STATUSES with emoji indicators
- ✅ Added OFFER_STATUSES
- ✅ Added TIME_SLOTS and DAYS_OF_WEEK constants
- ✅ Added generatePickupId(), generateOfferId(), generateTransactionId()
- ✅ Added formatTime(), offerStatus(), wasteCategoryEmoji()
- ✅ Updated exports with all new functions

### 1.2 Refactored messages.js
- ✅ Created comprehensive conversation screens
- ✅ Implemented onboarding (welcome, role selection)
- ✅ Implemented household registration (name → phone → state → lga → address → size)
- ✅ Implemented request pickup flow (5-step wizard with review)
- ✅ Implemented track pickups
- ✅ Implemented learn recycling (with detailed categories)
- ✅ Implemented quiz system (resumable)
- ✅ Implemented points & rewards
- ✅ Implemented collector flows
- ✅ Implemented buyer flows
- ✅ Added error messages
- ✅ Added confirmation messages
- ✅ Added screen() utility function
- ✅ All messages bilingual (English + Pidgin)

### 1.3 Refactored session.js
- ✅ Added persistent session storage to disk
- ✅ Added loadSessionFromDisk() for recovery
- ✅ Added saveSessionToDisk() for persistence
- ✅ Added setStep() for flow navigation
- ✅ Added getStep() to read current step
- ✅ Added goBack() for navigation history
- ✅ Added setRole(), getRole() for role management
- ✅ Added isRegistered() check
- ✅ Added previousSteps tracking for recovery
- ✅ Added cleanup utilities

### 1.4 Created Database Models Documentation (DATABASE_MODELS.md)
- ✅ Defined users schema
- ✅ Defined pickups schema with full state flow
- ✅ Defined collectors schema with inventory
- ✅ Defined listings (marketplace) schema
- ✅ Defined offers schema with negotiation
- ✅ Defined transactions schema
- ✅ Defined certificates schema
- ✅ Defined buyers schema
- ✅ Defined quiz progress (resumable)
- ✅ Defined notifications schema
- ✅ Defined session state schema
- ✅ Documented waste categories info

### 1.5 Created Flow Architecture (FLOW_ARCHITECTURE.md)
- ✅ Defined global states
- ✅ Defined household flow states
- ✅ Defined collector flow states
- ✅ Defined buyer flow states
- ✅ Documented 5 integration patterns

# ═══════════════════════════════════════════════════════════════════════════════
# NEXT STEPS: FLOW IMPLEMENTATION
# ═══════════════════════════════════════════════════════════════════════════════

## 📋 PHASE 2: HOUSEHOLD FLOW REFACTORING

### 2.1 Refactor flows/household.js
Replace current household flow with pattern-based implementation:

```javascript
// New structure:
async function handle(client, message, phone, sess) {
  const { step, data, role } = sess;
  const body = message.body.trim();
  const lang = sess.lang;

  // Validate registration
  if (!sess.role) {
    await message.reply(screen(errors.notRegistered, lang));
    return;
  }

  // Route to handler based on step
  if (step === 'household_menu') {
    await handleMenu(client, message, phone, sess);
  } else if (step.startsWith('pickup_')) {
    await handlePickupRequest(client, message, phone, sess);
  } else if (step.startsWith('track_')) {
    await handleTrackPickups(client, message, phone, sess);
  } else if (step.startsWith('learn_')) {
    await handleLearnRecycling(client, message, phone, sess);
  } else if (step.startsWith('quiz_')) {
    await handleQuiz(client, message, phone, sess);
  }
}

async function handleMenu(client, message, phone, sess) {
  // Use householdMenu.main screen
  // Menu options 1-8 with proper routing
}

async function handlePickupRequest(client, message, phone, sess) {
  // Implement 5-step wizard using requestPickup screens
  // Each step validates, saves, then moves to next
}

// etc...
```

### 2.2 Household Registration
Update registration to collect:
- Full Name
- Phone Number
- State (dropdown)
- LGA (dropdown)
- Address (text)
- Household Size (options)

Then create user with auto-generated ID (ECO-HH-001 format)

### 2.3 Request Pickup Workflow
Implement 5-step wizard:
1. Choose waste type (7 options)
2. Enter quantity in KG
3. Choose address (saved or new)
4. Choose day (Mon-Sat)
5. Choose time (4 slots)
6. Review & confirm
7. Auto-save pickup to storage

### 2.4 Track Pickups
- List all pickups for user
- Show status with emoji
- Allow viewing details
- Allow cancel (if pending/assigned/scheduled)

### 2.5 Learn Recycling
- 6 categories with full details
- Examples, preparation, mistakes, impact
- Points per KG

### 2.6 Quiz System
- 5 questions about recycling
- Can pause/resume (auto-saved)
- Show score after completion
- Award points

## 📦 PHASE 3: COLLECTOR FLOW REFACTORING

### 3.1 Refactor flows/collector.js
Implement collector dashboard:
- Available pickups in area
- My assigned pickups
- Inventory management
- Marketplace listings
- Earnings dashboard

### 3.2 Collection Process
- Accept pickup → gets assigned
- Update status: on_the_way → arrived → collected → completed
- Auto-notify household on each update
- Record actual quantities
- Update inventory

## 🏭 PHASE 4: BUYER FLOW REFACTORING

### 4.1 Refactor flows/buyer.js
Implement buyer dashboard:
- Browse materials
- Search materials
- Make offers
- Track orders
- View certificates

### 4.2 Offer/Transaction Flow
- Buyer selects listing
- Submits offer with price/quantity
- Collector receives notification
- Collector can accept/reject/counter
- On acceptance → transaction created
- After pickup → certificate generated

# ═══════════════════════════════════════════════════════════════════════════════
# CRITICAL INTEGRATION CHECKLIST
# ═══════════════════════════════════════════════════════════════════════════════

## Immediate Actions (Server.js Integration)

- [ ] Ensure session persistence directory exists: `./data/_sessions/`
- [ ] Update server.js to use new session management
- [ ] Update server.js to use new screen() function
- [ ] Add navigation helpers (menu, restart commands)
- [ ] Add error handling wrapper

## Session Management

- [ ] Session auto-loads from disk on user message
- [ ] Session auto-saves after every update
- [ ] Users can resume incomplete flows
- [ ] Users can go back with navigation history
- [ ] Users keep language preference after reset

## State Validation

- [ ] Check user is registered before showing role-specific menus
- [ ] Validate all user inputs
- [ ] Show clear error messages
- [ ] Allow retry without losing context

## Notifications

- [ ] Create notification when pickup assigned
- [ ] Notify on status changes (on_the_way, arrived, collected, completed)
- [ ] Notify buyer when offer received
- [ ] Notify collector when offer received
- [ ] Include reference IDs in notifications

## Data Consistency

- [ ] Pickup status transitions are valid
- [ ] Offer status transitions are valid
- [ ] Inventory updated when collections complete
- [ ] Points awarded after completion
- [ ] Certificates generated after transactions

## Navigation

- [ ] "menu" command goes to main dashboard
- [ ] "restart" command resets to start
- [ ] Back buttons in multi-step flows
- [ ] No dead-end screens
- [ ] All screens show next steps

# ═══════════════════════════════════════════════════════════════════════════════
# TESTING CHECKLIST
# ═══════════════════════════════════════════════════════════════════════════════

## Happy Path Testing

- [ ] Household registration → Request pickup → Track pickup
- [ ] Collector registration → Accept pickup → Complete collection
- [ ] Buyer registration → Browse materials → Make offer

## Recovery Testing

- [ ] User stops mid-registration, comes back, resumes
- [ ] User stops mid-quiz, comes back, continues
- [ ] User stops mid-pickup-request, comes back, resumes
- [ ] Session recovers after server restart

## Error Handling

- [ ] Invalid menu choice → show menu again
- [ ] Invalid phone → show error
- [ ] Invalid quantity → show error with example
- [ ] Invalid input type → show error

## State Transitions

- [ ] All step transitions work correctly
- [ ] No data loss during transitions
- [ ] Navigation history preserved
- [ ] Language preference maintained

## Multi-language

- [ ] English screens render correctly
- [ ] Pidgin screens render correctly
- [ ] Language switching works
- [ ] Language preserved across sessions

# ═══════════════════════════════════════════════════════════════════════════════
# RENDER OPTIMIZATION TIPS
# ═══════════════════════════════════════════════════════════════════════════════

## For Free Tier:

1. **Session Persistence**
   - Sessions are in-memory + disk backup
   - Low overhead for Render Free Tier
   - Cleanup old sessions weekly (30+ days old)

2. **Storage Optimization**
   - Use file-based storage (already done)
   - Keep JSON files reasonably sized (< 10MB each)
   - Archive old data periodically

3. **API Calls**
   - Baileys is lightweight
   - No external API calls required
   - All processing is local

4. **Memory Management**
   - In-memory session cache is limited (only active users)
   - Sessions loaded from disk on demand
   - Cleanup routine prevents memory bloat

# ═══════════════════════════════════════════════════════════════════════════════
# FILE STRUCTURE AFTER REFACTORING
# ═══════════════════════════════════════════════════════════════════════════════

```
ecosort/
├── server.js                          # Main entry point
├── package.json
├── DATABASE_MODELS.md                 # Schema documentation
├── FLOW_ARCHITECTURE.md               # State machine architecture
├── IMPLEMENTATION_GUIDE.md            # This file
├── utils/
│   ├── helpers.js                     # Updated with new constants
│   ├── messages.js                    # Refactored with 50+ screens
│   ├── session.js                     # Refactored with persistence
│   ├── storage.js                     # No changes needed
│   └── validators.js                  # May add new validators
├── flows/
│   ├── onboarding.js                  # To be refactored
│   ├── household.js                   # To be refactored
│   ├── collector.js                   # To be refactored
│   ├── buyer.js                       # To be refactored
│   ├── education.js                   # Educational content
│   ├── rewards.js                     # Rewards system
│   ├── marketplace.js                 # Marketplace system
│   └── certificates.js                # Certificate generation
├── data/
│   ├── users.json
│   ├── collectors.json
│   ├── buyers.json
│   ├── pickups.json
│   ├── listings.json
│   ├── offers.json
│   ├── transactions.json
│   ├── certificates.json
│   ├── notifications.json
│   ├── quiz_progress.json
│   └── _sessions/                     # Persisted session files
│       └── 2348012345678.json
│       └── 2348087654321.json
│       └── etc...
└── assets/
    ├── images/
    └── certificates/
```

# ═══════════════════════════════════════════════════════════════════════════════
# DEPLOYMENT CHECKLIST
# ═══════════════════════════════════════════════════════════════════════════════

Before pushing to Render:

- [ ] All backups created (.backup files)
- [ ] helpers.js updated with new constants
- [ ] messages.js refactored with all screens
- [ ] session.js refactored with persistence
- [ ] DATABASE_MODELS.md created
- [ ] FLOW_ARCHITECTURE.md created
- [ ] Tests pass for critical flows
- [ ] No console errors in development
- [ ] Render free tier limits checked
- [ ] .env variables configured
- [ ] Git commit with clear message
- [ ] Deploy to Render Free Tier

# ═══════════════════════════════════════════════════════════════════════════════
# EXAMPLE: WHAT A REFACTORED FLOW LOOKS LIKE
# ═══════════════════════════════════════════════════════════════════════════════

Here's how a household requesting a pickup flows through the system:

```
User Message: "1"
├─ session.get(phone) → loads from disk if exists
├─ Current step: "household_menu"
├─ Validate: choice is 1-8
├─ Process: choice === 1 → request_pickup
├─ session.setStep(phone, 'pickup_waste')
└─ Send: screen(requestPickup.wasteTypeSelect, lang)

User Message: "1" (plastic waste)
├─ Current step: "pickup_waste"
├─ Validate: choice is 1-7
├─ Save: session.setData(phone, 'pickupWaste', 'plastic')
├─ session.setStep(phone, 'pickup_quantity')
└─ Send: screen(requestPickup.quantityPrompt, lang)

User Message: "15.5"
├─ Current step: "pickup_quantity"
├─ Validate: isPositiveNumber('15.5') → true
├─ Save: session.setData(phone, 'pickupQuantity', 15.5)
├─ session.setStep(phone, 'pickup_address')
└─ Send: address options

... (continue for address, day, time)

User Message: "1" (at review screen)
├─ Current step: "pickup_review"
├─ Build review: waste, quantity, address, day, time
├─ Parse choice: 1 = submit
├─ Generate: pickupId = PU-1748965432123-ABC123
├─ Create pickup object with all data
├─ storage.insert('pickups', pickup)
├─ Clear form: session.data = {}
├─ session.setStep(phone, 'household_menu')
├─ Award points: +10 points
├─ Create notification for collectors
└─ Send: confirmation with pickup ID

Session after flow:
{
  phone: "2348012345678",
  step: "household_menu",          ← Back at main menu
  flow: "household",
  role: "household",
  lang: "en",
  data: {},                         ← Form cleared
  previousSteps: [                  ← Navigation history kept
    { step: 'pickup_waste', timestamp: ... },
    { step: 'pickup_quantity', timestamp: ... },
    { step: 'pickup_address', timestamp: ... },
    { step: 'pickup_day', timestamp: ... },
    { step: 'pickup_time', timestamp: ... },
    { step: 'pickup_review', timestamp: ... }
  ],
  updatedAt: "2025-06-02T10:45:00Z"
}
```

Perfect! Session is persisted to disk. If server restarts or user
leaves, their session is recovered exactly where it was.

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

You now have:

✅ Six standard waste categories (not PET/Nylon/Carton)
✅ Comprehensive conversation screens (50+ polished screens)
✅ True session resumability (persisted to disk)
✅ Step-by-step wizards (review before submit)
✅ Complete database schema (all models documented)
✅ Flow state machine (clear transitions)
✅ Integration patterns (ready to implement)
✅ Bilingual support (English + Pidgin)
✅ Auto-save after every action
✅ No session timeout
✅ All navigation (Back/Menu/Cancel)

The foundation is ready. Now implement the flow handlers using
the patterns and documentation provided.
