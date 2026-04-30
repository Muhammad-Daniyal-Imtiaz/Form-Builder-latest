import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import SignOutButton from '@/components/SignOutButton'
import FormCard from './FormCard'
import ImportButton from './ImportButton'
import { Layout, Plus, Info, LayoutGrid, List } from 'lucide-react'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: dbUser } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  const { data: forms } = await supabase
    .from('forms')
    .select('*, submissions(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  return (
    <DashboardClient 
      user={user} 
      dbUser={dbUser} 
      forms={forms || []} 
      siteUrl={siteUrl} 
    />
  )
}
