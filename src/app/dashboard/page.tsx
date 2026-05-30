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
  const email = claims?.email || claims?.primary_email_address || ''
  const fullName = [claims?.first_name, claims?.last_name].filter(Boolean).join(' ')
  const name = claims?.full_name || claims?.name || fullName || claims?.username || email.split('@')[0] || 'User'
  const avatarUrl = claims?.image_url || claims?.picture || null

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
