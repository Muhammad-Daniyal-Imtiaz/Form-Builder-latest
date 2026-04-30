'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, BarChart2, ExternalLink, Globe, FileText, CheckCircle2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useTheme } from '@/components/ThemeProvider'

export default function FormCard({ form, siteUrl }: { form: any; siteUrl: string }) {
    const router = useRouter()
    const { currentTheme } = useTheme()
    const [publishing, setPublishing] = useState(false)
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
            className="group relative border rounded-[2rem] p-8 transition-all duration-500 flex flex-col h-full"
            style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}
        >
            {/* Glossy Overlay */}
            <div 
              className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
              style={{ background: `linear-gradient(to bottom right, ${currentTheme.primary}05, transparent)` }}
            />

            <div className="relative z-10 flex-1">
                <div className="flex justify-between items-start mb-6">
                    <div 
                        className={cn(
                            "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 border",
                            form.published ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-amber-400 bg-amber-400/10 border-amber-400/20"
                        )}
                    >
                        {form.published ? <Globe className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        {form.published ? 'Live' : 'Draft'}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest" style={{ color: currentTheme.textMuted }}>
                        <BarChart2 className="w-3 h-3" style={{ color: currentTheme.primary }} />
                        {submissionCount} {submissionCount === 1 ? 'Response' : 'Responses'}
                    </div>
                </div>

                <h3 className="text-xl font-black mb-3 transition-colors leading-tight tracking-tight uppercase" style={{ color: currentTheme.text }}>
                    {form.title}
                </h3>
                <p className="text-sm line-clamp-2 mb-8 font-medium leading-relaxed" style={{ color: currentTheme.textMuted }}>
                    {form.description || 'Elevate your data collection with this premium form architecture.'}
                </p>
            </div>

            <div className="relative z-10 pt-6 border-t flex items-center justify-between mt-auto" style={{ borderColor: currentTheme.border }}>
                <div className="flex items-center gap-3">
                    <Link
                        href={`/dashboard/forms/${form.id}/edit`}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all active:scale-95"
                        style={{ 
                          backgroundColor: currentTheme.bg, 
                          color: currentTheme.text, 
                          borderColor: currentTheme.border 
                        }}
                    >
                        <Edit2 className="w-3 h-3" />
                        Edit
                    </Link>
                    <Link
                        href={`/dashboard/forms/${form.id}/submissions`}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-2 transition-colors"
                        style={{ color: currentTheme.textMuted }}
                    >
                        <BarChart2 className="w-3.5 h-3.5" />
                        Results
                    </Link>
                    {!form.published && (
                        <button
                            onClick={handlePublish}
                            disabled={publishing}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2 disabled:opacity-50 transition-colors"
                            style={{ color: '#10b981' }}
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
                        className="p-2.5 rounded-xl transition-all border"
                        style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.border, color: currentTheme.textMuted }}
                    >
                        <ExternalLink className="w-4 h-4" strokeWidth={3} />
                    </Link>
                )}
            </div>
        </motion.div>
    )
}
