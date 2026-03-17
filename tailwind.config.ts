import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
  ],

  darkMode: "class",

  theme: {
    extend: {
      // ── Tipografia ────────────────────────────────────────────────────────
      fontFamily: {
        sans:  ["Sora", "system-ui", "sans-serif"],
        mono:  ["DM Mono", "ui-monospace", "monospace"],
      },

      // ── Paleta de cores do StudyFlow ──────────────────────────────────────
      colors: {
        brand: {
          bg:       "#0e0f11",
          surface:  "#16181c",
          surface2: "#1e2026",
          border:   "#2a2d35",
          text:     "#e8eaf0",
          muted:    "#6b7280",
        },
        accent: {
          DEFAULT: "#a3e635",
          dim:     "rgba(163,230,53,0.12)",
          border:  "rgba(163,230,53,0.25)",
        },
        success: "#34d399",
        warning: "#fb923c",
        danger:  "#f87171",
        info:    "#60a5fa",
      },

      // ── Animações ─────────────────────────────────────────────────────────
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: "0.5", transform: "scale(1.4)" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
        blink: {
          "50%": { opacity: "0" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      animation: {
        "fade-up":       "fadeUp 0.4s ease both",
        "fade-up-slow":  "fadeUp 0.6s ease both",
        "pulse-soft":    "pulse 2s ease-in-out infinite",
        "spin-fast":     "spin 0.7s linear infinite",
        "blink":         "blink 1s step-end infinite",
        "shimmer":       "shimmer 2s linear infinite",
      },

      // ── Border radius ─────────────────────────────────────────────────────
      borderRadius: {
        sm:   "6px",
        md:   "8px",
        lg:   "12px",
        xl:   "16px",
        "2xl":"20px",
      },

      // ── Box shadow ────────────────────────────────────────────────────────
      boxShadow: {
        accent: "0 0 20px rgba(163,230,53,0.3)",
        "accent-lg": "0 0 40px rgba(163,230,53,0.2)",
        card: "0 1px 3px rgba(0,0,0,0.4)",
      },
    },
  },

  plugins: [],
};

export default config;
