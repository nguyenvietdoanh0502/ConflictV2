/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        social: {
          canvas: '#F7F5FF',
          paper: '#FFFCFE',
          ink: '#2F2A45',
          muted: '#77718C',
          violet: '#7C6EE6',
          pink: '#FF8FB3',
          mint: '#B8EADD',
          peach: '#FFD8BE',
          yellow: '#FFE9A9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Avenir Next', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 50px rgba(82, 67, 126, 0.10)',
        card: '0 10px 30px rgba(82, 67, 126, 0.08)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
