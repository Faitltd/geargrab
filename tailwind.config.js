/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // GearGrab-inspired color palette
        primary: {
          50: '#f0f9f8',
          100: '#ccebe8',
          200: '#99d6d0',
          300: '#66c2b8',
          400: '#33ada0',
          500: '#004641', // Primary green
          600: '#003a36',
          700: '#002e2b',
          800: '#002220',
          900: '#001615',
        },
        accent: {
          50: '#fef7f0',
          100: '#fde8d1',
          200: '#fbd1a3',
          300: '#f9ba75',
          400: '#f7a347',
          500: '#F17A24', // Accent orange
          600: '#d4621d',
          700: '#b74916',
          800: '#9a310f',
          900: '#7d1908',
        },
        // GearGrab forest green
        forest: {
          50: '#f0f9f4',
          100: '#dcf2e3',
          200: '#bce5cb',
          300: '#8dd1a8',
          400: '#5bb67d',
          500: '#3a9b5c',
          600: '#2d7d47',
          700: '#26653a',
          800: '#225130',
          900: '#1e4329',
        },
        // Mountain blues
        mountain: {
          50: '#f0f8ff',
          100: '#e0f0fe',
          200: '#b9e2fe',
          300: '#7ccdfd',
          400: '#36b5fa',
          500: '#0c9feb',
          600: '#0080c9',
          700: '#0166a3',
          800: '#065786',
          900: '#0b496f',
        },
        // Earth tones
        earth: {
          50: '#faf8f3',
          100: '#f4f0e6',
          200: '#e8dfc7',
          300: '#d9c9a0',
          400: '#c8b177',
          500: '#b89c5a',
          600: '#a6884e',
          700: '#8a6f42',
          800: '#715a3a',
          900: '#5c4a32',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 4px 25px -5px rgba(0, 0, 0, 0.1)',
        'rei': '0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ],
}
