/** @type {import('tailwindcss').Config} */
const { colors } = require("./colors");

module.exports = {
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        body: ["Plus Jakarta Sans", "Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        editorial: ["Playfair Display", "Cormorant Garamond", "Lora", "Georgia", "serif"],
        serif: ["Playfair Display", "Cormorant Garamond", "Lora", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 4px 20px rgba(0, 0, 0, 0.35)",
        "card-hover": "0 8px 30px rgba(0, 0, 0, 0.45)",
        "gold-glow": "0 0 16px rgba(214, 168, 79, 0.25)",
        dropdown: "0 10px 30px rgba(0, 0, 0, 0.5)",
        modal: "0 20px 60px rgba(0, 0, 0, 0.7)",
      },
      borderRadius: {
        DEFAULT: "10px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "24px",
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
