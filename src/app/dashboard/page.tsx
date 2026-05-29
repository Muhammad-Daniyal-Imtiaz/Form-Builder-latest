import { db } from '@/db'
import { forms, users, submissions } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? ''
  const name = clerkUser?.fullName || clerkUser?.username || email.split('@')[0] || 'User'
  const avatarUrl = clerkUser?.imageUrl ?? null

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
