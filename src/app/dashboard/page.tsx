import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import SignOutButton from '@/components/SignOutButton'
import FormCard from './FormCard'

import ImportButton from './ImportButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile info
  const { data: dbUser } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  // Fetch forms with submission count
  const { data: forms } = await supabase
    .from('forms')
    .select('*, submissions(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tighter">FormFlow AI</h1>
        <div className="flex items-center gap-6">
          <Link 
            href="/dashboard/json-guide"
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            JSON Guide
          </Link>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-gray-900">{dbUser?.name || user.user_metadata?.name || 'User'}</span>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">{dbUser?.role || 'Basic Plan'}</span>
          </div>
          <SignOutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Your Dashboard</h2>
            <p className="mt-2 text-base text-gray-500 font-medium leading-relaxed">Create beautiful forms and analyze responses instantly.</p>
          </div>
          <div className="flex items-center gap-4">
            <ImportButton />
            <Link
              href="/dashboard/forms/new"
              className="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <svg className="w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
              </svg>
              Create New Form
            </Link>
          </div>
        </div>

        {forms?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 p-12">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">No forms yet</h3>
            <p className="mt-2 text-gray-500 max-w-sm mx-auto font-medium">Click the button above to start collecting responses for your first form.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {forms?.map((form) => (
              <FormCard key={form.id} form={form} siteUrl={siteUrl} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
