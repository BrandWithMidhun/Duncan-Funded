import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        gold: {
          DEFAULT: 'hsl(var(--gold))',
          light: 'hsl(var(--gold-light))',
          dark: 'hsl(var(--gold-dark))',
        },
        wool: {
          DEFAULT: 'hsl(var(--wool))',
          muted: 'hsl(var(--wool-muted))',
        },
        highland: 'hsl(var(--highland))',
        navy: 'hsl(var(--navy))',
        pine: 'hsl(var(--pine))',
        heritage: 'hsl(var(--heritage))',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Raleway', 'sans-serif'],
        accent: ['Cormorant Garamond', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'hsl(48 22% 70%)',
            '--tw-prose-headings': 'hsl(43 62% 51%)',
            '--tw-prose-bold': 'hsl(48 30% 87%)',
            '--tw-prose-links': 'hsl(43 62% 51%)',
            '--tw-prose-bullets': 'hsl(43 62% 51%)',
            '--tw-prose-counters': 'hsl(43 62% 51%)',
            '--tw-prose-quotes': 'hsl(48 30% 87%)',
            '--tw-prose-quote-borders': 'hsl(43 62% 51%)',
            '--tw-prose-hr': 'hsl(147 35% 16%)',
            '--tw-prose-code': 'hsl(43 62% 51%)',
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
