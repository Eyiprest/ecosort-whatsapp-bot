/**
 * EcoSort Database Models & Schema
 * 
 * All data is stored as JSON files in ./data/
 * File-based storage is perfect for Render Free Tier with moderate usage
 * 
 * Stored in: ./data/{name}.json
 */

// ═══════════════════════════════════════════════════════════════════════════════
// USERS (Households)
// ═══════════════════════════════════════════════════════════════════════════════

const userExample = {
  // Identity
  id: "ECO-HH-001",                    // Unique EcoSort ID
  phone: "2348012345678",              // Normalized WhatsApp number
  name: "Chinedu Okonkwo",
  
  // Profile
  email: "chinedu@example.com",        // Optional
  phone_personal: "08012345678",       // Original format
  
  // Location
  state: "Lagos",
  lga: "Kosofe",
  address: "45 Main Street, Bariga",
  householdSize: "4-5 people",
  
  // Preferences
  lang: "en",                          // en or pid
  
  // Points & Rewards
  points: 150,
  pointsMonthly: 50,
  pointsLifetime: 500,
  badges: ["first_pickup", "quiz_master"],
  
  // Activity
  totalPickups: 5,
  lastActiveDate: "2025-06-02",
  streak: 3,
  
  // Status
  verified: false,
  active: true,
  
  // Timestamps
  registeredAt: "2025-05-01T10:30:00Z",
  lastUpdatedAt: "2025-06-02T15:45:00Z"
};

// ═══════════════════════════════════════════════════════════════════════════════
// PICKUPS
// ═══════════════════════════════════════════════════════════════════════════════

const pickupExample = {
  // Identity
  id: "PU-1748965432123-ABC12345",    // Unique pickup ID
  userId: "ECO-HH-001",                // Requester
  collectorId: null,                   // Assigned collector (null initially)
  
  // Waste Details
  wasteType: "plastic",                // plastic, paper, metal, glass, organic, ewaste, mixed
  quantity: 15.5,                      // in KG
  
  // Location & Schedule
  address: "45 Main Street, Bariga",
  preferredDay: "Monday",
  preferredTime: "10am - 12pm",
  
  // Status Flow
  status: "pending",                   // pending, assigned, scheduled, on_the_way, arrived, collected, completed, cancelled
  statusHistory: [
    {
      status: "pending",
      timestamp: "2025-06-02T10:00:00Z",
      note: "Pickup requested"
    }
  ],
  
  // Timeline
  requestedAt: "2025-06-02T10:00:00Z",
  assignedAt: null,
  scheduledFor: null,
  completedAt: null,
  
  // Actual Collection
  actualQuantity: null,                // Filled when collected
  actualWasteType: null,               // May differ from estimate
  notes: null,
  
  // Estimated Value
  estimatedPoints: 155,                // 10 points per KG for plastic
  actualPointsAwarded: null,
  
  // Interaction
  createdAt: "2025-06-02T10:00:00Z",
  updatedAt: "2025-06-02T10:00:00Z"
};

// ═══════════════════════════════════════════════════════════════════════════════
// COLLECTORS
// ═══════════════════════════════════════════════════════════════════════════════

const collectorExample = {
  // Identity
  id: "ECO-COL-001",
  phone: "2348099876543",
  name: "Ahmed Mohammed",
  
  // Profile
  email: "ahmed@example.com",
  state: "Lagos",
  lga: "Kosofe",
  businessName: "EcoMasters Recycling",
  
  // Preferences
  lang: "en",
  serviceArea: ["Kosofe", "Shomolu"],  // LGAs they cover
  
  // Inventory (what they have in stock)
  inventory: {
    plastic: { quantity: 150, unit: "kg", value: 7500 },     // ₦50/kg
    paper: { quantity: 200, unit: "kg", value: 6000 },       // ₦30/kg
    metal: { quantity: 50, unit: "kg", value: 10000 },       // ₦200/kg
    glass: { quantity: 100, unit: "kg", value: 2000 },       // ₦20/kg
    organic: { quantity: 300, unit: "kg", value: 3000 },     // ₦10/kg
    ewaste: { quantity: 30, unit: "kg", value: 9000 }        // ₦300/kg
  },
  
  // Performance
  totalCollections: 45,
  totalEarnings: 125000,
  rating: 4.8,
  reviews: 32,
  
  // Status
  active: true,
  verified: true,
  
  // Timestamps
  registeredAt: "2025-04-01T10:00:00Z",
  lastActiveAt: "2025-06-02T14:30:00Z"
};

// ═══════════════════════════════════════════════════════════════════════════════
// LISTINGS (Marketplace)
// ═══════════════════════════════════════════════════════════════════════════════

const listingExample = {
  // Identity
  id: "LIST-1748965432-AB12345",
  collectorId: "ECO-COL-001",
  
  // Material Details
  materialType: "plastic",
  quantity: 50,                        // kg
  pricePerKg: 55,                      // ₦55/kg
  totalPrice: 2750,
  
  // Status
  status: "active",                    // active, sold, expired, cancelled
  
  // Location
  location: "Kosofe, Lagos",
  
  // Images (optional)
  images: [
    "https://ecosort.blob.core.windows.net/listings/LIST-xxx/photo1.jpg"
  ],
  
  // Engagement
  views: 12,
  offers: 2,
  
  // Timeline
  listedAt: "2025-06-01T10:00:00Z",
  expiresAt: "2025-07-01T10:00:00Z",  // 30 days
  updatedAt: "2025-06-02T10:00:00Z"
};

// ═══════════════════════════════════════════════════════════════════════════════
// OFFERS
// ═══════════════════════════════════════════════════════════════════════════════

const offerExample = {
  // Identity
  id: "OF-1748965432123-XYZ789",
  listingId: "LIST-1748965432-AB12345",
  buyerId: "ECO-BUY-001",
  collectorId: "ECO-COL-001",
  
  // Offer Details
  offeredPrice: 50,                    // ₦ per kg
  quantityDesired: 30,                 // kg
  totalOfferedAmount: 1500,            // ₦30 * 50
  
  // Compared to Listing
  listingPrice: 55,
  discount: 9.1,                       // %
  
  // Status
  status: "pending",                   // pending, accepted, rejected, countered, completed, cancelled
  
  // Negotiation
  counterOffers: [
    {
      from: "collector",               // who made the counter
      price: 52,
      quantity: 30,
      total: 1560,
      timestamp: "2025-06-02T11:00:00Z"
    }
  ],
  
  // Timeline
  createdAt: "2025-06-02T10:30:00Z",
  expiresAt: "2025-06-05T10:30:00Z",   // 3 days to respond
  respondedAt: null,
  completedAt: null,
  
  // Notes
  buyerMessage: "Can you deliver?",
  collectorResponse: null
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const transactionExample = {
  // Identity
  id: "TXN-1748965432123-DEF456",
  offerId: "OF-1748965432123-XYZ789",
  
  // Parties
  buyerId: "ECO-BUY-001",
  collectorId: "ECO-COL-001",
  
  // Material Details
  materialType: "plastic",
  quantity: 30,
  pricePerKg: 52,
  totalAmount: 1560,
  
  // Status
  status: "completed",                 // pending, confirmed, shipped, delivered, completed, disputed
  
  // Location
  pickupLocation: "Kosofe, Lagos",
  deliveryLocation: "Lekki, Lagos",
  
  // Logistics
  pickupDate: "2025-06-02T14:00:00Z",
  deliveryDate: "2025-06-03T10:00:00Z",
  
  // Payment
  paymentMethod: "transfer",           // transfer, cash, etc
  paymentStatus: "completed",
  
  // ESG Certificate
  certificateId: "CERT-1748965432-GHI789",
  impactMetrics: {
    co2Saved: 150,                     // kg CO2 equivalent
    landfillDiverted: 30               // kg
  },
  
  // Timeline
  createdAt: "2025-06-02T10:30:00Z",
  completedAt: "2025-06-03T11:00:00Z"
};

// ═══════════════════════════════════════════════════════════════════════════════
// CERTIFICATES (ESG/Environmental)
// ═══════════════════════════════════════════════════════════════════════════════

const certificateExample = {
  // Identity
  id: "CERT-1748965432-GHI789",
  transactionId: "TXN-1748965432123-DEF456",
  
  // Parties
  buyerId: "ECO-BUY-001",
  collectorId: "ECO-COL-001",
  
  // Environmental Impact
  materialType: "plastic",
  quantity: 30,                        // kg
  co2Diverted: 150,                    // kg CO2 equivalent
  landfillDiverted: 30,                // kg
  treesProtected: 0.5,                 // equivalent trees
  waterSaved: 5000,                    // liters (estimated)
  
  // Certification Details
  certifiedDate: "2025-06-03",
  verifiedBy: "EcoSort Admin",
  validUntil: "2026-06-03",
  
  // Digital Asset
  certificateUrl: "https://ecosort.blockchain/cert/CERT-1748965432-GHI789",
  qrCode: "https://ecosort.blob.core.windows.net/certs/CERT-1748965432-GHI789.png",
  
  // Metadata
  createdAt: "2025-06-03T11:00:00Z"
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUYERS
// ═══════════════════════════════════════════════════════════════════════════════

const buyerExample = {
  // Identity
  id: "ECO-BUY-001",
  phone: "2347011234567",
  name: "Green Industries Ltd",
  
  // Business Profile
  email: "buyer@greenindust.com",
  businessType: "recycling_processor",  // recycling_processor, manufacturer, trader
  companyName: "Green Industries Limited",
  registrationNumber: "RC123456",
  
  // Preferences
  lang: "en",
  materialsOfInterest: ["plastic", "metal", "paper"],
  
  // Activity
  totalTransactions: 15,
  totalSpent: 750000,                  // ₦
  avgPricePerKg: 50,
  
  // Ratings
  rating: 4.9,
  reviews: 18,
  
  // Status
  verified: true,
  active: true,
  
  // Timestamps
  registeredAt: "2025-03-01T10:00:00Z",
  lastActiveAt: "2025-06-02T16:00:00Z"
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ PROGRESS (Resumable)
// ═══════════════════════════════════════════════════════════════════════════════

const quizProgressExample = {
  // Identity
  userId: "ECO-HH-001",
  quizId: "QUIZ-001",                  // Quiz version
  
  // Progress
  currentQuestion: 3,                  // Which question they're on (1-5)
  totalQuestions: 5,
  
  // Answers
  answers: [
    { questionNum: 1, answer: 1, correct: true },
    { questionNum: 2, answer: 2, correct: true },
    { questionNum: 3, answer: null, correct: null }  // Not answered yet
  ],
  
  // Score
  correctAnswers: 2,
  score: null,                         // Calculated when complete
  
  // Status
  completed: false,
  abandoned: false,
  
  // Rewards
  pointsEarned: null,
  
  // Timeline
  startedAt: "2025-06-02T10:00:00Z",
  lastAnsweredAt: "2025-06-02T10:15:00Z",
  completedAt: null
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const notificationExample = {
  // Identity
  id: "NOT-1748965432123",
  userId: "ECO-HH-001",
  
  // Content
  type: "pickup_assigned",             // pickup_assigned, collector_arrived, payment_received, etc
  title: "🚛 Collector Assigned",
  message: "Ahmed has been assigned to collect your waste",
  
  // Related Entity
  relatedId: "PU-1748965432123-ABC12345",
  relatedType: "pickup",
  
  // Status
  read: false,
  
  // Timeline
  createdAt: "2025-06-02T10:05:00Z"
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATA FILES TO CREATE/MAINTAIN
// ═══════════════════════════════════════════════════════════════════════════════

const FILES_TO_MAINTAIN = [
  'users.json',           // Household users
  'collectors.json',      // Collectors
  'buyers.json',          // Buyers/Businesses
  'pickups.json',         // Pickup requests
  'listings.json',        // Marketplace listings
  'offers.json',          // Purchase offers
  'transactions.json',    // Completed transactions
  'certificates.json',    // ESG certificates
  'notifications.json',   // User notifications
  'quiz_progress.json'    // Quiz progress
];

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION STATE (Persisted in _sessions/)
// ═══════════════════════════════════════════════════════════════════════════════

const sessionExample = {
  phone: "2348012345678",
  step: "pickup_day",                  // Current flow step
  flow: "household",                   // Current flow type
  role: "household",                   // User role
  lang: "en",                          // User language
  
  // Accumulated form data for the current flow
  data: {
    pickupWaste: "plastic",
    pickupQuantity: 15.5,
    pickupAddress: "45 Main Street",
    pickupDay: "Monday",
    pickupTime: "10am - 12pm"
  },
  
  // Navigation history
  previousSteps: [
    { step: 'start', timestamp: '2025-06-02T10:00:00Z' },
    { step: 'household_menu', timestamp: '2025-06-02T10:01:00Z' },
    { step: 'pickup_waste', timestamp: '2025-06-02T10:02:00Z' },
    { step: 'pickup_quantity', timestamp: '2025-06-02T10:03:00Z' }
  ],
  
  // Timestamps
  createdAt: "2025-06-02T10:00:00Z",
  updatedAt: "2025-06-02T10:05:00Z"
};

// ═══════════════════════════════════════════════════════════════════════════════
// WASTE CATEGORIES (Standard)
// ═══════════════════════════════════════════════════════════════════════════════

const WASTE_CATEGORIES_INFO = {
  plastic: {
    name: "Plastic Waste",
    emoji: "♻️",
    examples: ["Water bottles", "Bags", "Containers", "Toys"],
    preparation: ["Rinse bottles", "Remove caps separately", "Flatten bottles", "Keep dry"],
    mistakes: ["Mixed with paper", "Liquid inside", "Plastic bags with food"],
    impact: "Prevents ocean pollution, reduces landfill",
    pointsPerKg: 5,
    estimatedValuePerKg: 50
  },
  paper: {
    name: "Paper Waste",
    emoji: "📄",
    examples: ["Newspapers", "Cardboard", "Magazines", "Books"],
    preparation: ["Keep dry", "Remove plastic/tape", "Flatten boxes", "Bundle together"],
    mistakes: ["Wet/soaked paper", "Plastic coating", "Greasy papers"],
    impact: "Saves trees, reduces deforestation",
    pointsPerKg: 3,
    estimatedValuePerKg: 30
  },
  metal: {
    name: "Metal Waste",
    emoji: "🔩",
    examples: ["Aluminum cans", "Iron scraps", "Copper wires", "Steel containers"],
    preparation: ["Remove labels", "Crush cans", "Keep dry", "Separate types"],
    mistakes: ["Mixed with other metals", "Wet or rusted", "Still has food"],
    impact: "Saves energy in production",
    pointsPerKg: 8,
    estimatedValuePerKg: 200
  },
  glass: {
    name: "Glass Waste",
    emoji: "🍾",
    examples: ["Bottles", "Jars", "Cups", "Windows"],
    preparation: ["Rinse well", "Keep separate", "Stack carefully", "Remove caps"],
    mistakes: ["Mixed with ceramics", "Broken into shards", "Dirty"],
    impact: "Fully recyclable, infinite reuse",
    pointsPerKg: 4,
    estimatedValuePerKg: 20
  },
  organic: {
    name: "Organic Waste",
    emoji: "🌱",
    examples: ["Food scraps", "Garden waste", "Plant material", "Peels"],
    preparation: ["Dry well", "No meat or dairy", "No oil", "Bundle together"],
    mistakes: ["Meat included", "Oily food", "Wet and moldy"],
    impact: "Creates natural fertilizer",
    pointsPerKg: 2,
    estimatedValuePerKg: 10
  },
  ewaste: {
    name: "E-Waste",
    emoji: "⚡",
    examples: ["Old phones", "Computers", "Batteries", "Chargers"],
    preparation: ["Remove batteries", "Keep dry", "Separate carefully", "No liquids"],
    mistakes: ["Mixed with other waste", "Wet", "Broken into parts"],
    impact: "Recovers valuable minerals",
    pointsPerKg: 15,
    estimatedValuePerKg: 300
  }
};

module.exports = {
  userExample,
  pickupExample,
  collectorExample,
  listingExample,
  offerExample,
  transactionExample,
  certificateExample,
  buyerExample,
  quizProgressExample,
  notificationExample,
  sessionExample,
  FILES_TO_MAINTAIN,
  WASTE_CATEGORIES_INFO
};
