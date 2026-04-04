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
        // Base
        'bg-base':  '#030712',
        'bg-s1':    '#0E1726',
        'bg-s2':    '#152236',
        'bg-s3':    '#1C2E46',
        // Accents
        'accent-blue':  '#3B82F6',
        'accent-cyan':  '#22D3EE',
        // Alerts
        'c-ok':     '#10B981',
        'c-warn':   '#F59E0B',
        'c-danger': '#EF4444',
        // Text
        't1':       '#F1F5F9',
        't2':       '#94A3B8',
        't3':       '#475569',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
