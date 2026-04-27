'use client'

import { useState } from 'react'
import { Copy, Check, Sparkles, Code, Palette, Layers, Cpu, Image, Settings, Layout, Type, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const CopyBtn = ({ text, id, copied, onCopy }: { text: string; id: string; copied: string | null; onCopy: (t: string, id: string) => void }) => (
  <button onClick={() => onCopy(text, id)} className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-all border border-white/5 backdrop-blur-md">
    {copied === id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
  </button>
)

const TokenRow = ({ label, value, color = 'text-indigo-600' }: { label: string; value: string; color?: string }) => (
  <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
    <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
    <span className={`text-[10px] font-bold ${color}`}>{value}</span>
  </div>
)

export default function JSONGuidePage() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const fullSample = `{
  "name": "Elite Event Registration",
  "description": "Join our exclusive tech conference.",
  "logo_url": "https://img.logoipsum.com/296.svg",
  "cover_image_url": "https://images.unsplash.com/photo-1540575861501-7ce0e220beff?w=2070",
  "fields": [
    { "label": "Full Name", "type": "text", "required": true, "placeholder": "John Doe" },
    { "label": "Email", "type": "email", "required": true },
    { "label": "Age", "type": "number", "placeholder": "25" },
    { "label": "Bio", "type": "textarea", "placeholder": "Tell us about yourself..." },
    { "label": "Department", "type": "select", "options": ["Engineering", "Design", "Marketing"] },
    { "label": "Skills", "type": "multiselect", "options": ["React", "Python", "Figma"] },
    { "label": "Experience", "type": "radio", "options": ["Junior", "Mid", "Senior"] },
    { "label": "Agree to Terms", "type": "checkbox" },
    { "label": "Rating", "type": "rating", "required": true },
    { "label": "Resume", "type": "file" }
  ],
  "customStyles": {
    "accentColor": "#6366f1",
    "headerBg": "#1e1b4b",
    "headerText": "#ffffff",
    "bodyBg": "#ffffff",
    "bodyText": "#1f2937",
    "labelColor": "#374151",
    "inputBg": "#f9fafb",
    "inputBorderColor": "#e5e7eb",
    "pageBgColor": "#f5f3ff",
    "layout": "split",
    "layoutSide": "left",
    "borderRadius": 24,
    "containerWidth": 720,
    "fontFamily": "Space Grotesk",
    "formScale": 1
  },
  "settings": {
    "submitButtonText": "Secure My Spot",
    "thankYouHeadline": "You're In!",
    "thankYouMessage": "Check your inbox for the magic link."
  }
}`

  const sysPrompt = `You are a Form Sync JSON expert. Generate valid JSON for the Form Sync platform.

SCHEMA:
{
  "name": "string",
  "description": "string",
  "logo_url": "image URL (optional)",
  "cover_image_url": "banner image URL (optional)",
  "fields": [
    {
      "label": "string",
      "type": "text|email|number|textarea|select|multiselect|radio|checkbox|rating|file",
      "required": true|false,
      "placeholder": "string (optional)",
      "options": ["array of strings - required for select/multiselect/radio/checkbox"]
    }
  ],
  "customStyles": {
    "accentColor": "#HEX (button & link color)",
    "headerBg": "#HEX (header background)",
    "headerText": "#HEX (header text)",
    "bodyBg": "#HEX (form card background)",
    "bodyText": "#HEX (body text color)",
    "labelColor": "#HEX (field label color)",
    "inputBg": "#HEX (input background)",
    "inputBorderColor": "#HEX (input border)",
    "pageBgColor": "#HEX (full page background)",
    "layout": "centered|split|sidebar",
    "layoutSide": "left|right (for split/sidebar)",
    "borderRadius": 0-64,
    "containerWidth": 320-1200,
    "fontFamily": "Inter|Roboto|Outfit|Space Grotesk|DM Sans|Manrope|Playfair Display",
    "formScale": 0.5-1.5
  },
  "settings": {
    "submitButtonText": "string",
    "thankYouHeadline": "string",
    "thankYouMessage": "string"
  }
}

RULES:
- Always return ONLY valid JSON, no markdown
- Use real placeholder text
- Choose harmonious color palettes
- Pick fonts that match the form's mood

User Request: `

  return (
    <div className="min-h-screen bg-[#fafafb]">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">AI Form Builder Guide</h1>
        </div>
        <Link href="/dashboard/forms/new" className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm">
          Import JSON →
        </Link>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-10">
        {/* Hero */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest mb-4">
            <Sparkles className="w-4 h-4" /> Complete Reference
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Build Forms with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">AI + JSON</span>
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-3xl leading-relaxed">
            Describe any form to ChatGPT, get JSON back, paste it into Form Sync — done. This guide covers <strong>every field type, every color, every layout option</strong>.
          </p>
        </div>

        {/* 3-Step Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {[
            { step: '1', title: 'Copy the System Prompt', desc: 'Give ChatGPT the schema so it knows how to generate forms.', color: 'bg-indigo-100 text-indigo-600' },
            { step: '2', title: 'Describe Your Form', desc: '"Make a dark-mode pizza order form with ratings and file upload"', color: 'bg-pink-100 text-pink-600' },
            { step: '3', title: 'Paste the JSON', desc: 'Click Import JSON on the New Form page and paste it in.', color: 'bg-emerald-100 text-emerald-600' },
          ].map(s => (
            <div key={s.step} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center font-black text-lg mb-4`}>{s.step}</div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-8">

            {/* System Prompt */}
            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center"><Cpu className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">System Prompt for ChatGPT</h3>
                  <p className="text-sm text-gray-400">Paste this once, then just describe your form.</p>
                </div>
              </div>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-300 p-6 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-gray-800 max-h-[400px] overflow-y-auto custom-scrollbar">{sysPrompt}</pre>
                <CopyBtn text={sysPrompt} id="prompt" copied={copied} onCopy={copy} />
              </div>
            </section>

            {/* Field Types */}
            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center"><Layers className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">All 10 Field Types</h3>
                  <p className="text-sm text-gray-400">Every input your form can have.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { type: 'text', desc: 'Short text input', example: '"placeholder": "John Doe"' },
                  { type: 'email', desc: 'Email with validation', example: '"placeholder": "john@co.com"' },
                  { type: 'number', desc: 'Numeric input', example: '"placeholder": "25"' },
                  { type: 'textarea', desc: 'Multi-line paragraph', example: '"placeholder": "Tell us..."' },
                  { type: 'select', desc: 'Dropdown menu', example: '"options": ["A", "B"]' },
                  { type: 'multiselect', desc: 'Pick multiple items', example: '"options": ["X", "Y"]' },
                  { type: 'radio', desc: 'Choose one option', example: '"options": ["Yes", "No"]' },
                  { type: 'checkbox', desc: 'Toggle / agree box', example: '"required": true' },
                  { type: 'rating', desc: '5-star satisfaction', example: '"required": true' },
                  { type: 'file', desc: 'File upload area', example: '"required": false' },
                ].map(f => (
                  <div key={f.type} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <code className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 mt-0.5">{f.type}</code>
                    <div>
                      <div className="text-sm font-bold text-gray-800">{f.desc}</div>
                      <div className="text-[10px] font-mono text-gray-400 mt-0.5">{f.example}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Branding & Images */}
            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center"><Image className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Branding & Images</h3>
                  <p className="text-sm text-gray-400">Add logos, cover banners, and background images.</p>
                </div>
              </div>
              <div className="space-y-3">
                <TokenRow label="logo_url" value="Direct URL to your logo (SVG/PNG)" color="text-amber-600" />
                <TokenRow label="cover_image_url" value="Banner image above the form header" color="text-amber-600" />
                <TokenRow label="pageBgImage (in customStyles)" value="Full-page background image URL" color="text-amber-600" />
                <TokenRow label="pageBgBlur (in customStyles)" value="0–40 (blur the background image)" color="text-amber-600" />
                <TokenRow label="pageBgOverlayOpacity" value="0–100 (darken bg overlay %)" color="text-amber-600" />
              </div>
            </section>

            {/* Colors */}
            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center"><Palette className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">All Color Tokens</h3>
                  <p className="text-sm text-gray-400">Inside <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">customStyles</code></p>
                </div>
              </div>
              <div className="space-y-2">
                <TokenRow label="accentColor" value="Buttons, links, active states" color="text-pink-600" />
                <TokenRow label="headerBg" value="Header / branding section background" color="text-pink-600" />
                <TokenRow label="headerText" value="Title & description color" color="text-pink-600" />
                <TokenRow label="bodyBg" value="Form card surface color" color="text-pink-600" />
                <TokenRow label="bodyText" value="Body text & placeholder base" color="text-pink-600" />
                <TokenRow label="labelColor" value="Field label color" color="text-pink-600" />
                <TokenRow label="inputBg" value="Input field background" color="text-pink-600" />
                <TokenRow label="inputBorderColor" value="Input field border" color="text-pink-600" />
                <TokenRow label="pageBgColor" value="Full page background color" color="text-pink-600" />
              </div>
            </section>

            {/* Layout & Sizing */}
            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center"><Layout className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Layout & Sizing</h3>
                  <p className="text-sm text-gray-400">Control form structure and dimensions.</p>
                </div>
              </div>
              <div className="space-y-2">
                <TokenRow label="layout" value="centered | split | sidebar" color="text-sky-600" />
                <TokenRow label="layoutSide" value="left | right (for split/sidebar)" color="text-sky-600" />
                <TokenRow label="borderRadius" value="0–64 (rounded corners in px)" color="text-sky-600" />
                <TokenRow label="containerWidth" value="320–1200 (form width in px)" color="text-sky-600" />
                <TokenRow label="formScale" value="0.5–1.5 (zoom scale multiplier)" color="text-sky-600" />
              </div>
            </section>

            {/* Typography */}
            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center"><Type className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Typography</h3>
                  <p className="text-sm text-gray-400">Available Google Fonts.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Inter', 'Roboto', 'Outfit', 'Space Grotesk', 'DM Sans', 'Manrope', 'Playfair Display', 'Poppins', 'Lato', 'Nunito'].map(f => (
                  <span key={f} className="bg-gray-50 border border-gray-100 px-3 py-2 rounded-lg text-xs font-bold text-gray-600">{f}</span>
                ))}
              </div>
            </section>

            {/* Settings */}
            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center"><Settings className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Post-Submission Settings</h3>
                  <p className="text-sm text-gray-400">Inside <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">settings</code></p>
                </div>
              </div>
              <div className="space-y-2">
                <TokenRow label="submitButtonText" value='"Register Now", "Send", "Join Waitlist"' color="text-rose-600" />
                <TokenRow label="thankYouHeadline" value='"Thank You!", "You\'re In!", "All Done!"' color="text-rose-600" />
                <TokenRow label="thankYouMessage" value='"Your response was submitted successfully."' color="text-rose-600" />
              </div>
            </section>
          </div>

          {/* Right Sidebar — Sticky Sample */}
          <div className="lg:col-span-5">
            <div className="sticky top-20 space-y-6">
              <div className="bg-indigo-600 rounded-[2rem] p-7 text-white shadow-2xl shadow-indigo-200">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-black tracking-tight">Full Sample JSON</h3>
                  <button onClick={() => copy(fullSample, 'json')} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-all">
                    {copied === 'json' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="bg-gray-900/50 rounded-2xl p-5 font-mono text-[10px] text-indigo-100 border border-white/10 leading-relaxed max-h-[520px] overflow-y-auto custom-scrollbar">
                  <pre>{fullSample}</pre>
                </div>
                <p className="mt-5 text-[11px] font-bold opacity-70 italic leading-relaxed">
                  This sample creates a split-layout form with a logo, cover image, 10 fields, full color branding, Space Grotesk font, and a custom thank-you screen.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h4 className="text-sm font-black text-gray-900 mb-3 uppercase tracking-widest">Quick Tips</h4>
                <ul className="space-y-2 text-xs text-gray-500 font-medium">
                  <li className="flex gap-2"><span className="text-indigo-500 font-black">→</span> Use Unsplash URLs for free cover images</li>
                  <li className="flex gap-2"><span className="text-indigo-500 font-black">→</span> logoipsum.com for placeholder logos</li>
                  <li className="flex gap-2"><span className="text-indigo-500 font-black">→</span> <code className="bg-gray-50 px-1 rounded">split</code> layout looks best for branded forms</li>
                  <li className="flex gap-2"><span className="text-indigo-500 font-black">→</span> All fields are optional except <code className="bg-gray-50 px-1 rounded">name</code> and <code className="bg-gray-50 px-1 rounded">fields</code></li>
                  <li className="flex gap-2"><span className="text-indigo-500 font-black">→</span> You can edit everything after import too!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
      `}</style>
    </div>
  )
}
