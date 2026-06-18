/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        border: "hsl(var(--border))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        cream: {
          50: "hsl(var(--cream-50))",
          100: "hsl(var(--cream-100))",
          200: "hsl(var(--cream-200))",
          300: "hsl(var(--cream-300))",
        },
        ink: {
          900: "hsl(var(--ink-900))",
          700: "hsl(var(--ink-700))",
          500: "hsl(var(--ink-500))",
          400: "hsl(var(--ink-400))",
        },
        sage: {
          50: "hsl(var(--sage-50))",
          100: "hsl(var(--sage-100))",
          200: "hsl(var(--sage-200))",
          400: "hsl(var(--sage-400))",
          600: "hsl(var(--sage-600))",
          700: "hsl(var(--sage-700))",
          800: "hsl(var(--sage-800))",
        },
        terracotta: {
          50: "hsl(var(--terracotta-50))",
          100: "hsl(var(--terracotta-100))",
          400: "hsl(var(--terracotta-400))",
          500: "hsl(var(--terracotta-500))",
          600: "hsl(var(--terracotta-600))",
        },
        gold: {
          400: "hsl(var(--gold-400))",
          500: "hsl(var(--gold-500))",
        },
      },
      fontFamily: {
        // Serif con carácter — Fraunces tiene personalidad cálida, no es "librería"
        display: ['"Fraunces"', "ui-serif", "Georgia", "Cambria", "serif"],
        // Sans humanista para UI — Inter es la elección sólida para legibilidad
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        // Para texto bíblico / himnos en versalitas
        script: ['"Cormorant Garamond"', "ui-serif", "Georgia", "serif"],
      },
      fontSize: {
        // Escala editorial — un poco más generosa que defaults
        "display-xl": ["clamp(2.75rem, 5vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "500" }],
        "display-lg": ["clamp(2.25rem, 3.5vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.015em", fontWeight: "500" }],
        "display-md": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "500" }],
      },
      borderRadius: {
        // Menos cuadrado, más amable
        "card": "0.875rem",
        "pill": "9999px",
      },
      boxShadow: {
        // Sombras cálidas — no negro puro
        "soft": "0 1px 2px rgba(58, 50, 42, 0.04), 0 4px 12px rgba(58, 50, 42, 0.06)",
        "lift": "0 2px 4px rgba(58, 50, 42, 0.06), 0 12px 32px rgba(58, 50, 42, 0.10)",
        "ring-sage": "0 0 0 3px rgba(107, 138, 74, 0.25)",
      },
      keyframes: {
        "reveal-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "reveal-fade": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "subtle-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "reveal-up": "reveal-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "reveal-fade": "reveal-fade 0.6s ease-out forwards",
        "subtle-float": "subtle-float 6s ease-in-out infinite",
      },
      backgroundImage: {
        // Textura sutil de papel para el fondo
        "paper-grain":
          "radial-gradient(circle at 20% 10%, rgba(212, 166, 74, 0.06), transparent 40%), radial-gradient(circle at 80% 90%, rgba(107, 138, 74, 0.05), transparent 40%)",
        "sunrise":
          "linear-gradient(135deg, #fdfaf4 0%, #f8f1e3 60%, #efe4cc 100%)",
      },
    },
  },
  plugins: [],
};
