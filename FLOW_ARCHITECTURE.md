/**
 * ECOSORT FLOW ARCHITECTURE & INTEGRATION GUIDE
 * 
 * This document defines the complete state machine architecture for EcoSort flows.
 * It shows how to integrate the refactored components (helpers, messages, session)
 * with the flow handlers (household, collector, buyer).
 */

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW STATES & TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GLOBAL FLOW STATES
 */
const GLOBAL_STATES = {
  start: {
    desc: "Initial entry point",
    next: ["lang_select"],
    actions: ["show welcome screen"]
  },
  lang_select: {
    desc: "Language selection",
    next: ["role_select"],
    actions: ["show language options", "save language"]
  },
  role_select: {
    desc: "Role selection (household/collector/buyer)",
    next: ["register", "household_menu", "collector_menu", "buyer_menu"],
    actions: ["show role options", "save role"]
  },
  register: {
    desc: "Registration flow for new users",
    flows: {
      household: ["reg_name", "reg_phone", "reg_state", "reg_lga", "reg_address", "reg_household_size"],
      collector: ["reg_name", "reg_phone", "reg_state", "reg_lga", "reg_service_area"],
      buyer: ["reg_name", "reg_phone", "reg_business", "reg_email"]
    }
  }
};

/**
 * HOUSEHOLD FLOW STATES
 */
const HOUSEHOLD_STATES = {
  household_menu: {
    desc: "Main household dashboard",
    options: [
      { num: 1, action: "request_pickup", label: "Request Pickup" },
      { num: 2, action: "track_pickups", label: "Track Pickups" },
      { num: 3, action: "learn_recycling", label: "Learn Recycling" },
      { num: 4, action: "quiz_start", label: "Quiz Challenge" },
      { num: 5, action: "view_points", label: "My Points" },
      { num: 6, action: "view_rewards", label: "Rewards" },
      { num: 7, action: "view_profile", label: "My Profile" },
      { num: 8, action: "help_menu", label: "Help" }
    ]
  },

  // REQUEST PICKUP FLOW (Step-by-step)
  pickup_waste: {
    desc: "Choose waste type",
    step: "1 of 5",
    options: [
      { num: 1, value: "plastic", label: "Plastic Waste" },
      { num: 2, value: "paper", label: "Paper Waste" },
      { num: 3, value: "metal", label: "Metal Waste" },
      { num: 4, value: "glass", label: "Glass Waste" },
      { num: 5, value: "organic", label: "Organic Waste" },
      { num: 6, value: "ewaste", label: "E-Waste" },
      { num: 7, value: "mixed", label: "Mixed Waste" }
    ],
    save: ["pickupWaste"],
    next: ["pickup_quantity"]
  },

  pickup_quantity: {
    desc: "Enter quantity in KG",
    step: "2 of 5",
    input: "number",
    validation: "isPositiveNumber",
    save: ["pickupQuantity"],
    next: ["pickup_address"]
  },

  pickup_address: {
    desc: "Choose or enter address",
    step: "3 of 5",
    options: [
      { num: 1, value: "saved", label: "Use Saved Address" },
      { num: 2, value: "new", label: "Enter New Address" }
    ],
    next: ["pickup_day"]
  },

  pickup_day: {
    desc: "Choose collection day",
    step: "4 of 5",
    options: [
      { num: 1, value: "Monday", label: "Monday" },
      { num: 2, value: "Tuesday", label: "Tuesday" },
      { num: 3, value: "Wednesday", label: "Wednesday" },
      { num: 4, value: "Thursday", label: "Thursday" },
      { num: 5, value: "Friday", label: "Friday" },
      { num: 6, value: "Saturday", label: "Saturday" }
    ],
    save: ["pickupDay"],
    next: ["pickup_time"]
  },

  pickup_time: {
    desc: "Choose collection time",
    step: "5 of 5",
    options: [
      { num: 1, value: "8am - 10am", label: "8am - 10am" },
      { num: 2, value: "10am - 12pm", label: "10am - 12pm" },
      { num: 3, value: "12pm - 2pm", label: "12pm - 2pm" },
      { num: 4, value: "2pm - 4pm", label: "2pm - 4pm" }
    ],
    save: ["pickupTime"],
    next: ["pickup_review"]
  },

  pickup_review: {
    desc: "Review request before submission",
    actions: [
      { num: 1, action: "submit", label: "Confirm & Submit" },
      { num: 2, action: "edit", label: "Edit Request" },
      { num: 3, action: "cancel", label: "Cancel" }
    ],
    next: ["pickup_submitted", "pickup_waste", "household_menu"]
  },

  pickup_submitted: {
    desc: "Confirmation after submission",
    auto_next: "household_menu",
    delay: 2000
  },

  // TRACK PICKUPS
  track_pickups: {
    desc: "View active pickups",
    actions: [
      "list_pickups",
      "show_status_updates",
      "allow_cancel"
    ]
  },

  // LEARN RECYCLING
  learn_recycling_category: {
    desc: "Choose waste category to learn",
    options: [
      { num: 1, value: "plastic", label: "Plastic Waste" },
      { num: 2, value: "paper", label: "Paper Waste" },
      { num: 3, value: "metal", label: "Metal Waste" },
      { num: 4, value: "glass", label: "Glass Waste" },
      { num: 5, value: "organic", label: "Organic Waste" },
      { num: 6, value: "ewaste", label: "E-Waste" }
    ]
  },

  learn_recycling_details: {
    desc: "Show detailed category info",
    content: "examples, preparation, mistakes, impact, points",
    actions: [
      "continue_learning",
      "back_to_menu"
    ]
  }
};

/**
 * COLLECTOR FLOW STATES
 */
const COLLECTOR_STATES = {
  collector_menu: {
    desc: "Main collector dashboard",
    options: [
      { num: 1, action: "available_pickups", label: "Available Pickups" },
      { num: 2, action: "my_pickups", label: "My Assigned Pickups" },
      { num: 3, action: "inventory", label: "My Inventory" },
      { num: 4, action: "marketplace", label: "Marketplace" },
      { num: 5, action: "earnings", label: "My Earnings" },
      { num: 6, action: "profile", label: "My Profile" },
      { num: 7, action: "help", label: "Help" }
    ]
  },

  available_pickups: {
    desc: "Show pickups available in area",
    actions: [
      "accept_pickup",
      "reject_pickup",
      "next_pickup"
    ]
  },

  my_pickups: {
    desc: "Show assigned pickups",
    substates: ["start_route", "arrived", "collecting", "completed"],
    actions: [
      "update_status",
      "edit_details",
      "complete_collection"
    ]
  },

  collection_update: {
    desc: "Update collection progress",
    statuses: [
      { value: "on_the_way", label: "On The Way" },
      { value: "arrived", label: "Arrived at Location" },
      { value: "collected", label: "Collected Waste" },
      { value: "completed", label: "Complete Collection" }
    ],
    autoNotify: "household"
  },

  inventory: {
    desc: "View collected inventory",
    display: {
      categories: ["plastic", "paper", "metal", "glass", "organic", "ewaste"],
      fields: ["quantity", "value", "last_updated"]
    }
  },

  post_listing: {
    desc: "Create marketplace listing",
    steps: [
      { step: 1, field: "material_type", input: "select" },
      { step: 2, field: "quantity", input: "number" },
      { step: 3, field: "price_per_kg", input: "number" },
      { step: 4, field: "location", input: "text" },
      { step: 5, field: "photo", input: "optional" },
      { step: 6, action: "publish" }
    ]
  }
};

/**
 * BUYER FLOW STATES
 */
const BUYER_STATES = {
  buyer_menu: {
    desc: "Main buyer dashboard",
    options: [
      { num: 1, action: "search_materials", label: "Search Materials" },
      { num: 2, action: "browse_listings", label: "Browse All Listings" },
      { num: 3, action: "make_offer", label: "Make an Offer" },
      { num: 4, action: "my_orders", label: "My Orders" },
      { num: 5, action: "certificates", label: "ESG Certificates" },
      { num: 6, action: "profile", label: "My Profile" },
      { num: 7, action: "help", label: "Help" }
    ]
  },

  browse_listings: {
    desc: "Browse all available materials",
    filters: ["material_type", "location", "price_range"],
    display: ["material", "quantity", "price_per_kg", "collector_name"],
    actions: ["view_details", "make_offer"]
  },

  make_offer: {
    desc: "Make purchase offer",
    steps: [
      { step: 1, field: "listing_selection", input: "select" },
      { step: 2, field: "offer_price", input: "number" },
      { step: 3, field: "quantity", input: "number" },
      { step: 4, field: "message", input: "optional" },
      { step: 5, action: "submit_offer" }
    ]
  },

  offer_response: {
    desc: "Collector responds to offer",
    options: [
      { num: 1, action: "accept", label: "Accept" },
      { num: 2, action: "reject", label: "Reject" },
      { num: 3, action: "counter", label: "Make Counter Offer" }
    ],
    notify: "buyer"
  },

  order_tracking: {
    desc: "Track active orders",
    statuses: [
      "confirmed",
      "shipped",
      "delivered",
      "completed"
    ],
    actions: [
      "view_details",
      "contact_seller"
    ]
  },

  certificates: {
    desc: "View ESG certificates",
    display: {
      fields: ["material", "quantity", "date", "impact_metrics"],
      actions: ["download", "share"]
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PATTERN 1: Simple Menu State
 * 
 * User sees menu → selects option → transitions to next state
 */
const PATTERN_SIMPLE_MENU = `
async function handleState(client, message, phone, sess) {
  const { step, data, role } = sess;
  const { body } = message;
  const lang = sess.lang;

  if (step === 'household_menu') {
    if (!isMenuChoice(body, 8)) {
      await message.reply(screen(householdMenu.main, lang));
      return;
    }
    
    const choice = getMenuChoice(body);
    const actions = {
      1: () => session.setStep(phone, 'pickup_waste'),
      2: () => session.setStep(phone, 'track_pickups'),
      // ... etc
    };
    
    actions[choice]?.();
    return;
  }
}
`;

/**
 * PATTERN 2: Form Collection (Multi-Step)
 * 
 * Collect one piece of data per screen, validate, save, move to next
 */
const PATTERN_FORM_COLLECTION = `
async function handleState(client, message, phone, sess) {
  const { step, data } = sess;
  const { body } = message;
  const lang = sess.lang;

  if (step === 'pickup_quantity') {
    // Validate
    if (!isPositiveNumber(body)) {
      await message.reply(screen(errors.invalidQuantity, lang));
      return;
    }
    
    // Save
    session.setData(phone, 'pickupQuantity', parseFloat(body));
    
    // Move to next
    session.setStep(phone, 'pickup_address');
    await message.reply(screen(requestPickup.addressConfirm, lang));
    return;
  }
}
`;

/**
 * PATTERN 3: Review & Confirm
 * 
 * Show summary, allow edit or confirm
 */
const PATTERN_REVIEW_CONFIRM = `
async function handleState(client, message, phone, sess) {
  const { data } = sess;
  const { body } = message;
  const lang = sess.lang;

  if (step === 'pickup_review') {
    // Build summary
    const summary = \`
Waste Type: \${data.pickupWaste}
Quantity: \${data.pickupQuantity}kg
Address: \${data.pickupAddress}
Day: \${data.pickupDay}
Time: \${data.pickupTime}
    \`;
    
    // Show options
    if (!isMenuChoice(body, 3)) {
      const reviewScreen = requestPickup.reviewRequest(summary);
      await message.reply(screen(reviewScreen, lang));
      return;
    }
    
    const choice = getMenuChoice(body);
    if (choice === 1) {
      // SUBMIT
      const pickupId = generatePickupId();
      const pickup = {
        id: pickupId,
        userId: getUserId(phone),
        wasteType: data.pickupWaste,
        quantity: data.pickupQuantity,
        address: data.pickupAddress,
        preferredDay: data.pickupDay,
        preferredTime: data.pickupTime,
        status: 'pending',
        requestedAt: timestamp()
      };
      storage.insert('pickups', pickup);
      
      session.setData(phone, {});  // Clear form data
      session.setStep(phone, 'household_menu');
      
      const confirmMsg = requestPickup.pickupSubmitted(pickupId);
      await message.reply(screen(confirmMsg, lang));
      return;
    } else if (choice === 2) {
      // EDIT - go back to first step
      session.setStep(phone, 'pickup_waste');
      await message.reply(screen(requestPickup.wasteTypeSelect, lang));
      return;
    } else {
      // CANCEL
      session.setData(phone, {});
      session.setStep(phone, 'household_menu');
      await message.reply(screen(householdMenu.main, lang));
      return;
    }
  }
}
`;

/**
 * PATTERN 4: Persistent State Recovery
 * 
 * User can come back to incomplete flows
 */
const PATTERN_STATE_RECOVERY = `
async function handleIncomingMessage(client, message) {
  const phone = normalizePhone(message.key.remoteJid);
  const body = message.body.trim().toLowerCase();
  
  // Get session (loads from disk if needed)
  let sess = session.get(phone);
  
  // Check special commands first
  if (body === 'menu') {
    // Go to main menu for current role
    const menu = sess.role === 'household' ? 'household_menu'
               : sess.role === 'collector' ? 'collector_menu'
               : 'buyer_menu';
    session.setStep(phone, menu);
    // ... show menu
    return;
  }
  
  if (body === 'restart') {
    // Go back to start
    session.reset(phone);
    // ... show welcome
    return;
  }
  
  // Check current step
  const step = session.getStep(phone);
  
  // Route to appropriate handler based on role & step
  if (sess.role === 'household') {
    await householdFlow.handle(client, message, phone, sess);
  } else if (sess.role === 'collector') {
    await collectorFlow.handle(client, message, phone, sess);
  } else if (sess.role === 'buyer') {
    await buyerFlow.handle(client, message, phone, sess);
  } else {
    // Not registered - show onboarding
    await onboarding.handle(client, message, phone, sess);
  }
}
`;

/**
 * PATTERN 5: Auto-Notifications
 * 
 * Notify related parties when status changes
 */
const PATTERN_AUTO_NOTIFY = `
async function updatePickupStatus(pickupId, newStatus) {
  // Update pickup
  const pickup = storage.findOne('pickups', p => p.id === pickupId);
  storage.update('pickups', p => p.id === pickupId, { status: newStatus });
  
  // Notify household
  const household = storage.findOne('users', u => u.id === pickup.userId);
  const notification = {
    id: generateId('not'),
    userId: household.id,
    phone: household.phone,
    type: 'status_update',
    message: getStatusNotification(newStatus),
    pickupId,
    timestamp: timestamp()
  };
  storage.insert('notifications', notification);
  
  // Send WhatsApp message
  const msg = getStatusMessage(newStatus, lang);
  await client.sendMessage(household.phone, { text: msg });
}
`;

module.exports = {
  GLOBAL_STATES,
  HOUSEHOLD_STATES,
  COLLECTOR_STATES,
  BUYER_STATES,
  PATTERN_SIMPLE_MENU,
  PATTERN_FORM_COLLECTION,
  PATTERN_REVIEW_CONFIRM,
  PATTERN_STATE_RECOVERY,
  PATTERN_AUTO_NOTIFY
};
