/**
 * auth.ts — Drop-in helper that replaces Supabase auth calls.
 * Usage:
 *   const userId = await getAuthUserId()   // throws 401-style error if not signed in
 *   const user   = await requireUser()     // returns full DB user row, upserts on first call
 */
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export class AuthError extends Error {
  status = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

/** Returns the raw Clerk userId or throws AuthError */
export async function getAuthUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new AuthError();
  return userId;
}

/** Upserts the Clerk user into the Turso `users` table, returns the row */
export async function requireUser() {
  const userId = await getAuthUserId();

  const clerkUser = await currentUser();
  if (!clerkUser) throw new AuthError();

  const email =
    clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name =
    clerkUser.fullName ||
    clerkUser.username ||
    email.split("@")[0] ||
    "User";
  const avatarUrl = clerkUser.imageUrl ?? null;

  // Upsert: insert if new, update metadata on every call
  await db
    .insert(users)
    .values({
      id: userId,
      email,
      name,
      avatarUrl,
      isActive: true,
      isVerified: Boolean(clerkUser.emailAddresses[0]?.verification?.status === "verified"),
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email,
        name,
        avatarUrl,
        updatedAt: new Date().toISOString(),
      },
    });

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user;
}
