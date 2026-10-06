import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db, profilesTable, type Profile } from "@workspace/db";

export function requireClerkUser(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }

  res.locals.clerkUserId = userId;
  next();
}

export function getClerkUserId(req: Request): string | null {
  return getAuth(req).userId ?? null;
}

export async function findCurrentProfile(req: Request): Promise<Profile | null> {
  const userId = getClerkUserId(req);
  if (!userId) return null;

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, userId))
    .limit(1);

  return profile ?? null;
}

export async function requireProfile(
  req: Request,
  res: Response,
): Promise<Profile | null> {
  const userId = getClerkUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to continue." });
    return null;
  }

  const profile = await findCurrentProfile(req);
  if (!profile) {
    res.status(409).json({ error: "Complete your profile before continuing." });
    return null;
  }

  return profile;
}

export function requireRole(
  profile: Profile,
  allowed: Array<"farmer" | "industry" | "admin">,
  res: Response,
): boolean {
  if (allowed.includes(profile.role as "farmer" | "industry" | "admin")) {
    return true;
  }

  res.status(403).json({ error: "Your account cannot perform this action." });
  return false;
}

export function requireAdmin(profile: Profile, res: Response): boolean {
  if (profile.role === "admin") return true;
  res.status(403).json({ error: "Administrator access is required." });
  return false;
}
