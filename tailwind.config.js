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
        navy: {
          950: '#0f0f1a',
          900: '#1a1a2e',
          800: '#25253d',
        },
        accent: {
          violet: '#7c3aed',
          'violet-light': '#a78bfa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.15)',
        'glow-red': '0 0 20px rgba(244, 63, 94, 0.15)',
        'glow-violet': '0 0 20px rgba(124, 58, 237, 0.15)',
      },
    },
  },
  plugins: [],
}
