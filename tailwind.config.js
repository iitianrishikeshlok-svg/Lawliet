/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          void: '#07080a',
          card: 'rgba(12, 14, 20, 0.78)',
          glass: 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(255, 255, 255, 0.08)',
          accent: '#6366f1',
          accentGlow: 'rgba(99, 102, 241, 0.25)',
        },
        noir: {
          void: '#040405',
          card: 'rgba(10, 10, 12, 0.90)',
          glass: 'rgba(255, 255, 255, 0.03)',
          border: 'rgba(255, 255, 255, 0.12)',
          accent: '#e11d48',
          accentGlow: 'rgba(225, 29, 72, 0.3)',
        },
        cyber: {
          void: '#040811',
          card: 'rgba(6, 16, 29, 0.85)',
          glass: 'rgba(6, 182, 212, 0.05)',
          border: 'rgba(6, 182, 212, 0.25)',
          accent: '#06b6d4',
          accentGlow: 'rgba(6, 182, 212, 0.35)',
          pink: '#f43f5e',
        },
        frost: {
          void: '#0f141c',
          card: 'rgba(23, 29, 41, 0.72)',
          glass: 'rgba(255, 255, 255, 0.06)',
          border: 'rgba(255, 255, 255, 0.15)',
          accent: '#38bdf8',
          accentGlow: 'rgba(56, 189, 248, 0.25)',
          silver: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'Menlo', 'monospace'],
        gothic: ['"Cinzel Decorative"', 'serif'],
      },
      boxShadow: {
        'glass-glow': '0 0 25px rgba(99, 102, 241, 0.2)',
        'noir-glow': '0 0 25px rgba(225, 29, 72, 0.25)',
        'cyber-glow': '0 0 30px rgba(6, 182, 212, 0.3)',
        'frost-glow': '0 0 25px rgba(56, 189, 248, 0.2)',
        'orb-ambient': '0 10px 30px -5px rgba(0, 0, 0, 0.7)',
        'inner-light': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'sweep 2.5s ease-in-out infinite',
        'orb-float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        sweep: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
}
