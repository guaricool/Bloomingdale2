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
        canvas: {
          50: "hsl(var(--canvas-50))",
          100: "hsl(var(--canvas-100))",
          200: "hsl(var(--canvas-200))",
          300: "hsl(var(--canvas-300))",
        },
        charcoal: {
          900: "hsl(var(--charcoal-900))",
          700: "hsl(var(--charcoal-700))",
          500: "hsl(var(--charcoal-500))",
          400: "hsl(var(--charcoal-400))",
        },
        celestial: {
          50: "hsl(var(--celestial-50))",
          100: "hsl(var(--celestial-100))",
          200: "hsl(var(--celestial-200))",
          400: "hsl(var(--celestial-400))",
          600: "hsl(var(--celestial-600))",
          700: "hsl(var(--celestial-700))",
          800: "hsl(var(--celestial-800))",
        },
        gold: {
          50: "hsl(var(--gold-50))",
          100: "hsl(var(--gold-100))",
          400: "hsl(var(--gold-400))",
          500: "hsl(var(--gold-500))",
          600: "hsl(var(--gold-600))",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "ui-serif", "Georgia", "Cambria", "serif"],
        sans: ['"Outfit"', "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
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
        "soft": "0 1px 2px rgba(24, 24, 27, 0.04), 0 4px 12px rgba(24, 24, 27, 0.04)",
        "lift": "0 2px 4px rgba(24, 24, 27, 0.05), 0 12px 32px rgba(24, 24, 27, 0.08)",
        "ring-celestial": "0 0 0 3px rgba(30, 58, 138, 0.25)",
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
        "paper-grain":
          "radial-gradient(circle at 20% 10%, rgba(30, 58, 138, 0.03), transparent 40%), radial-gradient(circle at 80% 90%, rgba(203, 160, 82, 0.03), transparent 40%)",
        "sunrise":
          "linear-gradient(135deg, #fdfaf4 0%, #f8f1e3 60%, #efe4cc 100%)",
      },
    },
  },
  plugins: [],
};
