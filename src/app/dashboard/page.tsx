import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import SignOutButton from '@/components/SignOutButton'
import FormCard from './FormCard'
import ImportButton from './ImportButton'
import { Layout, Plus, Info, LayoutGrid, List } from 'lucide-react'

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
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30">
      {/* Premium Background Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 px-8 py-5 flex justify-between items-center backdrop-blur-xl bg-black/20 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layout className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter">FormFlow <span className="text-gray-500 font-medium">Dashboard</span></span>
        </div>
        
        <div className="flex items-center gap-8">
          <Link 
            href="/dashboard/json-guide"
            className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest"
          >
            <Info className="w-3.5 h-3.5" />
            JSON Guide
          </Link>
          <div className="w-px h-6 bg-white/5" />
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-black text-white">{dbUser?.name || user.user_metadata?.name || 'User'}</span>
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.1em]">{dbUser?.role || 'Basic Plan'}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 gap-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Overview
            </div>
            <h2 className="text-5xl font-black tracking-tighter">Your Creations</h2>
            <p className="text-gray-500 font-medium max-w-md">Manage your high-performance forms and analyze real-time response data.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 mr-4">
                <button className="p-2 rounded-lg bg-white/10 text-white"><LayoutGrid className="w-4 h-4" /></button>
                <button className="p-2 rounded-lg text-gray-600 hover:text-gray-400"><List className="w-4 h-4" /></button>
             </div>
             <ImportButton />
             <Link
               href="/dashboard/forms/new"
               className="inline-flex items-center bg-white text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
             >
               <Plus className="w-4 h-4 mr-2" strokeWidth={3} />
               Create Form
             </Link>
          </div>
        </div>

        {forms?.length === 0 ? (
          <div className="text-center py-32 rounded-[3rem] bg-white/[0.01] border border-white/5 border-dashed flex flex-col items-center justify-center group hover:bg-white/[0.02] transition-colors duration-500">
            <div className="w-24 h-24 bg-white/5 text-gray-500 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
              <Layout className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-3xl font-black mb-4 tracking-tight">Your space is empty.</h3>
            <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium leading-relaxed mb-8">Click "Create Form" or import a JSON definition to get started on your journey.</p>
             <Link
               href="/dashboard/forms/new"
               className="inline-flex items-center gap-2 text-xs font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400"
             >
               Create your first form <Plus className="w-3 h-3" />
             </Link>
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
