/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        black: "#000000",
        ink: "#0A0A0C",
        panel: "#111319",
        "panel-light": "#181B24",
        hairline: "#1E2230",
        "hairline-light": "#2E3547",
        white: "#FFFFFF",
        ivory: "#FFFFFF",
        muted: "#94A3B8",
        blue: {
          DEFAULT: "#2563EB",
          light: "#60A5FA",
          dark: "#1D4ED8",
          hover: "#3B82F6",
        },
        brass: "#2563EB",
        "brass-light": "#60A5FA",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Work Sans", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.2em",
      },
    },
  },
  plugins: [],
};
