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
        // Modern neutral palette
        neutral: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
          950: '#0A0A0B',
        },
        // Primary colors with gradients
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        // Modern semantic colors
        priority: {
          urgent: '#EF4444',
          soon: '#F59E0B',
          whenever: '#10B981'
        },
        // Glass morphism colors
        glass: {
          light: 'rgba(255, 255, 255, 0.7)',
          dark: 'rgba(26, 26, 28, 0.7)',
          border: 'rgba(255, 255, 255, 0.18)',
        },
        // Surface colors for dark mode
        surface: {
          dark: {
            DEFAULT: '#1A1A1C',
            elevated: '#2A2A2D',
            overlay: '#3A3A3F',
          }
        }
      },
      backgroundImage: {
        // Modern gradients
        'gradient-primary': 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
        'gradient-success': 'linear-gradient(135deg, #13B0A5 0%, #10B981 100%)',
        'gradient-danger': 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgb(99, 102, 241) 0px, transparent 50%), radial-gradient(at 80% 0%, rgb(236, 72, 153) 0px, transparent 50%), radial-gradient(at 0% 50%, rgb(59, 130, 246) 0px, transparent 50%)',
        'gradient-dark': 'linear-gradient(180deg, #0A0A0B 0%, #1A1A1C 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.35)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.35)',
        'soft': '0 2px 20px 0 rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 10px 40px 0 rgba(0, 0, 0, 0.1)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.06)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
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