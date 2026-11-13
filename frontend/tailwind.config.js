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
        bg: {
          primary: '#080D0A',
          secondary: '#0D1510',
          sidebar: '#0A100C',
          card: '#121C15',
          elevated: '#18231B',
          glass: 'rgba(18, 28, 21, 0.75)',
        },
        accent: {
          primary: '#39FF88',
          secondary: '#00B894',
          glow: 'rgba(57, 255, 136, 0.18)',
          glowStrong: 'rgba(57, 255, 136, 0.35)',
        },
        text: {
          primary: '#F4F8F5',
          secondary: '#9AA79E',
          muted: '#68766D',
        },
        status: {
          success: '#39FF88',
          warning: '#F5B942',
          critical: '#FF5D62',
          info: '#5BA8FF',
          neutral: '#8B9890',
        },
        industrial: {
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(57, 255, 136, 0.35)',
          grid: 'rgba(57, 255, 136, 0.04)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(57, 255, 136, 0.15)',
        'glow-md': '0 0 20px rgba(57, 255, 136, 0.22)',
        'glow-lg': '0 0 35px rgba(57, 255, 136, 0.30)',
        'glow-critical': '0 0 25px rgba(255, 93, 98, 0.25)',
        'glow-warning': '0 0 25px rgba(245, 185, 66, 0.25)',
        'card-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.55)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'float-slow': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
