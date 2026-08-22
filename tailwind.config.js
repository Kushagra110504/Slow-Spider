/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: 'var(--vault-bg)',
          surface: 'var(--vault-surface)',
          sidebar: 'var(--vault-sidebar)',
          card: 'var(--vault-card)',
          cardHover: 'var(--vault-card-hover)',
          cardAlt: 'var(--vault-card-alt)',
          border: 'var(--vault-border)',
          borderLight: 'var(--vault-border-light)',
          textMuted: 'var(--vault-text-muted)',
          textSecondary: 'var(--vault-text-secondary)',
          textPrimary: 'var(--vault-text-primary)',
        },
        brand: {
          green: {
            DEFAULT: '#00E575',
            hover: '#00D069',
            light: '#10F27E',
            dark: '#045E33',
            glow: 'rgba(0, 229, 117, 0.45)',
            subtle: 'rgba(0, 229, 117, 0.15)',
            text: '#045E33',
            border: 'rgba(0, 229, 117, 0.4)',
          },
          amber: {
            DEFAULT: '#F59E0B',
            glow: 'rgba(245, 158, 11, 0.25)',
            subtle: 'rgba(245, 158, 11, 0.12)',
            text: '#F59E0B',
            border: 'rgba(245, 158, 11, 0.35)',
          },
          red: {
            DEFAULT: '#EF4444',
            glow: 'rgba(239, 68, 68, 0.25)',
            subtle: 'rgba(239, 68, 68, 0.12)',
            text: '#EF4444',
            border: 'rgba(239, 68, 68, 0.35)',
          },
          cyan: {
            DEFAULT: '#06B6D4',
            glow: 'rgba(6, 182, 212, 0.25)',
            subtle: 'rgba(6, 182, 212, 0.12)',
            text: '#06B6D4',
            border: 'rgba(6, 182, 212, 0.35)',
          },
          blue: {
            DEFAULT: '#3B82F6',
            glow: 'rgba(59, 130, 246, 0.25)',
            subtle: 'rgba(59, 130, 246, 0.12)',
            text: '#3B82F6',
            border: 'rgba(59, 130, 246, 0.35)',
          },
          purple: {
            DEFAULT: '#8B5CF6',
            glow: 'rgba(139, 92, 246, 0.25)',
            subtle: 'rgba(139, 92, 246, 0.12)',
            text: '#8B5CF6',
            border: 'rgba(139, 92, 246, 0.35)',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 20px -2px rgba(0, 229, 117, 0.45)',
        'glow-lime': '0 0 20px -2px rgba(0, 229, 117, 0.45)',
        'glow-amber': '0 0 20px -3px rgba(245, 158, 11, 0.35)',
        'glow-red': '0 0 20px -3px rgba(239, 68, 68, 0.35)',
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.35)',
        'glow-purple': '0 0 20px -3px rgba(139, 92, 246, 0.35)',
        'card': '0 2px 10px -2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
