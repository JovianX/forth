/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Work Sans', 'system-ui', 'sans-serif'],
        'display': ['Caveat', 'cursive', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
