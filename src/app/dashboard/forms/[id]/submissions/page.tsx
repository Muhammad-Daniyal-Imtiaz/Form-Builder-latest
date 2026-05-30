'use client'

import { useState, useEffect, use, useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/utils/cn'
import { Database, Download, ExternalLink, ArrowLeft, Check, Zap, Table as TableIcon, Filter, X, Search, Calendar } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

const LoaderIcon = ({ className }: { className?: string }) => (
  <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
  </svg>
)

export default function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [form, setForm] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sheetStatus, setSheetStatus] = useState<any>(null)
  const [zapierStatus, setZapierStatus] = useState<any>(null)
  const [airtableStatus, setAirtableStatus] = useState<any>(null)
  const [syncing, setSyncing] = useState(false)
  const [zapSyncing, setZapSyncing] = useState(false)
  const [airSyncing, setAirSyncing] = useState(false)
  const { currentTheme } = useTheme()

  // Filtering State
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [globalSearch, setGlobalSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [formRes, subsRes] = await Promise.all([
        fetch(`/api/forms/${resolvedParams.id}`),
        fetch(`/api/forms/${resolvedParams.id}/submissions`)
      ])

      if (!formRes.ok) throw new Error('Failed to fetch form details')
      if (!subsRes.ok) throw new Error('Failed to fetch submissions')

      const formData = await formRes.json()
      const subsData = await subsRes.json()

      // Normalise form fields key (API returns form_fields from /api/forms/[id])
      const normForm = {
        ...formData,
        form_fields: formData.form_fields ?? formData.formFields ?? [],
      }
      setForm(normForm)
      // Normalise Drizzle camelCase → snake_case so the rest of the UI works
      const normSubs = subsData.map((s: any) => ({
        ...s,
        submitted_at: s.submitted_at ?? s.submittedAt,
        data: typeof s.data === 'string' ? JSON.parse(s.data) : (s.data ?? {}),
      }))
      setSubmissions(normSubs)
      
      // Fetch integration status
      const [intRes, zapRes, airRes] = await Promise.all([
        fetch(`/api/forms/${resolvedParams.id}/integrations/google-sheets`),
        fetch(`/api/forms/${resolvedParams.id}/integrations/zapier`),
        fetch(`/api/forms/${resolvedParams.id}/integrations/airtable`)
      ])
      
      if (intRes.ok) {
        const intData = await intRes.json()
        setSheetStatus(intData)
      }

      if (zapRes.ok) {
        const zapData = await zapRes.json()
        setZapierStatus(zapData)
      }

      if (airRes.ok) {
        const airData = await airRes.json()
        setAirtableStatus(airData)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- FILTER LOGIC ---
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      // Global Search
      if (globalSearch) {
        const searchStr = JSON.stringify(sub.data).toLowerCase()
        if (!searchStr.includes(globalSearch.toLowerCase())) return false
      }

      // Individual Field Filters
      for (const [fieldId, filterValue] of Object.entries(filters)) {
        if (!filterValue) continue
        
        const subValue = String(sub.data[fieldId] || '').toLowerCase()
        if (!subValue.includes(filterValue.toLowerCase())) return false
      }

      return true
    })
  }, [submissions, filters, globalSearch])

  const updateFilter = (fieldId: string, value: string) => {
    setFilters(prev => ({ ...prev, [fieldId]: value }))
  }

  const clearFilters = () => {
    setFilters({})
    setGlobalSearch('')
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length + (globalSearch ? 1 : 0)

  const handleGoogleSync = async () => {
    if (!sheetStatus?.sheetId) return
    if (!confirm(`This will push all ${submissions.length} submissions to your Google Sheet. Continue?`)) return

    setSyncing(true)
    try {
      const resp = await fetch(`/api/forms/${resolvedParams.id}/integrations/google-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync-existing' })
      })
      
      const data = await resp.json()
      
      if (resp.ok) {
        if (data.count === 0) {
          alert('Sheets already up-to-date. No new data to push!')
        } else {
          alert(data.message || `Successfully synced ${data.count} submissions!`)
        }
      } else {
        alert(data.error || 'Failed to sync. Please check your Google connection.')
      }
    } catch (err) {
      console.error('Sync failed:', err)
      alert('An error occurred during sync.')
    } finally {
      setSyncing(false)
    }
  }

  const handleZapierSync = async () => {
    if (!zapierStatus?.webhookUrl) return
    if (!confirm(`This will send all ${submissions.length} submissions to your Zapier Webhook. Continue?`)) return

    setZapSyncing(true)
    try {
      const resp = await fetch(`/api/forms/${resolvedParams.id}/integrations/zapier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync-existing' })
      })
      
      const data = await resp.json()
      
      if (resp.ok) {
        if (data.count === 0) {
          if (confirm('All data already synced! Would you like to reset the sync status and send everything again?')) {
            // First reset
            await fetch(`/api/forms/${resolvedParams.id}/integrations/zapier`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'reset-sync' })
            })
            // Then sync again
            handleZapierSync()
            return
          }
        } else {
          alert(data.message || `Successfully sent ${data.count} entries to Zapier!`)
        }
      } else {
        alert(data.error || 'Failed to sync. Please check your Zapier webhook.')
      }
    } catch (err) {
      console.error('Zapier sync failed:', err)
      alert('An error occurred during sync.')
    } finally {
      setZapSyncing(false)
    }
  }

  const handleAirtableSync = async () => {
    if (!airtableStatus?.apiKey || !airtableStatus?.baseId) return
    if (!confirm(`This will sync all remaining submissions to your Airtable table "${airtableStatus.tableName || 'Submissions'}" and create any missing columns. Continue?`)) return

    setAirSyncing(true)
    try {
      const resp = await fetch(`/api/forms/${resolvedParams.id}/integrations/airtable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync-existing' })
      })
      
      const data = await resp.json()
      
      if (resp.ok) {
        alert(data.message || `Successfully synced to Airtable!`)
      } else {
        alert(data.error || 'Failed to sync to Airtable.')
      }
    } catch (err) {
      console.error('Airtable sync failed:', err)
      alert('An error occurred during sync.')
    } finally {
      setAirSyncing(false)
    }
  }

  // Extract all unique headers from form fields
  const headers = form?.form_fields?.map((f: any) => f.label) || []

  const exportToCSV = () => {
    if (!filteredSubmissions.length || !form) return

    // 1. Prepare Headers
    const csvHeaders = ['Date Submitted', ...headers]
    
    // 2. Prepare Rows
    const rows = filteredSubmissions.map(sub => {
      const rowData = [new Date(sub.submitted_at).toLocaleString()]
      
      form.form_fields.forEach((field: any) => {
        let val = sub.data[field.id] || sub.data[field.label] || ''
        
        // Flatten arrays (multiselect or files)
        if (Array.isArray(val)) {
          if (['file', 'multifile'].includes(field.type)) {
            val = val.map(f => f.url).join('; ')
          } else {
            val = val.join(', ')
          }
        } else if (typeof val === 'object' && val?.url) {
          // Single file upload
          val = val.url
        }
        
        // Escape quotes and wrap in quotes for CSV safety
        const cleanedVal = String(val).replace(/"/g, '""')
        rowData.push(`"${cleanedVal}"`)
      })
      
      return rowData.join(',')
    })

    const csvContent = [csvHeaders.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    const fileName = `${form.title?.replace(/\s+/g, '_') || 'Form'}_Filtered_Submissions_${new Date().toISOString().split('T')[0]}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading submissions...</div>
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>

  return (
    <div className="min-h-screen p-6 md:p-8 transition-colors duration-500" style={{ backgroundColor: currentTheme.bg }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div 
          className="rounded-2xl border px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-xl backdrop-blur-xl"
          style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg"
              style={{ backgroundColor: `${currentTheme.primary}15`, borderColor: `${currentTheme.primary}30` }}
            >
              <TableIcon className="w-7 h-7" style={{ color: currentTheme.primary }} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight" style={{ color: currentTheme.text }}>{form?.title || 'Submissions'}</h1>
              <p className="text-sm font-medium" style={{ color: currentTheme.textMuted }}>
                {filteredSubmissions.length} of {submissions.length} Responses Displayed
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
             <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-6 py-2.5 rounded-xl font-black shadow-lg transition-all text-xs uppercase tracking-widest flex items-center gap-2 border",
                activeFiltersCount > 0 ? "bg-primary text-white" : ""
              )}
              style={{ 
                backgroundColor: activeFiltersCount > 0 ? currentTheme.primary : currentTheme.card, 
                color: activeFiltersCount > 0 ? (currentTheme.lightMode ? 'white' : 'black') : currentTheme.primary,
                borderColor: currentTheme.border 
              }}
            >
              <Filter className="w-4 h-4" />
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>

            <button
              onClick={exportToCSV}
              disabled={filteredSubmissions.length === 0}
              className="px-6 py-2.5 rounded-xl font-black shadow-lg transition-all text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-30 border"
              style={{ backgroundColor: currentTheme.card, color: currentTheme.primary, borderColor: currentTheme.border }}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <Link
              href={`/dashboard/forms/${resolvedParams.id}/edit`}
              className="px-6 py-2.5 rounded-xl font-black shadow-lg transition-all text-xs uppercase tracking-widest flex items-center gap-2 border"
              style={{ backgroundColor: currentTheme.card, color: currentTheme.text, borderColor: currentTheme.border }}
            >
              Edit Form
            </Link>
            <Link
              href={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/f/${resolvedParams.id}`}
              target="_blank"
              className="px-6 py-2.5 rounded-xl font-black shadow-lg transition-all text-xs uppercase tracking-widest flex items-center gap-2 shadow-primary/20"
              style={{ backgroundColor: currentTheme.primary, color: currentTheme.lightMode ? 'white' : 'black' }}
            >
              View Form
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div 
            className="p-8 rounded-2xl border shadow-xl backdrop-blur-xl space-y-6"
            style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: currentTheme.text }}>Advanced Filters</h3>
              <button 
                onClick={clearFilters}
                className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border hover:bg-red-500 hover:text-white transition-all"
                style={{ borderColor: currentTheme.border, color: currentTheme.textMuted }}
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Global Search */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: currentTheme.textMuted }}>Global Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: currentTheme.textMuted }} />
                  <input 
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Search anything..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                    style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.border, color: currentTheme.text }}
                  />
                </div>
              </div>

              {/* Dynamic Field Filters */}
              {form?.form_fields?.map((field: any) => (
                <div key={field.id} className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: currentTheme.textMuted }}>{field.label}</label>
                  <div className="relative">
                    {['select', 'radio', 'checkbox'].includes(field.type) ? (
                      <select
                        value={filters[field.id] || ''}
                        onChange={(e) => updateFilter(field.id, e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all appearance-none"
                        style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.border, color: currentTheme.text }}
                      >
                        <option value="">Any {field.label}</option>
                        {field.options?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text"
                        value={filters[field.id] || ''}
                        onChange={(e) => updateFilter(field.id, e.target.value)}
                        placeholder={`Filter by ${field.label}...`}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                        style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.border, color: currentTheme.text }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="rounded-2xl border shadow-2xl overflow-hidden transition-colors" style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <X className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-black tracking-tight" style={{ color: currentTheme.text }}>No matches found</h3>
              <p className="text-sm font-medium max-w-xs mx-auto mt-2" style={{ color: currentTheme.textMuted }}>Try adjusting your filters or clear them to see all submissions.</p>
              <button 
                onClick={clearFilters}
                className="mt-6 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                style={{ backgroundColor: currentTheme.primary, color: currentTheme.lightMode ? 'white' : 'black' }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead style={{ backgroundColor: `${currentTheme.bg}80` }}>
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: currentTheme.textMuted }}>
                      Date Submitted
                    </th>
                    {headers.map((header: string, i: number) => (
                      <th key={i} scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: currentTheme.textMuted }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: currentTheme.border }}>
                  {filteredSubmissions.map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: currentTheme.textMuted }}>
                        {new Date(sub.submitted_at).toLocaleString()}
                      </td>
                      {form?.form_fields?.map((field: any, i: number) => {
                        const cellValue = sub.data[field.id] || sub.data[field.label] || '-'
                        return (
                          <td key={i} className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: currentTheme.text }}>
                            {['file', 'multifile'].includes(field.type) && cellValue && (Array.isArray(cellValue) ? cellValue[0]?.url : cellValue.url) ? (
                              <div className="flex flex-col gap-1">
                                {(Array.isArray(cellValue) ? cellValue : [cellValue]).map((fileObj, fIdx) => (
                                  <a key={fIdx} href={fileObj.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-900 hover:underline flex items-center gap-1 font-medium text-xs">
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                    <span className="truncate max-w-[150px]">{fileObj.fileName || 'Download'}</span>
                                  </a>
                                ))}
                              </div>
                            ) : Array.isArray(cellValue) ? (
                              cellValue.join(', ')
                            ) : (
                              String(cellValue)
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}