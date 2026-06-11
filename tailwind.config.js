/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Papel / superficies — tonos cálidos, no blanco clínico
        cream: {
          50: "#fdfaf4",   // superficie principal
          100: "#f8f1e3",  // superficie elevada (cards)
          200: "#efe4cc",  // bordes sutiles cálidos
          300: "#d8c5a0",  // bordes más fuertes / separadores
        },
        ink: {
          900: "#1f1a14",  // texto principal — casi negro pero cálido
          700: "#3a322a",  // texto secundario
          500: "#6b5f50",  // texto muted
          400: "#8b7e6c",  // hints
        },
        // Verde profundo — vida, esperanza, higuera/fruto
        sage: {
          50: "#f1f5ee",
          100: "#dde6d2",
          200: "#b9c8a4",
          400: "#6b8a4a",
          600: "#3f5e2a",  // primary brand
          700: "#2f4a1f",
          800: "#1f3014",
        },
        // Terracota — acentos cálidos (anuncios, CTA secundarias)
        terracotta: {
          50: "#fbf2ec",
          100: "#f3ddcc",
          400: "#c97a52",
          500: "#b35d36",
          600: "#944a28",  // danger / advertencia
        },
        gold: {
          400: "#d4a64a",  // highlights decorativos
          500: "#b08a32",
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
