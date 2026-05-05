/**
 * ══════════════════════════════════════════════════════════════
 *  FORM BUILDER — PREMIUM THEME ENGINE
 *  7 hand-crafted palettes with full design-token coverage.
 *  Usage: import { applyTheme, themes } from '@/lib/themeEngine'
 * ══════════════════════════════════════════════════════════════
 */

export interface ThemeTokens {
  name: string;
  // ── Core Palette ──
  primary: string; primaryHover: string; primaryActive: string;
  secondary: string; secondaryHover: string;
  accent: string; accentHover: string;
  danger: string; dangerHover: string;
  // ── Surfaces ──
  pageBg: string; cardBg: string; cardBgAlt: string;
  headerBg: string; headerText: string;
  inputBg: string; inputBorder: string; inputFocus: string;
  // ── Text ──
  textPrimary: string; textSecondary: string; textMuted: string;
  textOnPrimary: string; textOnDanger: string;
  labelColor: string; helperText: string; errorText: string;
  // ── Borders & Shadows ──
  borderLight: string; borderMedium: string;
  shadowSm: string; shadowMd: string; shadowLg: string; shadowFocus: string;
  // ── Interactive States ──
  hoverOverlay: string; activeOverlay: string; disabledBg: string; disabledText: string;
  loadingPulse: string;
  // ── Components ──
  toggleTrack: string; toggleTrackActive: string; toggleThumb: string;
  checkboxBorder: string; checkboxChecked: string;
  radioBorder: string; radioChecked: string;
  dropzoneBg: string; dropzoneBorder: string; dropzoneHover: string;
  // ── Buttons ──
  btnPrimaryBg: string; btnPrimaryText: string;
  btnSecondaryBg: string; btnSecondaryText: string; btnSecondaryBorder: string;
  btnGhostText: string; btnGhostHover: string;
  btnDangerBg: string; btnDangerText: string;
  // ── Layout ──
  radius: string; radiusSm: string; radiusLg: string; radiusFull: string;
  fontFamily: string;
  transition: string; transitionFast: string;
}

// ─────────────────── THEMES ───────────────────

export const themes: Record<string, ThemeTokens> = {

  /** 1 ▸ VELVET DUSK — Blush pink, deep charcoal, soft gold, muted teal */
  'velvet-dusk': {
    name: 'Velvet Dusk',
    primary: '#c0849b', primaryHover: '#a96d84', primaryActive: '#8f5a6f',
    secondary: '#2d2d3a', secondaryHover: '#3b3b4d',
    accent: '#d4a96a', accentHover: '#c49550',
    danger: '#d94f4f', dangerHover: '#c43c3c',
    pageBg: '#1e1e28', cardBg: '#282836', cardBgAlt: '#32324a',
    headerBg: '#1a1a24', headerText: '#f0e6ec',
    inputBg: '#22222e', inputBorder: '#3e3e52', inputFocus: '#c0849b',
    textPrimary: '#f0e6ec', textSecondary: '#b0a4b0', textMuted: '#736b78',
    textOnPrimary: '#ffffff', textOnDanger: '#ffffff',
    labelColor: '#e0d4dc', helperText: '#8a7e90', errorText: '#e87070',
    borderLight: '#333344', borderMedium: '#484860',
    shadowSm: '0 1px 3px rgba(0,0,0,.4)', shadowMd: '0 4px 12px rgba(0,0,0,.5)',
    shadowLg: '0 12px 32px rgba(0,0,0,.6)', shadowFocus: '0 0 0 3px rgba(192,132,155,.35)',
    hoverOverlay: 'rgba(255,255,255,.04)', activeOverlay: 'rgba(255,255,255,.08)',
    disabledBg: '#2a2a38', disabledText: '#555560', loadingPulse: '#c0849b',
    toggleTrack: '#3e3e52', toggleTrackActive: '#c0849b', toggleThumb: '#ffffff',
    checkboxBorder: '#4e4e64', checkboxChecked: '#c0849b',
    radioBorder: '#4e4e64', radioChecked: '#d4a96a',
    dropzoneBg: '#24243080', dropzoneBorder: '#3e3e52', dropzoneHover: '#c0849b30',
    btnPrimaryBg: '#c0849b', btnPrimaryText: '#ffffff',
    btnSecondaryBg: 'transparent', btnSecondaryText: '#c0849b', btnSecondaryBorder: '#c0849b',
    btnGhostText: '#b0a4b0', btnGhostHover: 'rgba(192,132,155,.12)',
    btnDangerBg: '#d94f4f', btnDangerText: '#ffffff',
    radius: '10px', radiusSm: '6px', radiusLg: '16px', radiusFull: '9999px',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    transition: 'all .2s ease', transitionFast: 'all .12s ease',
  },

  /** 2 ▸ ARCTIC AURORA — Ice blue, deep navy, mint green, pale lavender */
  'arctic-aurora': {
    name: 'Arctic Aurora',
    primary: '#7ec8e3', primaryHover: '#5db8d9', primaryActive: '#3ea8cf',
    secondary: '#0b1d3a', secondaryHover: '#142c52',
    accent: '#72d4a8', accentHover: '#5cc494',
    danger: '#f06e6e', dangerHover: '#e05050',
    pageBg: '#060e1f', cardBg: '#0d1a33', cardBgAlt: '#132544',
    headerBg: '#081428', headerText: '#e0f0fa',
    inputBg: '#0a1629', inputBorder: '#1c3055', inputFocus: '#7ec8e3',
    textPrimary: '#e4f0f8', textSecondary: '#8ca8c4', textMuted: '#4a6a88',
    textOnPrimary: '#06101f', textOnDanger: '#ffffff',
    labelColor: '#c8dcea', helperText: '#5e84a8', errorText: '#f08080',
    borderLight: '#162a48', borderMedium: '#244060',
    shadowSm: '0 1px 3px rgba(0,0,0,.5)', shadowMd: '0 4px 14px rgba(0,0,0,.6)',
    shadowLg: '0 14px 36px rgba(0,0,0,.65)', shadowFocus: '0 0 0 3px rgba(126,200,227,.3)',
    hoverOverlay: 'rgba(126,200,227,.06)', activeOverlay: 'rgba(126,200,227,.12)',
    disabledBg: '#0e1e36', disabledText: '#3a5270', loadingPulse: '#7ec8e3',
    toggleTrack: '#1c3055', toggleTrackActive: '#72d4a8', toggleThumb: '#ffffff',
    checkboxBorder: '#2a4468', checkboxChecked: '#7ec8e3',
    radioBorder: '#2a4468', radioChecked: '#72d4a8',
    dropzoneBg: '#0a162980', dropzoneBorder: '#1c3055', dropzoneHover: '#7ec8e330',
    btnPrimaryBg: '#7ec8e3', btnPrimaryText: '#06101f',
    btnSecondaryBg: 'transparent', btnSecondaryText: '#7ec8e3', btnSecondaryBorder: '#7ec8e3',
    btnGhostText: '#8ca8c4', btnGhostHover: 'rgba(126,200,227,.1)',
    btnDangerBg: '#f06e6e', btnDangerText: '#ffffff',
    radius: '12px', radiusSm: '6px', radiusLg: '20px', radiusFull: '9999px',
    fontFamily: '"Inter", system-ui, sans-serif',
    transition: 'all .2s ease', transitionFast: 'all .12s ease',
  },

  /** 3 ▸ TERRACOTTA SUN — Warm clay, burnt sienna, cream, sage green */
  'terracotta-sun': {
    name: 'Terracotta Sun',
    primary: '#c67a4a', primaryHover: '#b56838', primaryActive: '#a05828',
    secondary: '#3d5a3e', secondaryHover: '#4d6e4e',
    accent: '#d4a24e', accentHover: '#c89038',
    danger: '#c94444', dangerHover: '#b53333',
    pageBg: '#faf5ef', cardBg: '#ffffff', cardBgAlt: '#f7f0e6',
    headerBg: '#3a2a1e', headerText: '#f5ece2',
    inputBg: '#fdf9f4', inputBorder: '#ddd0c0', inputFocus: '#c67a4a',
    textPrimary: '#2e2118', textSecondary: '#6b5a4a', textMuted: '#a09080',
    textOnPrimary: '#ffffff', textOnDanger: '#ffffff',
    labelColor: '#3e3028', helperText: '#8a7868', errorText: '#c94444',
    borderLight: '#e8ddd0', borderMedium: '#d0c0aa',
    shadowSm: '0 1px 3px rgba(60,40,20,.08)', shadowMd: '0 4px 12px rgba(60,40,20,.1)',
    shadowLg: '0 12px 30px rgba(60,40,20,.12)', shadowFocus: '0 0 0 3px rgba(198,122,74,.25)',
    hoverOverlay: 'rgba(198,122,74,.06)', activeOverlay: 'rgba(198,122,74,.1)',
    disabledBg: '#f0e8dc', disabledText: '#baa898', loadingPulse: '#c67a4a',
    toggleTrack: '#d0c0aa', toggleTrackActive: '#3d5a3e', toggleThumb: '#ffffff',
    checkboxBorder: '#c0b0a0', checkboxChecked: '#c67a4a',
    radioBorder: '#c0b0a0', radioChecked: '#3d5a3e',
    dropzoneBg: '#faf5ef', dropzoneBorder: '#ddd0c0', dropzoneHover: '#c67a4a18',
    btnPrimaryBg: '#c67a4a', btnPrimaryText: '#ffffff',
    btnSecondaryBg: 'transparent', btnSecondaryText: '#c67a4a', btnSecondaryBorder: '#c67a4a',
    btnGhostText: '#6b5a4a', btnGhostHover: 'rgba(198,122,74,.08)',
    btnDangerBg: '#c94444', btnDangerText: '#ffffff',
    radius: '8px', radiusSm: '4px', radiusLg: '14px', radiusFull: '9999px',
    fontFamily: '"DM Sans", system-ui, sans-serif',
    transition: 'all .2s ease', transitionFast: 'all .12s ease',
  },

  /** 4 ▸ MIDNIGHT BLOOM — Deep indigo, magenta rose, soft peach, cool gray */
  'midnight-bloom': {
    name: 'Midnight Bloom',
    primary: '#a855f7', primaryHover: '#9333ea', primaryActive: '#7e22ce',
    secondary: '#ec4899', secondaryHover: '#db2777',
    accent: '#f9a8d4', accentHover: '#f472b6',
    danger: '#ef4444', dangerHover: '#dc2626',
    pageBg: '#0c0a1a', cardBg: '#14112a', cardBgAlt: '#1c1838',
    headerBg: '#0e0c1e', headerText: '#f3e8ff',
    inputBg: '#110e24', inputBorder: '#2e2850', inputFocus: '#a855f7',
    textPrimary: '#f0e8ff', textSecondary: '#a898c8', textMuted: '#6b5e88',
    textOnPrimary: '#ffffff', textOnDanger: '#ffffff',
    labelColor: '#ddd0f0', helperText: '#7a6e98', errorText: '#fb7185',
    borderLight: '#241e44', borderMedium: '#362e5e',
    shadowSm: '0 1px 3px rgba(0,0,0,.5)', shadowMd: '0 4px 16px rgba(0,0,0,.55)',
    shadowLg: '0 14px 40px rgba(0,0,0,.6)', shadowFocus: '0 0 0 3px rgba(168,85,247,.3)',
    hoverOverlay: 'rgba(168,85,247,.06)', activeOverlay: 'rgba(168,85,247,.12)',
    disabledBg: '#18142e', disabledText: '#4a4468', loadingPulse: '#a855f7',
    toggleTrack: '#2e2850', toggleTrackActive: '#ec4899', toggleThumb: '#ffffff',
    checkboxBorder: '#3a3460', checkboxChecked: '#a855f7',
    radioBorder: '#3a3460', radioChecked: '#ec4899',
    dropzoneBg: '#110e2480', dropzoneBorder: '#2e2850', dropzoneHover: '#a855f720',
    btnPrimaryBg: '#a855f7', btnPrimaryText: '#ffffff',
    btnSecondaryBg: 'transparent', btnSecondaryText: '#ec4899', btnSecondaryBorder: '#ec4899',
    btnGhostText: '#a898c8', btnGhostHover: 'rgba(168,85,247,.1)',
    btnDangerBg: '#ef4444', btnDangerText: '#ffffff',
    radius: '12px', radiusSm: '6px', radiusLg: '20px', radiusFull: '9999px',
    fontFamily: '"Outfit", system-ui, sans-serif',
    transition: 'all .2s ease', transitionFast: 'all .12s ease',
  },

  /** 5 ▸ OCEAN PEARL — Teal, warm sand, coral accent, ivory white */
  'ocean-pearl': {
    name: 'Ocean Pearl',
    primary: '#0d9488', primaryHover: '#0f766e', primaryActive: '#115e59',
    secondary: '#d4a373', secondaryHover: '#c49060',
    accent: '#f87171', accentHover: '#ef4444',
    danger: '#dc2626', dangerHover: '#b91c1c',
    pageBg: '#f5f7f6', cardBg: '#ffffff', cardBgAlt: '#f0f5f3',
    headerBg: '#0f4f48', headerText: '#e6faf6',
    inputBg: '#fafcfb', inputBorder: '#c8d8d4', inputFocus: '#0d9488',
    textPrimary: '#1a2e2a', textSecondary: '#4a6860', textMuted: '#88a098',
    textOnPrimary: '#ffffff', textOnDanger: '#ffffff',
    labelColor: '#243830', helperText: '#6a8a80', errorText: '#dc2626',
    borderLight: '#d8e8e2', borderMedium: '#b0c8be',
    shadowSm: '0 1px 3px rgba(13,148,136,.06)', shadowMd: '0 4px 12px rgba(13,148,136,.08)',
    shadowLg: '0 12px 30px rgba(13,148,136,.1)', shadowFocus: '0 0 0 3px rgba(13,148,136,.2)',
    hoverOverlay: 'rgba(13,148,136,.04)', activeOverlay: 'rgba(13,148,136,.08)',
    disabledBg: '#e8f0ec', disabledText: '#a0b8b0', loadingPulse: '#0d9488',
    toggleTrack: '#b0c8be', toggleTrackActive: '#0d9488', toggleThumb: '#ffffff',
    checkboxBorder: '#a0bab2', checkboxChecked: '#0d9488',
    radioBorder: '#a0bab2', radioChecked: '#d4a373',
    dropzoneBg: '#f0f8f5', dropzoneBorder: '#c8d8d4', dropzoneHover: '#0d948815',
    btnPrimaryBg: '#0d9488', btnPrimaryText: '#ffffff',
    btnSecondaryBg: 'transparent', btnSecondaryText: '#0d9488', btnSecondaryBorder: '#0d9488',
    btnGhostText: '#4a6860', btnGhostHover: 'rgba(13,148,136,.06)',
    btnDangerBg: '#dc2626', btnDangerText: '#ffffff',
    radius: '10px', radiusSm: '6px', radiusLg: '16px', radiusFull: '9999px',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    transition: 'all .2s ease', transitionFast: 'all .12s ease',
  },

  /** 6 ▸ CARBON STEEL — Gunmetal gray, electric blue, warm amber, off-white */
  'carbon-steel': {
    name: 'Carbon Steel',
    primary: '#3b82f6', primaryHover: '#2563eb', primaryActive: '#1d4ed8',
    secondary: '#64748b', secondaryHover: '#475569',
    accent: '#f59e0b', accentHover: '#d97706',
    danger: '#ef4444', dangerHover: '#dc2626',
    pageBg: '#111113', cardBg: '#1a1a1e', cardBgAlt: '#222228',
    headerBg: '#0d0d0f', headerText: '#e8eaed',
    inputBg: '#161618', inputBorder: '#2a2a30', inputFocus: '#3b82f6',
    textPrimary: '#e8eaed', textSecondary: '#8e929a', textMuted: '#55585e',
    textOnPrimary: '#ffffff', textOnDanger: '#ffffff',
    labelColor: '#c8ccd2', helperText: '#6a6e78', errorText: '#f87171',
    borderLight: '#252528', borderMedium: '#35353a',
    shadowSm: '0 1px 3px rgba(0,0,0,.6)', shadowMd: '0 4px 14px rgba(0,0,0,.7)',
    shadowLg: '0 14px 36px rgba(0,0,0,.75)', shadowFocus: '0 0 0 3px rgba(59,130,246,.3)',
    hoverOverlay: 'rgba(59,130,246,.06)', activeOverlay: 'rgba(59,130,246,.1)',
    disabledBg: '#1e1e22', disabledText: '#44444a', loadingPulse: '#3b82f6',
    toggleTrack: '#2a2a30', toggleTrackActive: '#3b82f6', toggleThumb: '#ffffff',
    checkboxBorder: '#35353a', checkboxChecked: '#3b82f6',
    radioBorder: '#35353a', radioChecked: '#f59e0b',
    dropzoneBg: '#16161880', dropzoneBorder: '#2a2a30', dropzoneHover: '#3b82f620',
    btnPrimaryBg: '#3b82f6', btnPrimaryText: '#ffffff',
    btnSecondaryBg: 'transparent', btnSecondaryText: '#3b82f6', btnSecondaryBorder: '#3b82f6',
    btnGhostText: '#8e929a', btnGhostHover: 'rgba(59,130,246,.08)',
    btnDangerBg: '#ef4444', btnDangerText: '#ffffff',
    radius: '8px', radiusSm: '4px', radiusLg: '14px', radiusFull: '9999px',
    fontFamily: '"Inter", system-ui, sans-serif',
    transition: 'all .2s ease', transitionFast: 'all .12s ease',
  },

  /** 7 ▸ ROSE QUARTZ — Soft pink, warm gray, deep plum, gold accent */
  'rose-quartz': {
    name: 'Rose Quartz',
    primary: '#e879a0', primaryHover: '#d85f88', primaryActive: '#c84a74',
    secondary: '#6b4c6e', secondaryHover: '#7e5e82',
    accent: '#d4a855', accentHover: '#c49540',
    danger: '#d94848', dangerHover: '#c53535',
    pageBg: '#fdf8fa', cardBg: '#ffffff', cardBgAlt: '#faf2f5',
    headerBg: '#3a1f30', headerText: '#fce4ec',
    inputBg: '#fcf6f8', inputBorder: '#e8d0d8', inputFocus: '#e879a0',
    textPrimary: '#2e1a22', textSecondary: '#6a4858', textMuted: '#a88898',
    textOnPrimary: '#ffffff', textOnDanger: '#ffffff',
    labelColor: '#3e2430', helperText: '#8a6878', errorText: '#d94848',
    borderLight: '#f0dce4', borderMedium: '#d8b8c8',
    shadowSm: '0 1px 3px rgba(100,40,60,.06)', shadowMd: '0 4px 12px rgba(100,40,60,.08)',
    shadowLg: '0 12px 30px rgba(100,40,60,.1)', shadowFocus: '0 0 0 3px rgba(232,121,160,.25)',
    hoverOverlay: 'rgba(232,121,160,.05)', activeOverlay: 'rgba(232,121,160,.1)',
    disabledBg: '#f5e8ee', disabledText: '#c0a0b0', loadingPulse: '#e879a0',
    toggleTrack: '#d8b8c8', toggleTrackActive: '#e879a0', toggleThumb: '#ffffff',
    checkboxBorder: '#c8a8b8', checkboxChecked: '#e879a0',
    radioBorder: '#c8a8b8', radioChecked: '#6b4c6e',
    dropzoneBg: '#fdf4f7', dropzoneBorder: '#e8d0d8', dropzoneHover: '#e879a015',
    btnPrimaryBg: '#e879a0', btnPrimaryText: '#ffffff',
    btnSecondaryBg: 'transparent', btnSecondaryText: '#e879a0', btnSecondaryBorder: '#e879a0',
    btnGhostText: '#6a4858', btnGhostHover: 'rgba(232,121,160,.08)',
    btnDangerBg: '#d94848', btnDangerText: '#ffffff',
    radius: '12px', radiusSm: '6px', radiusLg: '20px', radiusFull: '9999px',
    fontFamily: '"Outfit", system-ui, sans-serif',
    transition: 'all .2s ease', transitionFast: 'all .12s ease',
  },
};

// ─────────────────── CSS VARIABLE MAP ───────────────────
const TOKEN_TO_CSS: Record<keyof Omit<ThemeTokens, 'name'>, string> = {
  primary: '--fb-primary', primaryHover: '--fb-primary-hover', primaryActive: '--fb-primary-active',
  secondary: '--fb-secondary', secondaryHover: '--fb-secondary-hover',
  accent: '--fb-accent', accentHover: '--fb-accent-hover',
  danger: '--fb-danger', dangerHover: '--fb-danger-hover',
  pageBg: '--fb-page-bg', cardBg: '--fb-card-bg', cardBgAlt: '--fb-card-bg-alt',
  headerBg: '--fb-header-bg', headerText: '--fb-header-text',
  inputBg: '--fb-input-bg', inputBorder: '--fb-input-border', inputFocus: '--fb-input-focus',
  textPrimary: '--fb-text', textSecondary: '--fb-text-secondary', textMuted: '--fb-text-muted',
  textOnPrimary: '--fb-text-on-primary', textOnDanger: '--fb-text-on-danger',
  labelColor: '--fb-label', helperText: '--fb-helper', errorText: '--fb-error',
  borderLight: '--fb-border-light', borderMedium: '--fb-border-medium',
  shadowSm: '--fb-shadow-sm', shadowMd: '--fb-shadow-md', shadowLg: '--fb-shadow-lg', shadowFocus: '--fb-shadow-focus',
  hoverOverlay: '--fb-hover-overlay', activeOverlay: '--fb-active-overlay',
  disabledBg: '--fb-disabled-bg', disabledText: '--fb-disabled-text', loadingPulse: '--fb-loading-pulse',
  toggleTrack: '--fb-toggle-track', toggleTrackActive: '--fb-toggle-track-active', toggleThumb: '--fb-toggle-thumb',
  checkboxBorder: '--fb-checkbox-border', checkboxChecked: '--fb-checkbox-checked',
  radioBorder: '--fb-radio-border', radioChecked: '--fb-radio-checked',
  dropzoneBg: '--fb-dropzone-bg', dropzoneBorder: '--fb-dropzone-border', dropzoneHover: '--fb-dropzone-hover',
  btnPrimaryBg: '--fb-btn-primary-bg', btnPrimaryText: '--fb-btn-primary-text',
  btnSecondaryBg: '--fb-btn-secondary-bg', btnSecondaryText: '--fb-btn-secondary-text', btnSecondaryBorder: '--fb-btn-secondary-border',
  btnGhostText: '--fb-btn-ghost-text', btnGhostHover: '--fb-btn-ghost-hover',
  btnDangerBg: '--fb-btn-danger-bg', btnDangerText: '--fb-btn-danger-text',
  radius: '--fb-radius', radiusSm: '--fb-radius-sm', radiusLg: '--fb-radius-lg', radiusFull: '--fb-radius-full',
  fontFamily: '--fb-font', transition: '--fb-transition', transitionFast: '--fb-transition-fast',
};

// ─────────────────── APPLY THEME ───────────────────

export function applyTheme(themeName: string, persist = true): boolean {
  const theme = themes[themeName];
  if (!theme) {
    console.warn(`[ThemeEngine] Theme "${themeName}" not found.`);
    return false;
  }

  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(TOKEN_TO_CSS)) {
    const value = theme[key as keyof ThemeTokens];
    if (value !== undefined) root.style.setProperty(cssVar, value as string);
  }

  // Responsive spacing tokens (mobile-first)
  root.style.setProperty('--fb-space-xs', '4px');
  root.style.setProperty('--fb-space-sm', '8px');
  root.style.setProperty('--fb-space-md', '16px');
  root.style.setProperty('--fb-space-lg', '24px');
  root.style.setProperty('--fb-space-xl', '40px');
  root.style.setProperty('--fb-container-max', '640px');
  root.style.setProperty('--fb-font-sm', '0.875rem');
  root.style.setProperty('--fb-font-base', '1rem');
  root.style.setProperty('--fb-font-lg', '1.25rem');
  root.style.setProperty('--fb-font-xl', '1.5rem');

  if (persist) {
    try { localStorage.setItem('fb-theme', themeName); } catch {}
  }
  return true;
}

/** Load saved theme on startup */
export function initTheme(fallback = 'carbon-steel'): string {
  let saved = fallback;
  try { saved = localStorage.getItem('fb-theme') || fallback; } catch {}
  applyTheme(saved);
  return saved;
}

/** Get all available theme names */
export function getThemeNames(): string[] {
  return Object.keys(themes);
}

/** Get human-readable label for a theme */
export function getThemeLabel(name: string): string {
  return themes[name]?.name || name;
}
