/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0C0E",
        panel: "#15171A",
        hairline: "#26282C",
        ivory: "#EDEAE3",
        muted: "#9A968C",
        brass: "#B08D57",
        "brass-light": "#D4B483",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Work Sans", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.2em",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out",
        fadeInUp: "fadeInUp 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
