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
        cyberViolet: "#facc15", // Mapped to Cyber Yellow
        cyberCyan: "#facc15",   // Mapped to Cyber Yellow (Purge Cyan/Blue)
        cyberGreen: "#10b981",  // Matrix Green for Active status
        cyberPink: "#ff0055"    // Mapped to Crimson Red
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
