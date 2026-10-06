import {
  CreateListingBody,
  CreateListingResponse,
  DeleteListingParams,
  DeleteListingResponse,
  GetFavoritesResponse,
  GetListingParams,
  GetListingResponse,
  GetListingsQueryParams,
  GetListingsResponse,
  GetMarketDemandResponse,
  GetNearbyBuyersQueryParams,
  GetNearbyBuyersResponse,
  GetRecommendationsResponse,
  RemoveFavoriteParams,
  RemoveFavoriteResponse,
  SaveFavoriteParams,
  SaveFavoriteResponse,
  UpdateListingBody,
  UpdateListingParams,
  UpdateListingResponse,
} from "@workspace/api-zod";
import {
  db,
  favoritesTable,
  listingsTable,
  profilesTable,
  type Listing as DbListing,
} from "@workspace/db";
import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import type { ObjectAclPolicy } from "../lib/objectAcl";
import { requireClerkUser, requireProfile, requireRole } from "../lib/auth";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const storage = new ObjectStorageService();

function dateValue(value: Date | string | null | undefined) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

function pathId(req: Request, name: string): number {
  const raw = req.params[name];
  return Number(Array.isArray(raw) ? raw[0] : raw);
}

function listingDto(
  listing: DbListing,
  farmer: typeof profilesTable.$inferSelect,
) {
  return {
    id: listing.id,
    farmerId: farmer.id,
    farmerName: farmer.name,
    farmerVerified: farmer.verified,
    wasteType: listing.wasteType,
    quantity: listing.quantity,
    unit: listing.unit,
    price: listing.price,
    location: listing.location,
    city: listing.city,
    state: listing.state,
    availableDate: listing.availableDate,
    description: listing.description,
    imageUrl: publicImageUrl(listing.imageUrl),
    aiConfidence: listing.aiConfidence,
    status: listing.status,
    uses: listing.uses,
    createdAt: listing.createdAt.toISOString(),
    distanceKm: null,
  };
}

function publicImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  if (path.startsWith("/storage/")) return `/api${path}`;
  return path;
}

async function prepareListingImage(
  imageUrl: string | null | undefined,
  ownerId: string,
): Promise<string | null | undefined> {
  if (imageUrl == null || imageUrl === "") return imageUrl;
  if (!imageUrl.startsWith("/objects/")) return imageUrl;

  const policy: ObjectAclPolicy = { owner: ownerId, visibility: "public" };
  return storage.trySetObjectEntityAclPolicy(imageUrl, policy);
}

async function selectListingWithFarmer(id: number) {
  const [row] = await db
    .select({ listing: listingsTable, farmer: profilesTable })
    .from(listingsTable)
    .innerJoin(profilesTable, eq(listingsTable.farmerId, profilesTable.id))
    .where(eq(listingsTable.id, id))
    .limit(1);
  return row;
}

router.get("/listings", async (req: Request, res: Response): Promise<void> => {
  const raw = req.query;
  const queryCandidate = {
    search: typeof raw.search === "string" ? raw.search : undefined,
    wasteType: typeof raw.wasteType === "string" ? raw.wasteType : undefined,
    city: typeof raw.city === "string" ? raw.city : undefined,
    minQuantity: typeof raw.minQuantity === "string" ? Number(raw.minQuantity) : undefined,
    maxPrice: typeof raw.maxPrice === "string" ? Number(raw.maxPrice) : undefined,
    sort: typeof raw.sort === "string" ? raw.sort : undefined,
    mine: raw.mine === "true",
  };
  const query = GetListingsQueryParams.safeParse(queryCandidate);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const filters = [];
  if (query.data.wasteType) {
    filters.push(ilike(listingsTable.wasteType, `%${query.data.wasteType}%`));
  }
  if (query.data.city) {
    filters.push(ilike(listingsTable.city, `%${query.data.city}%`));
  }
  if (query.data.minQuantity !== undefined) {
    filters.push(gte(listingsTable.quantity, query.data.minQuantity));
  }
  if (query.data.maxPrice !== undefined) {
    filters.push(lte(listingsTable.price, query.data.maxPrice));
  }
  if (query.data.search) {
    const match = `%${query.data.search}%`;
    filters.push(or(
      ilike(listingsTable.wasteType, match),
      ilike(listingsTable.description, match),
      ilike(listingsTable.city, match),
      ilike(listingsTable.state, match),
    ));
  }

  if (query.data.mine) {
    const profile = await requireProfile(req, res);
    if (!profile) return;
    if (profile.role !== "farmer") {
      res.status(403).json({ error: "Only farmers can view their own listings." });
      return;
    }
    filters.push(eq(listingsTable.farmerId, profile.id));
  } else {
    filters.push(eq(listingsTable.status, "available"));
  }

  const ordering =
    query.data.sort === "price"
      ? listingsTable.price
      : query.data.sort === "quantity"
        ? listingsTable.quantity
        : listingsTable.createdAt;
  const orderBy = query.data.sort === "recent" || !query.data.sort
    ? desc(ordering)
    : ordering;
  const rows = await db
    .select({ listing: listingsTable, farmer: profilesTable })
    .from(listingsTable)
    .innerJoin(profilesTable, eq(listingsTable.farmerId, profilesTable.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(orderBy)
    .limit(100);
  res.json(GetListingsResponse.parse(
    rows.map((row) => listingDto(row.listing, row.farmer)),
  ));
});

router.post(
  "/listings",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const profile = await requireProfile(req, res);
    if (!profile || !requireRole(profile, ["farmer"], res)) return;
    const body = CreateListingBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const imageUrl = await prepareListingImage(
      body.data.imageUrl,
      profile.clerkUserId,
    );
    const [created] = await db
      .insert(listingsTable)
      .values({
        ...body.data,
        availableDate: dateValue(body.data.availableDate),
        farmerId: profile.id,
        imageUrl: imageUrl ?? null,
        status: "available",
      })
      .returning();
    res.status(201).json(CreateListingResponse.parse(listingDto(created, profile)));
  },
);

router.get(
  "/listings/:listingId",
  async (req: Request, res: Response): Promise<void> => {
    const params = GetListingParams.safeParse({ listingId: pathId(req, "listingId") });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const row = await selectListingWithFarmer(params.data.listingId);
    if (!row) {
      res.status(404).json({ error: "Listing not found." });
      return;
    }
    res.json(GetListingResponse.parse(listingDto(row.listing, row.farmer)));
  },
);

router.put(
  "/listings/:listingId",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const profile = await requireProfile(req, res);
    if (!profile) return;
    const params = UpdateListingParams.safeParse({ listingId: pathId(req, "listingId") });
    const body = UpdateListingBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const [existing] = await db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.id, params.data.listingId))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Listing not found." });
      return;
    }
    if (existing.farmerId !== profile.id) {
      res.status(403).json({ error: "You can only edit your own listings." });
      return;
    }
    const imageUrl = body.data.imageUrl === undefined
      ? undefined
      : await prepareListingImage(body.data.imageUrl, profile.clerkUserId);
    const [updated] = await db
      .update(listingsTable)
      .set({
        ...body.data,
        availableDate: dateValue(body.data.availableDate),
        imageUrl,
      })
      .where(eq(listingsTable.id, existing.id))
      .returning();
    res.json(UpdateListingResponse.parse(listingDto(updated, profile)));
  },
);

router.delete(
  "/listings/:listingId",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const profile = await requireProfile(req, res);
    if (!profile) return;
    const params = DeleteListingParams.safeParse({ listingId: pathId(req, "listingId") });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [existing] = await db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.id, params.data.listingId))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Listing not found." });
      return;
    }
    if (existing.farmerId !== profile.id) {
      res.status(403).json({ error: "You can only remove your own listings." });
      return;
    }
    if (existing.status !== "available") {
      res.status(409).json({ error: "Reserved or sold listings cannot be removed." });
      return;
    }
    await db.delete(listingsTable).where(eq(listingsTable.id, existing.id));
    res.status(204).send();
    DeleteListingResponse.parse(undefined);
  },
);

router.get(
  "/buyers",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const current = await requireProfile(req, res);
    if (!current) return;
    const query = GetNearbyBuyersQueryParams.safeParse({
      wasteType: typeof req.query.wasteType === "string" ? req.query.wasteType : undefined,
      city: typeof req.query.city === "string" ? req.query.city : undefined,
    });
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
      return;
    }
    const profiles = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.role, "industry"))
      .orderBy(desc(profilesTable.verified), desc(profilesTable.rating))
      .limit(100);
    const buyers = profiles
      .filter((profile) =>
        (!query.data.city || profile.city.toLowerCase().includes(query.data.city.toLowerCase())) &&
        (!query.data.wasteType || profile.requiredWasteTypes.some(
          (type) => type.toLowerCase() === query.data.wasteType?.toLowerCase(),
        )),
      )
      .map((profile) => ({
        id: profile.id,
        name: profile.name,
        companyName: profile.companyName ?? profile.name,
        city: profile.city,
        state: profile.state,
        verified: profile.verified,
        requiredWasteTypes: profile.requiredWasteTypes,
        quantityNeeded: 25,
        offerPerTon: 5000,
        pickupAvailable: true,
        rating: profile.rating,
        distanceKm: null,
      }));
    res.json(GetNearbyBuyersResponse.parse(buyers));
  },
);

router.get(
  "/recommendations",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const profile = await requireProfile(req, res);
    if (!profile) return;
    const listingRows = await db
      .select({ listing: listingsTable, farmer: profilesTable })
      .from(listingsTable)
      .innerJoin(profilesTable, eq(listingsTable.farmerId, profilesTable.id))
      .where(eq(listingsTable.status, "available"))
      .orderBy(desc(listingsTable.createdAt))
      .limit(6);
    const buyerRows = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.role, "industry"))
      .orderBy(desc(profilesTable.verified), desc(profilesTable.rating))
      .limit(6);
    const listings = listingRows.map((row) => listingDto(row.listing, row.farmer));
    const buyers = buyerRows.map((buyer) => ({
      id: buyer.id,
      name: buyer.name,
      companyName: buyer.companyName ?? buyer.name,
      city: buyer.city,
      state: buyer.state,
      verified: buyer.verified,
      requiredWasteTypes: buyer.requiredWasteTypes,
      quantityNeeded: 25,
      offerPerTon: 5000,
      pickupAvailable: true,
      rating: buyer.rating,
      distanceKm: null,
    }));
    const insights = profile.role === "farmer"
      ? [
          `${buyers.length} industrial buyers are sourcing reusable farm residue.`,
          "Add clear photos and a pickup date to help buyers make a faster decision.",
        ]
      : [
          `${listings.length} active listings are available across the marketplace.`,
          "Filter by city and residue type to compare nearby supply.",
        ];
    res.json(GetRecommendationsResponse.parse({ insights, listings, buyers }));
  },
);

router.get(
  "/market/demand",
  async (_req: Request, res: Response): Promise<void> => {
    const [listings, buyers] = await Promise.all([
      db.select().from(listingsTable),
      db.select().from(profilesTable).where(eq(profilesTable.role, "industry")),
    ]);
    const wasteTypes = new Set([
      ...listings.map((listing) => listing.wasteType),
      ...buyers.flatMap((buyer) => buyer.requiredWasteTypes),
    ]);
    const demand = [...wasteTypes].map((wasteType) => {
      const supply = listings.filter((listing) =>
        listing.status === "available" &&
        listing.wasteType.toLowerCase() === wasteType.toLowerCase(),
      );
      const interestedBuyers = buyers.filter((buyer) =>
        buyer.requiredWasteTypes.some((type) =>
          type.toLowerCase() === wasteType.toLowerCase(),
        ),
      );
      const ratio = interestedBuyers.length / Math.max(1, supply.length);
      return {
        wasteType,
        demand: ratio >= 3 ? "very_high" : ratio >= 1.5 ? "high" : ratio >= 0.7 ? "medium" : "low",
        listingCount: supply.length,
        buyerCount: interestedBuyers.length,
        averagePrice: supply.length
          ? supply.reduce((sum, listing) => sum + listing.price, 0) / supply.length
          : 0,
      };
    }).sort((a, b) => b.buyerCount - a.buyerCount);
    res.json(GetMarketDemandResponse.parse(demand));
  },
);

router.get(
  "/favorites",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const profile = await requireProfile(req, res);
    if (!profile) return;
    const rows = await db
      .select({ listing: listingsTable, farmer: profilesTable })
      .from(favoritesTable)
      .innerJoin(listingsTable, eq(favoritesTable.listingId, listingsTable.id))
      .innerJoin(profilesTable, eq(listingsTable.farmerId, profilesTable.id))
      .where(eq(favoritesTable.userId, profile.id))
      .orderBy(desc(favoritesTable.createdAt));
    res.json(GetFavoritesResponse.parse(
      rows.map((row) => listingDto(row.listing, row.farmer)),
    ));
  },
);

router.put(
  "/favorites/:listingId",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const profile = await requireProfile(req, res);
    if (!profile) return;
    const params = SaveFavoriteParams.safeParse({ listingId: pathId(req, "listingId") });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [listing] = await db
      .select({ id: listingsTable.id })
      .from(listingsTable)
      .where(eq(listingsTable.id, params.data.listingId))
      .limit(1);
    if (!listing) {
      res.status(404).json({ error: "Listing not found." });
      return;
    }
    await db
      .insert(favoritesTable)
      .values({ userId: profile.id, listingId: listing.id })
      .onConflictDoNothing();
    res.json(SaveFavoriteResponse.parse({ favorited: true }));
  },
);

router.delete(
  "/favorites/:listingId",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const profile = await requireProfile(req, res);
    if (!profile) return;
    const params = RemoveFavoriteParams.safeParse({ listingId: pathId(req, "listingId") });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    await db
      .delete(favoritesTable)
      .where(and(
        eq(favoritesTable.userId, profile.id),
        eq(favoritesTable.listingId, params.data.listingId),
      ));
    res.json(RemoveFavoriteResponse.parse({ favorited: false }));
  },
);

export default router;
