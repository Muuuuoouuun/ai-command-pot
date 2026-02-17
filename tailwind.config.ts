import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f6f1e8',
        ink: '#2f2a24',
        line: '#d7cdbd'
      },
      fontFamily: {
        serif: ['Fraunces', 'Cormorant Garamond', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 8px 24px rgba(47,42,36,0.08)'
      }
    }
  },
  plugins: []
}

export default config
