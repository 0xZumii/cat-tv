/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'warm-bg': '#FFF8F0',
        'card': '#FFFFFF',
        'accent-orange': '#FF8C42',
        'accent-pink': '#FFB4B4',
        'accent-mint': '#B8E0D2',
        'accent-lavender': '#D4A5FF',
        'text-main': '#4A4A4A',
        'text-soft': '#8B8B8B',
        'happy': '#7ED957',
        'okay': '#FFD93D',
        'sad': '#FF6B6B',
      },
      fontFamily: {
        'display': ['Fredoka', 'sans-serif'],
        'body': ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        'card': '24px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(255, 140, 66, 0.15)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
