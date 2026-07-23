/**
 * koodalanne — Tailwind preset
 * Maps the design tokens (see tokens.css / tokens.json) onto Tailwind's theme.
 *
 * Usage (tailwind.config.js):
 *   module.exports = { presets: [require('./design-system/tokens/tailwind.preset.js')] }
 *
 * Colors reference the CSS custom properties so a single source of truth
 * (tokens.css) drives both raw CSS and Tailwind utilities. Ship tokens.css
 * in your global stylesheet for these to resolve.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Brand primitives
        pink: {
          50: 'var(--kd-pink-50)',
          100: 'var(--kd-pink-100)',
          200: 'var(--kd-pink-200)',
          300: 'var(--kd-pink-300)',
          400: 'var(--kd-pink-400)',
          500: 'var(--kd-pink-500)',
          600: 'var(--kd-pink-600)',
          700: 'var(--kd-pink-700)',
          DEFAULT: 'var(--kd-pink-300)',
        },
        cyan: {
          50: 'var(--kd-cyan-50)',
          100: 'var(--kd-cyan-100)',
          200: 'var(--kd-cyan-200)',
          300: 'var(--kd-cyan-300)',
          400: 'var(--kd-cyan-400)',
          500: 'var(--kd-cyan-500)',
          600: 'var(--kd-cyan-600)',
          700: 'var(--kd-cyan-700)',
          DEFAULT: 'var(--kd-cyan-300)',
        },
        ink: {
          900: 'var(--kd-ink-900)',
          800: 'var(--kd-ink-800)',
          700: 'var(--kd-ink-700)',
          600: 'var(--kd-ink-600)',
          500: 'var(--kd-ink-500)',
          400: 'var(--kd-ink-400)',
        },
        grey: {
          50: 'var(--kd-grey-50)',
          100: 'var(--kd-grey-100)',
          200: 'var(--kd-grey-200)',
          300: 'var(--kd-grey-300)',
          400: 'var(--kd-grey-400)',
          500: 'var(--kd-grey-500)',
          600: 'var(--kd-grey-600)',
        },
        violet: 'var(--kd-violet)',
        sunset: {
          1: 'var(--kd-sunset-1)',
          2: 'var(--kd-sunset-2)',
          3: 'var(--kd-sunset-3)',
        },

        // Semantic aliases
        bg: 'var(--color-bg)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
          inverse: 'var(--color-surface-inverse)',
        },
        content: {
          DEFAULT: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          subtle: 'var(--color-text-subtle)',
          inverse: 'var(--color-text-inverse)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          secondary: 'var(--color-accent-secondary)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
      },

      fontFamily: {
        display: ['Press Start 2P', 'Space Grotesk', 'monospace'],
        sans: ['Space Grotesk', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.694rem', { lineHeight: '1.3' }],
        xs: ['0.8rem', { lineHeight: '1.3' }],
        sm: ['0.9rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.55' }],
        lg: ['1.25rem', { lineHeight: '1.5' }],
        xl: ['1.563rem', { lineHeight: '1.3' }],
        '2xl': ['1.953rem', { lineHeight: '1.2' }],
        '3xl': ['2.441rem', { lineHeight: '1.15' }],
        '4xl': ['3.052rem', { lineHeight: '1.1' }],
        '5xl': ['3.815rem', { lineHeight: '1.05' }],
        '6xl': ['4.768rem', { lineHeight: '1.0' }],
      },

      letterSpacing: {
        tight: '-0.02em',
        normal: '0',
        wide: '0.04em',
        widest: '0.18em',
      },

      spacing: {
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        5: '1.5rem',
        6: '2rem',
        7: '3rem',
        8: '4rem',
        9: '6rem',
        10: '8rem',
      },

      borderRadius: {
        none: '0',
        sm: '2px',
        md: '6px',
        lg: '12px',
        xl: '20px',
        pill: '999px',
      },

      boxShadow: {
        sm: 'var(--kd-shadow-sm)',
        md: 'var(--kd-shadow-md)',
        lg: 'var(--kd-shadow-lg)',
        'glow-pink': 'var(--kd-glow-pink)',
        'glow-cyan': 'var(--kd-glow-cyan)',
        focus: 'var(--kd-glow-focus)',
      },

      backgroundImage: {
        'gradient-sunset': 'var(--kd-gradient-sunset)',
        'gradient-neon': 'var(--kd-gradient-neon)',
        'gradient-horizon': 'var(--kd-gradient-horizon)',
      },

      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0.0, 0.0, 1.0)',
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },

      transitionDuration: {
        instant: '80ms',
        fast: '160ms',
        normal: '240ms',
        slow: '420ms',
      },
    },
  },
};
