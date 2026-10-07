// AgriCycle - Domain Knowledge Base & Seed Data
// Comprehensive Indian agricultural residue marketplace dataset

const WASTE_CATEGORIES = {
  "Rice Husk": {
    name: "Rice Husk",
    category: "Grain Byproduct",
    avgPrice: 3200, // INR per ton
    minPrice: 2600,
    maxPrice: 3800,
    unit: "ton",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    description: "Dry golden-brown rice milling residue with high silica and calorific value.",
    uses: ["Biomass Pellet Fuel", "Animal Bedding", "Silica Extraction", "Biochar", "Refractory Bricks"],
    burningCo2PerKg: 1.45,
    highDemand: true,
    demandLevel: "Very High 🔥"
  },
  "Rice Straw": {
    name: "Rice Straw",
    category: "Crop Residue",
    avgPrice: 2200,
    minPrice: 1800,
    maxPrice: 2700,
    unit: "ton",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    description: "Post-harvest paddy straw, baled and dried under sun. Diverts away from winter smog.",
    uses: ["Mushroom Cultivation", "Paper & Pulp", "Ethanol Production", "Cattle Fodder", "Power Generation"],
    burningCo2PerKg: 1.52,
    highDemand: true,
    demandLevel: "High 🔥"
  },
  "Wheat Straw": {
    name: "Wheat Straw",
    category: "Crop Residue",
    avgPrice: 2800,
    minPrice: 2200,
    maxPrice: 3400,
    unit: "ton",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    description: "Clean golden wheat residue, finely chopped or baled. High cellulose content.",
    uses: ["Animal Fodder", "Cardboard Packaging", "Bio-plastics", "Compost & Mulch", "Thermal Insulation"],
    burningCo2PerKg: 1.48,
    highDemand: false,
    demandLevel: "Medium"
  },
  "Sugarcane Bagasse": {
    name: "Sugarcane Bagasse",
    category: "Mill Residue",
    avgPrice: 2600,
    minPrice: 2100,
    maxPrice: 3200,
    unit: "ton",
    image: "https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=800&q=80",
    description: "Fibrous matter remaining after sugarcane stalk crushing. Low moisture and baled.",
    uses: ["Biodegradable Tableware", "Paper Manufacturing", "Cogeneration Power", "Particle Boards"],
    burningCo2PerKg: 1.60,
    highDemand: true,
    demandLevel: "Very High 🔥"
  },
  "Corn Stover": {
    name: "Corn Stover",
    category: "Crop Residue",
    avgPrice: 2400,
    minPrice: 1900,
    maxPrice: 3000,
    unit: "ton",
    image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80",
    description: "Leaves, stalks, and cobs of maize field harvest. Excellent energy density.",
    uses: ["Cellulosic Ethanol", "Biomass Briquettes", "Direct Furnace Combustion", "Silage Animal Feed"],
    burningCo2PerKg: 1.42,
    highDemand: true,
    demandLevel: "High"
  },
  "Groundnut Shells": {
    name: "Groundnut Shells",
    category: "Shells & Pods",
    avgPrice: 4200,
    minPrice: 3500,
    maxPrice: 4900,
    unit: "ton",
    image: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=800&q=80",
    description: "Clean, dry peanut husks. Outstanding thermal combustion and low ash content.",
    uses: ["Activated Carbon", "Industrial Boiler Briquettes", "Heavy Metal Adsorption", "Hardboard Fillers"],
    burningCo2PerKg: 1.68,
    highDemand: true,
    demandLevel: "High 🔥"
  },
  "Cotton Stalks": {
    name: "Cotton Stalks",
    category: "Woody Biomass",
    avgPrice: 3100,
    minPrice: 2500,
    maxPrice: 3700,
    unit: "ton",
    image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=800&q=80",
    description: "Woody post-picking cotton plants. Shredded or tied in bundles for clean handling.",
    uses: ["Compressed Biomass Pellets", "MDF Board Core", "Kraft Paper", "Gasifier Fuel"],
    burningCo2PerKg: 1.55,
    highDemand: false,
    demandLevel: "Medium"
  },
  "Coconut Husk": {
    name: "Coconut Husk",
    category: "Fibre & Pith",
    avgPrice: 4800,
    minPrice: 3900,
    maxPrice: 5600,
    unit: "ton",
    image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80",
    description: "Outer fibrous husk containing natural coir fibres and horticultural peat.",
    uses: ["Coco Peat Soil Substrate", "Coir Geotextiles", "Upholstery & Mattresses", "Rope & Mats"],
    burningCo2PerKg: 1.72,
    highDemand: true,
    demandLevel: "High"
  },
  "Mustard Residue": {
    name: "Mustard Residue",
    category: "Oilseed Biomass",
    avgPrice: 2900,
    minPrice: 2300,
    maxPrice: 3500,
    unit: "ton",
    image: "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80",
    description: "Stalks and pods left after threshing mustard crops. High calorific value.",
    uses: ["Biomass Power Plants", "Industrial Briquettes", "Compost Base", "Pest-Repellent Mulch"],
    burningCo2PerKg: 1.49,
    highDemand: false,
    demandLevel: "Medium"
  }
};

const SEED_USERS = [
  // 1. Farmer Demo User
  {
    id: 1,
    name: "Ramesh Patel",
    email: "farmer@agricycle.demo",
    password: "demo123",
    role: "farmer",
    phone: "+91 98480 12345",
    city: "Anantapur",
    state: "Andhra Pradesh",
    farmSize: 16,
    verified: true,
    rating: 4.9,
    reviewCount: 14,
    avatar: "RP",
    createdAt: "2026-08-10T08:30:00Z"
  },
  // 2. Industry Demo User
  {
    id: 2,
    name: "Green BioEnergy Pvt Ltd",
    email: "industry@agricycle.demo",
    password: "demo123",
    role: "industry",
    phone: "+91 87722 89900",
    city: "Tirupati",
    state: "Andhra Pradesh",
    companyName: "Green BioEnergy Pvt Ltd",
    industryType: "Biomass Energy & Pellets",
    requiredWasteTypes: ["Rice Husk", "Groundnut Shells", "Sugarcane Bagasse"],
    quantityNeededTons: 85,
    offerRatePerTon: 3300,
    verified: true,
    rating: 4.8,
    reviewCount: 22,
    avatar: "GB",
    createdAt: "2026-08-12T10:00:00Z"
  },
  // 3. Admin Demo User
  {
    id: 3,
    name: "AgriCycle Operations Admin",
    email: "admin@agricycle.demo",
    password: "admin123",
    role: "admin",
    phone: "+91 80 4050 6070",
    city: "Bangalore",
    state: "Karnataka",
    verified: true,
    rating: 5.0,
    reviewCount: 50,
    avatar: "AC",
    createdAt: "2026-07-01T00:00:00Z"
  },
  // 4-13. Other Farmers
  {
    id: 4,
    name: "Suresh Reddy",
    email: "suresh.reddy@agrifarm.in",
    password: "demo123",
    role: "farmer",
    phone: "+91 94401 55672",
    city: "Kurnool",
    state: "Andhra Pradesh",
    farmSize: 28,
    verified: true,
    rating: 4.8,
    reviewCount: 11,
    avatar: "SR",
    createdAt: "2026-08-15T09:00:00Z"
  },
  {
    id: 5,
    name: "Balaji Naidu",
    email: "balaji.naidu@chittoorfarm.in",
    password: "demo123",
    role: "farmer",
    phone: "+91 98492 33411",
    city: "Chittoor",
    state: "Andhra Pradesh",
    farmSize: 20,
    verified: true,
    rating: 4.7,
    reviewCount: 9,
    avatar: "BN",
    createdAt: "2026-08-18T11:20:00Z"
  },
  {
    id: 6,
    name: "Ananya Sharma",
    email: "ananya.sharma@bellaryagro.in",
    password: "demo123",
    role: "farmer",
    phone: "+91 97412 88902",
    city: "Bellary",
    state: "Karnataka",
    farmSize: 32,
    verified: true,
    rating: 5.0,
    reviewCount: 18,
    avatar: "AS",
    createdAt: "2026-08-20T07:45:00Z"
  },
  {
    id: 7,
    name: "Venkat Rao",
    email: "venkat.rao@kadapaharvest.in",
    password: "demo123",
    role: "farmer",
    phone: "+91 94411 77299",
    city: "Kadapa",
    state: "Andhra Pradesh",
    farmSize: 24,
    verified: true,
    rating: 4.6,
    reviewCount: 8,
    avatar: "VR",
    createdAt: "2026-08-22T14:10:00Z"
  },
  {
    id: 8,
    name: "Lakshmi Devi",
    email: "lakshmi.devi@anantafarms.in",
    password: "demo123",
    role: "farmer",
    phone: "+91 99890 44211",
    city: "Anantapur",
    state: "Andhra Pradesh",
    farmSize: 14,
    verified: true,
    rating: 4.9,
    reviewCount: 15,
    avatar: "LD",
    createdAt: "2026-08-25T16:30:00Z"
  },
  {
    id: 9,
    name: "Prakash Gowda",
    email: "prakash.gowda@kafarms.in",
    password: "demo123",
    role: "farmer",
    phone: "+91 98801 66734",
    city: "Bangalore Rural",
    state: "Karnataka",
    farmSize: 19,
    verified: true,
    rating: 4.7,
    reviewCount: 12,
    avatar: "PG",
    createdAt: "2026-08-28T10:15:00Z"
  },
  {
    id: 10,
    name: "Ravi Varma",
    email: "ravi.varma@nellorepaddy.in",
    password: "demo123",
    role: "farmer",
    phone: "+91 94901 88200",
    city: "Nellore",
    state: "Andhra Pradesh",
    farmSize: 45,
    verified: true,
    rating: 4.9,
    reviewCount: 20,
    avatar: "RV",
    createdAt: "2026-09-01T08:00:00Z"
  },
  {
    id: 11,
    name: "Gurpreet Singh",
    email: "gurpreet.singh@hyderabadagro.in",
    password: "demo123",
    role: "farmer",
    phone: "+91 98721 34991",
    city: "Hyderabad Outskirts",
    state: "Telangana",
    farmSize: 36,
    verified: false,
    rating: 4.5,
    reviewCount: 6,
    avatar: "GS",
    createdAt: "2026-09-05T12:00:00Z"
  },
  {
    id: 12,
    name: "Mallikarjun K",
    email: "mallikarjun.k@raichurcrops.in",
    password: "demo123",
    role: "farmer",
    phone: "+91 97402 11984",
    city: "Raichur",
    state: "Karnataka",
    farmSize: 26,
    verified: true,
    rating: 4.8,
    reviewCount: 10,
    avatar: "MK",
    createdAt: "2026-09-08T09:30:00Z"
  },
  {
    id: 13,
    name: "Sunita Bai",
    email: "sunita.bai@kurnoolres.in",
    password: "demo123",
    role: "farmer",
    phone: "+91 99480 77123",
    city: "Kurnool",
    state: "Andhra Pradesh",
    farmSize: 11,
    verified: false,
    rating: 4.6,
    reviewCount: 5,
    avatar: "SB",
    createdAt: "2026-09-10T15:20:00Z"
  },
  // 14-18. Other Industries
  {
    id: 14,
    name: "EcoPaper & Board Mills",
    email: "sourcing@ecopapermills.in",
    password: "demo123",
    role: "industry",
    phone: "+91 8562 240199",
    city: "Kadapa",
    state: "Andhra Pradesh",
    companyName: "EcoPaper & Board Mills",
    industryType: "Paper & Packaging",
    requiredWasteTypes: ["Rice Straw", "Wheat Straw", "Sugarcane Bagasse"],
    quantityNeededTons: 120,
    offerRatePerTon: 2400,
    verified: true,
    rating: 4.9,
    reviewCount: 31,
    avatar: "EP",
    createdAt: "2026-08-16T10:00:00Z"
  },
  {
    id: 15,
    name: "Deccan Biochar Corporation",
    email: "procurement@deccanbiochar.com",
    password: "demo123",
    role: "industry",
    phone: "+91 80 2839 4410",
    city: "Bangalore",
    state: "Karnataka",
    companyName: "Deccan Biochar Corporation",
    industryType: "Agri Carbon & Soil Health",
    requiredWasteTypes: ["Rice Husk", "Groundnut Shells", "Cotton Stalks"],
    quantityNeededTons: 60,
    offerRatePerTon: 3450,
    verified: true,
    rating: 4.7,
    reviewCount: 16,
    avatar: "DB",
    createdAt: "2026-08-19T14:40:00Z"
  },
  {
    id: 16,
    name: "Andhra Biomass Energy Ltd",
    email: "biomass@andhrapower.in",
    password: "demo123",
    role: "industry",
    phone: "+91 8518 277600",
    city: "Kurnool",
    state: "Andhra Pradesh",
    companyName: "Andhra Biomass Energy Ltd",
    industryType: "Thermal Clean Energy",
    requiredWasteTypes: ["Cotton Stalks", "Corn Stover", "Mustard Residue"],
    quantityNeededTons: 150,
    offerRatePerTon: 2950,
    verified: true,
    rating: 4.8,
    reviewCount: 27,
    avatar: "AB",
    createdAt: "2026-08-23T11:00:00Z"
  },
  {
    id: 17,
    name: "Sri Venkateswara Board Mills",
    email: "admin@svboards.co.in",
    password: "demo123",
    role: "industry",
    phone: "+91 877 223 9100",
    city: "Tirupati",
    state: "Andhra Pradesh",
    companyName: "Sri Venkateswara Board Mills",
    industryType: "Particle Boards & Furniture",
    requiredWasteTypes: ["Sugarcane Bagasse", "Cotton Stalks"],
    quantityNeededTons: 75,
    offerRatePerTon: 2700,
    verified: true,
    rating: 4.6,
    reviewCount: 19,
    avatar: "SV",
    createdAt: "2026-08-27T16:15:00Z"
  },
  {
    id: 18,
    name: "SunFibre Agritech Solutions",
    email: "contact@sunfibreagri.in",
    password: "demo123",
    role: "industry",
    phone: "+91 8554 231888",
    city: "Anantapur",
    state: "Andhra Pradesh",
    companyName: "SunFibre Agritech Solutions",
    industryType: "Geotextiles & Coir Products",
    requiredWasteTypes: ["Coconut Husk", "Rice Straw"],
    quantityNeededTons: 40,
    offerRatePerTon: 4600,
    verified: true,
    rating: 4.9,
    reviewCount: 14,
    avatar: "SF",
    createdAt: "2026-09-02T13:25:00Z"
  }
];

const SEED_LISTINGS = [
  {
    id: 101,
    farmerId: 1, // Ramesh Patel
    farmerName: "Ramesh Patel",
    farmerVerified: true,
    wasteType: "Rice Husk",
    quantity: 14,
    unit: "ton",
    price: 3200,
    city: "Anantapur",
    state: "Andhra Pradesh",
    location: "Kalyandurg Road, Anantapur Rural",
    distanceKm: 8.5,
    availableDate: "2026-10-12",
    description: "Dry fresh golden rice husk from our kharif harvest. Kept covered under tin roof, moisture below 9%. Great for biomass pelleting or poultry bedding.",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.95,
    status: "available",
    uses: ["Biomass Pellet Fuel", "Animal Bedding", "Silica Extraction", "Biochar"],
    createdAt: "2026-10-02T09:15:00Z"
  },
  {
    id: 102,
    farmerId: 1, // Ramesh Patel
    farmerName: "Ramesh Patel",
    farmerVerified: true,
    wasteType: "Groundnut Shells",
    quantity: 8,
    unit: "ton",
    price: 4300,
    city: "Anantapur",
    state: "Andhra Pradesh",
    location: "Kalyandurg Road, Anantapur Rural",
    distanceKm: 8.5,
    availableDate: "2026-10-15",
    description: "Sun-dried groundnut decorticator shells. Clean, zero soil mixture, high calorific heat value. Ready for factory loader pickup.",
    imageUrl: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.94,
    status: "available",
    uses: ["Boiler Briquettes", "Activated Carbon", "Hardboard Manufacturing"],
    createdAt: "2026-10-04T11:00:00Z"
  },
  {
    id: 103,
    farmerId: 4, // Suresh Reddy
    farmerName: "Suresh Reddy",
    farmerVerified: true,
    wasteType: "Cotton Stalks",
    quantity: 25,
    unit: "ton",
    price: 3000,
    city: "Kurnool",
    state: "Andhra Pradesh",
    location: "Near Nandyal Highway, Kurnool District",
    distanceKm: 34.0,
    availableDate: "2026-10-18",
    description: "Tractor-pulled cotton stalks, chopped to 3-4 inch pieces. Sun-cured and tied in easy-to-load bundles. No residual pesticide spray.",
    imageUrl: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.92,
    status: "available",
    uses: ["Biomass Energy", "Particle Board Core", "Kraft Paper"],
    createdAt: "2026-09-28T14:30:00Z"
  },
  {
    id: 104,
    farmerId: 5, // Balaji Naidu
    farmerName: "Balaji Naidu",
    farmerVerified: true,
    wasteType: "Sugarcane Bagasse",
    quantity: 35,
    unit: "ton",
    price: 2550,
    city: "Chittoor",
    state: "Andhra Pradesh",
    location: "Madanapalle Sugar Belt, Chittoor",
    distanceKm: 28.2,
    availableDate: "2026-10-10",
    description: "Cooperative crusher bagasse. Pressed to 45% standard mill moisture. Direct tractor trail access for 10-wheeler lorries.",
    imageUrl: "https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.97,
    status: "available",
    uses: ["Biodegradable Cutlery", "Paper & Pulp", "Cogeneration Power"],
    createdAt: "2026-09-30T10:45:00Z"
  },
  {
    id: 105,
    farmerId: 5, // Balaji Naidu
    farmerName: "Balaji Naidu",
    farmerVerified: true,
    wasteType: "Coconut Husk",
    quantity: 12,
    unit: "ton",
    price: 4900,
    city: "Chittoor",
    state: "Andhra Pradesh",
    location: "Palamaner Road, Chittoor",
    distanceKm: 32.0,
    availableDate: "2026-10-20",
    description: "Thick mature green/brown coconut outer husks. Ready for decorticating or coir defibring mills. Consistent fibrous length.",
    imageUrl: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.96,
    status: "available",
    uses: ["Coir Geotextiles", "Coco Peat", "Upholstery Fillings"],
    createdAt: "2026-10-01T16:00:00Z"
  },
  {
    id: 106,
    farmerId: 6, // Ananya Sharma
    farmerName: "Ananya Sharma",
    farmerVerified: true,
    wasteType: "Corn Stover",
    quantity: 22,
    unit: "ton",
    price: 2350,
    city: "Bellary",
    state: "Karnataka",
    location: "Sandur Road, Bellary Rural",
    distanceKm: 42.5,
    availableDate: "2026-10-14",
    description: "High-density machine-baled corn stalks, husks and cobs. Bales weigh ~25 kg each. Easily stacked and weather-resistant.",
    imageUrl: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.93,
    status: "available",
    uses: ["Cellulosic Ethanol", "Biomass Briquettes", "Silage Feed"],
    createdAt: "2026-10-02T13:20:00Z"
  },
  {
    id: 107,
    farmerId: 7, // Venkat Rao
    farmerName: "Venkat Rao",
    farmerVerified: true,
    wasteType: "Rice Straw",
    quantity: 30,
    unit: "ton",
    price: 2100,
    city: "Kadapa",
    state: "Andhra Pradesh",
    location: "Proddatur Canal Bank, Kadapa",
    distanceKm: 26.0,
    availableDate: "2026-10-16",
    description: "Clean golden paddy straw. Rectangular baled, tied with biodegradable hemp rope. Prevented 45 tons of open field smoke.",
    imageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.94,
    status: "available",
    uses: ["Paper & Pulp", "Mushroom Bedding", "Animal Fodder", "Power Generation"],
    createdAt: "2026-10-03T08:50:00Z"
  },
  {
    id: 108,
    farmerId: 8, // Lakshmi Devi
    farmerName: "Lakshmi Devi",
    farmerVerified: true,
    wasteType: "Groundnut Shells",
    quantity: 6,
    unit: "ton",
    price: 4150,
    city: "Anantapur",
    state: "Andhra Pradesh",
    location: "Dharmavaram Highway, Anantapur",
    distanceKm: 12.0,
    availableDate: "2026-10-11",
    description: "Premium grade decorticated groundnut pods. Moisture tested at 7.8%. Perfect for immediate boiler feed.",
    imageUrl: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.95,
    status: "available",
    uses: ["Activated Carbon", "Boiler Pellets", "Soil Amendment"],
    createdAt: "2026-10-05T07:30:00Z"
  },
  {
    id: 109,
    farmerId: 9, // Prakash Gowda
    farmerName: "Prakash Gowda",
    farmerVerified: true,
    wasteType: "Wheat Straw",
    quantity: 18,
    unit: "ton",
    price: 2750,
    city: "Bangalore Rural",
    state: "Karnataka",
    location: "Doddaballapur Belt, Bangalore Rural",
    distanceKm: 55.0,
    availableDate: "2026-10-19",
    description: "Sun-cured golden wheat straw. Finely cut, zero dirt, stored on raised dry wooden pallets under shed.",
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.91,
    status: "available",
    uses: ["Packaging Board", "Bio-plastics", "Animal Bedding"],
    createdAt: "2026-09-29T15:10:00Z"
  },
  {
    id: 110,
    farmerId: 10, // Ravi Varma
    farmerName: "Ravi Varma",
    farmerVerified: true,
    wasteType: "Rice Husk",
    quantity: 40,
    unit: "ton",
    price: 3100,
    city: "Nellore",
    state: "Andhra Pradesh",
    location: "Kavali Road, Nellore Coastal",
    distanceKm: 78.0,
    availableDate: "2026-10-13",
    description: "Large volume continuous supply from modernize rice mill. 40 tons ready immediately, 20 tons weekly thereafter.",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.98,
    status: "available",
    uses: ["Biomass Power", "Refractory Bricks", "Animal Bedding"],
    createdAt: "2026-10-01T11:40:00Z"
  },
  {
    id: 111,
    farmerId: 11, // Gurpreet Singh
    farmerName: "Gurpreet Singh",
    farmerVerified: false,
    wasteType: "Wheat Straw",
    quantity: 32,
    unit: "ton",
    price: 2600,
    city: "Hyderabad Outskirts",
    state: "Telangana",
    location: "Shadnagar Highway, Hyderabad Outer",
    distanceKm: 92.0,
    availableDate: "2026-10-22",
    description: "Wheat crop residue after combine harvester. Compacted in round bales, 120 kg per bale.",
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.92,
    status: "available",
    uses: ["Straw Particle Boards", "Biofuel", "Fodder"],
    createdAt: "2026-10-04T16:20:00Z"
  },
  {
    id: 112,
    farmerId: 12, // Mallikarjun K
    farmerName: "Mallikarjun K",
    farmerVerified: true,
    wasteType: "Cotton Stalks",
    quantity: 20,
    unit: "ton",
    price: 3050,
    city: "Raichur",
    state: "Karnataka",
    location: "Manvi Taluk, Raichur",
    distanceKm: 68.0,
    availableDate: "2026-10-17",
    description: "Dry seasoned cotton stalks. Cut at root level, free of rocks and soil clods.",
    imageUrl: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.93,
    status: "available",
    uses: ["Biomass Pellets", "Paper Manufacturing", "Hardboard Core"],
    createdAt: "2026-10-03T17:00:00Z"
  },
  {
    id: 113,
    farmerId: 13, // Sunita Bai
    farmerName: "Sunita Bai",
    farmerVerified: false,
    wasteType: "Mustard Residue",
    quantity: 9,
    unit: "ton",
    price: 2850,
    city: "Kurnool",
    state: "Andhra Pradesh",
    location: "Dhone Mandal, Kurnool",
    distanceKm: 44.0,
    availableDate: "2026-10-19",
    description: "Dry mustard straw and seed pods. High heating calorific value, clean burning.",
    imageUrl: "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.90,
    status: "available",
    uses: ["Industrial Briquettes", "Boiler Fuel", "Pest Mulch"],
    createdAt: "2026-10-05T12:15:00Z"
  },
  {
    id: 114,
    farmerId: 1, // Ramesh Patel (Completed/Past item)
    farmerName: "Ramesh Patel",
    farmerVerified: true,
    wasteType: "Rice Straw",
    quantity: 15,
    unit: "ton",
    price: 2150,
    city: "Anantapur",
    state: "Andhra Pradesh",
    location: "Kalyandurg Road, Anantapur Rural",
    distanceKm: 8.5,
    availableDate: "2026-09-15",
    description: "Early kharif paddy straw. Successfully purchased by Green BioEnergy Pvt Ltd.",
    imageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    aiConfidence: 0.96,
    status: "sold",
    uses: ["Biomass Power Generation", "Paper Pulp"],
    createdAt: "2026-09-08T10:00:00Z"
  }
];

const SEED_OFFERS = [
  {
    id: 501,
    listingId: 101,
    listingTitle: "Rice Husk",
    farmerId: 1, // Ramesh Patel
    buyerId: 2, // Green BioEnergy Pvt Ltd
    buyerName: "Green BioEnergy Pvt Ltd",
    buyerVerified: true,
    quantity: 10,
    unit: "ton",
    price: 3100,
    pickupDate: "2026-10-14",
    message: "We need 10 tons of rice husk for our Tirupati biomass pellet plant. Can bring our own covered lorry on Tuesday morning.",
    status: "pending",
    createdAt: "2026-10-06T14:20:00Z"
  },
  {
    id: 502,
    listingId: 102,
    listingTitle: "Groundnut Shells",
    farmerId: 1, // Ramesh Patel
    buyerId: 15, // Deccan Biochar Corporation
    buyerName: "Deccan Biochar Corporation",
    buyerVerified: true,
    quantity: 8,
    unit: "ton",
    price: 4100,
    pickupDate: "2026-10-16",
    message: "Offering ₹4,100/ton for the full 8-ton groundnut shell lot. We will collect directly from your farm gate.",
    status: "countered",
    counterPrice: 4250,
    counterMessage: "Farmer proposed ₹4,250/ton because moisture is under 8%.",
    createdAt: "2026-10-05T16:45:00Z"
  },
  {
    id: 503,
    listingId: 104,
    listingTitle: "Sugarcane Bagasse",
    farmerId: 5, // Balaji Naidu
    buyerId: 14, // EcoPaper & Board Mills
    buyerName: "EcoPaper & Board Mills",
    buyerVerified: true,
    quantity: 35,
    unit: "ton",
    price: 2500,
    pickupDate: "2026-10-12",
    message: "Ready to lift all 35 tons in two articulated trucks. Please confirm loading ramp availability.",
    status: "accepted",
    createdAt: "2026-10-03T11:30:00Z"
  },
  {
    id: 504,
    listingId: 107,
    listingTitle: "Rice Straw",
    farmerId: 7, // Venkat Rao
    buyerId: 14, // EcoPaper & Board Mills
    buyerName: "EcoPaper & Board Mills",
    buyerVerified: true,
    quantity: 20,
    unit: "ton",
    price: 2050,
    pickupDate: "2026-10-17",
    message: "Need 20 tons for paper packaging trial. Good price offered.",
    status: "pending",
    createdAt: "2026-10-06T09:10:00Z"
  },
  {
    id: 505,
    listingId: 103,
    listingTitle: "Cotton Stalks",
    farmerId: 4, // Suresh Reddy
    buyerId: 16, // Andhra Biomass Energy Ltd
    buyerName: "Andhra Biomass Energy Ltd",
    buyerVerified: true,
    quantity: 25,
    unit: "ton",
    price: 2950,
    pickupDate: "2026-10-19",
    message: "Thermal power requirement. Ready to schedule logistics immediately upon approval.",
    status: "accepted",
    createdAt: "2026-10-04T15:00:00Z"
  }
];

const SEED_ORDERS = [
  {
    id: 801,
    orderNumber: "AG-1092",
    listingId: 101,
    listingTitle: "Rice Husk",
    farmerId: 1, // Ramesh Patel
    farmerName: "Ramesh Patel",
    farmerPhone: "+91 98480 12345",
    buyerId: 2, // Green BioEnergy Pvt Ltd
    buyerName: "Green BioEnergy Pvt Ltd",
    buyerPhone: "+91 87722 89900",
    quantity: 12,
    unit: "ton",
    ratePerUnit: 3150,
    totalAmount: 37800,
    status: "pickup_scheduled", // Stepper status: pending -> confirmed -> pickup_scheduled -> picked_up -> completed
    pickupDate: "2026-10-11",
    pickupTime: "10:30 AM",
    pickupAddress: "Kalyandurg Road, Anantapur Rural, Andhra Pradesh",
    contactNumber: "+91 98480 12345",
    driverName: "Venkat Swamy (Lorry AP-02-TX-8821)",
    transportRequired: false, // Buyer arranged
    notes: "Driver will arrive with weighbridge slips. Payment upon dispatch.",
    createdAt: "2026-10-04T10:00:00Z"
  },
  {
    id: 802,
    orderNumber: "AG-1088",
    listingId: 114,
    listingTitle: "Rice Straw",
    farmerId: 1, // Ramesh Patel
    farmerName: "Ramesh Patel",
    farmerPhone: "+91 98480 12345",
    buyerId: 2, // Green BioEnergy Pvt Ltd
    buyerName: "Green BioEnergy Pvt Ltd",
    buyerPhone: "+91 87722 89900",
    quantity: 15,
    unit: "ton",
    ratePerUnit: 2150,
    totalAmount: 32250,
    status: "completed",
    pickupDate: "2026-09-18",
    pickupTime: "02:00 PM",
    pickupAddress: "Kalyandurg Road, Anantapur Rural",
    contactNumber: "+91 98480 12345",
    driverName: "Chandra K (Lorry AP-02-TC-3310)",
    transportRequired: false,
    notes: "Pickup completed seamlessly. Weight slip confirmed at 15.2 tons. Payment cleared.",
    createdAt: "2026-09-12T09:00:00Z"
  },
  {
    id: 803,
    orderNumber: "AG-1090",
    listingId: 104,
    listingTitle: "Sugarcane Bagasse",
    farmerId: 5, // Balaji Naidu
    farmerName: "Balaji Naidu",
    farmerPhone: "+91 98492 33411",
    buyerId: 14, // EcoPaper & Board Mills
    buyerName: "EcoPaper & Board Mills",
    buyerPhone: "+91 8562 240199",
    quantity: 35,
    unit: "ton",
    ratePerUnit: 2500,
    totalAmount: 87500,
    status: "confirmed",
    pickupDate: "2026-10-12",
    pickupTime: "08:00 AM",
    pickupAddress: "Madanapalle Sugar Belt, Chittoor",
    contactNumber: "+91 98492 33411",
    transportRequired: true,
    notes: "Awaiting final loading slot confirmation.",
    createdAt: "2026-10-04T12:00:00Z"
  },
  {
    id: 804,
    orderNumber: "AG-1075",
    listingId: 108,
    listingTitle: "Groundnut Shells",
    farmerId: 8, // Lakshmi Devi
    farmerName: "Lakshmi Devi",
    farmerPhone: "+91 99890 44211",
    buyerId: 15, // Deccan Biochar Corporation
    buyerName: "Deccan Biochar Corporation",
    buyerPhone: "+91 80 2839 4410",
    quantity: 6,
    unit: "ton",
    ratePerUnit: 4100,
    totalAmount: 24600,
    status: "completed",
    pickupDate: "2026-09-24",
    pickupTime: "11:00 AM",
    pickupAddress: "Dharmavaram Highway, Anantapur",
    contactNumber: "+91 99890 44211",
    notes: "Full payment received via bank transfer. Excellent quality verified.",
    createdAt: "2026-09-19T14:30:00Z"
  }
];

const SEED_NOTIFICATIONS = [
  {
    id: 901,
    userId: 1, // Ramesh Patel
    title: "New Offer Received 🔥",
    message: "Green BioEnergy Pvt Ltd made an offer of ₹3,100/ton for 10 tons of your Rice Husk.",
    read: false,
    type: "offer",
    link: "/farmer/offers",
    createdAt: "2026-10-06T14:20:00Z"
  },
  {
    id: 902,
    userId: 1, // Ramesh Patel
    title: "Pickup Scheduled 🚚",
    message: "Lorry AP-02-TX-8821 is scheduled to pick up 12 tons of Rice Husk on 11 Oct, 10:30 AM.",
    read: false,
    type: "pickup",
    link: "/farmer/orders",
    createdAt: "2026-10-05T18:00:00Z"
  },
  {
    id: 903,
    userId: 1, // Ramesh Patel
    title: "Payment Credited ✅",
    message: "₹32,250 received for Order #AG-1088 (Rice Straw). Transferred to SBI Account **4012.",
    read: true,
    type: "payment",
    link: "/farmer/earnings",
    createdAt: "2026-09-19T11:00:00Z"
  },
  {
    id: 904,
    userId: 2, // Green BioEnergy
    title: "Offer Accepted by Farmer 🎉",
    message: "Ramesh Patel accepted your offer for Order #AG-1092. Please schedule pickup slot.",
    read: false,
    type: "offer",
    link: "/industry/orders",
    createdAt: "2026-10-05T10:15:00Z"
  },
  {
    id: 905,
    userId: 2, // Green BioEnergy
    title: "New Rice Husk Supply Nearby 🌾",
    message: "Ravi Varma listed 40 tons of Rice Husk within your procurement radius.",
    read: true,
    type: "listing",
    link: "/industry/marketplace",
    createdAt: "2026-10-01T11:45:00Z"
  }
];

const SEED_REVIEWS = [
  {
    id: 601,
    fromUserId: 2,
    fromName: "Green BioEnergy Pvt Ltd",
    toUserId: 1, // Ramesh Patel
    orderId: 802,
    rating: 5,
    comment: "Exceptional quality dry straw. Bales were tightly packed and loaded smoothly onto our trucks. Highly recommended farmer!",
    createdAt: "2026-09-20T10:00:00Z"
  },
  {
    id: 602,
    fromUserId: 1,
    fromName: "Ramesh Patel",
    toUserId: 2, // Green BioEnergy Pvt Ltd
    orderId: 802,
    rating: 5,
    comment: "Prompt driver, professional weighbridge verification, and same-day payment. Looking forward to our next deal.",
    createdAt: "2026-09-20T14:30:00Z"
  },
  {
    id: 603,
    fromUserId: 15,
    fromName: "Deccan Biochar Corporation",
    toUserId: 8, // Lakshmi Devi
    orderId: 804,
    rating: 5,
    comment: "Zero sand admixture in groundnut shells. Outstanding carbon yield.",
    createdAt: "2026-09-25T16:00:00Z"
  }
];

// Strict Limited Fair Price Bounds (Mandatory Mandi & Bioenergy Ceilings)
const PRICE_LIMITS = {
  "Rice Husk": { min: 2500, max: 3900, fairRecommended: 3200, unit: "ton", description: "Standard Indian boiler benchmark" },
  "Rice Straw": { min: 1600, max: 2800, fairRecommended: 2200, unit: "ton", description: "Paddy baled transport limit" },
  "Wheat Straw": { min: 2000, max: 3500, fairRecommended: 2800, unit: "ton", description: "Cellulose & fodder fair range" },
  "Sugarcane Bagasse": { min: 2000, max: 3300, fairRecommended: 2600, unit: "ton", description: "45% mill moisture standard" },
  "Corn Stover": { min: 1800, max: 3100, fairRecommended: 2400, unit: "ton", description: "Silage & energy price bound" },
  "Groundnut Shells": { min: 3400, max: 5000, fairRecommended: 4200, unit: "ton", description: "High calorific decorticated shell limit" },
  "Cotton Stalks": { min: 2400, max: 3800, fairRecommended: 3100, unit: "ton", description: "Briquette & board core price limit" },
  "Coconut Husk": { min: 3800, max: 5800, fairRecommended: 4800, unit: "ton", description: "Fibre & peat coir procurement limit" },
  "Mustard Residue": { min: 2200, max: 3600, fairRecommended: 2900, unit: "ton", description: "Oilseed threshing byproduct limit" }
};

// Farmer-Friendly Rural Load Conversions (Tractor Trolley & Lorry loads)
const RURAL_CONVERSIONS = {
  trolleyToTons: 3.5, // 1 Tractor Trolley = ~3.5 Tons (3,500 kg)
  lorryToTons: 12.0,  // 1 10-Wheeler Lorry = ~12 Tons (12,000 kg)
  quintalToTons: 0.1  // 1 Quintal = 100 kg
};

// Trilingual Farmer Dictionary (English, Telugu, Hindi)
const TRANSLATIONS = {
  en: {
    langName: "English",
    tagline: "Turn Agricultural Waste into Opportunity",
    zeroCommission: "0% Commission for Farmers",
    kisanHelpline: "Kisan Support: 1800-AGRI-CYCLE",
    listWaste: "Sell Crop Residue",
    aiPriceGuard: "Mandi Fair Price Guard",
    voiceAssistant: "Listen in Voice",
    voiceReading: "Reading aloud...",
    stopVoice: "Stop Voice",
    tractorTrolley: "Tractor Trolley",
    trolleyLoads: "Tractor Trolley Loads (≈ 3.5 Tons each)",
    safeZone: "Fair Mandi Price Zone",
    priceWarningLow: "⚠️ Price too low! Unfair to harvesting effort.",
    priceWarningHigh: "⚠️ Price above industry procurement ceiling.",
    priceOptimal: "✓ Fair Market Price. Fast buyer acceptance guaranteed.",
    shareWhatsapp: "Share on WhatsApp",
    easySell: "Easy 1-Tap Listing for Farmers",
    myEarnings: "My Earnings",
    nearbyBuyers: "Nearby Buyers",
    allMaterials: "All Residues"
  },
  te: {
    langName: "తెలుగు (Telugu)",
    tagline: "వ్యవసాయ వ్యర్థాలను లాభదాయక అవకాశంగా మార్చండి",
    zeroCommission: "రైతులకు 0% కమీషన్",
    kisanHelpline: "కిసాన్ హెల్ప్‌లైన్: 1800-AGRI-CYCLE",
    listWaste: "పంట వ్యర్థాలను అమ్మండి",
    aiPriceGuard: "మండి న్యాయమైన ధర రక్షణ",
    voiceAssistant: "తెలుగులో వినండి",
    voiceReading: "చదువుతున్నాము...",
    stopVoice: "వాయిస్ ఆపండి",
    tractorTrolley: "ట్రాక్టర్ ట్రాలీ",
    trolleyLoads: "ట్రాక్టర్ ట్రాలీ లోడ్లు (ఒక్కోటి ≈ 3.5 టన్నులు)",
    safeZone: "న్యాయమైన ధర సురక్షిత జోన్",
    priceWarningLow: "⚠️ ధర చాలా తక్కువ! కోత శ్రమకు తగినది కాదు.",
    priceWarningHigh: "⚠️ పరిశ్రమల కొనుగోలు పరిమితి కంటే ఎక్కువ.",
    priceOptimal: "✓ సరైన న్యాయమైన ధర. పరిశ్రమలు త్వరగా కొనుగోలు చేస్తాయి.",
    shareWhatsapp: "వాట్సాప్‌లో షేర్ చేయండి",
    easySell: "రైతులకు సులభమైన 1-ట్యాప్ నమోదు",
    myEarnings: "నా సంపాదన",
    nearbyBuyers: "సమీప కొనుగోలుదారులు",
    allMaterials: "అన్ని రకాల వ్యర్థాలు"
  },
  hi: {
    langName: "हिन्दी (Hindi)",
    tagline: "फसल अवशेष को बनाएं अतिरिक्त आमदनी",
    zeroCommission: "किसानों के लिए 0% कमीशन",
    kisanHelpline: "किसान हेल्पलाइन: 1800-AGRI-CYCLE",
    listWaste: "फसल अवशेष बेचें",
    aiPriceGuard: "मंडी उचित मूल्य सुरक्षा",
    voiceAssistant: "आवाज़ में सुनें",
    voiceReading: "सुना रहे हैं...",
    stopVoice: "आवाज़ बंद करें",
    tractorTrolley: "ट्रैक्टर ट्राली",
    trolleyLoads: "ट्रैक्टर ट्राली भार (प्रत्येक ≈ 3.5 टन)",
    safeZone: "उचित मंडी मूल्य सुरक्षित क्षेत्र",
    priceWarningLow: "⚠️ मूल्य बहुत कम है! कटाई मेहनत के अनुकूल नहीं।",
    priceWarningHigh: "⚠️ उद्योग खरीद अधिकतम सीमा से ऊपर।",
    priceOptimal: "✓ सही उचित मूल्य। खरीदार तुरंत स्वीकार करेंगे।",
    shareWhatsapp: "व्हाट्सएप पर साझा करें",
    easySell: "किसानों के लिए आसान 1-क्लिक लिस्टिंग",
    myEarnings: "मेरी कुल कमाई",
    nearbyBuyers: "नजदीकी खरीदार",
    allMaterials: "सभी फसल अवशेष"
  }
};

// If running in browser or Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WASTE_CATEGORIES,
    SEED_USERS,
    SEED_LISTINGS,
    SEED_OFFERS,
    SEED_ORDERS,
    SEED_NOTIFICATIONS,
    SEED_REVIEWS,
    PRICE_LIMITS,
    RURAL_CONVERSIONS,
    TRANSLATIONS
  };
}

