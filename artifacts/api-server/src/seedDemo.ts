import { clerkClient } from "@clerk/express";
import {
  db,
  favoritesTable,
  listingsTable,
  notificationsTable,
  offersTable,
  ordersTable,
  profilesTable,
  reviewsTable,
  transactionsTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { logger } from "./lib/logger";

const demoPassword = "AgriCycleDemo!2026";

const farmers = [
  { name: "Asha Reddy", email: "farmer@agricycle-demo.example.com", city: "Hyderabad", state: "Telangana", farmSize: 8, clerkUserId: "demo-farmer" },
  { name: "Ramesh Rao", city: "Medak", state: "Telangana", farmSize: 12 },
  { name: "Sunita Deshmukh", city: "Nashik", state: "Maharashtra", farmSize: 9 },
  { name: "Gurpreet Singh", city: "Ludhiana", state: "Punjab", farmSize: 18 },
  { name: "Kavitha Reddy", city: "Vijayawada", state: "Andhra Pradesh", farmSize: 7 },
  { name: "Rajesh Patil", city: "Pune", state: "Maharashtra", farmSize: 16 },
  { name: "Suresh Gowda", city: "Mysuru", state: "Karnataka", farmSize: 11 },
  { name: "Meena Yadav", city: "Kanpur", state: "Uttar Pradesh", farmSize: 10 },
  { name: "Karan Malik", city: "Karnal", state: "Haryana", farmSize: 15 },
  { name: "Lalita Choudhary", city: "Jaipur", state: "Rajasthan", farmSize: 6 },
].map((profile, index) => ({
  ...profile,
  clerkUserId: profile.clerkUserId ?? `seed-farmer-${index}`,
  email: profile.email ?? `farmer${index}@agricycle-demo.example.com`,
  role: "farmer",
  phone: `+91 98${String(10000000 + index * 313).slice(0, 8)}`,
  verified: index % 3 !== 2,
  rating: 4.3 + (index % 6) / 10,
  companyName: null,
  industryType: null,
  requiredWasteTypes: [],
}));

const industries = [
  { name: "Nisha Varma", companyName: "Green Earth Bioenergy", email: "buyer@agricycle-demo.example.com", city: "Hyderabad", state: "Telangana", industryType: "Biomass energy", requiredWasteTypes: ["Rice straw", "Cotton stalk", "Maize cobs"], clerkUserId: "demo-buyer" },
  { name: "Arjun Kulkarni", companyName: "Western Biofuels", city: "Pune", state: "Maharashtra", industryType: "Biofuel", requiredWasteTypes: ["Sugarcane bagasse", "Cotton stalk"] },
  { name: "Ananya Rao", companyName: "Nandi Renewables", city: "Bengaluru", state: "Karnataka", industryType: "Biomass energy", requiredWasteTypes: ["Rice straw", "Coconut husk", "Coffee husk"] },
  { name: "Harpreet Kaur", companyName: "Punjab Soil Collective", city: "Ludhiana", state: "Punjab", industryType: "Compost", requiredWasteTypes: ["Wheat straw", "Mustard straw", "Rice husk"] },
  { name: "Vikram Iyer", companyName: "Southern Circular Materials", city: "Chennai", state: "Tamil Nadu", industryType: "Animal bedding", requiredWasteTypes: ["Coconut husk", "Groundnut shells", "Banana stem"] },
].map((profile, index) => ({
  ...profile,
  clerkUserId: profile.clerkUserId ?? `seed-industry-${index}`,
  email: profile.email ?? `industry${index}@agricycle-demo.example.com`,
  role: "industry",
  phone: `+91 97${String(20000000 + index * 421).slice(0, 8)}`,
  verified: index !== 3,
  rating: 4.4 + (index % 5) / 10,
  farmSize: null,
}));

const admin = {
  clerkUserId: "demo-admin",
  name: "AgriCycle Admin",
  email: "admin@agricycle-demo.example.com",
  phone: "+91 9000000000",
  role: "admin",
  verified: true,
  city: "Hyderabad",
  state: "Telangana",
  farmSize: null,
  companyName: "AgriCycle",
  industryType: "Marketplace operations",
  requiredWasteTypes: [] as string[],
  rating: 5,
};

const residues = [
  { wasteType: "Rice straw", unitPrice: 3900, uses: ["Biomass fuel", "Compost"], city: "Medak", state: "Telangana" },
  { wasteType: "Wheat straw", unitPrice: 4800, uses: ["Animal bedding", "Mushroom substrate"], city: "Ludhiana", state: "Punjab" },
  { wasteType: "Sugarcane bagasse", unitPrice: 3300, uses: ["Biofuel", "Pulp and paper"], city: "Vijayawada", state: "Andhra Pradesh" },
  { wasteType: "Cotton stalk", unitPrice: 5400, uses: ["Biomass fuel", "Particle board"], city: "Nashik", state: "Maharashtra" },
  { wasteType: "Corn stover", unitPrice: 5200, uses: ["Biogas", "Compost"], city: "Hyderabad", state: "Telangana" },
  { wasteType: "Coconut husk", unitPrice: 6500, uses: ["Coir products", "Growing medium"], city: "Coimbatore", state: "Tamil Nadu" },
  { wasteType: "Mustard straw", unitPrice: 4100, uses: ["Biochar", "Animal bedding"], city: "Karnal", state: "Haryana" },
  { wasteType: "Maize cobs", unitPrice: 5700, uses: ["Biomass fuel", "Activated carbon"], city: "Mysuru", state: "Karnataka" },
  { wasteType: "Groundnut shells", unitPrice: 7200, uses: ["Boiler fuel", "Compost"], city: "Pune", state: "Maharashtra" },
  { wasteType: "Rice husk", unitPrice: 4400, uses: ["Silica production", "Biomass fuel"], city: "Jaipur", state: "Rajasthan" },
  { wasteType: "Banana stem", unitPrice: 2800, uses: ["Fiber products", "Compost"], city: "Vijayawada", state: "Andhra Pradesh" },
  { wasteType: "Coffee husk", unitPrice: 6100, uses: ["Compost", "Biochar"], city: "Mysuru", state: "Karnataka" },
  { wasteType: "Soybean residue", unitPrice: 4600, uses: ["Animal feed", "Biogas"], city: "Pune", state: "Maharashtra" },
  { wasteType: "Pigeon pea stalk", unitPrice: 3700, uses: ["Cookstove fuel", "Compost"], city: "Hyderabad", state: "Telangana" },
  { wasteType: "Sunflower stalk", unitPrice: 4300, uses: ["Pellets", "Particle board"], city: "Kanpur", state: "Uttar Pradesh" },
  { wasteType: "Pearl millet stalk", unitPrice: 3500, uses: ["Animal fodder", "Biomass fuel"], city: "Jaipur", state: "Rajasthan" },
  { wasteType: "Turmeric leaves", unitPrice: 2600, uses: ["Compost", "Mulch"], city: "Hyderabad", state: "Telangana" },
  { wasteType: "Jute sticks", unitPrice: 6800, uses: ["Biochar", "Paper pulp"], city: "Ludhiana", state: "Punjab" },
  { wasteType: "Sorghum stalk", unitPrice: 3200, uses: ["Animal fodder", "Biogas"], city: "Karnal", state: "Haryana" },
  { wasteType: "Paddy husk", unitPrice: 4500, uses: ["Silica production", "Compost"], city: "Medak", state: "Telangana" },
];

function dateAfter(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function getOrCreateClerkUser(email: string, firstName: string, lastName: string) {
  const existing = await clerkClient.users.getUserList({
    emailAddress: [email],
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0].id;
  const user = await clerkClient.users.createUser({
    emailAddress: [email],
    password: demoPassword,
    firstName,
    lastName,
  });
  return user.id;
}

async function seed(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo accounts and data must never be created in production.");
  }
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY is required to provision local demo sign-ins.");
  }
  const [existingProfile] = await db
    .select({ id: profilesTable.id })
    .from(profilesTable)
    .limit(1);
  if (existingProfile) {
    logger.info("Marketplace profiles already exist; demo seeding was skipped.");
    return;
  }

  const farmerEmail = farmers[0].email;
  const buyerEmail = industries[0].email;
  const adminEmail = admin.email;
  const demoUsers = [
    { email: farmerEmail, name: farmers[0].name },
    { email: buyerEmail, name: industries[0].name },
    { email: adminEmail, name: admin.name },
  ];
  for (const user of demoUsers) {
    const [firstName, ...rest] = user.name.split(" ");
    const userId = await getOrCreateClerkUser(user.email, firstName, rest.join(" "));
    if (user.email === farmerEmail) farmers[0].clerkUserId = userId;
    if (user.email === buyerEmail) industries[0].clerkUserId = userId;
    if (user.email === adminEmail) admin.clerkUserId = userId;
  }

  await db.insert(profilesTable).values([...farmers, ...industries, admin]);
  const profiles = await db.select().from(profilesTable);
  const farmerProfiles = farmers.map((item) =>
    profiles.find((profile) => profile.clerkUserId === item.clerkUserId)!,
  );
  const industryProfiles = industries.map((item) =>
    profiles.find((profile) => profile.clerkUserId === item.clerkUserId)!,
  );
  const demoFarmer = farmerProfiles[0];
  const demoBuyer = industryProfiles[0];

  const createdListings = await db.insert(listingsTable).values(
    residues.map((residue, index) => {
      const farmer = farmerProfiles[index % farmerProfiles.length];
      return {
        farmerId: farmer.id,
        wasteType: residue.wasteType,
        quantity: 8 + (index % 5) * 6,
        unit: "ton",
        price: residue.unitPrice,
        location: `${residue.city}, ${residue.state}`,
        city: residue.city,
        state: residue.state,
        availableDate: dateAfter((index % 10) + 1),
        description: `Clean, dry ${residue.wasteType.toLowerCase()} collected after harvest. Ready for local pickup. ${residue.uses.join(" and ")} are common reuse options.`,
        imageUrl: null,
        aiConfidence: null,
        status: "available",
        uses: residue.uses,
      };
    }),
  ).returning();

  const completeListing = createdListings[0];
  const scheduledListing = createdListings[2];
  const pendingListing = createdListings[4];
  const [completedOrder] = await db.insert(ordersTable).values({
    listingId: completeListing.id,
    buyerId: demoBuyer.id,
    farmerId: completeListing.farmerId,
    quantity: 2,
    unit: "ton",
    totalAmount: 2 * completeListing.price,
    status: "completed",
    pickupDate: dateAfter(-3),
    pickupTime: "09:00",
    pickupAddress: completeListing.location,
    contactNumber: demoFarmer.phone,
    transportRequired: true,
  }).returning();
  const [scheduledOrder] = await db.insert(ordersTable).values({
    listingId: scheduledListing.id,
    buyerId: industryProfiles[2].id,
    farmerId: scheduledListing.farmerId,
    quantity: 3,
    unit: "ton",
    totalAmount: 3 * scheduledListing.price,
    status: "pickup_scheduled",
    pickupDate: dateAfter(3),
    pickupTime: "10:30",
    pickupAddress: scheduledListing.location,
    contactNumber: industryProfiles[2].phone,
    transportRequired: true,
  }).returning();
  await db.insert(ordersTable).values({
    listingId: pendingListing.id,
    buyerId: demoBuyer.id,
    farmerId: pendingListing.farmerId,
    quantity: 4,
    unit: "ton",
    totalAmount: 4 * pendingListing.price,
    status: "pending",
    pickupDate: dateAfter(5),
    transportRequired: true,
  });

  await db.update(listingsTable)
    .set({
      quantity: Math.max(0, completeListing.quantity - 2),
      status: "available",
    })
    .where(eq(listingsTable.id, completeListing.id));
  await db.update(listingsTable)
    .set({ status: "reserved" })
    .where(inArray(listingsTable.id, [scheduledListing.id, pendingListing.id]));

  await db.insert(offersTable).values([
    {
      listingId: createdListings[5].id,
      buyerId: demoBuyer.id,
      farmerId: createdListings[5].farmerId,
      quantity: 4,
      unit: "ton",
      price: Math.round(createdListings[5].price * 0.92),
      status: "pending",
      message: "We can arrange pickup this week. Could you confirm moisture content?",
      pickupDate: dateAfter(4),
    },
    {
      listingId: createdListings[6].id,
      buyerId: industryProfiles[3].id,
      farmerId: createdListings[6].farmerId,
      quantity: 3,
      unit: "ton",
      price: Math.round(createdListings[6].price * 0.88),
      counterPrice: Math.round(createdListings[6].price * 0.96),
      status: "countered",
      message: "The listed batch is dry and baled. Pickup can be arranged.",
      pickupDate: dateAfter(6),
    },
    {
      listingId: completeListing.id,
      buyerId: demoBuyer.id,
      farmerId: completeListing.farmerId,
      quantity: 2,
      unit: "ton",
      price: completeListing.price,
      status: "accepted",
      message: "Completed successfully; pickup was on time.",
      pickupDate: dateAfter(-3),
      orderId: completedOrder.id,
    },
  ]);
  await db.insert(transactionsTable).values({
    orderId: completedOrder.id,
    payerId: demoBuyer.id,
    payeeId: demoFarmer.id,
    amount: completedOrder.totalAmount,
    status: "completed",
  });
  await db.insert(reviewsTable).values({
    fromProfileId: demoBuyer.id,
    toProfileId: demoFarmer.id,
    orderId: completedOrder.id,
    rating: 5,
    comment: "Clear communication, clean material, and an easy pickup.",
  });
  await db.update(profilesTable)
    .set({ rating: 5 })
    .where(eq(profilesTable.id, demoFarmer.id));
  await db.insert(favoritesTable).values({
    userId: demoBuyer.id,
    listingId: createdListings[5].id,
  });
  await db.insert(notificationsTable).values([
    {
      userId: demoFarmer.id,
      title: "New buyer offer",
      message: "Green Earth Bioenergy sent an offer on your listing.",
      href: "/farmer/offers",
    },
    {
      userId: demoFarmer.id,
      title: "Pickup scheduled",
      message: `A pickup for ${scheduledListing.wasteType.toLowerCase()} is scheduled for ${dateAfter(3)}.`,
      href: "/farmer/orders",
    },
    {
      userId: demoBuyer.id,
      title: "Supplier deal completed",
      message: "Your latest pickup is complete. Leave a review for your supplier.",
      href: "/industry/orders",
    },
  ]);

  logger.info(
    {
      farmers: farmerProfiles.length,
      industries: industryProfiles.length,
      listings: createdListings.length,
      sampleOrderIds: [completedOrder.id, scheduledOrder.id],
    },
    "Seeded AgriCycle development demo data",
  );
}

seed()
  .then(async () => {
    await db.$client.end();
  })
  .catch(async (error: unknown) => {
    logger.error(
      { message: error instanceof Error ? error.message : "Unknown seeding error" },
      "AgriCycle demo seeding failed",
    );
    await db.$client.end();
    process.exitCode = 1;
  });
