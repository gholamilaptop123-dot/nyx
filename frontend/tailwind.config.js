/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#090c15",
        cardBg: "rgba(16, 21, 34, 0.7)",
        cardBorder: "rgba(255, 255, 255, 0.08)",
        cyberYellow: "#fbbf24", // Warm amber gold
        cyberAmber: "#f59e0b",
        cyberRed: "#f43f5e",    // Soft warm rose
        cyberGreen: "#10b981",  // Warm soothing emerald
        cyberIndigo: "#6366f1",
        cyberViolet: "#8b5cf6",
        cyberCyan: "#06b6d4",
        cyberPink: "#f43f5e"
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      }
    },
  },
  plugins: [],
}
