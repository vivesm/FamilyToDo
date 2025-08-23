/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        priority: {
          urgent: '#EF4444',    // Red
          soon: '#F59E0B',      // Yellow/Amber
          whenever: '#10B981'   // Green
        }
      },
      minHeight: {
        'touch': '44px'  // iOS minimum touch target
      },
      minWidth: {
        'touch': '44px'  // iOS minimum touch target
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'urgent-pulse': 'urgentPulse 1.5s ease-in-out infinite'
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        urgentPulse: {
          '0%, 100%': { 
            backgroundColor: '#EF4444', // Red
            transform: 'scale(1)',
            opacity: '1',
            boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)'
          },
          '25%': { 
            backgroundColor: '#FB923C', // Orange
            transform: 'scale(1.1)',
            opacity: '0.9',
            boxShadow: '0 0 0 4px rgba(251, 146, 60, 0.4)'
          },
          '50%': { 
            backgroundColor: '#FBBF24', // Yellow
            transform: 'scale(1.2)',
            opacity: '1',
            boxShadow: '0 0 0 6px rgba(251, 191, 36, 0.2)'
          },
          '75%': { 
            backgroundColor: '#FB923C', // Orange
            transform: 'scale(1.1)',
            opacity: '0.9',
            boxShadow: '0 0 0 4px rgba(251, 146, 60, 0.4)'
          }
        }
      }
    },
  },
  plugins: [],
}