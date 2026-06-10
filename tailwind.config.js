/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* ── Primary orange — mais vibrante/moderno ── */
        orange: {
          50:  "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",   // ← era #FF7A1A
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        /* ── Navy → modern dark slate ── */
        navy: {
          50:  "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        /* ── Cream → clean neutral/gray ── */
        cream: {
          50:  "#FAFAFA",
          100: "#F4F4F5",
          200: "#E4E4E7",
          300: "#D4D4D8",
        },
        /* ── Green mantido ── */
        green: {
          50:  "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
          800: "#166534",
          900: "#14532D",
        },
        /* ── Accent colors ── */
        brand: {
          teal:   "#06B6D4",   // cyan-500
          purple: "#8B5CF6",   // violet-500
          pink:   "#EC4899",   // pink-500
          yellow: "#EAB308",   // yellow-500
        },
        ink: "#0F172A",
      },
      fontFamily: {
        sans:    ["Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fredoka", "Nunito", "ui-sans-serif", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3rem",
      },
      boxShadow: {
        soft:     "0 4px 24px -4px rgba(15,23,42,0.10)",
        "soft-lg":"0 8px 48px -8px rgba(15,23,42,0.16)",
        glow:     "0 8px 32px -6px rgba(249,115,22,0.45)",
        "glow-teal":  "0 8px 32px -6px rgba(6,182,212,0.40)",
        "glow-green": "0 8px 32px -6px rgba(34,197,94,0.40)",
        "glow-purple":"0 8px 32px -6px rgba(139,92,246,0.40)",
        card:     "0 2px 12px -2px rgba(15,23,42,0.06), 0 1px 4px -1px rgba(15,23,42,0.04)",
        "card-hover":"0 8px 32px -4px rgba(15,23,42,0.12)",
        bubble:   "0 16px 48px -12px rgba(249,115,22,0.20)",
        inner:    "inset 0 2px 4px 0 rgba(15,23,42,0.06)",
      },
      backgroundImage: {
        "hero-grad":   "linear-gradient(135deg, #F97316 0%, #EA580C 55%, #C2410C 100%)",
        "navy-grad":   "linear-gradient(135deg, #334155 0%, #1E293B 55%, #0F172A 100%)",
        "cream-grad":  "linear-gradient(180deg, #FAFAFA 0%, #F4F4F5 100%)",
        "orange-soft": "linear-gradient(135deg, #FFEDD5 0%, #FFF7ED 60%, #FAFAFA 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-14px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-4deg)" },
          "50%":      { transform: "rotate(4deg)" },
        },
        pop: {
          "0%":   { transform: "scale(0.8)", opacity: "0" },
          "60%":  { transform: "scale(1.06)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-in-right": {
          "0%":   { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        marquee: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "25%":      { transform: "scale(1.14)" },
          "50%":      { transform: "scale(1)" },
          "75%":      { transform: "scale(1.08)" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-10px)" },
        },
        "slide-in-left": {
          "0%":   { opacity: "0", transform: "translateX(-40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-up-fade": {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "ken-burns": {
          "0%":   { transform: "scale(1) translate(0, 0)" },
          "100%": { transform: "scale(1.10) translate(-1%, -1%)" },
        },
        "ken-burns-alt": {
          "0%":   { transform: "scale(1) translate(0, 0)" },
          "100%": { transform: "scale(1.10) translate(1%, 1%)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-scale": {
          "0%, 100%": { transform: "scale(1)" },
          "50%":      { transform: "scale(1.06)" },
        },
        "count-flip": {
          "0%":   { opacity: "0", transform: "translateY(-12px) scaleY(0.8)" },
          "100%": { opacity: "1", transform: "translateY(0) scaleY(1)" },
        },
        "progress-bar": {
          "0%":   { width: "0%" },
          "100%": { width: "100%" },
        },
      },
      animation: {
        "fade-up":        "fade-up 0.6s ease-out both",
        "fade-in":        "fade-in 0.5s ease-out both",
        "scale-in":       "scale-in 0.4s ease-out both",
        float:            "float 6s ease-in-out infinite",
        "float-slow":     "float-slow 5s ease-in-out infinite",
        wiggle:           "wiggle 1.2s ease-in-out infinite",
        pop:              "pop 0.35s ease-out both",
        "slide-in-right": "slide-in-right 0.3s ease-out both",
        "slide-in-left":  "slide-in-left 0.5s ease-out both",
        "slide-up-fade":  "slide-up-fade 0.55s ease-out both",
        marquee:          "marquee 28s linear infinite",
        "marquee-slow":   "marquee 48s linear infinite",
        heartbeat:        "heartbeat 1.8s ease-in-out infinite",
        "bounce-soft":    "bounce-soft 2.4s ease-in-out infinite",
        "ken-burns":      "ken-burns 8s ease-out forwards",
        "ken-burns-alt":  "ken-burns-alt 8s ease-out forwards",
        shimmer:          "shimmer 1.6s linear infinite",
        "pulse-scale":    "pulse-scale 2s ease-in-out infinite",
        "count-flip":     "count-flip 0.3s ease-out both",
        "progress-bar":   "progress-bar 5s linear forwards",
      },
    },
  },
  plugins: [],
};
