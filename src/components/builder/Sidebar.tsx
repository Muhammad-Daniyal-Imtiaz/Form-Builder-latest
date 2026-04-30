'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Type, Mail, Hash, AlignLeft, List, CheckSquare, 
  FileUp, Palette, Plus, Settings, Check, 
  MousePointer2, MessageSquare, ExternalLink, RefreshCcw,
  Share2, Globe, Code, Copy, Search, Plug, Database, FileSpreadsheet, Zap, Star
} from 'lucide-react'
import { useBuilder } from './BuilderContext'
import { FieldType, PRESET_THEMES, AVAILABLE_FONTS } from './types'
import { cn } from '@/utils/cn'
import { useTheme } from '@/components/ThemeProvider'

const SlackIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
    <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5z"/>
    <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5s.67-1.5 1.5-1.5z"/>
    <path d="M14 14.5c0 .83.67 1.5 1.5 1.5h5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5h-5c-.83 0-1.5.67-1.5 1.5z"/>
    <path d="M14 20.5V19h1.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5v5z"/>
    <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/>
    <path d="M10 3.5V5H8.5C7.67 5 7 4.33 7 3.5S7.67 2 8.5 2 10 2.67 10 3.5z"/>
  </svg>
)

const FIELD_TOOLS: { type: FieldType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'text', label: 'Short Text', icon: <Type className="w-4 h-4" />, desc: 'Simple text input' },
  { type: 'email', label: 'Email Address', icon: <Mail className="w-4 h-4" />, desc: 'Validates email formats' },
  { type: 'number', label: 'Number', icon: <Hash className="w-4 h-4" />, desc: 'Numeric integers or decimals' },
  { type: 'textarea', label: 'Long Text', icon: <AlignLeft className="w-4 h-4" />, desc: 'Multi-line paragraph text' },
  { type: 'select', label: 'Dropdown', icon: <List className="w-4 h-4" />, desc: 'Select from a list' },
  { type: 'checkbox', label: 'Multiple Choice', icon: <CheckSquare className="w-4 h-4" />, desc: 'Select multiple options' },
  { type: 'radio', label: 'Single Choice', icon: <CheckSquare className="w-4 h-4" />, desc: 'Select exactly one option' },
  { type: 'rating', label: 'Star Rating', icon: <Star className="w-4 h-4" />, desc: '5-star satisfaction rating' },
  { type: 'file', label: 'File Upload', icon: <FileUp className="w-4 h-4" />, desc: 'Allow users to upload files' },
]

export function Sidebar() {
  const { 
    sidebarTab, setSidebarTab, addField, 
    form, customStyles, updateFormDetails, 
    updateStyles, applyThemePreset, 
    formSettings, updateFormSettings 
  } = useBuilder()
  const { currentTheme } = useTheme()

  const [sheetStatus, setSheetStatus] = useState<{
    isConnected: boolean;
    googleEmail?: string;
    sheetId?: string;
    sheetName?: string;
    isEnabled: boolean;
  } | null>(null)
  const [zapierStatus, setZapierStatus] = useState<{
    webhookUrl?: string;
    isEnabled: boolean;
  } | null>(null)
  const [airtableStatus, setAirtableStatus] = useState<any>(null)
  const [slackStatus, setSlackStatus] = useState<any>(null)
  const [emailStatus, setEmailStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (sidebarTab === 'settings' && form?.id) {
      fetchStatus()
    }
  }, [sidebarTab, form?.id])

  const fetchStatus = async () => {
    try {
      const [sheetResp, zapierResp, airtableResp, slackResp, emailResp] = await Promise.all([
        fetch(`/api/forms/${form.id}/integrations/google-sheets`),
        fetch(`/api/forms/${form.id}/integrations/zapier`),
        fetch(`/api/forms/${form.id}/integrations/airtable`),
        fetch(`/api/forms/${form.id}/integrations/slack`),
        fetch(`/api/forms/${form.id}/integrations/email`)
      ])
      
      const [sheetData, zapierData, airtableData, slackData, emailData] = await Promise.all([
        sheetResp.json(),
        zapierResp.json(),
        airtableResp.json(),
        slackResp.json(),
        emailResp.json()
      ])
      
      setSheetStatus(sheetData)
      setZapierStatus(zapierData)
      setAirtableStatus(airtableData)
      setSlackStatus(slackData)
      setEmailStatus(emailData)
    } catch (err) {
      console.error('Failed to fetch integration status:', err)
    }
  }

  const handleAction = async (action: string, payload: any = {}) => {
    setLoading(true)
    try {
      const resp = await fetch(`/api/forms/${form.id}/integrations/google-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      })
      if (resp.ok) {
        await fetchStatus()
      } else {
        const data = await resp.json().catch(() => ({}));
        alert(data.error || `Action ${action} failed`);
        // Refresh status anyway to clear any invalid UI states
        await fetchStatus();
      }
    } catch (err) {
      console.error(`Action ${action} failed:`, err)
      alert('A network error occurred. Please try again.');
    } finally {
      setLoading(false)
    }
  }

  const handleZapierAction = async (action: string, payload: any = {}) => {
    setLoading(true)
    try {
      const resp = await fetch(`/api/forms/${form.id}/integrations/zapier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      })
      if (resp.ok) {
        const data = await resp.json()
        if (action === 'send-test' || action === 'reset-sync') {
          alert(data.message)
        }
        await fetchStatus()
      }
    } catch (err) {
      console.error(`Zapier action ${action} failed:`, err)
    } finally {
      setLoading(false)
    }
  }

  const handleAirtableAction = async (action: string, payload: any = {}) => {
    setLoading(true)
    try {
      const resp = await fetch(`/api/forms/${form.id}/integrations/airtable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      })
      if (resp.ok) {
        const data = await resp.json()
        if (action === 'sync-existing') {
          alert(data.message || 'Sync complete!')
        }
        await fetchStatus()
      } else {
        const data = await resp.json()
        alert(data.error || 'Airtable action failed')
      }
    } catch (err) {
      console.error(`Airtable action ${action} failed:`, err)
    } finally {
      setLoading(false)
    }
  }

  const handleSlackAction = async (action: string, payload: any = {}) => {
    setLoading(true)
    try {
      const resp = await fetch(`/api/forms/${form.id}/integrations/slack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      })
      if (resp.ok) {
        const data = await resp.json()
        if (action === 'create-channel') {
          alert(`Success! Channel "#${data.channelName}" created.`)
        }
        await fetchStatus()
      } else {
        const data = await resp.json()
        alert(data.error || 'Slack action failed')
      }
    } catch (err) {
      console.error(`Slack action ${action} failed:`, err)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAction = async (action: string, payload: any = {}) => {
    setLoading(true)
    try {
      const resp = await fetch(`/api/forms/${form.id}/integrations/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      })
      const data = await resp.json()
      if (resp.ok) {
        if (action === 'test-email') {
          alert(data.message || 'Test email sent!')
        }
        await fetchStatus()
      } else {
        alert(data.error || 'Email action failed')
      }
    } catch (err) {
      console.error(`Email action ${action} failed:`, err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside 
      className="w-80 border-r h-[calc(100vh-56px)] sticky top-14 flex flex-col shadow-2xl z-10 shrink-0 overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: `${currentTheme.bg}cc`, borderColor: currentTheme.border, backdropBlur: '40px' }}
    >
      <div className="flex p-2 gap-1 border-b" style={{ backgroundColor: `${currentTheme.bg}40`, borderColor: currentTheme.border }}>
        <button
          onClick={() => setSidebarTab('add')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 text-[10px] font-bold rounded-lg transition-all relative",
            sidebarTab === 'add' ? "text-indigo-700" : "text-gray-500 hover:bg-white hover:shadow-sm"
          )}
        >
          {sidebarTab === 'add' && <motion.div layoutId="tab-bg" className="absolute inset-0 shadow-sm border rounded-lg -z-10" style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }} />}
          <Plus className="w-4 h-4" />
          Fields
        </button>
        <button
          onClick={() => setSidebarTab('design')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 text-[10px] font-bold rounded-lg transition-all relative",
            sidebarTab === 'design' ? "text-pink-700" : "text-gray-500 hover:bg-white hover:shadow-sm"
          )}
        >
          {sidebarTab === 'design' && <motion.div layoutId="tab-bg" className="absolute inset-0 shadow-sm border rounded-lg -z-10" style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }} />}
          <Palette className="w-4 h-4" />
          Design
        </button>
        <button
          onClick={() => setSidebarTab('settings')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 text-[10px] font-bold rounded-lg transition-all relative",
            sidebarTab === 'settings' ? "text-amber-700" : "text-gray-500 hover:bg-white hover:shadow-sm"
          )}
        >
          {sidebarTab === 'settings' && <motion.div layoutId="tab-bg" className="absolute inset-0 shadow-sm border rounded-lg -z-10" style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }} />}
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button
          onClick={() => setSidebarTab('share')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 text-[10px] font-bold rounded-lg transition-all relative",
            sidebarTab === 'share' ? "text-emerald-700" : "text-gray-500 hover:bg-white hover:shadow-sm"
          )}
        >
          {sidebarTab === 'share' && <motion.div layoutId="tab-bg" className="absolute inset-0 shadow-sm border rounded-lg -z-10" style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }} />}
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {sidebarTab === 'add' && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest mb-3 px-1" style={{ color: currentTheme.textMuted }}>Basic Fields</h3>
              <div className="grid grid-cols-1 gap-2">
                {FIELD_TOOLS.slice(0, 4).map((tool) => (
                  <button
                    key={tool.type}
                    onClick={() => addField(tool.type)}
                    className="flex items-center gap-3 p-3 rounded-xl border transition-all text-left group"
                    style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}
                  >
                    <div className="p-2 rounded-lg transition-colors" style={{ backgroundColor: `${currentTheme.primary}10`, color: currentTheme.textMuted }}>
                      {tool.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: currentTheme.text }}>{tool.label}</div>
                      <div className="text-xs" style={{ color: currentTheme.textMuted }}>{tool.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest mb-3 px-1" style={{ color: currentTheme.textMuted }}>Choices & Media</h3>
              <div className="grid grid-cols-1 gap-2">
                {FIELD_TOOLS.slice(4).map((tool) => (
                  <button
                    key={tool.type}
                    onClick={() => addField(tool.type)}
                    className="flex items-center gap-3 p-3 rounded-xl border transition-all text-left group"
                    style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}
                  >
                    <div className="p-2 rounded-lg transition-colors" style={{ backgroundColor: `${currentTheme.primary}10`, color: currentTheme.textMuted }}>
                      {tool.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: currentTheme.text }}>{tool.label}</div>
                      <div className="text-xs" style={{ color: currentTheme.textMuted }}>{tool.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {sidebarTab === 'design' && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 pb-10">
            
            {/* Theme Presets */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: currentTheme.textMuted }}>Premium Presets</h3>
                <RefreshCcw 
                  className="w-3 h-3 text-gray-300 hover:text-indigo-500 cursor-pointer transition-colors" 
                  onClick={() => applyThemePreset('minimal-light')}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(PRESET_THEMES).map((presetId) => (
                  <button
                    key={presetId}
                    onClick={() => applyThemePreset(presetId)}
                    className={cn(
                      "group relative aspect-[4/3] rounded-xl border-2 overflow-hidden transition-all text-left",
                      "hover:shadow-lg hover:shadow-indigo-500/10",
                      // Highlight if it mostly matches active (simple check)
                      customStyles.fontFamily === PRESET_THEMES[presetId].fontFamily ? "border-indigo-500 ring-4 ring-indigo-50" : "border-gray-100 hover:border-indigo-200"
                    )}
                  >
                    <div className="absolute inset-0 p-3 flex flex-col justify-between" style={{ background: PRESET_THEMES[presetId].pageBgColor }}>
                      <div className="space-y-1">
                        <div className="w-full h-1 rounded-full opacity-20" style={{ background: PRESET_THEMES[presetId].accentColor }}></div>
                        <div className="w-2/3 h-1 rounded-full opacity-10" style={{ background: PRESET_THEMES[presetId].accentColor }}></div>
                      </div>
                      <span className="text-[10px] font-bold capitalize truncate" style={{ color: PRESET_THEMES[presetId].bodyText || '#000' }}>
                        {presetId.split('-').join(' ')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div>
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest mb-3 px-1" style={{ color: currentTheme.textMuted }}>Typography</h3>
              <div className="space-y-3 p-3 border rounded-xl" style={{ backgroundColor: `${currentTheme.bg}40`, borderColor: currentTheme.border }}>
                 <label className="block text-xs font-bold mb-1" style={{ color: currentTheme.text }}>Select Font</label>
                 <div className="grid grid-cols-1 gap-1">
                   {AVAILABLE_FONTS.map(font => (
                     <button
                        key={font}
                        onClick={() => updateStyles({ fontFamily: font })}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm border transition-all",
                          customStyles.fontFamily === font 
                            ? "bg-white border-indigo-200 text-indigo-700 shadow-sm shadow-indigo-500/10 font-bold" 
                            : "bg-transparent border-transparent text-gray-600 hover:bg-white hover:border-gray-200"
                        )}
                        style={{ fontFamily: font }}
                     >
                       {font}
                     </button>
                   ))}
                 </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest mb-3 px-1" style={{ color: currentTheme.textMuted }}>Brand Colors</h3>
              <div className="grid grid-cols-2 gap-3 p-3 border rounded-xl" style={{ backgroundColor: `${currentTheme.bg}40`, borderColor: currentTheme.border }}>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Accent</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={customStyles.accentColor} 
                      onChange={(e) => updateStyles({ accentColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                    />
                    <span className="text-[10px] font-mono uppercase text-gray-400">{customStyles.accentColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: currentTheme.textMuted }}>Header BG</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={customStyles.headerBg} 
                      onChange={(e) => updateStyles({ headerBg: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                    />
                    <span className="text-[10px] font-mono uppercase text-gray-400">{customStyles.headerBg}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Header Text</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={customStyles.headerText} 
                      onChange={(e) => updateStyles({ headerText: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                    />
                    <span className="text-[10px] font-mono uppercase text-gray-400">{customStyles.headerText}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Surface</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={customStyles.bodyBg} 
                      onChange={(e) => updateStyles({ bodyBg: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                    />
                    <span className="text-[10px] font-mono uppercase text-gray-400">{customStyles.bodyBg}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout Structure */}
            <div>
              <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 px-1">Layout & Structure</h3>
              <div className="grid grid-cols-1 gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Form Layout</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'centered', label: 'Classic' },
                      { id: 'split', label: 'Split' },
                      { id: 'sidebar', label: 'Sidebar' }
                    ].map(layout => (
                      <button
                        key={layout.id}
                        onClick={() => updateStyles({ layout: layout.id as any })}
                        className={cn(
                          "px-2 py-2 text-[10px] font-bold rounded-lg border transition-all text-center",
                          customStyles.layout === layout.id 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" 
                            : "bg-white border-gray-200 text-gray-500 hover:border-indigo-300"
                        )}
                      >
                        {layout.label}
                      </button>
                    ))}
                  </div>
                </div>

                {['split', 'sidebar'].includes(customStyles.layout) && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">Branding Side</label>
                    <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                      <button
                        onClick={() => updateStyles({ layoutSide: 'left' })}
                        className={cn(
                          "flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all",
                          customStyles.layoutSide === 'left' ? "bg-gray-100 text-indigo-600" : "text-gray-400"
                        )}
                      >
                        Left
                      </button>
                      <button
                        onClick={() => updateStyles({ layoutSide: 'right' })}
                        className={cn(
                          "flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all",
                          customStyles.layoutSide === 'right' ? "bg-gray-100 text-indigo-600" : "text-gray-400"
                        )}
                      >
                        Right
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 px-1">Brand Assets</h3>
              <div className="space-y-4">
                
                {/* Logo Section */}
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Main Logo URL</label>
                    <input
                      type="url"
                      value={form?.logo_url || ''}
                      onChange={(e) => updateFormDetails({ logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>
                  {form?.logo_url && (
                    <>
                      <div>
                        <label className="flex flex-col text-xs font-bold text-gray-700 mb-1">
                          <div className="flex justify-between mb-1">
                            <span>Image Height</span>
                            <span className="text-indigo-600">{customStyles.logoHeight || 48}px</span>
                          </div>
                          <input
                            type="range" min="16" max="256" step="4"
                            value={customStyles.logoHeight || 48}
                            onChange={(e) => updateStyles({ logoHeight: parseInt(e.target.value) })}
                            className="w-full accent-indigo-500"
                          />
                        </label>
                      </div>
                      <div>
                        <label className="flex flex-col text-xs font-bold text-gray-700 mb-1">
                          <div className="flex justify-between mb-1">
                            <span>Border Radius</span>
                            <span className="text-indigo-600">{customStyles.logoBorderRadius || 0}px</span>
                          </div>
                          <input
                            type="range" min="0" max="128" step="4"
                            value={customStyles.logoBorderRadius !== undefined ? customStyles.logoBorderRadius : 8}
                            onChange={(e) => updateStyles({ logoBorderRadius: parseInt(e.target.value) })}
                            className="w-full accent-indigo-500"
                          />
                        </label>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Alignment</label>
                        <select
                          value={customStyles.logoAlignment || 'left'}
                          onChange={(e) => updateStyles({ logoAlignment: e.target.value as any })}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        >
                          <option value="left">Left Aligned</option>
                          <option value="center">Centered</option>
                          <option value="right">Right Aligned</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {/* Secondary Image Section */}
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Secondary Asset URL</label>
                    <input
                      type="url"
                      value={customStyles.secondaryImageUrl || ''}
                      onChange={(e) => updateStyles({ secondaryImageUrl: e.target.value })}
                      placeholder="Trust badge or powered-by logo..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>
                  {customStyles.secondaryImageUrl && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Click Link (Optional)</label>
                      <input
                        type="url"
                        value={customStyles.secondaryImageLink || ''}
                        onChange={(e) => updateStyles({ secondaryImageLink: e.target.value })}
                        placeholder="https://yourwebsite.com"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                      />
                    </div>
                  )}
                </div>

                {/* Header Text Alignment */}
                <div className="px-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1 mt-2">Title & Description Alignment</label>
                  <select
                    value={customStyles.headerAlignment || 'left'}
                    onChange={(e) => updateStyles({ headerAlignment: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                {/* Cover Image Section */}
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Cover Image URL</label>
                    <input
                      type="url"
                      value={form?.cover_image_url || ''}
                      onChange={(e) => updateFormDetails({ cover_image_url: e.target.value })}
                      placeholder="https://example.com/banner.jpg"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>
                  {form?.cover_image_url && (
                    <>
                      <div>
                        <label className="flex flex-col text-xs font-bold text-gray-700 mb-1">
                          <div className="flex justify-between mb-1">
                            <span>Cover Height</span>
                            <span className="text-indigo-600">{customStyles.coverHeight || 240}px</span>
                          </div>
                          <input
                            type="range" min="64" max="600" step="8"
                            value={customStyles.coverHeight || 240}
                            onChange={(e) => updateStyles({ coverHeight: parseInt(e.target.value) })}
                            className="w-full accent-indigo-500"
                          />
                        </label>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Image Fit</label>
                        <select
                          value={customStyles.coverImageFit || 'cover'}
                          onChange={(e) => updateStyles({ coverImageFit: e.target.value as any })}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        >
                          <option value="cover">Fill & Crop Area (Cover)</option>
                          <option value="contain">Show Entire Image (Contain)</option>
                          <option value="fill">Stretch to Fill</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 px-1">Page Background</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Background Image URL</label>
                  <input
                    type="url"
                    value={customStyles.pageBgImage || ''}
                    onChange={(e) => updateStyles({ pageBgImage: e.target.value })}
                    placeholder="https://example.com/bg.jpg"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
                {customStyles.pageBgImage && (
                  <>
                    <div>
                      <label className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2 px-1">
                        <span>Background Blur</span>
                        <span className="text-pink-600">{customStyles.pageBgBlur}px</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="1"
                        value={customStyles.pageBgBlur || 0}
                        onChange={(e) => updateStyles({ pageBgBlur: parseInt(e.target.value) })}
                        className="w-full accent-pink-500"
                      />
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2 px-1">
                        <span>Background Dimming</span>
                        <span className="text-pink-600">{customStyles.pageBgOverlayOpacity || 10}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={customStyles.pageBgOverlayOpacity || 10}
                        onChange={(e) => updateStyles({ pageBgOverlayOpacity: parseInt(e.target.value) })}
                        className="w-full accent-pink-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 px-1">Advanced Sizing</h3>
              <div className="space-y-4 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <div>
                  <label className="flex flex-col text-xs font-bold text-gray-700 mb-1">
                    <div className="flex justify-between mb-1">
                      <span>Form Width</span>
                      <span className="text-indigo-600">{customStyles.containerWidth}px</span>
                    </div>
                    <input
                      type="range" min="320" max="1200" step="10"
                      value={customStyles.containerWidth}
                      onChange={(e) => updateStyles({ containerWidth: parseInt(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="flex flex-col text-xs font-bold text-gray-700 mb-1">
                    <div className="flex justify-between mb-1">
                      <span>Border Radius</span>
                      <span className="text-indigo-600">{customStyles.borderRadius}px</span>
                    </div>
                    <input
                      type="range" min="0" max="64" step="1"
                      value={customStyles.borderRadius}
                      onChange={(e) => updateStyles({ borderRadius: parseInt(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="flex flex-col text-xs font-bold text-gray-700 mb-1">
                    <div className="flex justify-between mb-1">
                      <span>Global Zoom (Scale)</span>
                      <span className="text-indigo-600">{Math.round((customStyles.formScale || 1) * 100)}%</span>
                    </div>
                    <input
                      type="range" min="0.5" max="1.5" step="0.05"
                      value={customStyles.formScale || 1}
                      onChange={(e) => updateStyles({ formScale: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </label>
                  <p className="text-[9px] text-gray-400 mt-1 italic">Scales the entire form container up or down instantly.</p>
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {sidebarTab === 'settings' && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 pb-10">
            
            <div>
              <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 px-1">Submission Button</h3>
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                  <MousePointer2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Button Text</span>
                </div>
                <input
                  type="text"
                  value={formSettings.submitButtonText}
                  onChange={(e) => updateFormSettings({ submitButtonText: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  placeholder="Submit Form"
                />
                <p className="text-[10px] text-gray-400 mt-1 px-1 italic">
                  Example: "Register Now", "Send Message", "Join Waitlist"
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 px-1">Completion Experience</h3>
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Thank You Screen</span>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Headline</label>
                  <input
                    type="text"
                    value={formSettings.thankYouHeadline}
                    onChange={(e) => updateFormSettings({ thankYouHeadline: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    placeholder="Thank You!"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Sub-message</label>
                  <textarea
                    rows={3}
                    value={formSettings.thankYouMessage}
                    onChange={(e) => updateFormSettings({ thankYouMessage: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                    placeholder="Your response has been successfully submitted."
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 px-1">Post-Submission</h3>
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Redirect URL</span>
                </div>
                <input
                  type="url"
                  value={formSettings.redirectUrl}
                  onChange={(e) => updateFormSettings({ redirectUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  placeholder="https://yourwebsite.com/welcome"
                />
                <p className="text-[10px] text-gray-400 mt-1 px-1">
                  If set, users will be taken to this URL immediately after submission instead of seeing the Thank You screen.
                </p>
              </div>
            </div>

            {/* INTEGRATIONS */}
            <div>
              <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 px-1">Integrations</h3>
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Database className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Connected Apps</span>
                </div>
                
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search apps (e.g., Google Sheets)"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                  />
                </div>

                <div className="pt-2 space-y-3">
                  {/* GOOGLE SHEETS */}
                  <div className={cn(
                    "border rounded-xl bg-white overflow-hidden transition-all duration-300",
                    sheetStatus?.isEnabled ? "border-green-500 shadow-[0_0_0_1px_rgba(34,197,94,0.3)] shadow-green-100" : "border-gray-200 hover:border-green-300"
                  )}>
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-[#0F9D58]/10 text-[#0F9D58]">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">Google Sheets</div>
                          <div className="text-[10px] text-gray-500">
                            {sheetStatus?.isConnected ? (sheetStatus.googleEmail || 'Connected') : 'Export responses automatically'}
                          </div>
                        </div>
                      </div>
                      
                      {!sheetStatus?.isConnected ? (
                        <button
                          onClick={() => {
                            window.location.href = `/api/auth/google?scope=sheets&redirectTo=${encodeURIComponent(window.location.pathname)}`
                          }}
                          className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-[10px] font-bold rounded-lg hover:border-green-500 hover:text-green-600 transition-colors shadow-sm whitespace-nowrap"
                        >
                          Connect
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          {sheetStatus.sheetId && (
                            <button
                              onClick={() => handleAction('toggle', { enabled: !sheetStatus.isEnabled })}
                              disabled={loading}
                              className={cn(
                                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                                sheetStatus.isEnabled ? "bg-green-600" : "bg-gray-200"
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                                  sheetStatus.isEnabled ? "translate-x-5" : "translate-x-1"
                                )}
                              />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {sheetStatus?.isConnected && (
                      <div className="bg-green-50/50 p-3 border-t border-green-100 space-y-3">
                        {!sheetStatus.sheetId ? (
                          <div>
                            <p className="text-[10px] text-gray-600 mb-2">Connect this form to a spreadsheet to start syncing results.</p>
                            <button
                              onClick={() => handleAction('create')}
                              disabled={loading}
                              className="w-full py-2 bg-green-600 text-white text-[10px] font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {loading ? 'Creating...' : 'Create New Spreadsheet'}
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Check className="w-3 h-3 text-green-600 shrink-0" />
                                <span className="text-[10px] font-medium text-green-800 truncate">
                                  Linked: {sheetStatus.sheetName || 'Responses'}
                                </span>
                              </div>
                              <button
                                onClick={() => handleAction('disconnect')}
                                className="text-[9px] text-red-500 font-bold hover:underline"
                              >
                                Unlink
                              </button>
                            </div>
                            <button
                               onClick={() => {
                                 window.open(`https://docs.google.com/spreadsheets/d/${sheetStatus.sheetId}`, '_blank')
                               }}
                               className="w-full flex items-center justify-center gap-1 py-1.5 px-2 bg-white border border-gray-200 text-gray-700 text-[10px] font-bold rounded-md hover:border-gray-300 transition-colors"
                            >
                               <ExternalLink className="w-3 h-3" />
                               Open Spreadsheet
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ZAPIER INTEGRATION */}
                  <div className={cn(
                    "border rounded-xl bg-white overflow-hidden transition-all duration-300",
                    zapierStatus?.isEnabled ? "border-orange-500 shadow-[0_0_0_1px_rgba(249,115,22,0.3)] shadow-orange-100" : "border-gray-200 hover:border-orange-300"
                  )}>
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-[#FF4F00]/10 text-[#FF4F00]">
                          <Zap className="w-4 h-4 fill-current" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">Zapier Webhooks</div>
                          <div className="text-[10px] text-gray-500">
                            Automation via webhooks
                          </div>
                        </div>
                      </div>
                      
                      {zapierStatus?.webhookUrl && (
                        <button
                          onClick={() => handleZapierAction('toggle', { enabled: !zapierStatus.isEnabled })}
                          disabled={loading}
                          className={cn(
                            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                            zapierStatus.isEnabled ? "bg-orange-600" : "bg-gray-200"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                              zapierStatus.isEnabled ? "translate-x-5" : "translate-x-1"
                            )}
                          />
                        </button>
                      )}
                    </div>
                    
                    <div className="bg-orange-50/50 p-3 border-t border-orange-100 space-y-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-tight px-1">Webhook URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          defaultValue={zapierStatus?.webhookUrl || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (zapierStatus?.webhookUrl || '')) {
                              handleZapierAction('update', { webhookUrl: e.target.value, enabled: true })
                            }
                          }}
                          placeholder="https://hooks.zapier.com/..."
                          className="flex-1 px-2 py-1.5 bg-white border border-orange-200 rounded-lg text-[10px] focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                        />
                        {zapierStatus?.webhookUrl && (
                          <button
                             onClick={() => handleZapierAction('disconnect')}
                             className="px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors font-bold"
                             title="Clear"
                          >
                             ×
                          </button>
                        )}
                      </div>
                      <p className="text-[9px] text-gray-400 px-1 leading-tight">Paste your Zapier 'Catch Hook' URL here.</p>
                      
                      {zapierStatus?.webhookUrl && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleZapierAction('send-test')}
                            disabled={loading}
                            className="flex-1 py-1.5 px-2 bg-orange-600 text-white text-[9px] font-bold rounded hover:bg-orange-700 transition-colors disabled:opacity-50"
                          >
                            Send Test Sample
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('This will mark all past submissions as unsynced locally. Re-syncing will send them again. Continue?')) {
                                handleZapierAction('reset-sync')
                              }
                            }}
                            disabled={loading}
                            className="py-1.5 px-2 bg-white border border-gray-200 text-gray-500 text-[9px] font-bold rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            Reset Sync
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                <div className="relative group">
                  <div className={cn(
                    "p-4 bg-white border rounded-2xl transition-all duration-300",
                    airtableStatus?.isEnabled ? "border-blue-200 shadow-sm ring-1 ring-blue-50" : "border-gray-100 hover:border-blue-200"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                          <Database className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">Airtable</h4>
                          <p className="text-[10px] text-gray-400 font-medium tracking-tight">Zero-Mapping Table Sync</p>
                        </div>
                      </div>
                      
                      {airtableStatus?.apiKey && (
                        <button
                          onClick={() => handleAirtableAction('update', { 
                            apiKey: airtableStatus.apiKey,
                            baseId: airtableStatus.baseId,
                            tableName: airtableStatus.tableName,
                            enabled: !airtableStatus.isEnabled 
                          })}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                            airtableStatus.isEnabled ? "bg-blue-600" : "bg-gray-200"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200",
                              airtableStatus.isEnabled ? "translate-x-4" : "translate-x-0"
                            )}
                          />
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight px-1">Personal Access Token</label>
                        <input
                          type="password"
                          placeholder="pat..."
                          defaultValue={airtableStatus?.apiKey || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (airtableStatus?.apiKey || '')) {
                              handleAirtableAction('update', { 
                                apiKey: e.target.value, 
                                baseId: airtableStatus?.baseId, 
                                tableName: airtableStatus?.tableName || 'Submissions',
                                enabled: true 
                              })
                            }
                          }}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight px-1">Base ID</label>
                          <input
                            type="text"
                            placeholder="app..."
                            defaultValue={airtableStatus?.baseId || ''}
                            onBlur={(e) => {
                              if (e.target.value !== (airtableStatus?.baseId || '')) {
                                handleAirtableAction('update', { 
                                  apiKey: airtableStatus?.apiKey, 
                                  baseId: e.target.value, 
                                  tableName: airtableStatus?.tableName || 'Submissions',
                                  enabled: true 
                                })
                              }
                            }}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight px-1">Table Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Leads"
                            defaultValue={airtableStatus?.tableName || ''}
                            onBlur={(e) => {
                              if (e.target.value !== (airtableStatus?.tableName || '')) {
                                handleAirtableAction('update', { 
                                  apiKey: airtableStatus?.apiKey, 
                                  baseId: airtableStatus?.baseId, 
                                  tableName: e.target.value, 
                                  enabled: true 
                                })
                              }
                            }}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      {airtableStatus?.apiKey && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleAirtableAction('sync-existing')}
                            disabled={loading}
                            className="flex-1 py-2 bg-blue-600 text-white text-[10px] font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 disabled:opacity-50"
                          >
                            Auto-Create & Sync
                          </button>
                          <button
                            onClick={() => handleAirtableAction('disconnect')}
                            disabled={loading}
                            className="px-3 py-2 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-xl hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <p className="text-[9px] text-gray-400 px-1 leading-tight mt-1">Provide your PAT and Base ID. We'll automatically create the table and columns for you.</p>
                    </div>
                  </div>
                </div>

                {/* SLACK INTEGRATION */}
                <div className="group/card relative">
                  <div className={cn(
                    "relative overflow-hidden p-4 rounded-2xl border transition-all duration-300",
                    slackStatus?.botToken 
                      ? "bg-white border-[#4A154B]/20 shadow-sm shadow-[#4A154B]/5" 
                      : "bg-gray-50 border-gray-100 grayscale hover:grayscale-0 opacity-70 hover:opacity-100"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "p-2 rounded-xl transition-colors",
                          slackStatus?.botToken ? "bg-[#4A154B] text-white" : "bg-gray-200 text-gray-500"
                        )}>
                          <SlackIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">Slack</h4>
                          <p className="text-[10px] text-gray-500 font-medium">Real-time notifications</p>
                        </div>
                      </div>
                      {slackStatus?.botToken && (
                        <button
                          onClick={() => handleSlackAction('update', { ...slackStatus, enabled: !slackStatus.isEnabled })}
                          className={cn(
                            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                            slackStatus.isEnabled ? "bg-[#4A154B]" : "bg-gray-200"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200",
                              slackStatus.isEnabled ? "translate-x-4" : "translate-x-0"
                            )}
                          />
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight px-1">Bot User OAuth Token</label>
                        <input
                          type="password"
                          placeholder="xoxb-..."
                          defaultValue={slackStatus?.botToken || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (slackStatus?.botToken || '')) {
                              handleSlackAction('update', { 
                                botToken: e.target.value, 
                                enabled: true 
                              })
                            }
                          }}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-[#4A154B]/20 focus:border-[#4A154B] outline-none transition-all"
                        />
                      </div>

                      {slackStatus?.botToken && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight px-1">Target Channel</label>
                            <select
                              value={slackStatus?.channelId || ''}
                              onChange={(e) => {
                                const channel = slackStatus.availableChannels.find((c: any) => c.id === e.target.value);
                                handleSlackAction('update', {
                                  ...slackStatus,
                                  channelId: e.target.value,
                                  channelName: channel?.name || '',
                                  enabled: true
                                })
                              }}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-[#4A154B]/20 focus:border-[#4A154B] outline-none transition-all"
                            >
                              <option value="">Select a channel...</option>
                              {slackStatus.availableChannels?.map((ch: any) => (
                                <option key={ch.id} value={ch.id}>#{ch.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="pt-2 flex flex-col gap-2">
                             <div className="relative group/create">
                               <input 
                                 type="text" 
                                 placeholder="Create new channel..."
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                     handleSlackAction('create-channel', { 
                                       botToken: slackStatus.botToken, 
                                       name: (e.target as HTMLInputElement).value 
                                     });
                                     (e.target as HTMLInputElement).value = '';
                                   }
                                 }}
                                 className="w-full pl-3 pr-10 py-1.5 bg-white border border-gray-100 rounded-lg text-[10px] outline-none focus:border-[#4A154B]"
                               />
                               <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 text-[9px] font-bold uppercase">Enter</div>
                             </div>
                             
                             <button
                               onClick={() => handleSlackAction('disconnect')}
                               className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors pt-1 px-1 text-left"
                             >
                               Disconnect Slack
                             </button>
                          </div>
                        </>
                      )}
                      
                      <p className="text-[9px] px-1 leading-tight mt-1 truncate" style={{ color: currentTheme.textMuted }}>
                        {slackStatus?.botToken ? "Connected. Select or create a channel." : "Get your Bot Token from Slack App settings."}
                      </p>
                    </div>
                  </div>
                </div>
                </div>{/* closes pt-2 space-y-3 */}
              </div>{/* closes p-3 bg-gray-50 integrations container */}
            </div>{/* closes outer integrations wrapper */}

            {/* ─── EMAIL NOTIFICATIONS ─── */}
            <div className="rounded-2xl border shadow-xl overflow-hidden group transition-all duration-500" style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: `${currentTheme.primary}08`, borderColor: currentTheme.border }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110" style={{ backgroundColor: currentTheme.primary }}>
                    <Mail className="w-5 h-5" style={{ color: currentTheme.lightMode ? 'white' : 'black' }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black tracking-tight" style={{ color: currentTheme.text }}>Email Notifications</h4>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: currentTheme.primary }}>Inbox Alerts</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${emailStatus?.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className="text-[10px] font-bold text-gray-400">{emailStatus?.isEnabled ? 'ACTIVE' : 'OFF'}</span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-tight px-1" style={{ color: currentTheme.textMuted }}>SMTP Host</label>
                  <input
                    type="text"
                    placeholder="smtp.gmail.com"
                    defaultValue={emailStatus?.host || 'smtp.gmail.com'}
                    onBlur={(e) => {
                      if (e.target.value !== (emailStatus?.host || '')) {
                        handleEmailAction('update', { ...emailStatus, host: e.target.value })
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none transition-all"
                    style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.border, color: currentTheme.text }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight px-1">Port</label>
                    <input
                      type="number"
                      placeholder="465"
                      defaultValue={emailStatus?.port || 465}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value)
                        if (val !== emailStatus?.port) {
                          handleEmailAction('update', { ...emailStatus, port: val })
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight px-1">Sender Email</label>
                    <input
                      type="email"
                      placeholder="you@gmail.com"
                      defaultValue={emailStatus?.email || ''}
                      onBlur={(e) => {
                        if (e.target.value !== (emailStatus?.email || '')) {
                          handleEmailAction('update', { ...emailStatus, email: e.target.value })
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight px-1">App Password</label>
                  <input
                    type="password"
                    placeholder="Google App Password"
                    defaultValue={emailStatus?.appPassword || ''}
                    onBlur={(e) => {
                      if (e.target.value && e.target.value !== '********') {
                        handleEmailAction('update', { ...emailStatus, appPassword: e.target.value })
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                  />
                  <p className="text-[9px] text-gray-400 px-1 italic">Use a Google App Password, not your regular password.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight px-1">Recipients</label>
                  <input
                    type="text"
                    placeholder="admin@email.com, team@email.com"
                    defaultValue={emailStatus?.toList || ''}
                    onBlur={(e) => {
                      if (e.target.value !== (emailStatus?.toList || '')) {
                        handleEmailAction('update', { ...emailStatus, toList: e.target.value })
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                  />
                </div>

                <div className="pt-1 flex flex-col gap-2">
                  {emailStatus?.email && (
                    <button
                      onClick={() => handleEmailAction('test-email', emailStatus)}
                      disabled={loading}
                      className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Mail className="w-3 h-3" />
                      Send Test Email
                    </button>
                  )}
                  <button
                    onClick={() => handleEmailAction('update', { ...emailStatus, enabled: !emailStatus?.isEnabled })}
                    disabled={!emailStatus?.email || loading}
                    className={cn(
                      "w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40",
                      emailStatus?.isEnabled
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    )}
                  >
                    {emailStatus?.isEnabled ? (
                      <>
                        <RefreshCcw className="w-3 h-3" />
                        Deactivate Email
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        Activate Email Notifications
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </motion.div>
        )}
        
        {sidebarTab === 'share' && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 pb-10">
            <div>
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest mb-3 px-1" style={{ color: currentTheme.textMuted }}>Publish & Share</h3>
              <div className="p-4 border rounded-2xl space-y-4 shadow-sm" style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: currentTheme.primary }}>
                  <Globe className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Public Link</span>
                </div>
                
                <div className="relative group">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/f/${form?.id}`}
                    className="w-full pr-10 pl-3 py-2 border rounded-xl text-xs font-mono outline-none"
                    style={{ backgroundColor: `${currentTheme.bg}80`, borderColor: currentTheme.border, color: currentTheme.textMuted }}
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/f/${form?.id}`)
                      alert('Link copied to clipboard!')
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 transition-all rounded-lg"
                    style={{ color: currentTheme.textMuted }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed italic">
                  Anyone with this link can view and fill out your beautiful form.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest mb-3 px-1" style={{ color: currentTheme.textMuted }}>Embed on your site</h3>
              <div className="p-4 border rounded-2xl space-y-4 shadow-sm" style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: currentTheme.primary }}>
                  <Code className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Iframe Embed</span>
                </div>
                
                <div className="relative">
                  <textarea
                    readOnly
                    rows={4}
                    value={`<iframe \n  src="${typeof window !== 'undefined' ? window.location.origin : ''}/f/${form?.id}" \n  width="100%" \n  height="600px" \n  frameborder="0" \n  style="border:none; border-radius:12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">\n</iframe>`}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-[10px] font-mono text-gray-500 outline-none resize-none leading-relaxed"
                  />
                  <button 
                    onClick={() => {
                      const code = `<iframe src="${window.location.origin}/f/${form?.id}" width="100%" height="600px" frameborder="0" style="border:none; border-radius:12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"></iframe>`;
                      navigator.clipboard.writeText(code)
                      alert('Embed code copied!')
                    }}
                    className="absolute right-3 bottom-3 p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all shadow-sm"
                    title="Copy Code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200/50">
                  <div className="flex items-center gap-2 text-pink-600 mb-2">
                    <Code className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Script Embed</span>
                  </div>
                  <div className="relative">
                    <textarea
                      readOnly
                      rows={4}
                      value={`<div id="form-container"></div>\n<script>\n  (function() {\n    const div = document.getElementById('form-container');\n    const ifr = document.createElement('iframe');\n    ifr.src = "${typeof window !== 'undefined' ? window.location.origin : ''}/f/${form?.id}";\n    ifr.style.width = '100%';\n    ifr.style.height = '600px';\n    ifr.style.border = 'none';\n    div.appendChild(ifr);\n  })();\n</script>`}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-[10px] font-mono text-gray-500 outline-none resize-none leading-relaxed"
                    />
                    <button 
                      onClick={() => {
                        const code = `<div id="form-container"></div><script>(function(){const div=document.getElementById('form-container');const ifr=document.createElement('iframe');ifr.src="${window.location.origin}/f/${form?.id}";ifr.style.width='100%';ifr.style.height='600px';ifr.style.border='none';div.appendChild(ifr);})();</script>`;
                        navigator.clipboard.writeText(code)
                        alert('Script code copied!')
                      }}
                      className="absolute right-3 bottom-3 p-2 bg-pink-50 text-pink-600 hover:bg-pink-600 hover:text-white rounded-lg transition-all shadow-sm"
                      title="Copy Code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </aside>
  )
}
