/**
 * Central Tailwind config mapping semantic colors to CSS variables.
 * Editing CSS variables in `src/styles/theme.css` will update the whole app.
 */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-foreground": "var(--color-on-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        success: "var(--color-success)",
        error: "var(--color-error)",
        info: "var(--color-info)",
        warning: "var(--color-warning)",
      },
      boxShadow: {
        soft: "0 6px 18px rgba(16,24,40,0.06)",
        elevated: "0 10px 30px rgba(2,6,23,0.2)",
      },
      transitionTimingFunction: {
        interactive: "cubic-bezier(.2,.9,.2,1)",
      },
    },
  },
  plugins: [],
};
