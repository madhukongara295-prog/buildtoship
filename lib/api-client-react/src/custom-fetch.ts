import {
  getActiveUser,
  setActiveUser,
  getMockListings,
  saveMockListings,
  getMockFavorites,
  saveMockFavorites,
  getMockOffers,
  saveMockOffers,
  getMockOrders,
  saveMockOrders,
  getMockNotifications,
  saveMockNotifications,
  INITIAL_BUYERS,
  INITIAL_DEMAND,
  SEED_USERS,
} from './mock-db';

export function handleMockApi<T = unknown>(
  pathname: string,
  method: string,
  searchParams: URLSearchParams,
  bodyData?: unknown,
): T {
  const currentUser = getActiveUser();

  // 1. Listings
  if (pathname === '/api/listings' && method === 'GET') {
    let all = [...getMockListings()];
    const search = searchParams.get('search')?.toLowerCase();
    const city = searchParams.get('city')?.toLowerCase();
    const wasteType = searchParams.get('wasteType')?.toLowerCase();
    const mine = searchParams.get('mine');
    const sort = searchParams.get('sort') || 'recent';

    if (search) {
      all = all.filter(l =>
        l.wasteType.toLowerCase().includes(search) ||
        l.city.toLowerCase().includes(search) ||
        l.state.toLowerCase().includes(search) ||
        l.location.toLowerCase().includes(search) ||
        l.description.toLowerCase().includes(search)
      );
    }
    if (city) {
      all = all.filter(l => l.city.toLowerCase().includes(city));
    }
    if (wasteType) {
      all = all.filter(l => l.wasteType.toLowerCase() === wasteType);
    }
    if (mine === 'true') {
      all = all.filter(l => l.farmerId === currentUser.id);
    }

    if (sort === 'price') {
      all.sort((a, b) => a.price - b.price);
    } else if (sort === 'quantity') {
      all.sort((a, b) => b.quantity - a.quantity);
    } else {
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return all as unknown as T;
  }

  // Single listing: /api/listings/:id
  const singleListingMatch = pathname.match(/^\/api\/listings\/(\d+)$/);
  if (singleListingMatch) {
    const id = Number(singleListingMatch[1]);
    const all = [...getMockListings()];
    if (method === 'GET') {
      const found = all.find(l => l.id === id);
      return (found || all[0]) as unknown as T;
    }
    if (method === 'PUT' || method === 'PATCH') {
      const parsedBody = typeof bodyData === 'string' ? JSON.parse(bodyData) : (bodyData || {});
      const index = all.findIndex(l => l.id === id);
      if (index >= 0) {
        all[index] = { ...all[index], ...parsedBody };
        saveMockListings(all);
        return all[index] as unknown as T;
      }
      return { success: true } as unknown as T;
    }
    if (method === 'DELETE') {
      const filtered = all.filter(l => l.id !== id);
      saveMockListings(filtered);
      return { success: true } as unknown as T;
    }
  }

  // Create Listing: POST /api/listings
  if (pathname === '/api/listings' && method === 'POST') {
    const parsed = typeof bodyData === 'string' ? JSON.parse(bodyData) : (bodyData || {});
    const all = [...getMockListings()];
    const newListing = {
      id: Date.now(),
      farmerId: currentUser.id,
      farmerName: currentUser.name,
      farmerVerified: currentUser.verified,
      wasteType: parsed.wasteType || 'Rice Straw',
      quantity: Number(parsed.quantity) || 10,
      unit: (parsed.unit || 'ton') as 'ton' | 'kg' | 'quintal',
      price: Number(parsed.price) || 2500,
      location: parsed.location || `${currentUser.city} Agro Yard`,
      city: parsed.city || currentUser.city,
      state: parsed.state || currentUser.state,
      availableDate: parsed.availableDate || new Date().toISOString().split('T')[0],
      description: parsed.description || '',
      imageUrl: parsed.imageUrl || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
      aiConfidence: parsed.aiConfidence || 0.95,
      status: 'available' as const,
      uses: parsed.uses || ['Biomass Pellet Fuel', 'Paper & Pulp'],
      distanceKm: 12.0,
      createdAt: new Date().toISOString(),
    };
    all.unshift(newListing);
    saveMockListings(all);
    return newListing as unknown as T;
  }

  // 2. Favorites: /api/favorites
  if (pathname === '/api/favorites' && method === 'GET') {
    const favIds = new Set(getMockFavorites());
    const all = getMockListings();
    return all.filter(l => favIds.has(l.id)) as unknown as T;
  }
  if (pathname === '/api/favorites' && method === 'POST') {
    const parsed = typeof bodyData === 'string' ? JSON.parse(bodyData) : (bodyData || {});
    const favIds = [...getMockFavorites()];
    const id = Number(parsed.listingId);
    if (!favIds.includes(id)) {
      favIds.push(id);
      saveMockFavorites(favIds);
    }
    return { success: true } as unknown as T;
  }
  const favRemoveMatch = pathname.match(/^\/api\/favorites\/(\d+)$/);
  if (favRemoveMatch && method === 'DELETE') {
    const id = Number(favRemoveMatch[1]);
    const favIds = getMockFavorites().filter(item => item !== id);
    saveMockFavorites(favIds);
    return { success: true } as unknown as T;
  }

  // 3. Profiles: /api/profiles/me
  if (pathname === '/api/profiles/me') {
    if (method === 'GET') {
      return currentUser as unknown as T;
    }
    if (method === 'POST' || method === 'PUT') {
      const parsed = typeof bodyData === 'string' ? JSON.parse(bodyData) : (bodyData || {});
      const updated = { ...currentUser, ...parsed };
      setActiveUser(updated);
      return updated as unknown as T;
    }
  }

  // Public profiles: /api/profiles/:id
  const publicProfileMatch = pathname.match(/^\/api\/profiles\/(\d+)$/);
  if (publicProfileMatch && method === 'GET') {
    const id = Number(publicProfileMatch[1]);
    const found = SEED_USERS.find(u => u.id === id) || currentUser;
    return found as unknown as T;
  }
  if (pathname.includes('/reviews') && method === 'GET') {
    return [
      { id: 1, fromName: 'Green BioEnergy Pvt Ltd', rating: 5, comment: 'Prompt delivery, perfect moisture grade and fair price!', createdAt: '2026-10-01T00:00:00Z' },
      { id: 2, fromName: 'Deccan Biochar Corporation', rating: 5, comment: 'Clean groundnut shells with high carbon yield.', createdAt: '2026-09-28T00:00:00Z' }
    ] as unknown as T;
  }

  // 4. Health: /api/health
  if (pathname === '/api/health') {
    return {
      status: 'ok',
      service: 'AgriCycle Marketplace API',
      aiMode: 'demo_fallback_active',
      timestamp: new Date().toISOString()
    } as unknown as T;
  }

  // 5. Dashboard: /api/dashboard
  if (pathname === '/api/dashboard') {
    const listings = getMockListings();
    const offers = getMockOffers();
    const orders = getMockOrders();
    const notifs = getMockNotifications();

    const activeListings = listings.filter(l => l.status === 'available').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const activeOrders = orders.filter(o => o.status !== 'completed').length;
    const totalEarnings = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const totalQuantity = orders.reduce((acc, o) => acc + (o.quantity || 0), 0);

    return {
      role: currentUser.role,
      activeListings,
      totalOffers: offers.length,
      pendingOffers: offers.filter(o => o.status === 'pending').length,
      completedOrders,
      activeOrders,
      totalEarnings,
      totalQuantity,
      totalSpent: totalEarnings,
      wasteReusedKg: (totalQuantity * 1000) || 28400,
      unreadNotifications: notifs.filter(n => !n.read).length,
      monthly: [
        { label: 'Jul', value: 12000 },
        { label: 'Aug', value: 24500 },
        { label: 'Sep', value: 38000 },
        { label: 'Oct', value: totalEarnings || 42000 }
      ],
      breakdown: [
        { label: 'Rice Husk', value: 45 },
        { label: 'Groundnut Shells', value: 30 },
        { label: 'Rice Straw', value: 25 }
      ],
      activity: [
        { id: '1', title: 'Offer received from Green BioEnergy', detail: '10 tons Rice Husk requested at ₹3,100/ton', createdAt: '2026-10-07T08:00:00Z' },
        { id: '2', title: 'Pickup scheduled by Deccan Biochar', detail: '8 tons Groundnut Shells on Oct 14', createdAt: '2026-10-06T12:00:00Z' },
        { id: '3', title: 'Cycle Completed: 12 tons Rice Straw', detail: 'Payment ₹25,800 received directly to bank', createdAt: '2026-09-22T14:00:00Z' }
      ]
    } as unknown as T;
  }

  // 6. Offers: /api/offers
  if (pathname === '/api/offers' && method === 'GET') {
    return getMockOffers() as unknown as T;
  }
  if (pathname === '/api/offers' && method === 'POST') {
    const parsed = typeof bodyData === 'string' ? JSON.parse(bodyData) : (bodyData || {});
    const offers = [...getMockOffers()];
    const listings = getMockListings();
    const matchedListing = listings.find(l => l.id === Number(parsed.listingId));
    const newOffer = {
      id: Date.now(),
      listingId: Number(parsed.listingId),
      listingTitle: matchedListing?.wasteType || 'Residue Listing',
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      farmerId: matchedListing?.farmerId || 1,
      quantity: Number(parsed.quantity) || 5,
      unit: (matchedListing?.unit || 'ton') as 'ton' | 'kg' | 'quintal',
      price: Number(parsed.price) || (matchedListing?.price || 3000),
      status: 'pending' as const,
      message: parsed.message || 'Offer submitted via marketplace.',
      pickupDate: parsed.pickupDate || new Date().toISOString().split('T')[0],
      counterPrice: null,
      orderId: null,
      createdAt: new Date().toISOString()
    };
    offers.unshift(newOffer);
    saveMockOffers(offers);
    return newOffer as unknown as T;
  }
  const offerUpdateMatch = pathname.match(/^\/api\/offers\/(\d+)$/);
  if (offerUpdateMatch && (method === 'PUT' || method === 'PATCH')) {
    const id = Number(offerUpdateMatch[1]);
    const parsed = typeof bodyData === 'string' ? JSON.parse(bodyData) : (bodyData || {});
    const offers = [...getMockOffers()];
    const index = offers.findIndex(o => o.id === id);
    if (index >= 0) {
      offers[index] = { ...offers[index], ...parsed };
      saveMockOffers(offers);

      // If accepted, also create an order!
      if (parsed.status === 'accepted') {
        const orders = [...getMockOrders()];
        const newOrder = {
          id: Date.now(),
          listingId: offers[index].listingId,
          listingTitle: offers[index].listingTitle,
          buyerId: offers[index].buyerId,
          buyerName: offers[index].buyerName,
          farmerId: offers[index].farmerId,
          farmerName: currentUser.name,
          quantity: offers[index].quantity,
          unit: offers[index].unit,
          totalAmount: offers[index].quantity * offers[index].price,
          status: 'confirmed' as const,
          createdAt: new Date().toISOString(),
          pickupDate: offers[index].pickupDate,
          pickupTime: '11:00 AM',
          pickupAddress: `${currentUser.city} Farm Gate`,
          contactNumber: currentUser.phone || '+91 98480 12345',
          transportRequired: true
        };
        orders.unshift(newOrder);
        saveMockOrders(orders);
      }
      return offers[index] as unknown as T;
    }
    return { success: true } as unknown as T;
  }

  // 7. Orders: /api/orders
  if (pathname === '/api/orders' && method === 'GET') {
    return getMockOrders() as unknown as T;
  }
  const singleOrderMatch = pathname.match(/^\/api\/orders\/(\d+)$/);
  if (singleOrderMatch) {
    const id = Number(singleOrderMatch[1]);
    const orders = [...getMockOrders()];
    if (method === 'GET') {
      const found = orders.find(o => o.id === id);
      return (found || orders[0]) as unknown as T;
    }
    if (method === 'PUT' || method === 'PATCH') {
      const parsed = typeof bodyData === 'string' ? JSON.parse(bodyData) : (bodyData || {});
      const index = orders.findIndex(o => o.id === id);
      if (index >= 0) {
        orders[index] = { ...orders[index], ...parsed };
        saveMockOrders(orders);
        return orders[index] as unknown as T;
      }
      return { success: true } as unknown as T;
    }
  }
  if (pathname === '/api/orders' && method === 'POST') {
    const parsed = typeof bodyData === 'string' ? JSON.parse(bodyData) : (bodyData || {});
    const orders = [...getMockOrders()];
    const listings = getMockListings();
    const matched = listings.find(l => l.id === Number(parsed.listingId));
    const newOrder = {
      id: Date.now(),
      listingId: Number(parsed.listingId),
      listingTitle: matched?.wasteType || 'Residue Listing',
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      farmerId: matched?.farmerId || 1,
      farmerName: matched?.farmerName || 'Ramesh Patel',
      quantity: Number(parsed.quantity) || (matched?.quantity || 10),
      unit: (matched?.unit || 'ton') as 'ton' | 'kg' | 'quintal',
      totalAmount: (Number(parsed.quantity) || 10) * (matched?.price || 2500),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      pickupDate: parsed.pickupDate || new Date().toISOString().split('T')[0],
      pickupTime: '10:00 AM',
      pickupAddress: matched?.location || `${currentUser.city} Farm Gate`,
      contactNumber: currentUser.phone || '+91 98480 12345',
      transportRequired: true
    };
    orders.unshift(newOrder);
    saveMockOrders(orders);
    return newOrder as unknown as T;
  }

  // 8. Buyers: /api/nearby-buyers
  if (pathname === '/api/nearby-buyers') {
    return INITIAL_BUYERS as unknown as T;
  }

  // 9. Market demand: /api/market-demand
  if (pathname === '/api/market-demand') {
    return INITIAL_DEMAND as unknown as T;
  }

  // 10. Notifications: /api/notifications
  if (pathname === '/api/notifications' && method === 'GET') {
    return getMockNotifications() as unknown as T;
  }
  if (pathname.includes('/notifications') && (method === 'PUT' || method === 'POST' || method === 'PATCH')) {
    const notifs = getMockNotifications();
    const updated = notifs.map(n => ({ ...n, read: true }));
    saveMockNotifications(updated);
    return { success: true } as unknown as T;
  }

  // 11. Admin Statistics: /api/admin/statistics
  if (pathname === '/api/admin/statistics') {
    const listings = getMockListings();
    const orders = getMockOrders();
    return {
      totalUsers: 18,
      farmers: 12,
      industries: 6,
      listings: listings.length,
      orders: orders.length,
      wasteReusedKg: 48500,
      transactions: 28,
      recentUsers: SEED_USERS
    } as unknown as T;
  }

  // 12. Admin Users: /api/admin/users
  if (pathname === '/api/admin/users') {
    return SEED_USERS as unknown as T;
  }
  if (pathname.includes('/verify')) {
    return { success: true } as unknown as T;
  }

  // 13. AI Scanner & Price estimation
  if (pathname === '/api/ai/classify') {
    return {
      wasteType: 'Rice Straw',
      confidence: 0.96,
      description: 'Post-harvest paddy straw, golden baled and dry. High cellulose yield.',
      possibleUses: ['Paper & Pulp', 'Mushroom Cultivation', 'Ethanol Production', 'Power Generation'],
      alternatives: ['Rice Husk', 'Wheat Straw'],
      mode: 'demo'
    } as unknown as T;
  }

  if (pathname === '/api/ai/price-estimate') {
    return {
      suggestedPrice: 2400,
      minPrice: 1800,
      maxPrice: 2800,
      unit: 'ton',
      explanation: 'Optimal Mandi benchmark for Andhra Pradesh and Telangana biomass processors.',
      mode: 'demo'
    } as unknown as T;
  }

  // 14. Storage upload
  if (pathname.includes('/storage')) {
    return {
      uploadURL: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
      objectPath: '/mock_photo.jpg'
    } as unknown as T;
  }

  return [] as unknown as T;
}

export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;

export type BodyType<T> = T;

export type AuthTokenGetter = () => Promise<string | null> | string | null;

const NO_BODY_STATUS = new Set([204, 205, 304]);
const DEFAULT_JSON_ACCEPT = "application/json, application/problem+json";

// ---------------------------------------------------------------------------
// Module-level configuration
// ---------------------------------------------------------------------------

let _baseUrl: string | null = null;
let _authTokenGetter: AuthTokenGetter | null = null;

/**
 * Set a base URL that is prepended to every relative request URL
 * (i.e. paths that start with `/`).
 *
 * Useful for Expo bundles that need to call a remote API server.
 * Pass `null` to clear the base URL.
 */
export function setBaseUrl(url: string | null): void {
  _baseUrl = url ? url.replace(/\/+$/, "") : null;
}

/**
 * Register a getter that supplies a bearer auth token.  Before every fetch
 * the getter is invoked; when it returns a non-null string, an
 * `Authorization: Bearer <token>` header is attached to the request.
 *
 * Useful for Expo bundles making token-gated API calls.
 * Pass `null` to clear the getter.
 *
 * NOTE: This function should never be used in web applications where session
 * token cookies are automatically associated with API calls by the browser.
 */
export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  _authTokenGetter = getter;
}

function isRequest(input: RequestInfo | URL): input is Request {
  return typeof Request !== "undefined" && input instanceof Request;
}

function resolveMethod(input: RequestInfo | URL, explicitMethod?: string): string {
  if (explicitMethod) return explicitMethod.toUpperCase();
  if (isRequest(input)) return input.method.toUpperCase();
  return "GET";
}

// Use loose check for URL — some runtimes (e.g. React Native) polyfill URL
// differently, so `instanceof URL` can fail.
function isUrl(input: RequestInfo | URL): input is URL {
  return typeof URL !== "undefined" && input instanceof URL;
}

function applyBaseUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (!_baseUrl) return input;
  const url = resolveUrl(input);
  // Only prepend to relative paths (starting with /)
  if (!url.startsWith("/")) return input;

  const absolute = `${_baseUrl}${url}`;
  if (typeof input === "string") return absolute;
  if (isUrl(input)) return new URL(absolute);
  return new Request(absolute, input as Request);
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (isUrl(input)) return input.toString();
  return input.url;
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>): Headers {
  const headers = new Headers();

  for (const source of sources) {
    if (!source) continue;
    new Headers(source).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

function getMediaType(headers: Headers): string | null {
  const value = headers.get("content-type");
  return value ? value.split(";", 1)[0].trim().toLowerCase() : null;
}

function isJsonMediaType(mediaType: string | null): boolean {
  return mediaType === "application/json" || Boolean(mediaType?.endsWith("+json"));
}

function isTextMediaType(mediaType: string | null): boolean {
  return Boolean(
    mediaType &&
      (mediaType.startsWith("text/") ||
        mediaType === "application/xml" ||
        mediaType === "text/xml" ||
        mediaType.endsWith("+xml") ||
        mediaType === "application/x-www-form-urlencoded"),
  );
}

// Use strict equality: in browsers, `response.body` is `null` when the
// response genuinely has no content.  In React Native, `response.body` is
// always `undefined` because the ReadableStream API is not implemented —
// even when the response carries a full payload readable via `.text()` or
// `.json()`.  Loose equality (`== null`) matches both `null` and `undefined`,
// which causes every React Native response to be treated as empty.
function hasNoBody(response: Response, method: string): boolean {
  if (method === "HEAD") return true;
  if (NO_BODY_STATUS.has(response.status)) return true;
  if (response.headers.get("content-length") === "0") return true;
  if (response.body === null) return true;
  return false;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function getStringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const candidate = (value as Record<string, unknown>)[key];
  if (typeof candidate !== "string") return undefined;

  const trimmed = candidate.trim();
  return trimmed === "" ? undefined : trimmed;
}

function truncate(text: string, maxLength = 300): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function buildErrorMessage(response: Response, data: unknown): string {
  const prefix = `HTTP ${response.status} ${response.statusText}`;

  if (typeof data === "string") {
    const text = data.trim();
    return text ? `${prefix}: ${truncate(text)}` : prefix;
  }

  const title = getStringField(data, "title");
  const detail = getStringField(data, "detail");
  const message =
    getStringField(data, "message") ??
    getStringField(data, "error_description") ??
    getStringField(data, "error");

  if (title && detail) return `${prefix}: ${title} — ${detail}`;
  if (detail) return `${prefix}: ${detail}`;
  if (message) return `${prefix}: ${message}`;
  if (title) return `${prefix}: ${title}`;

  return prefix;
}

export class ApiError<T = unknown> extends Error {
  readonly name = "ApiError";
  readonly status: number;
  readonly statusText: string;
  readonly data: T | null;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;

  constructor(
    response: Response,
    data: T | null,
    requestInfo: { method: string; url: string },
  ) {
    super(buildErrorMessage(response, data));
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.data = data;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
  }
}

export class ResponseParseError extends Error {
  readonly name = "ResponseParseError";
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;
  readonly rawBody: string;
  readonly cause: unknown;

  constructor(
    response: Response,
    rawBody: string,
    cause: unknown,
    requestInfo: { method: string; url: string },
  ) {
    super(
      `Failed to parse response from ${requestInfo.method} ${response.url || requestInfo.url} ` +
        `(${response.status} ${response.statusText}) as JSON`,
    );
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
    this.rawBody = rawBody;
    this.cause = cause;
  }
}

async function parseJsonBody(
  response: Response,
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  const raw = await response.text();
  const normalized = stripBom(raw);

  if (normalized.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(normalized);
  } catch (cause) {
    throw new ResponseParseError(response, raw, cause, requestInfo);
  }
}

async function parseErrorBody(response: Response, method: string): Promise<unknown> {
  if (hasNoBody(response, method)) {
    return null;
  }

  const mediaType = getMediaType(response.headers);

  // Fall back to text when blob() is unavailable (e.g. some React Native builds).
  if (mediaType && !isJsonMediaType(mediaType) && !isTextMediaType(mediaType)) {
    return typeof response.blob === "function" ? response.blob() : response.text();
  }

  const raw = await response.text();
  const normalized = stripBom(raw);
  const trimmed = normalized.trim();

  if (trimmed === "") {
    return null;
  }

  if (isJsonMediaType(mediaType) || looksLikeJson(normalized)) {
    try {
      return JSON.parse(normalized);
    } catch {
      return raw;
    }
  }

  return raw;
}

function inferResponseType(response: Response): "json" | "text" | "blob" {
  const mediaType = getMediaType(response.headers);

  if (isJsonMediaType(mediaType)) return "json";
  if (isTextMediaType(mediaType) || mediaType == null) return "text";
  return "blob";
}

async function parseSuccessBody(
  response: Response,
  responseType: "json" | "text" | "blob" | "auto",
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  if (hasNoBody(response, requestInfo.method)) {
    return null;
  }

  const effectiveType =
    responseType === "auto" ? inferResponseType(response) : responseType;

  switch (effectiveType) {
    case "json":
      return parseJsonBody(response, requestInfo);

    case "text": {
      const text = await response.text();
      return text === "" ? null : text;
    }

    case "blob":
      if (typeof response.blob !== "function") {
        throw new TypeError(
          "Blob responses are not supported in this runtime. " +
            "Use responseType \"json\" or \"text\" instead.",
        );
      }
      return response.blob();
  }
}

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {},
): Promise<T> {
  const rawUrl = resolveUrl(input);

  // Directly intercept any internal API call for zero-backend static deployments
  if (rawUrl.startsWith("/api/") || rawUrl.includes("/api/")) {
    const urlObj = new URL(rawUrl, "http://localhost");
    const method = resolveMethod(input, options.method);
    return handleMockApi<T>(urlObj.pathname, method, urlObj.searchParams, options.body);
  }

  input = applyBaseUrl(input);
  const { responseType = "auto", headers: headersInit, ...init } = options;

  const method = resolveMethod(input, init.method);

  if (init.body != null && (method === "GET" || method === "HEAD")) {
    throw new TypeError(`customFetch: ${method} requests cannot have a body.`);
  }

  const headers = mergeHeaders(isRequest(input) ? input.headers : undefined, headersInit);

  if (
    typeof init.body === "string" &&
    !headers.has("content-type") &&
    looksLikeJson(init.body)
  ) {
    headers.set("content-type", "application/json");
  }

  if (responseType === "json" && !headers.has("accept")) {
    headers.set("accept", DEFAULT_JSON_ACCEPT);
  }

  // Attach bearer token when an auth getter is configured and no
  // Authorization header has been explicitly provided.
  if (_authTokenGetter && !headers.has("authorization")) {
    const token = await _authTokenGetter();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  const requestInfo = { method, url: resolveUrl(input) };

  const response = await fetch(input, { ...init, method, headers });

  if (!response.ok) {
    const errorData = await parseErrorBody(response, method);
    throw new ApiError(response, errorData, requestInfo);
  }

  return (await parseSuccessBody(response, responseType, requestInfo)) as T;
}
