/* Tailwind v3 Play CDN config — must run AFTER <script src="cdn.tailwindcss.com"> */
/* shadcn-style theme: every utility points at hsl(var(--token)). */
tailwind.config = {
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", '"SF Mono"', "Menlo", "Consolas", "monospace"],
      },
      colors: {
        border:     "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        "text-soft":"hsl(var(--text-soft))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT:    "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          border:     "hsl(var(--sidebar-border))",
        },
        positive: {
          DEFAULT: "hsl(var(--positive))",
          soft:    "hsl(var(--positive-soft))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          soft:    "hsl(var(--warning-soft))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          soft:    "hsl(var(--info-soft))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in":   { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in":  { from: { opacity: "0", transform: "scale(0.96)" }, to: { opacity: "1", transform: "scale(1)" } },
      },
      animation: {
        "fade-in":  "fade-in 120ms ease-out",
        "scale-in": "scale-in 140ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
      boxShadow: {
        "elev-xs": "0 1px 0 rgba(15, 23, 36, 0.04)",
        "elev-sm": "0 1px 2px rgba(15, 23, 36, 0.06), 0 1px 1px rgba(15, 23, 36, 0.04)",
        "elev-md": "0 2px 6px rgba(15, 23, 36, 0.06), 0 4px 12px rgba(15, 23, 36, 0.06)",
        "elev-lg": "0 8px 24px rgba(15, 23, 36, 0.10), 0 2px 8px rgba(15, 23, 36, 0.06)",
        "elev-pop":"0 10px 28px rgba(15, 23, 36, 0.18), 0 2px 6px rgba(15, 23, 36, 0.08)",
      },
    },
  },
};
