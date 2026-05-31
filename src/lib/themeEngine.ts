/**
 * ══════════════════════════════════════════════════════════════
 *  FORM BUILDER — WORLD CLASS THEME ENGINE
 *  3 Masterfully composed themes with 5-color palettes.
 * ══════════════════════════════════════════════════════════════
 */

export interface ThemeTokens {
  name: string;
  // ── Core Palette (The 5 Main Colors) ──
  color1: string; // Primary
  color2: string; // Secondary
  color3: string; // Accent
  color4: string; // Highlight
  color5: string; // Neutral/Deep
  
  // ── Functional Mapping ──
  primary: string; primaryHover: string;
  secondary: string;
  accent: string;
  
  // ── Surfaces ──
  pageBg: string; cardBg: string;
  headerBg: string; headerText: string;
  inputBg: string; inputBorder: string;
  
  // ── Text ──
  textPrimary: string; textSecondary: string; textMuted: string;
  textOnPrimary: string;
  labelColor: string;
  helperText: string;
  
  // ── Borders & Shadows ──
  borderLight: string;
  shadowLg: string;
  
  // ── Components ──
  btnPrimaryBg: string; btnPrimaryText: string;
  radius: string;
  fontFamily: string;
}

export const themes: Record<string, ThemeTokens> = {
  'midnight-galaxy': {
    name: 'Midnight Galaxy',
    color1: '#6366f1', // Cosmic Indigo
    color2: '#a855f7', // Nebula Purple
    color3: '#f59e0b', // Stellar Gold
    color4: '#ec4899', // Supernova Pink
    color5: '#0f172a', // Deep Space
    
    primary: '#6366f1', primaryHover: '#4f46e5',
    secondary: '#a855f7',
    accent: '#f59e0b',
    
    pageBg: '#020617', cardBg: '#0f172a',
    headerBg: '#1e1b4b', headerText: '#f8fafc',
    inputBg: '#1e293b', inputBorder: '#334155',
    
    textPrimary: '#f8fafc', textSecondary: '#94a3b8', textMuted: '#64748b',
    textOnPrimary: '#ffffff',
    labelColor: '#e2e8f0',
    helperText: '#94a3b8',
    
    borderLight: '#1e293b',
    shadowLg: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    
    btnPrimaryBg: '#6366f1', btnPrimaryText: '#ffffff',
    radius: '16px',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },
  'slate-minimal': {
    name: 'Slate Minimal',
    color1: '#38bdf8', // Soft Sky Blue
    color2: '#818cf8', // Slate Lavender
    color3: '#34d399', // Emerald Green
    color4: '#fb7185', // Rose Petal
    color5: '#0f172a', // Deep Slate
    
    primary: '#38bdf8', primaryHover: '#0284c7',
    secondary: '#818cf8',
    accent: '#34d399',
    
    pageBg: '#0f172a', cardBg: '#1e293b',
    headerBg: '#1e293b', headerText: '#f8fafc',
    inputBg: '#0f172a', inputBorder: '#334155',
    
    textPrimary: '#f8fafc', textSecondary: '#94a3b8', textMuted: '#64748b',
    textOnPrimary: '#0f172a',
    labelColor: '#e2e8f0',
    helperText: '#94a3b8',
    
    borderLight: '#334155',
    shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
    
    btnPrimaryBg: '#38bdf8', btnPrimaryText: '#0f172a',
    radius: '12px',
    fontFamily: '"Outfit", sans-serif',
  },
  'nordic-frost': {
    name: 'Nordic Frost',
    color1: '#88c0d0', // Frost Blue
    color2: '#8fbcbb', // Nord Teal
    color3: '#a3be8c', // Muted Olive
    color4: '#ebcb8b', // Warm Sand
    color5: '#2e3440', // Polar Night
    
    primary: '#88c0d0', primaryHover: '#5e81ac',
    secondary: '#8fbcbb',
    accent: '#a3be8c',
    
    pageBg: '#2e3440', cardBg: '#3b4252',
    headerBg: '#3b4252', headerText: '#eceff4',
    inputBg: '#2e3440', inputBorder: '#4c566a',
    
    textPrimary: '#eceff4', textSecondary: '#d8dee9', textMuted: '#4c566a',
    textOnPrimary: '#2e3440',
    labelColor: '#e5e9f0',
    helperText: '#d8dee9',
    
    borderLight: '#434c5e',
    shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.25)',
    
    btnPrimaryBg: '#88c0d0', btnPrimaryText: '#2e3440',
    radius: '16px',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },
  'charcoal-cream': {
    name: 'Charcoal Cream',
    color1: '#fbbf24', // Amber Gold
    color2: '#f472b6', // Muted Rose
    color3: '#60a5fa', // Soft Blue
    color4: '#a78bfa', // Soft Purple
    color5: '#18181b', // Deep Charcoal
    
    primary: '#fbbf24', primaryHover: '#d97706',
    secondary: '#f472b6',
    accent: '#60a5fa',
    
    pageBg: '#18181b', cardBg: '#27272a',
    headerBg: '#27272a', headerText: '#fafafa',
    inputBg: '#18181b', inputBorder: '#3f3f46',
    
    textPrimary: '#fafafa', textSecondary: '#d4d4d8', textMuted: '#71717a',
    textOnPrimary: '#18181b',
    labelColor: '#f4f4f5',
    helperText: '#d4d4d8',
    
    borderLight: '#3f3f46',
    shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
    
    btnPrimaryBg: '#fbbf24', btnPrimaryText: '#18181b',
    radius: '20px',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },
  'serene-oasis': {
    name: 'Serene Oasis',
    color1: '#0d9488', // Ethereal Teal
    color2: '#99f6e4', // Soft Mint
    color3: '#fca5a5', // Coral Sunset
    color4: '#fde68a', // Sand Drift
    color5: '#134e4a', // Ocean Deep
    
    primary: '#0d9488', primaryHover: '#0f766e',
    secondary: '#99f6e4',
    accent: '#fca5a5',
    
    pageBg: '#f0fdfa', cardBg: '#ffffff',
    headerBg: '#134e4a', headerText: '#f0fdfa',
    inputBg: '#f9fafb', inputBorder: '#e5e7eb',
    
    textPrimary: '#111827', textSecondary: '#4b5563', textMuted: '#9ca3af',
    textOnPrimary: '#ffffff',
    labelColor: '#374151',
    helperText: '#6b7280',
    
    borderLight: '#f1f5f9',
    shadowLg: '0 10px 15px -3px rgba(13, 148, 136, 0.1)',
    
    btnPrimaryBg: '#0d9488', btnPrimaryText: '#ffffff',
    radius: '24px',
    fontFamily: '"Outfit", sans-serif',
  },
  'vibrant-brutalist': {
    name: 'Vibrant Brutalist',
    color1: '#2563eb', // Electric Blue
    color2: '#adff2f', // Acid Lime
    color3: '#ff00ff', // Hot Magenta
    color4: '#ffffff', // Pure White
    color5: '#000000', // Stark Black
    
    primary: '#2563eb', primaryHover: '#1d4ed8',
    secondary: '#adff2f',
    accent: '#ff00ff',
    
    pageBg: '#ffffff', cardBg: '#ffffff',
    headerBg: '#000000', headerText: '#ffffff',
    inputBg: '#ffffff', inputBorder: '#000000',
    
    textPrimary: '#000000', textSecondary: '#333333', textMuted: '#666666',
    textOnPrimary: '#ffffff',
    labelColor: '#000000',
    helperText: '#333333',
    
    borderLight: '#000000',
    shadowLg: '8px 8px 0px 0px #000000',
    
    btnPrimaryBg: '#000000', btnPrimaryText: '#ffffff',
    radius: '0px',
    fontFamily: '"Space Grotesk", sans-serif',
  }
};

export function applyTheme(themeName: string, persist = true): boolean {
  const theme = themes[themeName];
  if (!theme) return false;

  const root = document.documentElement;
  root.style.setProperty('--fb-primary', theme.primary);
  root.style.setProperty('--fb-primary-hover', theme.primaryHover);
  root.style.setProperty('--fb-secondary', theme.secondary);
  root.style.setProperty('--fb-accent', theme.accent);
  root.style.setProperty('--fb-page-bg', theme.pageBg);
  root.style.setProperty('--fb-card-bg', theme.cardBg);
  root.style.setProperty('--fb-header-bg', theme.headerBg);
  root.style.setProperty('--fb-header-text', theme.headerText);
  root.style.setProperty('--fb-text', theme.textPrimary);
  root.style.setProperty('--fb-text-secondary', theme.textSecondary);
  root.style.setProperty('--fb-text-muted', theme.textMuted);
  root.style.setProperty('--fb-input-bg', theme.inputBg);
  root.style.setProperty('--fb-input-border', theme.inputBorder);
  root.style.setProperty('--fb-radius', theme.radius);
  root.style.setProperty('--fb-font', theme.fontFamily);
  root.style.setProperty('--fb-shadow-lg', theme.shadowLg);

  // Map to the app's internal variables too
  root.style.setProperty('--theme-bg', theme.pageBg);
  root.style.setProperty('--theme-text', theme.textPrimary);
  root.style.setProperty('--theme-text-muted', theme.textMuted);
  root.style.setProperty('--theme-primary', theme.primary);
  root.style.setProperty('--theme-secondary', theme.secondary);
  root.style.setProperty('--theme-border', theme.borderLight);
  root.style.setProperty('--theme-card', theme.cardBg);

  if (persist) {
    try { localStorage.setItem('app-theme', themeName); } catch {}
  }
  return true;
}

export function initTheme(fallback = 'midnight-galaxy'): string {
  let saved = fallback;
  try { saved = localStorage.getItem('app-theme') || fallback; } catch {}
  applyTheme(saved);
  return saved;
}
