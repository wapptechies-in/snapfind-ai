/** @type {import('tailwindcss').Config} */
const { colors } = require("./colors");

module.exports = {
  theme: {
    extend: {
      colors,
      fontFamily: {
        serif: ["Playfair Display", "Cormorant Garamond", "Lora", "Georgia", "serif"],
        display: ["Playfair Display", "Cormorant Garamond", "Lora", "Georgia", "serif"],
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        body: ["Plus Jakarta Sans", "Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(26, 28, 26, 0.04)",
        "card-hover": "0 8px 24px rgba(26, 28, 26, 0.07)",
        dropdown: "0 10px 30px rgba(26, 28, 26, 0.08)",
        modal: "0 20px 50px rgba(26, 28, 26, 0.14)",
      },
      borderRadius: {
        DEFAULT: "10px",
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "22px",
        "2xl": "28px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 160ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-subtle": "pulse-subtle 2.5s ease-in-out infinite",
      },
    },
  },
};
