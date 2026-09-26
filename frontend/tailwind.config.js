/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#030712',
          900: '#070E1E',
          800: '#0B1528',
          700: '#11213D',
          600: '#193056',
          500: '#23447A',
        },
        brand: {
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#B9DDFF',
          300: '#7CC0FF',
          400: '#369EFF',
          500: '#0A7DE8',
          600: '#0262C2',
          700: '#034E9E',
          800: '#074282',
          900: '#0C386D',
        },
        accent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px -1px rgba(11, 21, 40, 0.05), 0 1px 4px -1px rgba(11, 21, 40, 0.03)',
        'card-hover': '0 12px 24px -4px rgba(11, 21, 40, 0.1), 0 4px 8px -2px rgba(11, 21, 40, 0.05)',
        'premium': '0 20px 40px -15px rgba(11, 21, 40, 0.12)',
      }
    },
  },
  plugins: [],
}
