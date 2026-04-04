/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      colors: {
        // Base Palette
        'bg-deep':      '#020617',
        'surface-base': 'rgba(15, 23, 42, 0.6)',
        
        // Brand Accents
        'accent-blue':  '#3b82f6',
        'accent-cyan':  '#22d3ee',
        'accent-amber': '#f59e0b',
        'accent-red':   '#ef4444',
        
        // Status
        'ok':           '#10b981',
        
        // Typography
        't1':           '#f8fafc',
        't2':           '#94a3b8',
        't3':           '#475569',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
