import type { Listing, Offer, Order } from './generated/api.schemas';

// AgriCycle In-Browser Mock Database & State Engine
// Zero-backend fallback for standalone static deployments (Vercel, GitHub Pages)

export interface MockUser {
  id: number;
  name: string;
  email: string;
  role: 'farmer' | 'industry' | 'admin';
  phone?: string;
  city: string;
  state: string;
  farmSize?: number;
  companyName?: string;
  industryType?: string;
  requiredWasteTypes?: string[];
  verified: boolean;
  rating: number;
  createdAt: string;
}

export const SEED_USERS: MockUser[] = [
  {
    id: 1,
    name: "Ramesh Patel",
    email: "farmer@agricycle.demo",
    role: "farmer",
    phone: "+91 98480 12345",
    city: "Anantapur",
    state: "Andhra Pradesh",
    farmSize: 16,
    verified: true,
    rating: 4.9,
    createdAt: "2026-08-10T08:30:00Z"
  },
  {
    id: 2,
    name: "Green BioEnergy Pvt Ltd",
    email: "industry@agricycle.demo",
    role: "industry",
    phone: "+91 87722 89900",
    city: "Tirupati",
    state: "Andhra Pradesh",
    companyName: "Green BioEnergy Pvt Ltd",
    industryType: "Biomass Energy & Pellets",
    requiredWasteTypes: ["Rice Husk", "Groundnut Shells", "Sugarcane Bagasse"],
    verified: true,
    rating: 4.8,
    createdAt: "2026-08-12T10:00:00Z"
  },
  {
    id: 3,
    name: "AgriCycle Operations Admin",
    email: "admin@agricycle.demo",
    role: "admin",
    phone: "+91 80 4050 6070",
    city: "Bangalore",
    state: "Karnataka",
    verified: true,
    rating: 5.0,
    createdAt: "2026-07-01T00:00:00Z"
  }
];

export const INITIAL_LISTINGS: Listing[] = [
  {
    id: 101,
    farmerId: 1,
    farmerName: "Ramesh Patel",
    farmerVerified: true,
    wasteType: "Rice Husk",
    quantity: 14,
    unit: "ton" as const,
    price: 3200,
    city: "Anantapur",
    state: "Andhra Pradesh",
    location: "Kalyandurg Road, Anantapur Rural",
    distanceKm: 8.5,
    availableDate: "2026-10-15",
    description: "Dry fresh golden rice husk from our kharif harvest. Kept covered under tin roof, moisture below 9%. Great for biomass pelleting or poultry bedding.",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.95,
    status: "available" as const,
    uses: ["Biomass Pellet Fuel", "Animal Bedding", "Silica Extraction", "Biochar"],
    createdAt: "2026-10-02T09:15:00Z"
  },
  {
    id: 102,
    farmerId: 1,
    farmerName: "Ramesh Patel",
    farmerVerified: true,
    wasteType: "Groundnut Shells",
    quantity: 8,
    unit: "ton" as const,
    price: 4300,
    city: "Anantapur",
    state: "Andhra Pradesh",
    location: "Kalyandurg Road, Anantapur Rural",
    distanceKm: 8.5,
    availableDate: "2026-10-14",
    description: "Decorticated high-calorific groundnut pods, low ash content, perfectly dry for gasifier units.",
    imageUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.93,
    status: "available" as const,
    uses: ["Biomass Pellets", "Activated Carbon", "Soil Conditioning"],
    createdAt: "2026-10-03T11:00:00Z"
  },
  {
    id: 103,
    farmerId: 4,
    farmerName: "Suresh Reddy",
    farmerVerified: true,
    wasteType: "Cotton Stalks",
    quantity: 25,
    unit: "ton" as const,
    price: 3000,
    city: "Kurnool",
    state: "Andhra Pradesh",
    location: "Adoni Highway Mandi Yard",
    distanceKm: 28.0,
    availableDate: "2026-10-20",
    description: "Shredded dry cotton stalks from 30 acres. Baled and ready for particle board or briquette factories.",
    imageUrl: "https://images.unsplash.com/photo-1594488518063-44249a5b47a1?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.91,
    status: "available" as const,
    uses: ["Particle Board", "Briquette Production", "Pulping"],
    createdAt: "2026-10-04T08:20:00Z"
  },
  {
    id: 104,
    farmerId: 5,
    farmerName: "Balaji Naidu",
    farmerVerified: true,
    wasteType: "Sugarcane Bagasse",
    quantity: 35,
    unit: "ton" as const,
    price: 2550,
    city: "Chittoor",
    state: "Andhra Pradesh",
    location: "Madanapalle Sugar Belt",
    distanceKm: 42.0,
    availableDate: "2026-10-18",
    description: "Depithed sugarcane bagasse, 45% moisture content standard, ready for paper mills and eco-tableware.",
    imageUrl: "https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.97,
    status: "available" as const,
    uses: ["Biodegradable Tableware", "Paper Manufacturing", "Boiler Cogeneration"],
    createdAt: "2026-10-04T14:10:00Z"
  },
  {
    id: 105,
    farmerId: 5,
    farmerName: "Balaji Naidu",
    farmerVerified: true,
    wasteType: "Coconut Husk",
    quantity: 12,
    unit: "ton" as const,
    price: 4900,
    city: "Chittoor",
    state: "Andhra Pradesh",
    location: "Madanapalle Sugar Belt",
    distanceKm: 42.0,
    availableDate: "2026-10-16",
    description: "Raw untreated coconut coir husks. Excellent fiber length for geotextiles and coco-peat substrates.",
    imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.94,
    status: "available" as const,
    uses: ["Coir Fibre", "Horticultural Coco Peat", "Geotextiles"],
    createdAt: "2026-10-05T07:45:00Z"
  },
  {
    id: 106,
    farmerId: 6,
    farmerName: "Ananya Sharma",
    farmerVerified: true,
    wasteType: "Corn Stover",
    quantity: 22,
    unit: "ton" as const,
    price: 2350,
    city: "Bellary",
    state: "Karnataka",
    location: "Siruguppa Agro Hub",
    distanceKm: 55.0,
    availableDate: "2026-10-22",
    description: "Stalks, cobs, and husks harvested by combine. Moisture controlled under 12%, stored in stack.",
    imageUrl: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.89,
    status: "available" as const,
    uses: ["Silage & Animal Fodder", "Cellulosic Ethanol", "Biomass Fuel"],
    createdAt: "2026-10-05T12:00:00Z"
  },
  {
    id: 107,
    farmerId: 7,
    farmerName: "Venkat Rao",
    farmerVerified: false,
    wasteType: "Rice Straw",
    quantity: 30,
    unit: "ton" as const,
    price: 2100,
    city: "Kadapa",
    state: "Andhra Pradesh",
    location: "Proddatur Bypass",
    distanceKm: 34.0,
    availableDate: "2026-10-19",
    description: "Sun-dried paddy straw bales. Zero field burning! Ready for mushroom farms or packing board producers.",
    imageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.96,
    status: "available" as const,
    uses: ["Mushroom Cultivation", "Paper & Pulp", "Cattle Feed Supplement"],
    createdAt: "2026-10-05T16:30:00Z"
  },
  {
    id: 108,
    farmerId: 8,
    farmerName: "Lakshmi Devi",
    farmerVerified: true,
    wasteType: "Groundnut Shells",
    quantity: 6,
    unit: "ton" as const,
    price: 4150,
    city: "Anantapur",
    state: "Andhra Pradesh",
    location: "Dharmavaram Rural",
    distanceKm: 19.5,
    availableDate: "2026-10-13",
    description: "Premium clean peanut shells from community oil press. Dry and high density.",
    imageUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.95,
    status: "available" as const,
    uses: ["Biomass Pellets", "Decorticated Carbon", "Boiler Fuel"],
    createdAt: "2026-10-06T09:00:00Z"
  },
  {
    id: 109,
    farmerId: 9,
    farmerName: "Prakash Gowda",
    farmerVerified: true,
    wasteType: "Wheat Straw",
    quantity: 18,
    unit: "ton" as const,
    price: 2750,
    city: "Bangalore Rural",
    state: "Karnataka",
    location: "Doddaballapur Belt",
    distanceKm: 65.0,
    availableDate: "2026-10-21",
    description: "Chopped golden wheat straw in weather-tight storage. Clean, odorless, premium quality.",
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.92,
    status: "available" as const,
    uses: ["Animal Feed Fodder", "Mushroom Beds", "Biodegradable Board"],
    createdAt: "2026-10-06T10:30:00Z"
  },
  {
    id: 110,
    farmerId: 10,
    farmerName: "Ravi Varma",
    farmerVerified: false,
    wasteType: "Rice Husk",
    quantity: 40,
    unit: "ton" as const,
    price: 3100,
    city: "Nellore",
    state: "Andhra Pradesh",
    location: "Kovur Rice Mill Cluster",
    distanceKm: 78.0,
    availableDate: "2026-10-25",
    description: "Bulk supply available directly from parboiled rice mills. Consistent 10-ton truckload loads.",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.98,
    status: "available" as const,
    uses: ["Power Cogeneration", "Refractory Bricks", "Silica Recovery"],
    createdAt: "2026-10-06T14:40:00Z"
  },
  {
    id: 111,
    farmerId: 11,
    farmerName: "Gurpreet Singh",
    farmerVerified: true,
    wasteType: "Wheat Straw",
    quantity: 32,
    unit: "ton" as const,
    price: 2600,
    city: "Hyderabad Outskirts",
    state: "Telangana",
    location: "Shadnagar Agricultural Market",
    distanceKm: 85.0,
    availableDate: "2026-10-26",
    description: "Strictly baled wheat straw without stone or dust admixture. Truck loading facility on site.",
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.94,
    status: "available" as const,
    uses: ["Paper Manufacturing", "Bio-plastics", "Animal Fodder"],
    createdAt: "2026-10-06T16:15:00Z"
  },
  {
    id: 112,
    farmerId: 12,
    farmerName: "Mallikarjun K",
    farmerVerified: false,
    wasteType: "Cotton Stalks",
    quantity: 20,
    unit: "ton" as const,
    price: 3050,
    city: "Raichur",
    state: "Karnataka",
    location: "Manvi Taluk Field Center",
    distanceKm: 60.0,
    availableDate: "2026-10-24",
    description: "Field-cleared cotton biomass stalks. Helps divert farm clearing from seasonal burning.",
    imageUrl: "https://images.unsplash.com/photo-1594488518063-44249a5b47a1?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.90,
    status: "available" as const,
    uses: ["Biomass Pellets", "Composite Boards"],
    createdAt: "2026-10-06T18:00:00Z"
  },
  {
    id: 113,
    farmerId: 13,
    farmerName: "Sunita Bai",
    farmerVerified: true,
    wasteType: "Mustard Residue",
    quantity: 9,
    unit: "ton" as const,
    price: 2850,
    city: "Kurnool",
    state: "Andhra Pradesh",
    location: "Dhone Mandi Area",
    distanceKm: 31.0,
    availableDate: "2026-10-17",
    description: "Mustard straw and pods after threshing. Highly calorific, dry stored under covered shed.",
    imageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.93,
    status: "available" as const,
    uses: ["Industrial Boilers", "Biochar", "Briquettes"],
    createdAt: "2026-10-07T06:30:00Z"
  },
  {
    id: 114,
    farmerId: 1,
    farmerName: "Ramesh Patel",
    farmerVerified: true,
    wasteType: "Rice Straw",
    quantity: 15,
    unit: "ton" as const,
    price: 2150,
    city: "Anantapur",
    state: "Andhra Pradesh",
    location: "Kalyandurg Road, Anantapur Rural",
    distanceKm: 8.5,
    availableDate: "2026-10-15",
    description: "Freshly cut paddy straw from our northern 8-acre parcel. Mechanically baled into rectangular blocks.",
    imageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.95,
    status: "available" as const,
    uses: ["Paper Pulp", "Bio-Ethanol", "Cattle Bedding"],
    createdAt: "2026-10-07T08:10:00Z"
  }
];

export const INITIAL_OFFERS: Offer[] = [
  {
    id: 701,
    listingId: 101,
    listingTitle: "Rice Husk",
    buyerId: 2,
    buyerName: "Green BioEnergy Pvt Ltd",
    farmerId: 1,
    quantity: 10,
    unit: "ton" as const,
    price: 3100,
    status: "pending" as const,
    message: "We need 10 tons for our boiler pellets plant in Tirupati. Can collect via our lorry on Oct 16th.",
    pickupDate: "2026-10-16",
    counterPrice: null,
    orderId: null,
    createdAt: "2026-10-04T10:15:00Z"
  },
  {
    id: 702,
    listingId: 102,
    listingTitle: "Groundnut Shells",
    buyerId: 15,
    buyerName: "Deccan Biochar Corporation",
    farmerId: 1,
    quantity: 8,
    unit: "ton" as const,
    price: 4200,
    status: "accepted" as const,
    message: "Full lot requested for immediate carbon pyrolyzer intake.",
    pickupDate: "2026-10-14",
    counterPrice: null,
    orderId: 801,
    createdAt: "2026-10-04T12:30:00Z"
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 801,
    listingId: 102,
    listingTitle: "Groundnut Shells",
    buyerId: 15,
    buyerName: "Deccan Biochar Corporation",
    farmerId: 1,
    farmerName: "Ramesh Patel",
    quantity: 8,
    unit: "ton" as const,
    totalAmount: 33600,
    status: "pickup_scheduled" as const,
    createdAt: "2026-10-04T13:00:00Z",
    pickupDate: "2026-10-14",
    pickupTime: "10:30 AM",
    pickupAddress: "Kalyandurg Road, Anantapur Rural",
    contactNumber: "+91 98480 12345",
    transportRequired: true
  },
  {
    id: 802,
    listingId: 114,
    listingTitle: "Rice Straw",
    buyerId: 2,
    buyerName: "Green BioEnergy Pvt Ltd",
    farmerId: 1,
    farmerName: "Ramesh Patel",
    quantity: 12,
    unit: "ton" as const,
    totalAmount: 25800,
    status: "completed" as const,
    createdAt: "2026-09-20T08:00:00Z",
    pickupDate: "2026-09-22",
    pickupTime: "02:00 PM",
    pickupAddress: "Kalyandurg Road, Anantapur Rural",
    contactNumber: "+91 98480 12345",
    transportRequired: false
  }
];

export const INITIAL_BUYERS = [
  {
    id: 2,
    companyName: "Green BioEnergy Pvt Ltd",
    city: "Tirupati",
    state: "Andhra Pradesh",
    verified: true,
    requiredWasteTypes: ["Rice Husk", "Groundnut Shells", "Sugarcane Bagasse"],
    quantityNeeded: 85,
    offerPerTon: 3300,
    distanceKm: 35.0
  },
  {
    id: 14,
    companyName: "EcoPaper Pulp Industries",
    city: "Kurnool",
    state: "Andhra Pradesh",
    verified: true,
    requiredWasteTypes: ["Rice Straw", "Wheat Straw", "Sugarcane Bagasse"],
    quantityNeeded: 120,
    offerPerTon: 2350,
    distanceKm: 26.5
  },
  {
    id: 15,
    companyName: "Deccan Biochar Corporation",
    city: "Bellary",
    state: "Karnataka",
    verified: true,
    requiredWasteTypes: ["Cotton Stalks", "Groundnut Shells", "Coconut Husk"],
    quantityNeeded: 60,
    offerPerTon: 4250,
    distanceKm: 48.0
  },
  {
    id: 16,
    companyName: "Andhra Biomass Power Ltd",
    city: "Kadapa",
    state: "Andhra Pradesh",
    verified: true,
    requiredWasteTypes: ["Rice Husk", "Cotton Stalks", "Corn Stover"],
    quantityNeeded: 200,
    offerPerTon: 2950,
    distanceKm: 38.2
  }
];

export const INITIAL_DEMAND = [
  { wasteType: "Rice Husk", demand: "very_high" as const, listingCount: 6, buyerCount: 14, averagePrice: 3200 },
  { wasteType: "Rice Straw", demand: "high" as const, listingCount: 5, buyerCount: 11, averagePrice: 2200 },
  { wasteType: "Groundnut Shells", demand: "very_high" as const, listingCount: 4, buyerCount: 9, averagePrice: 4250 },
  { wasteType: "Sugarcane Bagasse", demand: "high" as const, listingCount: 3, buyerCount: 8, averagePrice: 2600 },
  { wasteType: "Cotton Stalks", demand: "medium" as const, listingCount: 4, buyerCount: 6, averagePrice: 3050 },
  { wasteType: "Coconut Husk", demand: "high" as const, listingCount: 2, buyerCount: 7, averagePrice: 4850 }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 901,
    title: "New Buyer Offer Received",
    message: "Green BioEnergy Pvt Ltd sent an offer for 10 tons of Rice Husk at ₹3,100/ton.",
    read: false,
    createdAt: "2026-10-07T08:00:00Z",
    href: "/farmer/offers"
  },
  {
    id: 902,
    title: "Pickup Confirmed",
    message: "Deccan Biochar Corporation scheduled pickup for Oct 14 at 10:30 AM.",
    read: false,
    createdAt: "2026-10-06T15:30:00Z",
    href: "/farmer/orders"
  },
  {
    id: 903,
    title: "Market Price Alert",
    message: "Groundnut Shells demand in Anantapur rose +8% this week. Fair price now ₹4,200 – ₹4,400/ton.",
    read: true,
    createdAt: "2026-10-05T09:10:00Z",
    href: "/marketplace"
  }
];

// Helper to safely read and write to localStorage
function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, val: T): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

export function getActiveUser(): MockUser {
  return getStorage<MockUser>('agricycle_active_user', SEED_USERS[0]);
}

export function setActiveUser(user: MockUser): void {
  setStorage('agricycle_active_user', user);
}

export function getMockListings(): Listing[] {
  return getStorage('agricycle_listings', INITIAL_LISTINGS);
}

export function saveMockListings(items: Listing[]): void {
  setStorage('agricycle_listings', items);
}

export function getMockFavorites(): number[] {
  return getStorage('agricycle_favorites', [101, 102]);
}

export function saveMockFavorites(ids: number[]): void {
  setStorage('agricycle_favorites', ids);
}

export function getMockOffers(): Offer[] {
  return getStorage('agricycle_offers', INITIAL_OFFERS);
}

export function saveMockOffers(items: Offer[]): void {
  setStorage('agricycle_offers', items);
}

export function getMockOrders(): Order[] {
  return getStorage('agricycle_orders', INITIAL_ORDERS);
}

export function saveMockOrders(items: Order[]): void {
  setStorage('agricycle_orders', items);
}

export function getMockNotifications(): typeof INITIAL_NOTIFICATIONS {
  return getStorage('agricycle_notifications', INITIAL_NOTIFICATIONS);
}

export function saveMockNotifications(items: typeof INITIAL_NOTIFICATIONS): void {
  setStorage('agricycle_notifications', items);
}
