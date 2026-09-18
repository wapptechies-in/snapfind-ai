/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0B0D12",
        panel: "#12151B",
        panel2: "#171B22",
        hairline: "#22262E",
        cloud: "#ECEFF3",
        dim: "#8A90A0",
        violet: "#7C6CF6",
        "violet-light": "#A79AFF",
        good: "#3DD68C",
        bad: "#F0654F",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
