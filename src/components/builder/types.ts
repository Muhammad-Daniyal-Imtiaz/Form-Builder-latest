export type FieldType = 'text' | 'email' | 'number' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'file' | 'multifile' | 'rating';


export interface FieldLogicRule {
  id: string;
  condition: 'equals' | 'not_equals' | 'contains';
  value: string;
  action: 'show' | 'hide' | 'jump_to';
  targetId: string;
}

export interface FormField {
  id: string; // Crucial for dnd-kit. Generate via crypto.randomUUID() or a simple counter.
  label: string;
  type: FieldType;
  required: boolean;
  options: string[] | null;
  placeholder: string | null;
  fileMode?: 'upload' | 'link';
  logicRules?: FieldLogicRule[];
  pageIndex: number;
}

export interface CustomStyles {
  headerBg: string;
  headerText: string;
  bodyBg: string;
  bodyText: string;
  accentColor: string;
  buttonText: string;
  fontFamily: string;
  inputBorderColor: string;
  inputBg: string;
  labelColor: string;
  containerWidth: number;
  containerPadding: number;
  borderRadius: number;
  boxShadow: string;
  fontSizeBase: number;
  fieldSpacing: number;
  labelWeight: 'normal' | 'semibold' | 'bold';
  fontWeight: 'normal' | 'semibold' | 'bold';
  buttonStyle: 'rounded' | 'pill' | 'square';
  inputVariant: 'outline' | 'filled' | 'underline';
  logoHeight: number;
  logoAlignment: 'left' | 'center' | 'right';
  logoBorderRadius: number;
  coverHeight: number;
  pageBgColor: string;
  pageBgImage: string;
  pageBgBlur: number;
  pageBgOverlayOpacity: number;
  formScale: number;
  headerAlignment: 'left' | 'center' | 'right';
  coverImageFit: 'cover' | 'contain' | 'fill';
  layout: 'centered' | 'split' | 'sidebar';
  layoutSide: 'left' | 'right';
  secondaryImageUrl: string;
  secondaryImageLink: string;
}

export interface FormSettings {
  submitButtonText: string;
  thankYouHeadline: string;
  thankYouMessage: string;
  redirectUrl: string;
  integrations?: {
    googleSheets?: {
      connected: boolean;
      spreadsheetId?: string;
      spreadsheetUrl?: string;
      sheetName?: string;
    };
  };
}

export const DEFAULT_SETTINGS: FormSettings = {
  submitButtonText: 'Submit Form',
  thankYouHeadline: 'Thank You!',
  thankYouMessage: 'Your response has been successfully submitted.',
  redirectUrl: '',
}

export const AVAILABLE_FONTS = [
  'Inter',
  'Roboto',
  'Playfair Display',
  'Outfit',
  'Space Grotesk',
  'DM Sans',
  'Plus Jakarta Sans',
  'Inconsolata'
]

export const DEFAULT_STYLES: CustomStyles = {
  headerBg: '#4f46e5',
  headerText: '#ffffff',
  bodyBg: '#ffffff',
  bodyText: '#111827',
  accentColor: '#4f46e5',
  buttonText: '#ffffff',
  fontFamily: 'Inter',
  inputBorderColor: '#e5e7eb',
  inputBg: '#f9fafb',
  labelColor: '#111827',
  containerWidth: 640,
  containerPadding: 40,
  borderRadius: 16,
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  fontSizeBase: 16,
  fieldSpacing: 32,
  labelWeight: 'bold',
  fontWeight: 'normal',
  buttonStyle: 'rounded',
  inputVariant: 'outline',
  logoHeight: 48,
  logoAlignment: 'left',
  logoBorderRadius: 8,
  coverHeight: 240,
  pageBgColor: '#f8fafc',
  pageBgImage: '',
  pageBgBlur: 0,
  pageBgOverlayOpacity: 0,
  formScale: 1,
  headerAlignment: 'left',
  coverImageFit: 'cover',
  layout: 'centered',
  layoutSide: 'left',
  secondaryImageUrl: '',
  secondaryImageLink: '',
};

export const PRESET_THEMES: Record<string, Partial<CustomStyles>> = {
  'minimal-light': { ...DEFAULT_STYLES, headerBg: '#ffffff', headerText: '#111827', bodyBg: '#ffffff', pageBgColor: '#f9fafb', accentColor: '#000000', fontFamily: 'Inter', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderRadius: 8, },
  'midnight-glass': { ...DEFAULT_STYLES, pageBgColor: '#0a0a0a', bodyBg: 'rgba(25, 25, 25, 0.65)', headerBg: 'transparent', headerText: '#ffffff', bodyText: '#e5e5e5', labelColor: '#ffffff', inputBg: 'rgba(255, 255, 255, 0.05)', inputBorderColor: 'rgba(255, 255, 255, 0.1)', accentColor: '#8b5cf6', fontFamily: 'Outfit', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', borderRadius: 24, },
  'notion-style': { ...DEFAULT_STYLES, headerBg: '#ffffff', headerText: '#37352f', bodyBg: '#ffffff', pageBgColor: '#ffffff', bodyText: '#37352f', labelColor: '#37352f', inputBg: '#ffffff', inputBorderColor: '#e5e5e5', accentColor: '#2eaadc', fontFamily: 'Playfair Display', boxShadow: 'none', borderRadius: 4, containerWidth: 700, },
  'brutalist': { ...DEFAULT_STYLES, headerBg: '#ffeb3b', headerText: '#000000', bodyBg: '#ffffff', pageBgColor: '#e0e0e0', bodyText: '#000000', labelColor: '#000000', inputBg: '#ffffff', inputBorderColor: '#000000', accentColor: '#ff1744', fontFamily: 'Space Grotesk', boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)', borderRadius: 0, containerWidth: 640, },
  'ocean-breeze': { ...DEFAULT_STYLES, pageBgColor: '#e0f2fe', bodyBg: '#ffffff', headerBg: '#0ea5e9', headerText: '#ffffff', bodyText: '#0f172a', labelColor: '#0369a1', inputBg: '#f0f9ff', inputBorderColor: '#bae6fd', accentColor: '#0ea5e9', fontFamily: 'Plus Jakarta Sans', boxShadow: '0 20px 25px -5px rgba(14, 165, 233, 0.1)', borderRadius: 32, },
  'cyberpunk-neon': { ...DEFAULT_STYLES, pageBgColor: '#050511', bodyBg: '#0f0f1a', headerBg: '#ff003c', headerText: '#ffffff', bodyText: '#cbd5e1', labelColor: '#00f0ff', inputBg: '#000000', inputBorderColor: '#ff003c', accentColor: '#00f0ff', fontFamily: 'Space Grotesk', boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)', borderRadius: 0, },
  'pastel-dreams': { ...DEFAULT_STYLES, pageBgColor: '#fdf4ff', bodyBg: '#ffffff', headerBg: '#fbcfe8', headerText: '#831843', bodyText: '#4c1d95', labelColor: '#9d174d', inputBg: '#fff1f2', inputBorderColor: '#fce7f3', accentColor: '#d946ef', fontFamily: 'Outfit', boxShadow: '0 10px 15px -3px rgba(236, 72, 153, 0.1)', borderRadius: 24, },
  'gotham-dark': { ...DEFAULT_STYLES, pageBgColor: '#000000', bodyBg: '#111111', headerBg: '#1f2937', headerText: '#facc15', bodyText: '#9ca3af', labelColor: '#e5e7eb', inputBg: '#1f2937', inputBorderColor: '#374151', accentColor: '#facc15', fontFamily: 'Inter', boxShadow: '0 4px 6px rgba(250, 204, 21, 0.1)', borderRadius: 8, },
  'nature-botanical': { ...DEFAULT_STYLES, pageBgColor: '#f0fdf4', bodyBg: '#ffffff', headerBg: '#14532d', headerText: '#f0fdf4', bodyText: '#064e3b', labelColor: '#166534', inputBg: '#f0fdfa', inputBorderColor: '#a7f3d0', accentColor: '#059669', fontFamily: 'Playfair Display', boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.1)', borderRadius: 12, },
  'web3-glass': { ...DEFAULT_STYLES, pageBgColor: '#0f172a', bodyBg: 'rgba(30, 41, 59, 0.7)', headerBg: 'transparent', headerText: '#f8fafc', bodyText: '#cbd5e1', labelColor: '#818cf8', inputBg: 'rgba(255,255,255,0.05)', inputBorderColor: 'rgba(129, 140, 248, 0.3)', accentColor: '#6366f1', fontFamily: 'Inter', boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2)', borderRadius: 16, },
  'vintage-typewriter': { ...DEFAULT_STYLES, pageBgColor: '#fef3c7', bodyBg: '#fffbeb', headerBg: '#fffbeb', headerText: '#1e293b', bodyText: '#334155', labelColor: '#0f172a', inputBg: '#fef3c7', inputBorderColor: '#d97706', accentColor: '#9a3412', fontFamily: 'Inconsolata', boxShadow: '0 2px 4px rgba(154, 52, 18, 0.1)', borderRadius: 2, },
  'cherry-blossom': { ...DEFAULT_STYLES, pageBgColor: '#ffe4e6', bodyBg: '#ffffff', headerBg: '#fda4af', headerText: '#ffffff', bodyText: '#881337', labelColor: '#e11d48', inputBg: '#fff1f2', inputBorderColor: '#fecdd3', accentColor: '#f43f5e', fontFamily: 'Plus Jakarta Sans', boxShadow: '0 4px 14px rgba(244, 63, 94, 0.15)', borderRadius: 32, },
  'dune-desert': { ...DEFAULT_STYLES, pageBgColor: '#ffedd5', bodyBg: '#fff7ed', headerBg: '#c2410c', headerText: '#fff7ed', bodyText: '#431407', labelColor: '#9a3412', inputBg: '#ffedd5', inputBorderColor: '#fed7aa', accentColor: '#ea580c', fontFamily: 'Playfair Display', boxShadow: '0 10px 15px -3px rgba(194, 65, 12, 0.1)', borderRadius: 0, },
  'tokyo-night': { ...DEFAULT_STYLES, pageBgColor: '#1e1e2e', bodyBg: '#181825', headerBg: '#11111b', headerText: '#cba6f7', bodyText: '#bac2de', labelColor: '#f38ba8', inputBg: '#313244', inputBorderColor: '#45475a', accentColor: '#89b4fa', fontFamily: 'Space Grotesk', boxShadow: '0 4px 6px rgba(137, 180, 250, 0.1)', borderRadius: 16, },
  'startup-saas': { ...DEFAULT_STYLES, pageBgColor: '#f8fafc', bodyBg: '#ffffff', headerBg: '#3b82f6', headerText: '#ffffff', bodyText: '#334155', labelColor: '#0f172a', inputBg: '#ffffff', inputBorderColor: '#e2e8f0', accentColor: '#3b82f6', fontFamily: 'Inter', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.1)', borderRadius: 12, },
  'monochrome-slate': { ...DEFAULT_STYLES, pageBgColor: '#e2e8f0', bodyBg: '#f8fafc', headerBg: '#475569', headerText: '#ffffff', bodyText: '#1e293b', labelColor: '#0f172a', inputBg: '#ffffff', inputBorderColor: '#cbd5e1', accentColor: '#334155', fontFamily: 'DM Sans', boxShadow: 'none', borderRadius: 0, },
  'soft-blush': { ...DEFAULT_STYLES, pageBgColor: '#fff1f2', bodyBg: '#ffffff', headerBg: '#ffffff', headerText: '#9f1239', bodyText: '#4c0519', labelColor: '#881337', inputBg: '#fff1f2', inputBorderColor: '#fecdd3', accentColor: '#e11d48', fontFamily: 'Outfit', boxShadow: '0 10px 25px rgba(225, 29, 72, 0.05)', borderRadius: 24, },
  'neo-brutalist-blue': { ...DEFAULT_STYLES, pageBgColor: '#bfdbfe', bodyBg: '#ffffff', headerBg: '#2563eb', headerText: '#ffffff', bodyText: '#000000', labelColor: '#1e3a8a', inputBg: '#ffffff', inputBorderColor: '#000000', accentColor: '#1d4ed8', fontFamily: 'Space Grotesk', boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)', borderRadius: 4, },
  'corporate-trust': { ...DEFAULT_STYLES, pageBgColor: '#f3f4f6', bodyBg: '#ffffff', headerBg: '#1e3a8a', headerText: '#ffffff', bodyText: '#374151', labelColor: '#111827', inputBg: '#f9fafb', inputBorderColor: '#d1d5db', accentColor: '#1d4ed8', fontFamily: 'Inter', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderRadius: 4, },
  'y2k-plastic': { ...DEFAULT_STYLES, pageBgColor: '#f0abfc', bodyBg: '#ffffff', headerBg: '#e879f9', headerText: '#ffffff', bodyText: '#701a75', labelColor: '#a21caf', inputBg: '#fdf4ff', inputBorderColor: '#f0abfc', accentColor: '#06b6d4', fontFamily: 'Outfit', boxShadow: '0 10px 20px rgba(232, 121, 249, 0.3)', borderRadius: 32, },
  'nordic-frost': { ...DEFAULT_STYLES, pageBgColor: '#f8fafc', bodyBg: '#ffffff', headerBg: '#e2e8f0', headerText: '#0f172a', bodyText: '#334155', labelColor: '#1e293b', inputBg: '#ffffff', inputBorderColor: '#f1f5f9', accentColor: '#38bdf8', fontFamily: 'Plus Jakarta Sans', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', borderRadius: 8, },
  'halloween-spooky': { ...DEFAULT_STYLES, pageBgColor: '#111827', bodyBg: '#1f2937', headerBg: '#ea580c', headerText: '#ffffff', bodyText: '#d1d5db', labelColor: '#f97316', inputBg: '#374151', inputBorderColor: '#ea580c', accentColor: '#f97316', fontFamily: 'Space Grotesk', boxShadow: '0 4px 20px rgba(234, 88, 12, 0.2)', borderRadius: 12, },
  'luxury-gold': { ...DEFAULT_STYLES, pageBgColor: '#171717', bodyBg: '#262626', headerBg: '#fbbf24', headerText: '#171717', bodyText: '#e5e5e5', labelColor: '#fcd34d', inputBg: '#404040', inputBorderColor: '#fbbf24', accentColor: '#fbbf24', fontFamily: 'Playfair Display', boxShadow: '0 10px 25px rgba(251, 191, 36, 0.1)', borderRadius: 0, },
  'coffee-shop': { ...DEFAULT_STYLES, pageBgColor: '#f5f5f4', bodyBg: '#ffffff', headerBg: '#78350f', headerText: '#f5f5f4', bodyText: '#44403c', labelColor: '#78350f', inputBg: '#fafaf9', inputBorderColor: '#e7e5e4', accentColor: '#92400e', fontFamily: 'Playfair Display', boxShadow: '0 4px 6px rgba(120, 53, 15, 0.1)', borderRadius: 8, },
  'deep-ocean': { ...DEFAULT_STYLES, pageBgColor: '#083344', bodyBg: '#164e63', headerBg: '#06b6d4', headerText: '#ffffff', bodyText: '#cffafe', labelColor: '#67e8f9', inputBg: '#083344', inputBorderColor: '#06b6d4', accentColor: '#22d3ee', fontFamily: 'Plus Jakarta Sans', boxShadow: '0 10px 30px rgba(6, 182, 212, 0.2)', borderRadius: 16, },
  'dracula-mode': { ...DEFAULT_STYLES, pageBgColor: '#282a36', bodyBg: '#44475a', headerBg: '#6272a4', headerText: '#f8f8f2', bodyText: '#f8f8f2', labelColor: '#ff79c6', inputBg: '#282a36', inputBorderColor: '#6272a4', accentColor: '#bd93f9', fontFamily: 'Inconsolata', boxShadow: '0 4px 15px rgba(189, 147, 249, 0.1)', borderRadius: 8, },
  'solarized-light': { ...DEFAULT_STYLES, pageBgColor: '#fdf6e3', bodyBg: '#eee8d5', headerBg: '#2aa198', headerText: '#fdf6e3', bodyText: '#657b83', labelColor: '#586e75', inputBg: '#fdf6e3', inputBorderColor: '#93a1a1', accentColor: '#cb4b16', fontFamily: 'DM Sans', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 4, },
  'solarized-dark': { ...DEFAULT_STYLES, pageBgColor: '#002b36', bodyBg: '#073642', headerBg: '#268bd2', headerText: '#fdf6e3', bodyText: '#839496', labelColor: '#93a1a1', inputBg: '#002b36', inputBorderColor: '#586e75', accentColor: '#d33682', fontFamily: 'DM Sans', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', borderRadius: 4, },
  'high-contrast': { ...DEFAULT_STYLES, pageBgColor: '#000000', bodyBg: '#000000', headerBg: '#ffffff', headerText: '#000000', bodyText: '#ffffff', labelColor: '#ffff00', inputBg: '#000000', inputBorderColor: '#ffffff', accentColor: '#ffff00', fontFamily: 'Inter', boxShadow: 'none', borderRadius: 0, },
  'mint-fresh': { ...DEFAULT_STYLES, pageBgColor: '#ecfdf5', bodyBg: '#ffffff', headerBg: '#10b981', headerText: '#ffffff', bodyText: '#064e3b', labelColor: '#047857', inputBg: '#f0fdf4', inputBorderColor: '#a7f3d0', accentColor: '#34d399', fontFamily: 'Outfit', boxShadow: '0 10px 15px rgba(16, 185, 129, 0.1)', borderRadius: 20, },
  'sunset-gradient': { ...DEFAULT_STYLES, pageBgColor: '#fff1f2', bodyBg: '#ffffff', headerBg: '#f43f5e', headerText: '#ffffff', bodyText: '#4c0519', labelColor: '#e11d48', inputBg: '#fff1f2', inputBorderColor: '#fda4af', accentColor: '#f59e0b', fontFamily: 'Plus Jakarta Sans', boxShadow: '0 10px 25px rgba(244, 63, 94, 0.15)', borderRadius: 16, },
  'midnight-purple': { ...DEFAULT_STYLES, pageBgColor: '#17052a', bodyBg: '#2b0a46', headerBg: '#5b21b6', headerText: '#ffffff', bodyText: '#ddd6fe', labelColor: '#c4b5fd', inputBg: '#1e0735', inputBorderColor: '#7c3aed', accentColor: '#a78bfa', fontFamily: 'Space Grotesk', boxShadow: '0 10px 30px rgba(139, 92, 246, 0.2)', borderRadius: 12, },
  'sapphire-glow': { ...DEFAULT_STYLES, pageBgColor: '#020617', bodyBg: '#0f172a', headerBg: '#1d4ed8', headerText: '#ffffff', bodyText: '#bfdbfe', labelColor: '#60a5fa', inputBg: '#020617', inputBorderColor: '#2563eb', accentColor: '#3b82f6', fontFamily: 'Outfit', boxShadow: '0 0 30px rgba(59, 130, 246, 0.15)', borderRadius: 16, },
  'ruby-red': { ...DEFAULT_STYLES, pageBgColor: '#2a040b', bodyBg: '#4c0519', headerBg: '#be123c', headerText: '#ffffff', bodyText: '#fecdd3', labelColor: '#fb7185', inputBg: '#2a040b', inputBorderColor: '#e11d48', accentColor: '#f43f5e', fontFamily: 'Inter', boxShadow: '0 4px 20px rgba(225, 29, 72, 0.2)', borderRadius: 8, },
  'forest-dark': { ...DEFAULT_STYLES, pageBgColor: '#022c22', bodyBg: '#064e3b', headerBg: '#059669', headerText: '#ffffff', bodyText: '#a7f3d0', labelColor: '#34d399', inputBg: '#022c22', inputBorderColor: '#10b981', accentColor: '#6ee7b7', fontFamily: 'Playfair Display', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)', borderRadius: 4, },
  'amber-glow': { ...DEFAULT_STYLES, pageBgColor: '#451a03', bodyBg: '#78350f', headerBg: '#d97706', headerText: '#ffffff', bodyText: '#fde68a', labelColor: '#fbbf24', inputBg: '#451a03', inputBorderColor: '#f59e0b', accentColor: '#fbbf24', fontFamily: 'Outfit', boxShadow: '0 8px 25px rgba(245, 158, 11, 0.15)', borderRadius: 12, },
  'royal-velvet': { ...DEFAULT_STYLES, pageBgColor: '#2e1065', bodyBg: '#ffffff', headerBg: '#4c1d95', headerText: '#ffffff', bodyText: '#3b0764', labelColor: '#6b21a8', inputBg: '#faf5ff', inputBorderColor: '#e9d5ff', accentColor: '#7e22ce', fontFamily: 'Playfair Display', boxShadow: '0 10px 30px rgba(126, 34, 206, 0.1)', borderRadius: 24, },
  'stark-white': { ...DEFAULT_STYLES, pageBgColor: '#ffffff', bodyBg: '#ffffff', headerBg: '#ffffff', headerText: '#000000', bodyText: '#000000', labelColor: '#000000', inputBg: '#ffffff', inputBorderColor: '#e5e5e5', accentColor: '#000000', fontFamily: 'Inter', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', borderRadius: 8, },
  'charcoal-matte': { ...DEFAULT_STYLES, pageBgColor: '#18181b', bodyBg: '#27272a', headerBg: '#3f3f46', headerText: '#ffffff', bodyText: '#d4d4d8', labelColor: '#ffffff', inputBg: '#18181b', inputBorderColor: '#52525b', accentColor: '#a1a1aa', fontFamily: 'DM Sans', boxShadow: 'none', borderRadius: 4, },
  'apple-clean': { ...DEFAULT_STYLES, pageBgColor: '#f5f5f7', bodyBg: '#ffffff', headerBg: '#ffffff', headerText: '#1d1d1f', bodyText: '#1d1d1f', labelColor: '#86868b', inputBg: '#f5f5f7', inputBorderColor: '#d2d2d7', accentColor: '#0071e3', fontFamily: 'Inter', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', borderRadius: 18, },
  'gamer-rgb': { ...DEFAULT_STYLES, pageBgColor: '#09090b', bodyBg: '#18181b', headerBg: '#3f3f46', headerText: '#a855f7', bodyText: '#d4d4d8', labelColor: '#ec4899', inputBg: '#09090b', inputBorderColor: '#8b5cf6', accentColor: '#06b6d4', fontFamily: 'Space Grotesk', boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)', borderRadius: 0, },
  'neon-synth': { ...DEFAULT_STYLES, pageBgColor: '#000000', bodyBg: '#1a0033', headerBg: '#ff007f', headerText: '#ffffff', bodyText: '#e5ccff', labelColor: '#00ffff', inputBg: '#000000', inputBorderColor: '#ff007f', accentColor: '#ff00ff', fontFamily: 'Space Grotesk', boxShadow: '0 0 15px rgba(255, 0, 127, 0.5)', borderRadius: 8, },
  'earth-tones': { ...DEFAULT_STYLES, pageBgColor: '#d7ccc8', bodyBg: '#efebe9', headerBg: '#5d4037', headerText: '#ffffff', bodyText: '#3e2723', labelColor: '#4e342e', inputBg: '#ffffff', inputBorderColor: '#bcaaa4', accentColor: '#795548', fontFamily: 'Playfair Display', boxShadow: '0 2px 8px rgba(93, 64, 55, 0.1)', borderRadius: 12, },
  'warm-sand': { ...DEFAULT_STYLES, pageBgColor: '#fdfbf7', bodyBg: '#ffffff', headerBg: '#f5ebe0', headerText: '#333333', bodyText: '#555555', labelColor: '#c2a58b', inputBg: '#fdfbf7', inputBorderColor: '#e3d5ca', accentColor: '#d4a373', fontFamily: 'Outfit', boxShadow: '0 10px 15px rgba(212, 163, 115, 0.05)', borderRadius: 20, },
  'frozen-ice': { ...DEFAULT_STYLES, pageBgColor: '#f0fdfa', bodyBg: '#ffffff', headerBg: '#ccfbf1', headerText: '#0f766e', bodyText: '#134e4a', labelColor: '#14b8a6', inputBg: '#f0fdfa', inputBorderColor: '#99f6e4', accentColor: '#0d9488', fontFamily: 'Plus Jakarta Sans', boxShadow: '0 8px 16px rgba(13, 148, 136, 0.05)', borderRadius: 16, },
  'midnight-gold': { ...DEFAULT_STYLES, pageBgColor: '#0f172a', bodyBg: '#1e293b', headerBg: '#334155', headerText: '#e2e8f0', bodyText: '#cbd5e1', labelColor: '#fbbf24', inputBg: '#0f172a', inputBorderColor: '#d97706', accentColor: '#f59e0b', fontFamily: 'Playfair Display', boxShadow: '0 8px 24px rgba(245, 158, 11, 0.1)', borderRadius: 8, },
  'candy-pop': { ...DEFAULT_STYLES, pageBgColor: '#fbcfe8', bodyBg: '#ffffff', headerBg: '#f472b6', headerText: '#ffffff', bodyText: '#831843', labelColor: '#db2777', inputBg: '#fdf2f8', inputBorderColor: '#fce7f3', accentColor: '#ec4899', fontFamily: 'Space Grotesk', boxShadow: '4px 4px 0px 0px #db2777', borderRadius: 24, },
  'emerald-city': { ...DEFAULT_STYLES, pageBgColor: '#064e3b', bodyBg: '#022c22', headerBg: '#059669', headerText: '#ffffff', bodyText: '#6ee7b7', labelColor: '#34d399', inputBg: '#064e3b', inputBorderColor: '#10b981', accentColor: '#10b981', fontFamily: 'Outfit', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)', borderRadius: 12, },
  'crimson-night': { ...DEFAULT_STYLES, pageBgColor: '#4c0519', bodyBg: '#2a040b', headerBg: '#9f1239', headerText: '#ffffff', bodyText: '#fda4af', labelColor: '#fb7185', inputBg: '#4c0519', inputBorderColor: '#e11d48', accentColor: '#f43f5e', fontFamily: 'Inter', boxShadow: '0 0 20px rgba(225, 29, 72, 0.3)', borderRadius: 4, },
  'neon-city': { ...DEFAULT_STYLES, pageBgColor: '#000000', bodyBg: '#111111', headerBg: '#222222', headerText: '#00ffcc', bodyText: '#cccccc', labelColor: '#ff00ff', inputBg: '#000000', inputBorderColor: '#00ffcc', accentColor: '#ffff00', fontFamily: 'Space Grotesk', boxShadow: '0 0 10px #00ffcc', borderRadius: 0, },
  'modern-minimal': { ...DEFAULT_STYLES, pageBgColor: '#fafafa', bodyBg: '#ffffff', headerBg: '#ffffff', headerText: '#18181b', bodyText: '#52525b', labelColor: '#3f3f46', inputBg: '#ffffff', inputBorderColor: '#e4e4e7', accentColor: '#18181b', fontFamily: 'Inter', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', borderRadius: 2, containerWidth: 600 },
  'swiss-design': { ...DEFAULT_STYLES, pageBgColor: '#ffffff', bodyBg: '#ffffff', headerBg: '#ffffff', headerText: '#ef4444', bodyText: '#18181b', labelColor: '#18181b', inputBg: '#ffffff', inputBorderColor: '#18181b', accentColor: '#ef4444', fontFamily: 'Inter', boxShadow: 'none', borderRadius: 0, containerWidth: 640, fontSizeBase: 18, fontWeight: 'bold' as any, labelWeight: 'bold' as any },
  'bauhaus': { ...DEFAULT_STYLES, pageBgColor: '#f5f5f5', bodyBg: '#ffffff', headerBg: '#dc2626', headerText: '#ffffff', bodyText: '#18181b', labelColor: '#18181b', inputBg: '#ffffff', inputBorderColor: '#2563eb', accentColor: '#fbbf24', fontFamily: 'DM Sans', boxShadow: '4px 4px 0px #18181b', borderRadius: 0, containerWidth: 600 },
  'glass-frost': { ...DEFAULT_STYLES, pageBgColor: '#667eea', bodyBg: 'rgba(255, 255, 255, 0.25)', headerBg: 'rgba(255, 255, 255, 0.15)', headerText: '#1e293b', bodyText: '#334155', labelColor: '#1e293b', inputBg: 'rgba(255, 255, 255, 0.5)', inputBorderColor: 'rgba(255, 255, 255, 0.3)', accentColor: '#6366f1', fontFamily: 'Plus Jakarta Sans', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', borderRadius: 24, pageBgBlur: 10 },
  'mesh-gradient': { ...DEFAULT_STYLES, pageBgColor: '#0f172a', bodyBg: 'rgba(255, 255, 255, 0.08)', headerBg: 'transparent', headerText: '#f8fafc', bodyText: '#e2e8f0', labelColor: '#cbd5e1', inputBg: 'rgba(255, 255, 255, 0.1)', inputBorderColor: 'rgba(99, 102, 241, 0.5)', accentColor: '#818cf8', fontFamily: 'Outfit', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', borderRadius: 16, pageBgOverlayOpacity: 0 },
  'material-you': { ...DEFAULT_STYLES, pageBgColor: '#fffeec', bodyBg: '#ffffff', headerBg: '#6750a4', headerText: '#ffffff', bodyText: '#1c1b1f', labelColor: '#49454f', inputBg: '#fffeec', inputBorderColor: '#79747e', accentColor: '#6750a4', fontFamily: 'Roboto', boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)', borderRadius: 28, containerWidth: 560 },
  'windows-11': { ...DEFAULT_STYLES, pageBgColor: '#f3f3f3', bodyBg: '#ffffff', headerBg: '#ffffff', headerText: '#000000', bodyText: '#5d5d5d', labelColor: '#000000', inputBg: '#ffffff', inputBorderColor: '#cacaef', accentColor: '#0078d4', fontFamily: 'Segoe UI', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', borderRadius: 8, containerWidth: 520 },
  'linear-elegant': { ...DEFAULT_STYLES, pageBgColor: '#1e1e2e', bodyBg: '#232330', headerBg: '#2e2e3d', headerText: '#ffffff', bodyText: '#a1a1aa', labelColor: '#e4e4e7', inputBg: '#1e1e2e', inputBorderColor: '#3e3e4d', accentColor: '#5e5eff', fontFamily: 'DM Sans', boxShadow: 'none', borderRadius: 6, containerWidth: 560 },
  'figma-dark': { ...DEFAULT_STYLES, pageBgColor: '#1e1e1e', bodyBg: '#2c2c2c', headerBg: '#333333', headerText: '#ffffff', bodyText: '#d4d4d4', labelColor: '#ffffff', inputBg: '#1e1e1e', inputBorderColor: '#444444', accentColor: '#f24e1e', fontFamily: 'Inter', boxShadow: 'none', borderRadius: 8, containerWidth: 640 },
  'stripe-clean': { ...DEFAULT_STYLES, pageBgColor: '#f6f9fc', bodyBg: '#ffffff', headerBg: '#635bff', headerText: '#ffffff', bodyText: '#3a3a3a', labelColor: '#3a3a3a', inputBg: '#ffffff', inputBorderColor: '#e3e8ee', accentColor: '#635bff', fontFamily: 'Inter', boxShadow: '0 4px 6px rgba(99, 91, 255, 0.08)', borderRadius: 8, containerWidth: 540 },
  'airbnb-warm': { ...DEFAULT_STYLES, pageBgColor: '#fafaf9', bodyBg: '#ffffff', headerBg: '#ffffff', headerText: '#18191a', bodyText: '#5e5e5e', labelColor: '#18191a', inputBg: '#ffffff', inputBorderColor: '#dddddd', accentColor: '#ff385c', fontFamily: 'Circular', boxShadow: '0 1px 2px rgba(0,0,0, 0.04)', borderRadius: 12, containerWidth: 580 },
  'notion-black': { ...DEFAULT_STYLES, pageBgColor: '#191919', bodyBg: '#232323', headerBg: '#232323', headerText: '#ffffff', bodyText: '#d4d4d4', labelColor: '#ffffff', inputBg: '#1a1a1a', inputBorderColor: '#3a3a3a', accentColor: '#eb5757', fontFamily: 'Inter', boxShadow: 'none', borderRadius: 4, containerWidth: 640 },
  'vercel-black': { ...DEFAULT_STYLES, pageBgColor: '#000000', bodyBg: '#0c0c0c', headerBg: '#171717', headerText: '#ffffff', bodyText: '#a1a1aa', labelColor: '#ffffff', inputBg: '#0c0c0c', inputBorderColor: '#27272a', accentColor: '#ffffff', fontFamily: 'Inter', boxShadow: 'none', borderRadius: 8, containerWidth: 600 },
  'github-dark': { ...DEFAULT_STYLES, pageBgColor: '#0d1117', bodyBg: '#161b22', headerBg: '#21262d', headerText: '#f0f6fc', bodyText: '#8b949e', labelColor: '#c9d1d9', inputBg: '#0d1117', inputBorderColor: '#30363d', accentColor: '#58a6ff', fontFamily: 'DM Sans', boxShadow: 'none', borderRadius: 6, containerWidth: 600 },
  'spotify-green': { ...DEFAULT_STYLES, pageBgColor: '#121212', bodyBg: '#181818', headerBg: '#1db954', headerText: '#ffffff', bodyText: '#b3b3b3', labelColor: '#ffffff', inputBg: '#282828', inputBorderColor: '#3e3e3e', accentColor: '#1db954', fontFamily: 'Circular', boxShadow: 'none', borderRadius: 4, containerWidth: 640 },
  'discord-blurple': { ...DEFAULT_STYLES, pageBgColor: '#313338', bodyBg: '#2b2d31', headerBg: '#5865f2', headerText: '#ffffff', bodyText: '#dbdee1', labelColor: '#f2f3f5', inputBg: '#1e1f22', inputBorderColor: '#3f4047', accentColor: '#5865f2', fontFamily: 'gg Sans', boxShadow: 'none', borderRadius: 8, containerWidth: 520 },
  'telegram-blue': { ...DEFAULT_STYLES, pageBgColor: '#ffffff', bodyBg: '#ffffff', headerBg: '#229ed9', headerText: '#ffffff', bodyText: '#000000', labelColor: '#000000', inputBg: '#ffffff', inputBorderColor: '#e0e0e0', accentColor: '#229ed9', fontFamily: 'Roboto', boxShadow: '0 1px 2px rgba(0,0,0, 0.1)', borderRadius: 12, containerWidth: 560 },
  'whatsapp-teal': { ...DEFAULT_STYLES, pageBgColor: '#d1d7dd', bodyBg: '#ffffff', headerBg: '#075e54', headerText: '#ffffff', bodyText: '#3b3b3b', labelColor: '#3b3b3b', inputBg: '#ffffff', inputBorderColor: '#d1d7dd', accentColor: '#25d366', fontFamily: 'Arial', boxShadow: 'none', borderRadius: 0, containerWidth: 560 },
  'slack-purple': { ...DEFAULT_STYLES, pageBgColor: '#f8f8f8', bodyBg: '#ffffff', headerBg: '#4a154b', headerText: '#ffffff', bodyText: '#1d1c1d', labelColor: '#1d1c1d', inputBg: '#ffffff', inputBorderColor: '#dddddd', accentColor: '#36c5f0', fontFamily: 'Lato', boxShadow: '0 0 0 1px rgba(29,28,29,0.15)', borderRadius: 4, containerWidth: 640 },
  'youtube-red': { ...DEFAULT_STYLES, pageBgColor: '#f9f9f9', bodyBg: '#ffffff', headerBg: '#ff0000', headerText: '#ffffff', bodyText: '#0f0f0f', labelColor: '#0f0f0f', inputBg: '#ffffff', inputBorderColor: '#cccccc', accentColor: '#ff0000', fontFamily: 'Roboto', boxShadow: 'none', borderRadius: 4, containerWidth: 640 },
  'instagram-gradient': { ...DEFAULT_STYLES, pageBgColor: '#fafafa', bodyBg: '#ffffff', headerBg: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', headerText: '#ffffff', bodyText: '#262626', labelColor: '#262626', inputBg: '#fafafa', inputBorderColor: '#dbdbdb', accentColor: '#e4405f', fontFamily: '-apple-system', boxShadow: 'none', borderRadius: 8, containerWidth: 560 },
  'twitter-x': { ...DEFAULT_STYLES, pageBgColor: '#000000', bodyBg: '#000000', headerBg: '#ffffff', headerText: '#000000', bodyText: '#71767b', labelColor: '#e7e9ea', inputBg: '#000000', inputBorderColor: '#2f3336', accentColor: '#ffffff', fontFamily: '-apple-system', boxShadow: 'none', borderRadius: 0, containerWidth: 600 },
  'linkedin-blue': { ...DEFAULT_STYLES, pageBgColor: '#f3f2ef', bodyBg: '#ffffff', headerBg: '#0a66c2', headerText: '#ffffff', bodyText: '#292929', labelColor: '#292929', inputBg: '#ffffff', inputBorderColor: '#cfcfcf', accentColor: '#0a66c2', fontFamily: '-apple-system', boxShadow: 'none', borderRadius: 2, containerWidth: 640 },
  'zoom-blue': { ...DEFAULT_STYLES, pageBgColor: '#f5f5f5', bodyBg: '#ffffff', headerBg: '#2d8cff', headerText: '#ffffff', bodyText: '#333333', labelColor: '#333333', inputBg: '#ffffff', inputBorderColor: '#d9d9d9', accentColor: '#2d8cff', fontFamily: 'Inter', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', borderRadius: 8, containerWidth: 520 },
  'dropbox-indigo': { ...DEFAULT_STYLES, pageBgColor: '#f6f9fc', bodyBg: '#ffffff', headerBg: '#0061fe', headerText: '#ffffff', bodyText: '#5e5e5e', labelColor: '#1e1919', inputBg: '#ffffff', inputBorderColor: '#e1e4e8', accentColor: '#0061fe', fontFamily: 'Inter', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: 8, containerWidth: 560 },
  'figma-light': { ...DEFAULT_STYLES, pageBgColor: '#ffffff', bodyBg: '#ffffff', headerBg: '#f24e1e', headerText: '#ffffff', bodyText: '#333333', labelColor: '#333333', inputBg: '#ffffff', inputBorderColor: '#e5e5e5', accentColor: '#f24e1e', fontFamily: 'Inter', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', borderRadius: 8, containerWidth: 640 },
  'shopify-green': { ...DEFAULT_STYLES, pageBgColor: '#fbfbfb', bodyBg: '#ffffff', headerBg: '#96bf48', headerText: '#ffffff', bodyText: '#333333', labelColor: '#333333', inputBg: '#ffffff', inputBorderColor: '#dfe3e8', accentColor: '#96bf48', fontFamily: 'Inter', boxShadow: 'none', borderRadius: 4, containerWidth: 610 },
  'canva-purple': { ...DEFAULT_STYLES, pageBgColor: '#f4f4f4', bodyBg: '#ffffff', headerBg: '#7d7afc', headerText: '#ffffff', bodyText: '#2c2c2c', labelColor: '#2c2c2c', inputBg: '#ffffff', inputBorderColor: '#e5e5e5', accentColor: '#7d7afc', fontFamily: 'Inter', boxShadow: 'none', borderRadius: 8, containerWidth: 640 },
  'loom-purple': { ...DEFAULT_STYLES, pageBgColor: '#fafafa', bodyBg: '#ffffff', headerBg: '#625df5', headerText: '#ffffff', bodyText: '#2c2c2c', labelColor: '#2c2c2c', inputBg: '#fafafa', inputBorderColor: '#e5e5e5', accentColor: '#625df5', fontFamily: 'Inter', boxShadow: 'none', borderRadius: 8, containerWidth: 560 },
  'cal-purple': { ...DEFAULT_STYLES, pageBgColor: '#fafafa', bodyBg: '#ffffff', headerBg: '#5f6ac7', headerText: '#ffffff', bodyText: '#333333', labelColor: '#333333', inputBg: '#ffffff', inputBorderColor: '#e5e5e5', accentColor: '#5f6ac7', fontFamily: 'DM Sans', boxShadow: '0 4px 12px rgba(95, 106, 199, 0.1)', borderRadius: 12, containerWidth: 600 },
  'notion-light': { ...DEFAULT_STYLES, pageBgColor: '#ffffff', bodyBg: '#ffffff', headerBg: '#ffffff', headerText: '#37352f', bodyText: '#37352f', labelColor: '#37352f', inputBg: '#ffffff', inputBorderColor: '#e5e5e5', accentColor: '#2eaadc', fontFamily: 'Inter', boxShadow: 'none', borderRadius: 4, containerWidth: 640 },
  'monday-blue': { ...DEFAULT_STYLES, pageBgColor: '#f5f6f8', bodyBg: '#ffffff', headerBg: '#ffcb00', headerText: '#ffffff', bodyText: '#323338', labelColor: '#323338', inputBg: '#ffffff', inputBorderColor: '#e5e5e5', accentColor: '#ffcb00', fontFamily: 'Inter', boxShadow: '0 2px 8px rgba(0,0,0, 0.04)', borderRadius: 8, containerWidth: 560 },
  'asana-orange': { ...DEFAULT_STYLES, pageBgColor: '#f7f6f3', bodyBg: '#ffffff', headerBg: '#f06a6a', headerText: '#ffffff', bodyText: '#2c2c2c', labelColor: '#2c2c2c', inputBg: '#ffffff', inputBorderColor: '#e5e5e5', accentColor: '#f06a6a', fontFamily: 'Inter', boxShadow: 'none', borderRadius: 0, containerWidth: 600 },
  'clickup-green': { ...DEFAULT_STYLES, pageBgColor: '#f6f6f6', bodyBg: '#ffffff', headerBg: '#7c3aed', headerText: '#ffffff', bodyText: '#333333', labelColor: '#333333', inputBg: '#ffffff', inputBorderColor: '#e5e5e5', accentColor: '#7c3aed', fontFamily: 'Inter', boxShadow: 'none', borderRadius: 8, containerWidth: 560 },
  'trello-blue': { ...DEFAULT_STYLES, pageBgColor: '#f4f5f7', bodyBg: '#ffffff', headerBg: '#0079bf', headerText: '#ffffff', bodyText: '#172b4d', labelColor: '#172b4d', inputBg: '#ffffff', inputBorderColor: '#dfe1e6', accentColor: '#0079bf', fontFamily: 'Inter', boxShadow: 'none', borderRadius: 4, containerWidth: 560 },
  'asana-purple': { ...DEFAULT_STYLES, pageBgColor: '#ffffff', bodyBg: '#ffffff', headerBg: '#fc636b', headerText: '#ffffff', bodyText: '#2c2c2c', labelColor: '#2c2c2c', inputBg: '#ffffff', inputBorderColor: '#e5e5e5', accentColor: '#fc636b', fontFamily: 'Inter', boxShadow: 'none', borderRadius: 8, containerWidth: 540 },
  'miro-dark': { ...DEFAULT_STYLES, pageBgColor: '#1a1a1a', bodyBg: '#252525', headerBg: '#ffd02f', headerText: '#1a1a1a', bodyText: '#c9c9c9', labelColor: '#ffffff', inputBg: '#1a1a1a', inputBorderColor: '#444444', accentColor: '#ffd02f', fontFamily: 'Inter', boxShadow: 'none', borderRadius: 12, containerWidth: 600 },
  'miro-light': { ...DEFAULT_STYLES, pageBgColor: '#f7f7f7', bodyBg: '#ffffff', headerBg: '#ffd02f', headerText: '#1a1a1a', bodyText: '#333333', labelColor: '#333333', inputBg: '#ffffff', inputBorderColor: '#e5e5e5', accentColor: '#ffd02f', fontFamily: 'Inter', boxShadow: 'none', borderRadius: 12, containerWidth: 600 },
  'typeform-dark': { ...DEFAULT_STYLES, pageBgColor: '#000000', bodyBg: '#1a1a1a', headerBg: '#262626', headerText: '#ffffff', bodyText: '#d4d4d4', labelColor: '#ffffff', inputBg: '#0a0a0a', inputBorderColor: '#333333', accentColor: '#3f3f46', fontFamily: 'DM Sans', boxShadow: 'none', borderRadius: 0, containerWidth: 640 },
  'typeform-light': { ...DEFAULT_STYLES, pageBgColor: '#ffffff', bodyBg: '#ffffff', headerBg: '#e5e5e5', headerText: '#000000', bodyText: '#444444', labelColor: '#000000', inputBg: '#fafafa', inputBorderColor: '#dddddd', accentColor: '#1a1a1a', fontFamily: 'DM Sans', boxShadow: 'none', borderRadius: 0, containerWidth: 640 },
  'sage-wellness': { ...DEFAULT_STYLES, pageBgColor: '#f0f4f2', bodyBg: '#ffffff', headerBg: '#86a28a', headerText: '#f0f4f2', bodyText: '#2d3a2e', labelColor: '#3d4c3e', inputBg: '#f5f8f6', inputBorderColor: '#c4d1c7', accentColor: '#739276', fontFamily: 'Playfair Display', boxShadow: '0 4px 12px rgba(115, 146, 118, 0.08)', borderRadius: 8, containerWidth: 580 },
  'olive-nature': { ...DEFAULT_STYLES, pageBgColor: '#f5f5f0', bodyBg: '#fffff9', headerBg: '#4a5d23', headerText: '#f5f5f0', bodyText: '#3e4a1f', labelColor: '#5a6b2a', inputBg: '#fafaf5', inputBorderColor: '#d4d8cc', accentColor: '#6b7d33', fontFamily: 'DM Sans', boxShadow: '0 2px 8px rgba(74, 93, 35, 0.06)', borderRadius: 6, containerWidth: 560 },
};

