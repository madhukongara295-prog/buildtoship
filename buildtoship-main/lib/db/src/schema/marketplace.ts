import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const profilesTable = pgTable(
  "marketplace_profiles",
  {
    id: serial("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    role: text("role").notNull(),
    verified: boolean("verified").notNull().default(false),
    city: text("city").notNull().default(""),
    state: text("state").notNull().default(""),
    farmSize: real("farm_size"),
    companyName: text("company_name"),
    industryType: text("industry_type"),
    requiredWasteTypes: text("required_waste_types").array().notNull().default([]),
    rating: real("rating").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("marketplace_profiles_role_idx").on(table.role),
    index("marketplace_profiles_city_idx").on(table.city),
  ],
);

export const listingsTable = pgTable(
  "waste_listings",
  {
    id: serial("id").primaryKey(),
    farmerId: integer("farmer_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    wasteType: text("waste_type").notNull(),
    quantity: real("quantity").notNull(),
    unit: text("unit").notNull(),
    price: real("price").notNull(),
    location: text("location").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    availableDate: date("available_date", { mode: "string" }),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url"),
    aiConfidence: real("ai_confidence"),
    status: text("status").notNull().default("available"),
    uses: text("uses").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("waste_listings_farmer_idx").on(table.farmerId),
    index("waste_listings_type_status_idx").on(table.wasteType, table.status),
    index("waste_listings_city_idx").on(table.city),
  ],
);

export const ordersTable = pgTable(
  "marketplace_orders",
  {
    id: serial("id").primaryKey(),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listingsTable.id),
    buyerId: integer("buyer_id")
      .notNull()
      .references(() => profilesTable.id),
    farmerId: integer("farmer_id")
      .notNull()
      .references(() => profilesTable.id),
    quantity: real("quantity").notNull(),
    unit: text("unit").notNull(),
    totalAmount: real("total_amount").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    pickupDate: date("pickup_date", { mode: "string" }),
    pickupTime: text("pickup_time"),
    pickupAddress: text("pickup_address"),
    contactNumber: text("contact_number"),
    transportRequired: boolean("transport_required").notNull().default(true),
  },
  (table) => [
    index("marketplace_orders_buyer_idx").on(table.buyerId),
    index("marketplace_orders_farmer_idx").on(table.farmerId),
    index("marketplace_orders_status_idx").on(table.status),
  ],
);

export const offersTable = pgTable(
  "marketplace_offers",
  {
    id: serial("id").primaryKey(),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listingsTable.id, { onDelete: "cascade" }),
    buyerId: integer("buyer_id")
      .notNull()
      .references(() => profilesTable.id),
    farmerId: integer("farmer_id")
      .notNull()
      .references(() => profilesTable.id),
    quantity: real("quantity").notNull(),
    unit: text("unit").notNull(),
    price: real("price").notNull(),
    status: text("status").notNull().default("pending"),
    message: text("message").notNull().default(""),
    pickupDate: date("pickup_date", { mode: "string" }),
    counterPrice: real("counter_price"),
    orderId: integer("order_id").references(() => ordersTable.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("marketplace_offers_buyer_idx").on(table.buyerId),
    index("marketplace_offers_farmer_idx").on(table.farmerId),
    index("marketplace_offers_listing_idx").on(table.listingId),
  ],
);

export const notificationsTable = pgTable(
  "marketplace_notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    href: text("href"),
  },
  (table) => [index("marketplace_notifications_user_idx").on(table.userId)],
);

export const reviewsTable = pgTable(
  "marketplace_reviews",
  {
    id: serial("id").primaryKey(),
    fromProfileId: integer("from_profile_id")
      .notNull()
      .references(() => profilesTable.id),
    toProfileId: integer("to_profile_id")
      .notNull()
      .references(() => profilesTable.id),
    orderId: integer("order_id")
      .notNull()
      .references(() => ordersTable.id),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("marketplace_reviews_order_author_idx").on(
      table.orderId,
      table.fromProfileId,
    ),
    index("marketplace_reviews_recipient_idx").on(table.toProfileId),
  ],
);

export const favoritesTable = pgTable(
  "marketplace_favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listingsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("marketplace_favorites_user_listing_idx").on(
      table.userId,
      table.listingId,
    ),
  ],
);

export const transactionsTable = pgTable(
  "marketplace_transactions",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "cascade" }),
    payerId: integer("payer_id")
      .notNull()
      .references(() => profilesTable.id),
    payeeId: integer("payee_id")
      .notNull()
      .references(() => profilesTable.id),
    amount: real("amount").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("marketplace_transactions_order_idx").on(table.orderId)],
);

export const aiAnalysesTable = pgTable(
  "marketplace_ai_analyses",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id").references(() => profilesTable.id, {
      onDelete: "set null",
    }),
    wasteType: text("waste_type").notNull(),
    confidence: real("confidence"),
    mode: text("mode").notNull(),
    result: jsonb("result").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("marketplace_ai_analyses_profile_idx").on(table.profileId)],
);

export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  id: true,
  createdAt: true,
});
export const insertListingSchema = createInsertSchema(listingsTable).omit({
  id: true,
  createdAt: true,
});
export const insertOfferSchema = createInsertSchema(offersTable).omit({
  id: true,
  createdAt: true,
});
export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
});
export const insertNotificationSchema = createInsertSchema(
  notificationsTable,
).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviewsTable).omit({
  id: true,
  createdAt: true,
});
export const insertFavoriteSchema = createInsertSchema(favoritesTable).omit({
  id: true,
  createdAt: true,
});
export const insertTransactionSchema = createInsertSchema(
  transactionsTable,
).omit({ id: true, createdAt: true });
export const insertAIAnalysisSchema = createInsertSchema(aiAnalysesTable).omit({
  id: true,
  createdAt: true,
});

export type Profile = typeof profilesTable.$inferSelect;
export type Listing = typeof listingsTable.$inferSelect;
export type Offer = typeof offersTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;
export type Notification = typeof notificationsTable.$inferSelect;
export type Review = typeof reviewsTable.$inferSelect;
export type Favorite = typeof favoritesTable.$inferSelect;
export type Transaction = typeof transactionsTable.$inferSelect;
export type AIAnalysis = typeof aiAnalysesTable.$inferSelect;
