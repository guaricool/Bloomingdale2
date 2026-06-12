/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Paleta: usamos los colores nativos de Tailwind directamente.
      //   blue  = color de marca primario
      //   slate = superficies y texto (gris azulado frío)
      //   red   = errores / danger
      //   sky   = acento secundario decorativo
      // No definimos ramps custom: los nativos ya tienen todos los stops.
      fontFamily: {
        display: ['"Fraunces"', "ui-serif", "Georgia", "Cambria", "serif"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        script: ['"Cormorant Garamond"', "ui-serif", "Georgia", "serif"],
      },
      fontSize: {
        "display-xl": ["clamp(2.75rem, 5vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "500" }],
        "display-lg": ["clamp(2.25rem, 3.5vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.015em", fontWeight: "500" }],
        "display-md": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "500" }],
      },
      borderRadius: {
        "card": "0.875rem",
        "pill": "9999px",
      },
      boxShadow: {
        // Sombras frías — base slate-900.
        "soft": "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)",
        "lift": "0 2px 4px rgba(15, 23, 42, 0.06), 0 12px 32px rgba(15, 23, 42, 0.12)",
        "ring-blue": "0 0 0 3px rgba(37, 99, 235, 0.25)",
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
        // Textura sutil — tints azules fríos.
        "paper-grain":
          "radial-gradient(circle at 20% 10%, rgba(56, 189, 248, 0.06), transparent 40%), radial-gradient(circle at 80% 90%, rgba(37, 99, 235, 0.05), transparent 40%)",
        // Gradiente del hero — slate claro a azul, suave.
        "hero":
          "linear-gradient(135deg, #f8fafc 0%, #eff6ff 55%, #dbeafe 100%)",
      },
    },
  },
  plugins: [],
};
