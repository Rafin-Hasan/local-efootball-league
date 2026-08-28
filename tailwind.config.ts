import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FFF1F2",
          100: "#FFE0E2",
          200: "#FFC6CA",
          300: "#FF9BA2",
          400: "#FA5F6B",
          500: "#E11D2A",
          600: "#C6121F",
          700: "#A50E19",
          800: "#881017",
          900: "#731218",
        },
        ink: {
          DEFAULT: "#0B0B0D",
          800: "#17181C",
          700: "#2A2C33",
          600: "#4A4D57",
          500: "#6B6F7B",
          400: "#9A9EA9",
          300: "#C6C9D1",
          200: "#E4E6EB",
          100: "#F1F2F5",
          50: "#F8F9FB",
        },
        gold: {
          400: "#F5C542",
          500: "#E0A81E",
          600: "#B98410",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Impact", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,11,13,0.04), 0 8px 24px -8px rgba(11,11,13,0.10)",
        lift: "0 2px 4px rgba(11,11,13,0.04), 0 18px 40px -12px rgba(11,11,13,0.18)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
