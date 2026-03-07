/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050B14', // Darker, deeper blue for contrast
        surface: '#0B132B',
        surface_light: '#1C2541',
        
        // Vibrant neon palette
        accent: '#00F0FF',       // Cyan
        accent_hover: '#00C2FF',
        primary: '#7000FF',      // Deep purple
        primary_light: '#9D4EDD',// Bright purple
        secondary: '#FF007F',    // Neon Pink
        
        warning: '#FFE600',      // Bright Yellow
        critical: '#FF2A2A',     // Neon Red
        success: '#00FF66',      // Neon Green
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        sans: ['Inter', 'sans-serif']
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 240, 255, 0.1)',
        'glass-purple': '0 8px 32px 0 rgba(157, 78, 221, 0.15)',
        'glow-accent': '0 0 20px rgba(0, 240, 255, 0.6)',
        'glow-purple': '0 0 20px rgba(157, 78, 221, 0.6)',
        'glow-pink': '0 0 20px rgba(255, 0, 127, 0.6)',
        'glow-critical': '0 0 25px rgba(255, 42, 42, 0.8)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'glow-shift': 'glowShift 4s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowShift: {
          '0%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(157, 78, 221, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 0, 127, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
