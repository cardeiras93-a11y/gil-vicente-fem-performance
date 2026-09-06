/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#090d16',
          card: '#131b2e',
          surface: '#1e293b',
          border: '#334155',
        },
        brand: {
          lime: '#a3e635',
          limeHover: '#84cc16',
          cyan: '#06b6d4',
          amber: '#f59e0b',
          red: '#ef4444',
          purple: '#8b5cf6',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
