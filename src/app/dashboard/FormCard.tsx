'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, BarChart2, ExternalLink, Globe, FileText, CheckCircle2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function FormCard({ form, siteUrl }: { form: any; siteUrl: string }) {
    const router = useRouter()
    const [publishing, setPublishing] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const submissionCount = form.submissions?.[0]?.count || 0

    const handlePublish = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setPublishing(true)
        try {
            const res = await fetch(`/api/forms/${form.id}/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ published: true })
            })
            if (res.ok) router.refresh()
        } catch (err) {
            console.error(err)
        } finally {
            setPublishing(false)
        }
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 flex flex-col h-full"
        >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex-1">
                <div className="flex justify-between items-start mb-6">
                    <div className={cn(
                        "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5",
                        form.published ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    )}>
                        {form.published ? <Globe className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        {form.published ? 'Live' : 'Draft'}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        <BarChart2 className="w-3 h-3 text-indigo-500" />
                        {submissionCount} {submissionCount === 1 ? 'Response' : 'Responses'}
                    </div>
                </div>

                <h3 className="text-xl font-black text-white mb-3 group-hover:text-indigo-400 transition-colors leading-tight tracking-tight uppercase">
                    {form.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-8 font-medium leading-relaxed">
                    {form.description || 'Elevate your data collection with this premium form architecture.'}
                </p>
            </div>

            <div className="relative z-10 pt-6 border-t border-white/5 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/dashboard/forms/${form.id}/edit`}
                        className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:bg-indigo-600 hover:border-indigo-500 transition-all active:scale-95"
                    >
                        <Edit2 className="w-3 h-3" />
                        Edit
                    </Link>
                    <Link
                        href={`/dashboard/forms/${form.id}/submissions`}
                        className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest px-2 transition-colors"
                    >
                        <BarChart2 className="w-3.5 h-3.5" />
                        Results
                    </Link>
                    {!form.published && (
                        <button
                            onClick={handlePublish}
                            disabled={publishing}
                            className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest px-2 disabled:opacity-50 transition-colors"
                        >
                            <CheckCircle2 className="w-3 h-3" />
                            {publishing ? '...' : 'Publish'}
                        </button>
                    )}
                </div>

                {form.published && (
                    <Link
                        href={`${siteUrl}/f/${form.id}`}
                        target="_blank"
                        className="p-2.5 bg-white/5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all border border-white/5 hover:border-indigo-500/20"
                    >
                        <ExternalLink className="w-4 h-4" strokeWidth={3} />
                    </Link>
                )}
            </div>
        </motion.div>
    )
}
