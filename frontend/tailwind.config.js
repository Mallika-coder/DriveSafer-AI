/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0f1e',
        surface: '#121b2d',
        surface_light: '#1f2d47',
        accent: '#00d4ff',
        accent_hover: '#00aacc',
        warning: '#ffaa00',
        critical: '#ff3d3d',
        success: '#00ff88',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        sans: ['Inter', 'sans-serif']
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 212, 255, 0.1)',
        'glass-red': '0 8px 32px 0 rgba(255, 61, 61, 0.15)',
        'glow-accent': '0 0 15px rgba(0, 212, 255, 0.5)',
        'glow-critical': '0 0 20px rgba(255, 61, 61, 0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
