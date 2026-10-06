import {
  CreateOfferBody,
  CreateOfferResponse,
  CreateOrderBody,
  CreateOrderResponse,
  GetDashboardResponse,
  GetOffersResponse,
  GetOrderParams,
  GetOrderResponse,
  GetOrdersResponse,
  RespondToOfferBody,
  RespondToOfferParams,
  RespondToOfferResponse,
  UpdateOrderBody,
  UpdateOrderParams,
  UpdateOrderResponse,
} from "@workspace/api-zod";
import {
  db,
  listingsTable,
  notificationsTable,
  offersTable,
  ordersTable,
  profilesTable,
  reviewsTable,
  type Listing,
  type Offer,
  type Order,
  type Profile,
} from "@workspace/db";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import { requireClerkUser, requireProfile, requireRole } from "../lib/auth";

const router: IRouter = Router();
const activeOrderStatuses = ["pending", "confirmed", "pickup_scheduled", "picked_up"];

function dateValue(value: Date | string | null | undefined) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

function pathId(req: Request, name: string): number {
  const raw = req.params[name];
  return Number(Array.isArray(raw) ? raw[0] : raw);
}

function notificationHref(role: string): string {
  return role === "farmer" ? "/farmer/notifications" : "/industry/notifications";
}

async function notify(
  userId: number,
  title: string,
  message: string,
  href: string | null = null,
): Promise<void> {
  await db.insert(notificationsTable).values({ userId, title, message, href });
}

function offerDto(
  offer: Offer,
  listing: Listing,
  buyer: Profile,
) {
  return {
    id: offer.id,
    listingId: offer.listingId,
    listingTitle: listing.wasteType,
    buyerId: buyer.id,
    buyerName: buyer.name,
    farmerId: offer.farmerId,
    quantity: offer.quantity,
    unit: offer.unit,
    price: offer.price,
    status: offer.status,
    message: offer.message,
    pickupDate: offer.pickupDate,
    counterPrice: offer.counterPrice,
    orderId: offer.orderId,
    createdAt: offer.createdAt.toISOString(),
  };
}

function orderDto(
  order: Order,
  listing: Listing,
  buyer: Profile,
  farmer: Profile,
) {
  return {
    id: order.id,
    listingId: listing.id,
    listingTitle: listing.wasteType,
    buyerId: buyer.id,
    buyerName: buyer.name,
    farmerId: farmer.id,
    farmerName: farmer.name,
    quantity: order.quantity,
    unit: order.unit,
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    pickupDate: order.pickupDate,
    pickupTime: order.pickupTime,
    pickupAddress: order.pickupAddress,
    contactNumber: order.contactNumber,
    transportRequired: order.transportRequired,
  };
}

async function getOfferView(id: number) {
  const [row] = await db
    .select({
      offer: offersTable,
      listing: listingsTable,
      buyer: profilesTable,
    })
    .from(offersTable)
    .innerJoin(listingsTable, eq(offersTable.listingId, listingsTable.id))
    .innerJoin(profilesTable, eq(offersTable.buyerId, profilesTable.id))
    .where(eq(offersTable.id, id))
    .limit(1);
  return row;
}

// Joins the same profile table twice with explicit aliases to avoid ambiguous columns.
async function loadOrderView(id: number) {
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id))
    .limit(1);
  if (!order) return null;
  const [listing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, order.listingId))
    .limit(1);
  const [buyer] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, order.buyerId))
    .limit(1);
  const [farmer] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, order.farmerId))
    .limit(1);
  if (!listing || !buyer || !farmer) return null;
  return { order, listing, buyer, farmer };
}

router.get(
  "/offers",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const profile = await requireProfile(req, res);
    if (!profile) return;
    const rows = await db
      .select({
        offer: offersTable,
        listing: listingsTable,
        buyer: profilesTable,
      })
      .from(offersTable)
      .innerJoin(listingsTable, eq(offersTable.listingId, listingsTable.id))
      .innerJoin(profilesTable, eq(offersTable.buyerId, profilesTable.id))
      .where(or(
        eq(offersTable.buyerId, profile.id),
        eq(offersTable.farmerId, profile.id),
      ))
      .orderBy(desc(offersTable.createdAt))
      .limit(200);
    res.json(GetOffersResponse.parse(
      rows.map((row) => offerDto(row.offer, row.listing, row.buyer)),
    ));
  },
);

router.post(
  "/offers",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const buyer = await requireProfile(req, res);
    if (!buyer || !requireRole(buyer, ["industry"], res)) return;
    const body = CreateOfferBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const [listing] = await db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.id, body.data.listingId))
      .limit(1);
    if (!listing || listing.status !== "available") {
      res.status(409).json({ error: "This listing is no longer available." });
      return;
    }
    if (listing.farmerId === buyer.id) {
      res.status(400).json({ error: "You cannot make an offer on your own listing." });
      return;
    }
    if (body.data.quantity > listing.quantity) {
      res.status(400).json({ error: "The requested quantity exceeds this listing." });
      return;
    }
    const [offer] = await db
      .insert(offersTable)
      .values({
        listingId: listing.id,
        buyerId: buyer.id,
        farmerId: listing.farmerId,
        quantity: body.data.quantity,
        unit: listing.unit,
        price: body.data.price,
        pickupDate: dateValue(body.data.pickupDate) ?? null,
        message: body.data.message ?? "",
        status: "pending",
      })
      .returning();
    await notify(
      listing.farmerId,
      "New buyer offer",
      `${buyer.name} offered ₹${body.data.price.toLocaleString("en-IN")} for ${body.data.quantity} ${listing.unit} of ${listing.wasteType}.`,
      "/farmer/offers",
    );
    res.status(201).json(CreateOfferResponse.parse(
      offerDto(offer, listing, buyer),
    ));
  },
);

router.put(
  "/offers/:offerId",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const profile = await requireProfile(req, res);
    if (!profile) return;
    const params = RespondToOfferParams.safeParse({ offerId: pathId(req, "offerId") });
    const body = RespondToOfferBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const row = await getOfferView(params.data.offerId);
    if (!row) {
      res.status(404).json({ error: "Offer not found." });
      return;
    }
    const isFarmer = row.offer.farmerId === profile.id;
    const isBuyer = row.offer.buyerId === profile.id;
    if (!isFarmer && !isBuyer) {
      res.status(403).json({ error: "You are not a participant in this offer." });
      return;
    }

    if (isFarmer) {
      if (row.offer.status !== "pending") {
        res.status(409).json({ error: "This offer has already been answered." });
        return;
      }
      if (!requireRole(profile, ["farmer"], res)) return;
      if (body.data.status === "countered" && body.data.counterPrice == null) {
        res.status(400).json({ error: "Enter a counter price." });
        return;
      }
      if (!["accepted", "rejected", "countered"].includes(body.data.status)) {
        res.status(400).json({ error: "Farmers can accept, reject, or counter an offer." });
        return;
      }

      if (body.data.status === "accepted") {
        const order = await db.transaction(async (tx) => {
          const [available] = await tx
            .update(listingsTable)
            .set({ status: "reserved" })
            .where(and(
              eq(listingsTable.id, row.listing.id),
              eq(listingsTable.status, "available"),
            ))
            .returning();
          if (!available) return null;
          const [created] = await tx
            .insert(ordersTable)
            .values({
              listingId: row.listing.id,
              buyerId: row.offer.buyerId,
              farmerId: row.offer.farmerId,
              quantity: row.offer.quantity,
              unit: row.offer.unit,
              totalAmount: row.offer.quantity * row.offer.price,
              status: "confirmed",
              pickupDate: row.offer.pickupDate,
              transportRequired: true,
            })
            .returning();
          await tx
            .update(offersTable)
            .set({ status: "accepted", orderId: created.id })
            .where(eq(offersTable.id, row.offer.id));
          return created;
        });
        if (!order) {
          res.status(409).json({ error: "The listing is no longer available." });
          return;
        }
        await notify(
          row.offer.buyerId,
          "Offer accepted",
          `${profile.name} accepted your offer for ${row.listing.wasteType}.`,
          "/industry/orders",
        );
      } else {
        await db
          .update(offersTable)
          .set({
            status: body.data.status,
            counterPrice: body.data.counterPrice ?? null,
            message: body.data.message ?? row.offer.message,
          })
          .where(eq(offersTable.id, row.offer.id));
        await notify(
          row.offer.buyerId,
          body.data.status === "countered" ? "Farmer sent a counteroffer" : "Offer declined",
          body.data.status === "countered"
            ? `${profile.name} proposed ₹${body.data.counterPrice?.toLocaleString("en-IN")} for ${row.listing.wasteType}.`
            : `${profile.name} declined your offer for ${row.listing.wasteType}.`,
          "/industry/offers",
        );
      }
    } else {
      if (row.offer.status !== "countered") {
        res.status(409).json({ error: "There is no counteroffer to respond to." });
        return;
      }
      if (!requireRole(profile, ["industry"], res)) return;
      if (!["accepted", "rejected"].includes(body.data.status)) {
        res.status(400).json({ error: "You can accept or reject this counteroffer." });
        return;
      }
      if (body.data.status === "accepted") {
        const acceptedPrice = row.offer.counterPrice ?? row.offer.price;
        const order = await db.transaction(async (tx) => {
          const [available] = await tx
            .update(listingsTable)
            .set({ status: "reserved" })
            .where(and(
              eq(listingsTable.id, row.listing.id),
              eq(listingsTable.status, "available"),
            ))
            .returning();
          if (!available) return null;
          const [created] = await tx
            .insert(ordersTable)
            .values({
              listingId: row.listing.id,
              buyerId: row.offer.buyerId,
              farmerId: row.offer.farmerId,
              quantity: row.offer.quantity,
              unit: row.offer.unit,
              totalAmount: row.offer.quantity * acceptedPrice,
              status: "confirmed",
              pickupDate: row.offer.pickupDate,
              transportRequired: true,
            })
            .returning();
          await tx
            .update(offersTable)
            .set({ status: "accepted", price: acceptedPrice, orderId: created.id })
            .where(eq(offersTable.id, row.offer.id));
          return created;
        });
        if (!order) {
          res.status(409).json({ error: "The listing is no longer available." });
          return;
        }
        await notify(
          row.offer.farmerId,
          "Counteroffer accepted",
          `${profile.name} accepted your counteroffer for ${row.listing.wasteType}.`,
          "/farmer/orders",
        );
      } else {
        await db
          .update(offersTable)
          .set({ status: "rejected" })
          .where(eq(offersTable.id, row.offer.id));
        await notify(
          row.offer.farmerId,
          "Counteroffer declined",
          `${profile.name} declined your counteroffer for ${row.listing.wasteType}.`,
          "/farmer/offers",
        );
      }
    }

    const updated = await getOfferView(row.offer.id);
    if (!updated) {
      res.status(500).json({ error: "Offer was updated but could not be loaded." });
      return;
    }
    res.json(RespondToOfferResponse.parse(
      offerDto(updated.offer, updated.listing, updated.buyer),
    ));
  },
);

router.get(
  "/orders",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const profile = await requireProfile(req, res);
    if (!profile) return;
    const orders = await db
      .select()
      .from(ordersTable)
      .where(or(
        eq(ordersTable.buyerId, profile.id),
        eq(ordersTable.farmerId, profile.id),
      ))
      .orderBy(desc(ordersTable.createdAt))
      .limit(200);
    const rows = await Promise.all(orders.map((order) => loadOrderView(order.id)));
    res.json(GetOrdersResponse.parse(
      rows.filter((row): row is NonNullable<typeof row> => Boolean(row))
        .map((row) => orderDto(row.order, row.listing, row.buyer, row.farmer)),
    ));
  },
);

router.post(
  "/orders",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const buyer = await requireProfile(req, res);
    if (!buyer || !requireRole(buyer, ["industry"], res)) return;
    const body = CreateOrderBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const [listing] = await db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.id, body.data.listingId))
      .limit(1);
    if (!listing || listing.status !== "available") {
      res.status(409).json({ error: "This listing is no longer available." });
      return;
    }
    if (listing.farmerId === buyer.id) {
      res.status(400).json({ error: "You cannot order your own listing." });
      return;
    }
    if (body.data.quantity > listing.quantity) {
      res.status(400).json({ error: "The requested quantity exceeds this listing." });
      return;
    }
    const created = await db.transaction(async (tx) => {
      const [available] = await tx
        .update(listingsTable)
        .set({ status: "reserved" })
        .where(and(
          eq(listingsTable.id, listing.id),
          eq(listingsTable.status, "available"),
        ))
        .returning();
      if (!available) return null;
      const [order] = await tx
        .insert(ordersTable)
        .values({
          listingId: listing.id,
          buyerId: buyer.id,
          farmerId: listing.farmerId,
          quantity: body.data.quantity,
          unit: listing.unit,
          totalAmount: body.data.quantity * listing.price,
          status: "pending",
          pickupDate: dateValue(body.data.pickupDate) ?? null,
          transportRequired: true,
        })
        .returning();
      return order;
    });
    if (!created) {
      res.status(409).json({ error: "This listing has already been reserved." });
      return;
    }
    await notify(
      listing.farmerId,
      "New purchase request",
      `${buyer.name} requested ${body.data.quantity} ${listing.unit} of ${listing.wasteType}.`,
      "/farmer/orders",
    );
    const view = await loadOrderView(created.id);
    if (!view) {
      res.status(500).json({ error: "Purchase request could not be loaded." });
      return;
    }
    res.status(201).json(CreateOrderResponse.parse(
      orderDto(view.order, view.listing, view.buyer, view.farmer),
    ));
  },
);

router.get(
  "/orders/:orderId",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const profile = await requireProfile(req, res);
    if (!profile) return;
    const params = GetOrderParams.safeParse({ orderId: pathId(req, "orderId") });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const view = await loadOrderView(params.data.orderId);
    if (!view) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    if (![view.order.buyerId, view.order.farmerId].includes(profile.id) && profile.role !== "admin") {
      res.status(403).json({ error: "You cannot view this order." });
      return;
    }
    res.json(GetOrderResponse.parse(
      orderDto(view.order, view.listing, view.buyer, view.farmer),
    ));
  },
);

router.put(
  "/orders/:orderId",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const profile = await requireProfile(req, res);
    if (!profile) return;
    const params = UpdateOrderParams.safeParse({ orderId: pathId(req, "orderId") });
    const body = UpdateOrderBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const existing = await loadOrderView(params.data.orderId);
    if (!existing) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    const isFarmer = existing.order.farmerId === profile.id;
    const isBuyer = existing.order.buyerId === profile.id;
    if (!isFarmer && !isBuyer) {
      res.status(403).json({ error: "You are not a participant in this order." });
      return;
    }
    const nextStatus = body.data.status;
    if (nextStatus && nextStatus !== existing.order.status) {
      const transitionMap: Record<string, string[]> = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["pickup_scheduled", "cancelled"],
        pickup_scheduled: ["picked_up", "cancelled"],
        picked_up: ["completed"],
        completed: [],
        cancelled: [],
      };
      if (!transitionMap[existing.order.status]?.includes(nextStatus)) {
        res.status(409).json({ error: "This order cannot move to that status." });
        return;
      }
      if (nextStatus === "confirmed" && !isFarmer) {
        res.status(403).json({ error: "Only the farmer can confirm a purchase request." });
        return;
      }
      if (nextStatus === "pickup_scheduled" && !isFarmer) {
        res.status(403).json({ error: "Only the farmer can schedule pickup." });
        return;
      }
      if (nextStatus === "picked_up" && !isBuyer) {
        res.status(403).json({ error: "Only the buyer can confirm collection." });
        return;
      }
      if (nextStatus === "completed" && !isFarmer) {
        res.status(403).json({ error: "Only the farmer can complete this order." });
        return;
      }
      if (nextStatus === "pickup_scheduled" && !body.data.pickupDate && !existing.order.pickupDate) {
        res.status(400).json({ error: "Choose a pickup date before scheduling." });
        return;
      }
    }
    const updated = await db.transaction(async (tx) => {
      const values = {
        ...(body.data.status ? { status: body.data.status } : {}),
        ...(body.data.pickupDate !== undefined ? { pickupDate: dateValue(body.data.pickupDate) } : {}),
        ...(body.data.pickupTime !== undefined ? { pickupTime: body.data.pickupTime } : {}),
        ...(body.data.pickupAddress !== undefined ? { pickupAddress: body.data.pickupAddress } : {}),
        ...(body.data.contactNumber !== undefined ? { contactNumber: body.data.contactNumber } : {}),
        ...(body.data.transportRequired !== undefined ? { transportRequired: body.data.transportRequired } : {}),
      };
      const [order] = await tx
        .update(ordersTable)
        .set(values)
        .where(eq(ordersTable.id, existing.order.id))
        .returning();
      if (nextStatus === "cancelled") {
        await tx
          .update(listingsTable)
          .set({ status: "available" })
          .where(and(
            eq(listingsTable.id, existing.listing.id),
            eq(listingsTable.status, "reserved"),
          ));
      }
      if (nextStatus === "completed") {
        const remaining = Math.max(0, existing.listing.quantity - existing.order.quantity);
        await tx
          .update(listingsTable)
          .set({
            quantity: remaining,
            status: remaining <= 0 ? "sold" : "available",
          })
          .where(eq(listingsTable.id, existing.listing.id));
      }
      return order;
    });
    const recipient = isFarmer ? existing.order.buyerId : existing.order.farmerId;
    const recipientRole = isFarmer ? "industry" : "farmer";
    const statusMessage = nextStatus
      ? `Order #${updated.id} is now ${nextStatus.replaceAll("_", " ")}.`
      : `Order #${updated.id} pickup details were updated.`;
    await notify(recipient, "Order updated", statusMessage, notificationHref(recipientRole));
    const view = await loadOrderView(updated.id);
    if (!view) {
      res.status(500).json({ error: "Order was updated but could not be loaded." });
      return;
    }
    res.json(UpdateOrderResponse.parse(
      orderDto(view.order, view.listing, view.buyer, view.farmer),
    ));
  },
);

router.get(
  "/dashboard",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const profile = await requireProfile(req, res);
    if (!profile) return;
    const [listings, offers, orders, notifications, reviews] = await Promise.all([
      db.select().from(listingsTable).where(eq(listingsTable.farmerId, profile.id)),
      db.select().from(offersTable).where(or(
        eq(offersTable.buyerId, profile.id),
        eq(offersTable.farmerId, profile.id),
      )),
      db.select().from(ordersTable).where(or(
        eq(ordersTable.buyerId, profile.id),
        eq(ordersTable.farmerId, profile.id),
      )),
      db.select().from(notificationsTable).where(eq(notificationsTable.userId, profile.id)),
      db.select().from(reviewsTable).where(eq(reviewsTable.toProfileId, profile.id)),
    ]);
    const relevantOrders = profile.role === "farmer"
      ? orders.filter((order) => order.farmerId === profile.id)
      : orders.filter((order) => order.buyerId === profile.id);
    const completed = relevantOrders.filter((order) => order.status === "completed");
    const volumeKg = (order: Order) => order.quantity * (
      order.unit === "ton" ? 1000 : order.unit === "quintal" ? 100 : 1
    );
    const totalAmount = completed.reduce((sum, order) => sum + order.totalAmount, 0);
    const monthly = Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date();
      monthDate.setDate(1);
      monthDate.setMonth(monthDate.getMonth() - (5 - index));
      const monthOrders = completed.filter((order) =>
        order.createdAt.getFullYear() === monthDate.getFullYear() &&
        order.createdAt.getMonth() === monthDate.getMonth(),
      );
      return {
        label: monthDate.toLocaleString("en", { month: "short" }),
        value: monthOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      };
    });
    const completedListingIds = [...new Set(completed.map((order) => order.listingId))];
    const completedListings = completedListingIds.length
      ? await db.select().from(listingsTable).where(inArray(listingsTable.id, completedListingIds))
      : [];
    const breakdownMap = new Map<string, number>();
    for (const listing of completedListings) {
      const totalForType = completed
        .filter((order) => order.listingId === listing.id)
        .reduce((sum, order) => sum + volumeKg(order), 0);
      breakdownMap.set(listing.wasteType, (breakdownMap.get(listing.wasteType) ?? 0) + totalForType);
    }
    const recentOffers = offers.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 4);
    const recentOrders = relevantOrders.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 4);
    const activity = [
      ...recentOffers.map((offer) => ({
        id: `offer-${offer.id}`,
        title: offer.status === "accepted" ? "Offer accepted" : "Offer activity",
        detail: `Offer #${offer.id} for ${offer.quantity} ${offer.unit}`,
        createdAt: offer.createdAt.toISOString(),
        href: profile.role === "farmer" ? "/farmer/offers" : "/industry/offers",
      })),
      ...recentOrders.map((order) => ({
        id: `order-${order.id}`,
        title: order.status === "completed" ? "Deal completed" : "Order update",
        detail: `Order #${order.id} · ₹${order.totalAmount.toLocaleString("en-IN")}`,
        createdAt: order.createdAt.toISOString(),
        href: profile.role === "farmer" ? "/farmer/orders" : "/industry/orders",
      })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
    const pendingOffers = offers.filter((offer) =>
      ["pending", "countered"].includes(offer.status),
    ).length;
    res.json(GetDashboardResponse.parse({
      role: profile.role,
      activeListings: listings.filter((listing) => listing.status === "available").length,
      totalOffers: offers.length,
      completedOrders: completed.length,
      totalEarnings: profile.role === "farmer" ? totalAmount : 0,
      pendingOffers,
      activeOrders: relevantOrders.filter((order) => activeOrderStatuses.includes(order.status)).length,
      totalQuantity: completed.reduce((sum, order) => sum + order.quantity, 0),
      totalSpent: profile.role === "industry" ? totalAmount : 0,
      wasteReusedKg: completed.reduce((sum, order) => sum + volumeKg(order), 0),
      unreadNotifications: notifications.filter((notification) => !notification.read).length,
      monthly,
      breakdown: [...breakdownMap].map(([label, value]) => ({ label, value })),
      activity,
    }));
  },
);

export default router;
