/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        primary: '#16a34a', // green-600
      },
      boxShadow: {
        t: '0 -2px 5px rgba(0,0,0,0.05)'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
