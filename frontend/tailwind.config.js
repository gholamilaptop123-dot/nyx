/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#090d16",
        cardBg: "rgba(18, 25, 41, 0.75)",
        cardBorder: "rgba(255, 255, 255, 0.08)",
        cyberViolet: "#7c3aed",
        cyberCyan: "#06b6d4",
        cyberGreen: "#10b981",
        cyberPink: "#ec4899"
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
