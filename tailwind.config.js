/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#06060f",
          raised: "rgba(255,255,255,0.03)",
          hover: "rgba(255,255,255,0.06)",
        },
        border: {
          subtle: "rgba(255,255,255,0.06)",
          medium: "rgba(255,255,255,0.1)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
