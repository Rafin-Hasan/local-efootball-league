import type { Config } from "tailwindcss";

/**
 * Liquid Water — the palette of light through deep water.
 *
 * Two ramps that can never be confused:
 *   `deep` runs abyss→shallow and is only ever a *background*.
 *   `ink`  runs bright→dim and is only ever *text*.
 *
 * Accents are split by meaning, not by taste: `aqua` is every interactive and
 * positive signal, `brand` red is reserved for the mark itself plus live and
 * losing states. Red on cyan is a complementary pair, so the few red things
 * stay loud precisely because everything else is cool.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        deep: {
          950: "#020609",
          900: "#040C14",
          850: "#06131F",
          800: "#081B2B",
          700: "#0C2739",
          600: "#12384E",
          500: "#1A4C67",
        },
        ink: {
          DEFAULT: "#EEF7FB",
          700: "#CBDDE7",
          600: "#A9C1CF",
          500: "#8AA5B6",
          400: "#6E8899",
          300: "#54697A",
          200: "#3C4E5C",
        },
        aqua: {
          200: "#B8F1FB",
          300: "#7FE3F5",
          400: "#3FD3EE",
          500: "#12BEDB",
          600: "#0C9CB8",
          700: "#0A7A93",
        },
        brand: {
          300: "#FF9BA2",
          400: "#FF5A67",
          500: "#E11D2A",
          600: "#C6121F",
          700: "#A50E19",
        },
        gold: {
          300: "#FFDC7A",
          400: "#F5C542",
          500: "#E0A81E",
        },
        win: "#3BE0A0",
        draw: "#6E8899",
        loss: "#FF5A67",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Impact", "sans-serif"],
      },
      boxShadow: {
        // Depth reads as a soft column of shadow, the way objects sit in water.
        depth: "0 1px 0 0 rgba(255,255,255,0.07) inset, 0 24px 48px -28px rgba(0,0,0,0.95)",
        glow: "0 0 0 1px rgba(63,211,238,0.35), 0 14px 34px -14px rgba(18,190,219,0.55)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        // Slow caustic drift — light bending through moving water.
        caustic: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)", opacity: "0.55" },
          "50%": { transform: "translate3d(2%,-1.5%,0) scale(1.08)", opacity: "0.85" },
        },
        // A highlight travelling along a surface, like a swell passing under it.
        swell: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        caustic: "caustic 18s ease-in-out infinite",
        "caustic-slow": "caustic 26s ease-in-out infinite reverse",
        swell: "swell 6s cubic-bezier(0.4,0,0.2,1) infinite",
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
