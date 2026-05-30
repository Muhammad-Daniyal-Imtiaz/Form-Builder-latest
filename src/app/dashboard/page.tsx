import { db } from '@/db'
import { forms, users, submissions } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/login')

  const claims = sessionClaims as any
  let email = claims?.email || claims?.primary_email_address || ''
  let name = claims?.full_name || claims?.name || ''
  let avatarUrl = claims?.image_url || claims?.picture || null

  if (!email && userId) {
    try {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      email = clerkUser.emailAddresses[0]?.emailAddress || ''
      name = clerkUser.fullName || clerkUser.username || name || ''
      avatarUrl = clerkUser.imageUrl || avatarUrl
    } catch (e: any) {
      console.warn('[Dashboard Auth Fallback] Failed to fetch user via clerkClient:', e.message)
    }
  }

  // Safety fallbacks to prevent Turso NOT NULL constraints from throwing 500 errors
  if (!email) {
    email = `user_${userId}@placeholder.formbuilder.com`
  }
  if (!name) {
    name = email.split('@')[0] || 'User'
  }

  // Upsert user into Turso
  await db
    .insert(users)
    .values({ id: userId, email, name, avatarUrl, isActive: true })
    .onConflictDoUpdate({ target: users.id, set: { email, name, avatarUrl, updatedAt: new Date().toISOString() } })

  const [dbUser] = await db.select({ name: users.name, role: users.role }).from(users).where(eq(users.id, userId))

  // Get forms with submission counts
  const allForms = await db.select().from(forms).where(eq(forms.userId, userId)).orderBy(desc(forms.createdAt))

  const formsWithCounts = await Promise.all(
    allForms.map(async (form) => {
      const [result] = await db.select({ count: sql<number>`count(*)` }).from(submissions).where(eq(submissions.formId, form.id))
      return { ...form, submissions: [{ count: result?.count ?? 0 }] }
    })
  )

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  return (
    <DashboardClient
      user={{ id: userId, email }}
      dbUser={dbUser}
      forms={formsWithCounts}
      siteUrl={siteUrl}
    />
  )
}
