/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── CRIMSON & WHITE HEMATOLOGY / BIOMEDICAL PALETTE ─────────
        // Deep Hematology Darkfield Base
        'lab-void': '#060205',
        'lab-base': '#0A0408',
        'lab-surface': '#12060E',
        'lab-panel': '#180813',
        'lab-elevated': '#220B1B',

        // Primary Accent: Vivid Crimson / Ruby Red
        crimson: {
          DEFAULT: '#FF2A55',
          300: '#FFA0B4',
          400: '#FF4D73',
          500: '#FF2A55',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
        },
        ruby: {
          DEFAULT: '#DC2626',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },

        // Crisp Optical White & Highlights
        white: '#FFFFFF',
        'pure-white': '#FFFFFF',
        ice: {
          DEFAULT: '#FFFFFF',
          100: '#FFFFFF',
          200: '#F8FAFC',
          300: '#F1F5F9',
          400: '#E2E8F0',
        },

        // Text & Contrast
        'text-primary': '#FFFFFF',
        'text-secondary': '#CBD5E1',
        'text-muted': '#94A3B8',

        // Glass & Hairlines
        'glass-bg': 'rgba(255, 255, 255, 0.03)',
        'glass-border': 'rgba(255, 255, 255, 0.09)',
        'glass-border-hover': 'rgba(255, 42, 85, 0.35)',
        'glass-highlight': 'rgba(255, 255, 255, 0.15)',

        // Status & Secondary Accents
        aurora: {
          DEFAULT: '#FF2A55',
          300: '#FFA0B4',
          400: '#FF4D73',
          500: '#FF2A55',
          600: '#E11D48',
          700: '#BE123C',
        },
        electric: {
          DEFAULT: '#C084FC',
          400: '#E879F9',
          500: '#C084FC',
          600: '#A855F7',
        },
        status: {
          online: '#10B981',
          standby: '#F59E0B',
          alert: '#FF2A55',
          info: '#FF2A55',
        },

        // Legacy compatibility
        void: '#060205',
        obsidian: '#0A0408',
        titanium: '#12060E',
        surface: '#12060E',
        panel: '#180813',
        'panel-light': '#220B1B',
        bio: '#FF2A55',
        mint: '#FF4D73',
        warn: '#F59E0B',
        alert: '#FF2A55',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'glass': '20px',
        '20px': '20px',
        'xl': '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        'glass': '0 20px 50px -12px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glow-crimson': '0 0 30px rgba(255, 42, 85, 0.35), 0 0 70px rgba(255, 42, 85, 0.12)',
        'glow-white': '0 0 25px rgba(255, 255, 255, 0.3), 0 0 50px rgba(255, 255, 255, 0.1)',
        'button-crimson': '0 4px 20px rgba(255, 42, 85, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
