/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          cream: 'var(--bg-cream)',
          white: 'var(--bg-white)',
          surface: 'var(--bg-surface)',
          'surface-2': 'var(--bg-surface-2)',
        },
        border: {
          light: 'var(--border-light)',
          default: 'var(--border-default)',
          strong: 'var(--border-strong)',
          forest: 'var(--border-forest)',
        },
        text: {
          dark: 'var(--text-dark)',
          body: 'var(--text-body)',
          muted: 'var(--text-muted)',
          accent: 'var(--text-accent)',
        },
        suk: {
          forest: 'var(--suk-forest)',
          'forest-mid': 'var(--suk-forest-mid)',
          'forest-pale': 'var(--suk-forest-pale)',
          amber: 'var(--suk-amber)',
          fire: 'var(--suk-fire)',
          river: 'var(--suk-river)',
        },
        risk: {
          0: 'var(--risk-0)',
          1: 'var(--risk-1)',
          2: 'var(--risk-2)',
          3: 'var(--risk-3)',
          4: 'var(--risk-4)',
          5: 'var(--risk-5)',
          urban: 'var(--risk-urban)',
        },
        'risk-text': {
          0: 'var(--risk-0-text)',
          1: 'var(--risk-1-text)',
          2: 'var(--risk-2-text)',
          3: 'var(--risk-3-text)',
          4: 'var(--risk-4-text)',
          5: 'var(--risk-5-text)',
          urban: 'var(--risk-urban-text)',
        },
        'risk-border': {
          0: 'var(--risk-0-border)',
          1: 'var(--risk-1-border)',
          2: 'var(--risk-2-border)',
          3: 'var(--risk-3-border)',
          4: 'var(--risk-4-border)',
          5: 'var(--risk-5-border)',
          urban: 'var(--risk-urban-border)',
        },
        estimated: {
          bg: 'var(--estimated-bg)',
          border: 'var(--estimated-border)',
          text: 'var(--estimated-text)',
        },
        river: {
          low: 'var(--river-low)',
          normal: 'var(--river-normal)',
          warning: 'var(--river-warning)',
          danger: 'var(--river-danger)',
          extreme: 'var(--river-extreme)',
        }
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        ui: ['DM Sans', 'system-ui', 'sans-serif'],
        data: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      spacing: {
        '1': 'var(--sp-1)',
        '2': 'var(--sp-2)',
        '3': 'var(--sp-3)',
        '4': 'var(--sp-4)',
        '5': 'var(--sp-5)',
        '6': 'var(--sp-6)',
        '8': 'var(--sp-8)',
        '12': 'var(--sp-12)',
      },
      borderRadius: {
        'sm': 'var(--r-sm)',
        'md': 'var(--r-md)',
        'lg': 'var(--r-lg)',
        'xl': 'var(--r-xl)',
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        popup: 'var(--shadow-popup)',
        tooltip: 'var(--shadow-tooltip)',
      }
    },
  },
  plugins: [],
}
