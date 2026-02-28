import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // CSS variable–driven: supports Tailwind opacity modifiers (text-ink/60 etc.)
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        ink:   'rgb(var(--color-ink)   / <alpha-value>)',
        line:  'rgb(var(--color-line)  / <alpha-value>)',
      },
      fontFamily: {
        serif: ['Fraunces', 'Cormorant Garamond', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 8px 24px rgba(47,42,36,0.08)'
      }
    }
  },
  plugins: []
}

export default config
