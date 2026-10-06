import { clerkClient, getAuth } from "@clerk/express";
import {
  CreateReviewBody,
  CreateReviewResponse,
  GetAdminStatisticsResponse,
  GetAdminUsersResponse,
  GetMyProfileResponse,
  GetNotificationsResponse,
  GetProfileParams,
  GetProfileResponse,
  GetProfileReviewsParams,
  GetProfileReviewsResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
  SaveMyProfileBody,
  SaveMyProfileResponse,
  SetUserVerificationBody,
  SetUserVerificationParams,
  SetUserVerificationResponse,
} from "@workspace/api-zod";
import {
  db,
  listingsTable,
  notificationsTable,
  ordersTable,
  profilesTable,
  reviewsTable,
  transactionsTable,
} from "@workspace/db";
import { and, avg, desc, eq } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import { findCurrentProfile, requireAdmin, requireClerkUser, requireProfile } from "../lib/auth";

const router: IRouter = Router();

function profileDto(profile: typeof profilesTable.$inferSelect) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    role: profile.role,
    verified: profile.verified,
    city: profile.city,
    state: profile.state,
    farmSize: profile.farmSize,
    companyName: profile.companyName,
    industryType: profile.industryType,
    requiredWasteTypes: profile.requiredWasteTypes,
    rating: profile.rating,
    createdAt: profile.createdAt.toISOString(),
  };
}

function publicProfileDto(profile: typeof profilesTable.$inferSelect) {
  return {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    verified: profile.verified,
    city: profile.city,
    state: profile.state,
    farmSize: profile.farmSize,
    companyName: profile.companyName,
    industryType: profile.industryType,
    requiredWasteTypes: profile.requiredWasteTypes,
    rating: profile.rating,
    createdAt: profile.createdAt.toISOString(),
  };
}

function pathId(req: Request, name: string): number {
  const raw = req.params[name];
  return Number(Array.isArray(raw) ? raw[0] : raw);
}

router.get("/profiles/me", async (req: Request, res: Response): Promise<void> => {
  const profile = await findCurrentProfile(req);
  if (!profile) {
    GetMyProfileResponse.parse(null);
    res.json(null);
    return;
  }
  res.json(GetMyProfileResponse.parse(profileDto(profile)));
});

router.put(
  "/profiles/me",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const body = SaveMyProfileBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const auth = getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: "Sign in to continue." });
      return;
    }

    const existing = await findCurrentProfile(req);
    if (existing && existing.role !== body.data.role) {
      res.status(409).json({ error: "Your marketplace role cannot be changed after setup." });
      return;
    }

    const clerkUser = await clerkClient.users.getUser(auth.userId);
    const email =
      clerkUser.emailAddresses.find(
        (address) => address.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      `${auth.userId}@member.agricycle.invalid`;

    const values = {
      name: body.data.name,
      email,
      phone: body.data.phone,
      city: body.data.city,
      state: body.data.state,
      farmSize: body.data.farmSize ?? null,
      companyName: body.data.companyName ?? null,
      industryType: body.data.industryType ?? null,
      requiredWasteTypes: body.data.requiredWasteTypes ?? [],
    };
    let profile: typeof profilesTable.$inferSelect | undefined;
    if (existing) {
      [profile] = await db
        .update(profilesTable)
        .set(values)
        .where(eq(profilesTable.id, existing.id))
        .returning();
    } else {
      [profile] = await db
        .insert(profilesTable)
        .values({ ...values, clerkUserId: auth.userId, role: body.data.role })
        .onConflictDoNothing({ target: profilesTable.clerkUserId })
        .returning();
      if (!profile) {
        profile = await findCurrentProfile(req) ?? undefined;
      }
    }

    if (!profile) {
      res.status(500).json({ error: "Unable to save your profile." });
      return;
    }

    res.json(SaveMyProfileResponse.parse(profileDto(profile)));
  },
);

router.get(
  "/profiles/:profileId",
  async (req: Request, res: Response): Promise<void> => {
    const params = GetProfileParams.safeParse({ profileId: pathId(req, "profileId") });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.id, params.data.profileId))
      .limit(1);
    if (!profile) {
      res.status(404).json({ error: "Profile not found." });
      return;
    }
    res.json(GetProfileResponse.parse(publicProfileDto(profile)));
  },
);

router.get(
  "/profiles/:profileId/reviews",
  async (req: Request, res: Response): Promise<void> => {
    const params = GetProfileReviewsParams.safeParse({ profileId: pathId(req, "profileId") });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const rows = await db
      .select({
        id: reviewsTable.id,
        fromName: profilesTable.name,
        toProfileId: reviewsTable.toProfileId,
        rating: reviewsTable.rating,
        comment: reviewsTable.comment,
        createdAt: reviewsTable.createdAt,
      })
      .from(reviewsTable)
      .innerJoin(profilesTable, eq(reviewsTable.fromProfileId, profilesTable.id))
      .where(eq(reviewsTable.toProfileId, params.data.profileId))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(50);
    res.json(GetProfileReviewsResponse.parse(rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    }))));
  },
);

router.get(
  "/notifications",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const profile = await requireProfile(req, res);
    if (!profile) return;
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, profile.id))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(100);
    res.json(GetNotificationsResponse.parse(rows.map((row) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      read: row.read,
      createdAt: row.createdAt.toISOString(),
      href: row.href,
    }))));
  },
);

router.put(
  "/notifications/:notificationId/read",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const profile = await requireProfile(req, res);
    if (!profile) return;
    const params = MarkNotificationReadParams.safeParse({
      notificationId: pathId(req, "notificationId"),
    });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [row] = await db
      .update(notificationsTable)
      .set({ read: true })
      .where(and(
        eq(notificationsTable.id, params.data.notificationId),
        eq(notificationsTable.userId, profile.id),
      ))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Notification not found." });
      return;
    }
    res.json(MarkNotificationReadResponse.parse({
      id: row.id,
      title: row.title,
      message: row.message,
      read: row.read,
      createdAt: row.createdAt.toISOString(),
      href: row.href,
    }));
  },
);

router.post(
  "/reviews",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const profile = await requireProfile(req, res);
    if (!profile) return;
    const body = CreateReviewBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, body.data.orderId))
      .limit(1);
    if (!order || order.status !== "completed") {
      res.status(409).json({ error: "Only completed orders can be reviewed." });
      return;
    }
    if (![order.buyerId, order.farmerId].includes(profile.id)) {
      res.status(403).json({ error: "You are not a participant in this order." });
      return;
    }
    const toProfileId = profile.id === order.buyerId ? order.farmerId : order.buyerId;
    const [review] = await db
      .insert(reviewsTable)
      .values({
        fromProfileId: profile.id,
        toProfileId,
        orderId: order.id,
        rating: body.data.rating,
        comment: body.data.comment,
      })
      .onConflictDoNothing()
      .returning();
    if (!review) {
      res.status(409).json({ error: "You already reviewed this order." });
      return;
    }
    const [from] = await db
      .select({ name: profilesTable.name })
      .from(profilesTable)
      .where(eq(profilesTable.id, profile.id))
      .limit(1);
    const [average] = await db
      .select({ value: avg(reviewsTable.rating) })
      .from(reviewsTable)
      .where(eq(reviewsTable.toProfileId, toProfileId));
    await db
      .update(profilesTable)
      .set({ rating: Number(average?.value ?? body.data.rating) })
      .where(eq(profilesTable.id, toProfileId));
    res.status(201).json(CreateReviewResponse.parse({
      id: review.id,
      fromName: from?.name ?? profile.name,
      toProfileId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    }));
  },
);

router.get(
  "/admin/users",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const admin = await requireProfile(req, res);
    if (!admin || !requireAdmin(admin, res)) return;
    const rows = await db.select().from(profilesTable).orderBy(desc(profilesTable.createdAt)).limit(500);
    res.json(GetAdminUsersResponse.parse(rows.map(profileDto)));
  },
);

router.put(
  "/admin/users/:profileId/verification",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const admin = await requireProfile(req, res);
    if (!admin || !requireAdmin(admin, res)) return;
    const params = SetUserVerificationParams.safeParse({ profileId: pathId(req, "profileId") });
    const body = SetUserVerificationBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const [profile] = await db
      .update(profilesTable)
      .set({ verified: body.data.verified })
      .where(eq(profilesTable.id, params.data.profileId))
      .returning();
    if (!profile) {
      res.status(404).json({ error: "Profile not found." });
      return;
    }
    res.json(SetUserVerificationResponse.parse(profileDto(profile)));
  },
);

router.get(
  "/admin/statistics",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const admin = await requireProfile(req, res);
    if (!admin || !requireAdmin(admin, res)) return;
    const [profiles, listings, orders, transactions] = await Promise.all([
      db.select().from(profilesTable),
      db.select().from(listingsTable),
      db.select().from(ordersTable),
      db.select().from(transactionsTable),
    ]);
    const completedOrders = orders.filter((order) => order.status === "completed");
    const reusedKg = completedOrders.reduce((sum, order) => {
      const multiplier = order.unit === "ton" ? 1000 : order.unit === "quintal" ? 100 : 1;
      return sum + order.quantity * multiplier;
    }, 0);
    const recentUsers = profiles
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 8)
      .map(profileDto);
    res.json(GetAdminStatisticsResponse.parse({
      totalUsers: profiles.length,
      farmers: profiles.filter((profile) => profile.role === "farmer").length,
      industries: profiles.filter((profile) => profile.role === "industry").length,
      listings: listings.length,
      orders: orders.length,
      wasteReusedKg: reusedKg,
      transactions: transactions.reduce((sum, transaction) => sum + transaction.amount, 0),
      recentUsers,
    }));
  },
);

export default router;
