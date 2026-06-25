/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 🔥 ADD THIS LINE

  theme: {
    extend: {
      // 🔥 INSANE ANIMATIONS
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'theme-transition': 'theme-transition 0.3s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        glow: {
          '0%': { boxShadow: '0 0 20px #3b82f6' },
          '100%': { boxShadow: '0 0 30px #8b5cf6, 0 0 40px #3b82f6' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' }
        },
        'theme-transition': {
          '0%': { opacity: '0.8', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      },
      // 🌈 GRADIENTS & BLURS
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        // Theme-aware gradients
        'gradient-dark': 'linear-gradient(to bottom right, #0f172a, #1e1b4b, #0f172a)',
        'gradient-light': 'linear-gradient(to bottom right, #f8fafc, #f1f5f9, #e2e8f0)',
        'glass-dark': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        'glass-light': 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
      },
      backdropBlur: {
        xs: '2px',
      },
      // 🎯 CUSTOM COLORS - Enhanced for theme support
      colors: {
        'cyber-blue': '#00f5ff',
        'neon-purple': '#a855f7',
        'matrix-green': '#00ff41',
        // Light mode variants
        'light-primary': '#f8fafc',
        'light-secondary': '#f1f5f9',
        'light-accent': '#e2e8f0',
        'light-text': '#1e293b',
        'light-text-secondary': '#475569',
        // Dark mode variants (your existing colors work well for dark)
        'dark-primary': '#0f172a',
        'dark-secondary': '#1e1b4b',
        'dark-accent': '#1e293b',
        'dark-text': '#f1f5f9',
        'dark-text-secondary': '#cbd5e1',
      },
      // 📱 Enhanced spacing and containers for theme consistency
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // 🎨 Extended opacity for glass morphism effects
      opacity: {
        '15': '0.15',
        '35': '0.35',
        '65': '0.65',
        '85': '0.85',
      },
      // ✨ Enhanced border colors for themes
      borderColor: {
        'light-border': 'rgba(0, 0, 0, 0.1)',
        'dark-border': 'rgba(255, 255, 255, 0.1)',
      },
      // 🌟 Box shadow enhancements
      boxShadow: {
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
        'neumorphic-light': '5px 5px 10px #d1d5db, -5px -5px 10px #ffffff',
        'neumorphic-dark': '5px 5px 10px #0f172a, -5px -5px 10px #1e293b',
      },
      // 🌀 Transition properties for smooth theme switching
      transitionProperty: {
        'theme': 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
      },
      transitionDuration: {
        'theme': '300ms',
      }
    },
  },
  plugins: [],
}