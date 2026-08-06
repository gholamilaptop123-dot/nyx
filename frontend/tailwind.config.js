/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#06070a",
        cardBg: "rgba(14, 15, 23, 0.85)",
        cardBorder: "rgba(250, 204, 21, 0.15)",
        cyberYellow: "#facc15",
        cyberRed: "#ff0055",
        cyberViolet: "#facc15", // Mapped to Cyber Yellow for seamless compatibility
        cyberCyan: "#00f0ff",
        cyberGreen: "#10b981",
        cyberPink: "#ff0055"   // Mapped to Neon Crimson Red
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
