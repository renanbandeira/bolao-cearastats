/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ceara: {
          50: '#f5f5f5',
          100: '#e0e0e0',
          200: '#d0d0d0',
          300: '#a0a0a0',
          400: '#808080',
          500: '#000000', // Ceará primary black
          600: '#0a0a0a',
          700: '#141414',
          800: '#1e1e1e',
          900: '#282828',
        },
      },
    },
  },
  plugins: [],
}
