import type { Config } from "tailwindcss";

/**
 * Red and black — the logo's own palette.
 *
 * Two ramps that can never be confused:
 *   `deep` runs black→charcoal and is only ever a *background*.
 *   `ink`  runs bright→dim and is only ever *text*.
 *
 * Both are neutral with a faint warm bias, so the blacks read as warm rather
 * than blue, and red sits on them without clashing.
 *
 * `brand` red is now the primary interactive colour: buttons, active states,
 * focus, links. That creates one problem worth naming — red traditionally also
 * means "defeat". Reusing the same red for "press this" and "you lost" makes
 * both ambiguous, so results keep their own scale: `win` green, `draw` grey and
 * `loss` a muted rose that is deliberately duller than any brand red. Action is
 * vivid; outcome is muted.
 *
 * `gold` survives only where the word is literal — the Golden Boot and Golden
 * Ball races. It is not a decorative third colour.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        deep: {
          950: "#070506",
          900: "#0C0A0B",
          850: "#121011",
          800: "#191516",
          700: "#241E1F",
          600: "#332A2B",
          500: "#453839",
        },
        ink: {
          DEFAULT: "#F7F4F5",
          700: "#E2DCDD",
          600: "#C6BDBE",
          500: "#A79C9E",
          400: "#8A7F81",
          300: "#665C5E",
          200: "#4A4243",
        },
        brand: {
          200: "#FFD2D6",
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
        draw: "#8A7F81",
        // Deliberately duller and greyer than every brand red, so "lost"
        // never reads as an action and a button never reads as a defeat. Light
        // enough that the dark text on a result pill clears AA (6.1:1).
        loss: "#C46A73",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Impact", "sans-serif"],
      },
      boxShadow: {
        depth: "0 1px 0 0 rgba(255,255,255,0.07) inset, 0 24px 48px -28px rgba(0,0,0,0.95)",
        glow: "0 0 0 1px rgba(225,29,42,0.35), 0 14px 34px -14px rgba(225,29,42,0.55)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        // Slow ember drift — light bleeding through a dark room.
        caustic: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)", opacity: "0.55" },
          "50%": { transform: "translate3d(2%,-1.5%,0) scale(1.08)", opacity: "0.85" },
        },
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
