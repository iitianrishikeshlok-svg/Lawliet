/**
 * "L" — Premium Theme & Visual Identity System
 * Designed with restrained, professional Windows desktop aesthetics.
 * Avoids excessive glowing borders, overly bright gradients, or AI-dashboard clutter.
 * Supports dark mode, light mode, and customizable accent colors.
 */

export const ACCENT_COLORS = {
  cobalt: { id: 'cobalt', name: 'Refined Cobalt', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.25)', hover: '#2563eb' },
  indigo: { id: 'indigo', name: 'Slate Indigo', color: '#6366f1', glow: 'rgba(99, 102, 241, 0.25)', hover: '#4f46e5' },
  emerald: { id: 'emerald', name: 'Forest Emerald', color: '#10b981', glow: 'rgba(16, 185, 129, 0.25)', hover: '#059669' },
  crimson: { id: 'crimson', name: 'Restrained Crimson', color: '#e11d48', glow: 'rgba(225, 29, 72, 0.25)', hover: '#be123c' },
  amber: { id: 'amber', name: 'Warm Amber', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.25)', hover: '#d97706' },
  slate: { id: 'slate', name: 'Monochrome Slate', color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.25)', hover: '#64748b' },
};

export const THEMES = {
  graphite: {
    id: 'graphite',
    name: 'Neutral Graphite (Default)',
    mode: 'dark',
    tagline: 'Deep charcoal background with soft off-white typography and subtle borders',
    bg: '#141518',
    bgGlass: 'rgba(20, 21, 24, 0.92)',
    card: '#1b1c21',
    cardGlass: 'rgba(27, 28, 33, 0.88)',
    input: '#121316',
    border: 'rgba(255, 255, 255, 0.08)',
    borderSubtle: 'rgba(255, 255, 255, 0.04)',
    borderFocus: 'rgba(255, 255, 255, 0.18)',
    textPrimary: '#f1f2f4',
    textSecondary: '#8b909a',
    textMuted: '#5e636e',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
    shadowSubtle: '0 4px 16px rgba(0, 0, 0, 0.3)',
  },
  light: {
    id: 'light',
    name: 'Paper Slate (Light Mode)',
    mode: 'light',
    tagline: 'Clean off-white surface with deep charcoal text and delicate graphite borders',
    bg: '#f8fafc',
    bgGlass: 'rgba(248, 250, 252, 0.95)',
    card: '#ffffff',
    cardGlass: 'rgba(255, 255, 255, 0.92)',
    input: '#f1f5f9',
    border: 'rgba(0, 0, 0, 0.09)',
    borderSubtle: 'rgba(0, 0, 0, 0.05)',
    borderFocus: 'rgba(0, 0, 0, 0.22)',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    shadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
    shadowSubtle: '0 4px 12px rgba(0, 0, 0, 0.05)',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Minimal',
    mode: 'dark',
    tagline: 'Deep jet black with razor-sharp neutral contrast',
    bg: '#0a0a0c',
    bgGlass: 'rgba(10, 10, 12, 0.94)',
    card: '#121216',
    cardGlass: 'rgba(18, 18, 22, 0.90)',
    input: '#0d0d10',
    border: 'rgba(255, 255, 255, 0.07)',
    borderSubtle: 'rgba(255, 255, 255, 0.03)',
    borderFocus: 'rgba(255, 255, 255, 0.16)',
    textPrimary: '#f8fafc',
    textSecondary: '#8892b0',
    textMuted: '#525a70',
    shadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
    shadowSubtle: '0 4px 20px rgba(0, 0, 0, 0.5)',
  },
  frost: {
    id: 'frost',
    name: 'Nordic Frost',
    mode: 'dark',
    tagline: 'Cool slate-blue translucent glass with crisp silver borders',
    bg: '#12161f',
    bgGlass: 'rgba(18, 22, 31, 0.92)',
    card: '#1a202d',
    cardGlass: 'rgba(26, 32, 45, 0.88)',
    input: '#10141c',
    border: 'rgba(255, 255, 255, 0.10)',
    borderSubtle: 'rgba(255, 255, 255, 0.05)',
    borderFocus: 'rgba(255, 255, 255, 0.20)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    shadowSubtle: '0 4px 16px rgba(0, 0, 0, 0.35)',
  },
  noir: {
    id: 'noir',
    name: 'Death Note Noir',
    mode: 'dark',
    tagline: 'High-contrast monochrome gothic aesthetic with subtle crimson accents',
    bg: '#050507',
    bgGlass: 'rgba(5, 5, 7, 0.95)',
    card: '#0e0e12',
    cardGlass: 'rgba(14, 14, 18, 0.90)',
    input: '#09090b',
    border: 'rgba(255, 255, 255, 0.10)',
    borderSubtle: 'rgba(255, 255, 255, 0.05)',
    borderFocus: 'rgba(255, 255, 255, 0.24)',
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    textMuted: '#52525b',
    shadow: '0 12px 40px rgba(0, 0, 0, 0.85)',
    shadowSubtle: '0 4px 20px rgba(0, 0, 0, 0.65)',
  },
};

/**
 * Apply theme and accent color to the document root element.
 */
export function applyTheme(themeId = 'graphite', accentId = 'cobalt') {
  const theme = THEMES[themeId] || THEMES.graphite;
  const accent = ACCENT_COLORS[accentId] || ACCENT_COLORS.cobalt;
  const root = document.documentElement;

  // Theme base variables
  root.style.setProperty('--theme-bg', theme.bg);
  root.style.setProperty('--theme-bg-glass', theme.bgGlass);
  root.style.setProperty('--theme-card', theme.card);
  root.style.setProperty('--theme-card-glass', theme.cardGlass);
  root.style.setProperty('--theme-input', theme.input);
  root.style.setProperty('--theme-border', theme.border);
  root.style.setProperty('--theme-border-subtle', theme.borderSubtle);
  root.style.setProperty('--theme-border-focus', theme.borderFocus);
  root.style.setProperty('--theme-text-primary', theme.textPrimary);
  root.style.setProperty('--theme-text-secondary', theme.textSecondary);
  root.style.setProperty('--theme-text-muted', theme.textMuted);
  root.style.setProperty('--theme-shadow', theme.shadow);
  root.style.setProperty('--theme-shadow-subtle', theme.shadowSubtle);

  // Accent color variables
  root.style.setProperty('--theme-accent', accent.color);
  root.style.setProperty('--theme-accent-glow', accent.glow);
  root.style.setProperty('--theme-accent-hover', accent.hover);

  // Light / Dark mode class
  if (theme.mode === 'light') {
    root.classList.add('theme-light');
    root.classList.remove('theme-dark');
  } else {
    root.classList.add('theme-dark');
    root.classList.remove('theme-light');
  }

  return { ...theme, accent: accent.color, accentGlow: accent.glow, accentHover: accent.hover, accentId };
}
